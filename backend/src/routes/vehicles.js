const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

function formatVehicle(v) {
  if (!v) return v;
  return {
    ...v,
    registrationNumber: v.registrationNo,
    odometer: v.odometerKm,
  };
}

function parseVehiclePayload(body) {
  const data = { ...body };
  if (data.registrationNumber && !data.registrationNo) {
    data.registrationNo = data.registrationNumber;
  }
  delete data.registrationNumber;
  if (data.odometer !== undefined && data.odometerKm === undefined) {
    data.odometerKm = data.odometer;
  }
  delete data.odometer;
  if (data.year !== undefined) data.year = Number(data.year);
  if (data.capacity !== undefined) data.capacity = Number(data.capacity);
  if (data.odometerKm !== undefined) data.odometerKm = Number(data.odometerKm);
  return data;
}

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
        _count: { select: { trips: true, fuelLogs: true, maintenance: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
    res.json(vehicles.map(formatVehicle));
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
        fuelLogs: { take: 10, orderBy: { refuelledAt: 'desc' } },
        maintenance: { take: 5, orderBy: { serviceDate: 'desc' } },
      },
    });
    if (!vehicle) return res.status(404).json({ error: 'Vehicle not found' });
    res.json(formatVehicle(vehicle));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create vehicle
router.post('/', async (req, res) => {
  try {
    const data = parseVehiclePayload(req.body);
    const vehicle = await prisma.vehicle.create({ data });
    res.status(201).json(formatVehicle(vehicle));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// PUT update vehicle
router.put('/:id', async (req, res) => {
  try {
    const data = parseVehiclePayload(req.body);
    const vehicle = await prisma.vehicle.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json(formatVehicle(vehicle));
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
