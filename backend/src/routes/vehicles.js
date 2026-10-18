const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

// GET all vehicles
router.get('/', async (req, res) => {
  try {
    const { status, type } = req.query;
    const where = {};
    if (status) where.status = status;
    if (type) where.vehicleType = type;

    const vehicles = await prisma.vehicle.findMany({
      where,
      include: {
        _count: { select: { trips: true, fuelLogs: true, maintenanceRecords: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(vehicles);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET single vehicle
router.get('/:id', async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        trips: { take: 10, orderBy: { scheduledAt: 'desc' } },
        fuelLogs: { take: 10, orderBy: { fuelDate: 'desc' } },
        maintenanceRecords: { take: 5, orderBy: { startDate: 'desc' } },
      },
    });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(vehicle);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create vehicle
router.post('/', async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.create({ data: req.body });
    res.status(201).json(vehicle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update vehicle
router.put('/:id', async (req, res) => {
  try {
    const vehicle = await prisma.vehicle.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(vehicle);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE vehicle
router.delete('/:id', async (req, res) => {
  try {
    await prisma.vehicle.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Vehicle deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
