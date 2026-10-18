/**
 * Person 3: Analytics & Reports API
 * All report endpoints execute meaningful SQL through Prisma
 */
const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// ─── GET /api/reports/fleet ──────────────────────────────────
// Analytics dashboard summary (aggregate data)
router.get('/fleet', async (req, res) => {
  try {
    const [
      totalVehicles,
      vehiclesByStatus,
      totalDrivers,
      driversByStatus,
      tripsByStatus,
      totalIncidents,
      avgDelay,
      totalFuelCost,
    ] = await Promise.all([
      prisma.vehicle.count(),
      prisma.vehicle.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.driver.count(),
      prisma.driver.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.trip.groupBy({ by: ['status'], _count: { id: true } }),
      prisma.trafficIncident.count(),
      prisma.trip.aggregate({ _avg: { delayMinutes: true } }),
      prisma.fuelLog.aggregate({ _sum: { fuelCost: true } }),
    ]);

    res.json({
      totalVehicles,
      vehiclesByStatus,
      totalDrivers,
      driversByStatus,
      tripsByStatus,
      totalIncidents,
      avgDelayMinutes: avgDelay._avg.delayMinutes ?? 0,
      totalFuelCost: totalFuelCost._sum.fuelCost ?? 0,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reports/fuel ───────────────────────────────────
// Report 1: Total fuel expenditure per vehicle
// Report 8: Vehicles with fuel above fleet average
router.get('/fuel', async (req, res) => {
  try {
    // Fuel per vehicle (GROUP BY vehicleId, aggregate SUM/AVG)
    const fuelPerVehicle = await prisma.fuelLog.groupBy({
      by: ['vehicleId'],
      _sum: { fuelCost: true, fuelQuantity: true },
      _avg: { fuelCost: true },
      _count: { id: true },
      orderBy: { _sum: { fuelCost: 'desc' } },
    });

    // Enrich with vehicle details
    const vehicleIds = fuelPerVehicle.map(f => f.vehicleId);
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIds } },
      select: { id: true, registrationNumber: true, make: true, model: true, vehicleType: true },
    });
    const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));

    const enriched = fuelPerVehicle.map(f => ({
      ...f,
      vehicle: vehicleMap[f.vehicleId],
    }));

    // Fleet average
    const totalCost = enriched.reduce((s, f) => s + (f._sum.fuelCost || 0), 0);
    const fleetAvg = enriched.length ? totalCost / enriched.length : 0;

    // Above-average vehicles
    const aboveAverage = enriched.filter(f => (f._sum.fuelCost || 0) > fleetAvg);

    res.json({ fuelPerVehicle: enriched, fleetAvg, aboveAverage });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reports/trips ──────────────────────────────────
// Report 2: Trips per driver
// Report 6: Trip completion statistics
// Report 4: Avg delay per route
// Report 7: Routes with avg delay above threshold
router.get('/trips', async (req, res) => {
  try {
    const { delayThreshold = 10 } = req.query;

    // Trips per driver
    const tripsPerDriver = await prisma.trip.groupBy({
      by: ['driverId'],
      _count: { id: true },
      _avg: { delayMinutes: true },
      orderBy: { _count: { id: 'desc' } },
    });
    const driverIds = tripsPerDriver.map(t => t.driverId);
    const drivers = await prisma.driver.findMany({
      where: { id: { in: driverIds } },
      select: { id: true, name: true, licenceNumber: true },
    });
    const driverMap = Object.fromEntries(drivers.map(d => [d.id, d]));

    // Trip completion stats
    const completionStats = await prisma.trip.groupBy({
      by: ['status'],
      _count: { id: true },
    });

    // Avg delay per route
    const delayPerRoute = await prisma.trip.groupBy({
      by: ['routeId'],
      _avg: { delayMinutes: true },
      _count: { id: true },
      orderBy: { _avg: { delayMinutes: 'desc' } },
    });
    const routeIds = delayPerRoute.map(d => d.routeId);
    const routes = await prisma.route.findMany({
      where: { id: { in: routeIds } },
      select: { id: true, name: true, source: true, destination: true, distanceKm: true },
    });
    const routeMap = Object.fromEntries(routes.map(r => [r.id, r]));

    const delayPerRouteEnriched = delayPerRoute.map(d => ({
      ...d,
      route: routeMap[d.routeId],
    }));

    // Routes above threshold (HAVING equivalent)
    const aboveThreshold = delayPerRouteEnriched.filter(
      d => (d._avg.delayMinutes || 0) > Number(delayThreshold)
    );

    res.json({
      tripsPerDriver: tripsPerDriver.map(t => ({ ...t, driver: driverMap[t.driverId] })),
      completionStats,
      delayPerRoute: delayPerRouteEnriched,
      aboveThreshold,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ─── GET /api/reports/incidents ─────────────────────────────
// Report 3: Most frequently affected routes
// Report 5: Vehicles due for maintenance
router.get('/incidents', async (req, res) => {
  try {
    // Incidents per route (GROUP BY routeId)
    const incidentsPerRoute = await prisma.trafficIncident.groupBy({
      by: ['routeId'],
      _count: { id: true },
      _avg: { estimatedDelay: true },
      orderBy: { _count: { id: 'desc' } },
    });
    const routeIds = incidentsPerRoute.map(i => i.routeId);
    const routes = await prisma.route.findMany({
      where: { id: { in: routeIds } },
      select: { id: true, name: true, source: true, destination: true },
    });
    const routeMap = Object.fromEntries(routes.map(r => [r.id, r]));

    // Incidents by type and severity
    const byType = await prisma.trafficIncident.groupBy({
      by: ['incidentType'],
      _count: { id: true },
    });
    const bySeverity = await prisma.trafficIncident.groupBy({
      by: ['severity'],
      _count: { id: true },
    });

    // Vehicles due for maintenance (next 30 days)
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 30);
    const maintenanceDue = await prisma.maintenance.findMany({
      where: { nextServiceDate: { lte: cutoff }, status: { not: 'COMPLETED' } },
      include: { vehicle: { select: { registrationNumber: true, make: true, model: true, status: true } } },
      orderBy: { nextServiceDate: 'asc' },
    });

    // Vehicle utilisation (trips per vehicle)
    const vehicleUtilisation = await prisma.trip.groupBy({
      by: ['vehicleId'],
      _count: { id: true },
      orderBy: { _count: { id: 'desc' } },
    });
    const vehicleIds = vehicleUtilisation.map(v => v.vehicleId);
    const vehicles = await prisma.vehicle.findMany({
      where: { id: { in: vehicleIds } },
      select: { id: true, registrationNumber: true, make: true, model: true },
    });
    const vehicleMap = Object.fromEntries(vehicles.map(v => [v.id, v]));

    res.json({
      incidentsPerRoute: incidentsPerRoute.map(i => ({ ...i, route: routeMap[i.routeId] })),
      byType,
      bySeverity,
      maintenanceDue,
      vehicleUtilisation: vehicleUtilisation.map(v => ({ ...v, vehicle: vehicleMap[v.vehicleId] })),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
