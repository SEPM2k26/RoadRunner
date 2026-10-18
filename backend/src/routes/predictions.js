/**
 * Person 3: AI/ML Trip Delay Prediction API
 * Calls the Python prediction service and stores results in MySQL
 */
const express = require('express');
const router = express.Router();
const axios = require('axios');
const prisma = require('../prisma');

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000';

// POST /api/predictions/delay
// Body: { routeId, vehicleId?, scheduledAt }
router.post('/delay', async (req, res) => {
  try {
    const { routeId, vehicleId, scheduledAt, tripId } = req.body;

    // Fetch route data
    const route = await prisma.route.findUnique({ where: { id: Number(routeId) } });
    if (!route) return res.status(404).json({ error: 'Route not found' });

    // Compute historical avg delay for this route
    const histAgg = await prisma.trip.aggregate({
      where: { routeId: Number(routeId), status: 'COMPLETED' },
      _avg: { delayMinutes: true },
    });

    // Count active incidents on this route
    const activeIncidents = await prisma.trafficIncident.count({
      where: { routeId: Number(routeId), status: 'ACTIVE' },
    });

    const depDate = new Date(scheduledAt || Date.now());
    const departureHour = depDate.getHours();
    const dayOfWeek = depDate.getDay(); // 0=Sun, 6=Sat (JS), convert to 0=Mon
    const dayAdjusted = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const features = {
      route_distance: route.distanceKm,
      departure_hour: departureHour,
      day_of_week: dayAdjusted,
      historical_avg_delay: histAgg._avg.delayMinutes ?? 5,
      active_incidents: activeIncidents,
    };

    // Call Python AI service
    let predictedDelay = 0;
    let modelVersion = 'v1';
    let confidence = null;

    try {
      const aiResponse = await axios.post(`${AI_SERVICE_URL}/predict`, features, { timeout: 5000 });
      predictedDelay = aiResponse.data.predicted_delay;
      modelVersion = aiResponse.data.model_version || 'v1';
      confidence = aiResponse.data.confidence || null;
    } catch (aiErr) {
      console.warn('AI service unavailable, using fallback heuristic:', aiErr.message);
      // Fallback heuristic: base delay from history + incident penalty
      predictedDelay = (histAgg._avg.delayMinutes ?? 5) + activeIncidents * 3;
    }

    // Store prediction in MySQL
    const prediction = await prisma.tripDelayPrediction.create({
      data: {
        tripId:             tripId ? Number(tripId) : null,
        routeId:            Number(routeId),
        vehicleId:          vehicleId ? Number(vehicleId) : null,
        routeDistance:      route.distanceKm,
        departureHour:      departureHour,
        dayOfWeek:          dayAdjusted,
        historicalAvgDelay: histAgg._avg.delayMinutes ?? 5,
        activeIncidents:    activeIncidents,
        predictedDelay:     predictedDelay,
        modelVersion:       modelVersion,
        confidence:         confidence,
      },
    });

    res.json({
      prediction,
      features,
      message: `Predicted delay: ${predictedDelay.toFixed(1)} minutes`,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/predictions/delay — prediction history
router.get('/delay', async (req, res) => {
  try {
    const { routeId, limit = 50 } = req.query;
    const predictions = await prisma.tripDelayPrediction.findMany({
      where: routeId ? { routeId: Number(routeId) } : {},
      include: {
        route:   { select: { name: true, source: true, destination: true } },
        vehicle: { select: { registrationNo: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: Number(limit),
    });
    const formatted = predictions.map(p => ({
      ...p,
      vehicle: p.vehicle ? { ...p.vehicle, registrationNumber: p.vehicle.registrationNo } : null,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
