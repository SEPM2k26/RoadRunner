const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

router.get('/', async (req, res) => {
  try {
    const { status, vehicleId, driverId, routeId } = req.query;
    const where = {};
    if (status)    where.status    = status;
    if (vehicleId) where.vehicleId = Number(vehicleId);
    if (driverId)  where.driverId  = Number(driverId);
    if (routeId)   where.routeId   = Number(routeId);

    const trips = await prisma.trip.findMany({
      where,
      include: {
        route:   { select: { name: true, source: true, destination: true } },
        vehicle: { select: { id: true, registrationNo: true, make: true, model: true } },
        driver:  { select: { id: true, firstName: true, lastName: true, phone: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    });
    const formatted = trips.map(t => ({
      ...t,
      vehicle: t.vehicle ? { ...t.vehicle, registrationNumber: t.vehicle.registrationNo } : null,
      driver: t.driver ? { ...t.driver, name: `${t.driver.firstName || ''} ${t.driver.lastName || ''}`.trim() } : null,
    }));
    res.json(formatted);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const trip = await prisma.trip.findUnique({
      where: { id: Number(req.params.id) },
      include: { route: true, vehicle: true, driver: true, fuelLogs: true },
    });
    if (!trip) return res.status(404).json({ error: 'Trip not found' });
    res.json(trip);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const trip = await prisma.trip.create({ data: req.body });
    // Update vehicle and driver status
    await prisma.vehicle.update({ where: { id: req.body.vehicleId }, data: { status: 'IN_USE' } });
    await prisma.driver.update({ where: { id: req.body.driverId }, data: { status: 'ON_TRIP' } });
    res.status(201).json(trip);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const trip = await prisma.trip.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    // If trip completed or cancelled, free up vehicle and driver
    if (req.body.status === 'COMPLETED' || req.body.status === 'CANCELLED') {
      await prisma.vehicle.update({ where: { id: trip.vehicleId }, data: { status: 'AVAILABLE' } });
      await prisma.driver.update({ where: { id: trip.driverId }, data: { status: 'AVAILABLE' } });
    }
    res.json(trip);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
