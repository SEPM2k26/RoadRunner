const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

function formatMaintenance(m) {
  if (!m) return m;
  return {
    ...m,
    startDate: m.serviceDate,
    odometer: m.odometerKm ? Number(m.odometerKm) : null,
    cost: Number(m.cost),
    vehicle: m.vehicle ? {
      ...m.vehicle,
      registrationNumber: m.vehicle.registrationNo,
    } : null,
  };
}

function parseMaintenancePayload(body) {
  const data = { ...body };
  if (data.startDate !== undefined && data.serviceDate === undefined) {
    data.serviceDate = data.startDate;
  }
  delete data.startDate;
  if (data.odometer !== undefined && data.odometerKm === undefined) {
    data.odometerKm = data.odometer;
  }
  delete data.odometer;

  if (data.vehicleId !== undefined) data.vehicleId = Number(data.vehicleId);
  if (data.cost !== undefined) data.cost = Number(data.cost);
  if (data.odometerKm !== undefined && data.odometerKm !== null && data.odometerKm !== '') {
    data.odometerKm = Number(data.odometerKm);
  } else {
    delete data.odometerKm;
  }
  if (data.serviceDate) data.serviceDate = new Date(data.serviceDate);
  if (data.nextServiceDate) data.nextServiceDate = new Date(data.nextServiceDate);
  if (data.endDate) data.endDate = new Date(data.endDate);
  return data;
}

router.get('/', async (req, res) => {
  try {
    const { vehicleId, status } = req.query;
    const where = {};
    if (vehicleId) where.vehicleId = Number(vehicleId);
    if (status) where.status = status;
    const records = await prisma.maintenance.findMany({
      where,
      include: { vehicle: { select: { id: true, registrationNo: true, make: true, model: true } } },
      orderBy: { serviceDate: 'desc' },
    });
    res.json(records.map(formatMaintenance));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Vehicles due for maintenance (next service date <= 7 days from now)
router.get('/due', async (req, res) => {
  try {
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + 7);
    const due = await prisma.maintenance.findMany({
      where: { nextServiceDate: { lte: cutoff }, status: { not: 'COMPLETED' } },
      include: { vehicle: { select: { id: true, registrationNo: true, make: true, model: true } } },
      orderBy: { nextServiceDate: 'asc' },
    });
    res.json(due.map(formatMaintenance));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = parseMaintenancePayload(req.body);
    const record = await prisma.maintenance.create({
      data,
      include: { vehicle: { select: { id: true, registrationNo: true, make: true, model: true } } },
    });
    res.status(201).json(formatMaintenance(record));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = parseMaintenancePayload(req.body);
    const record = await prisma.maintenance.update({
      where: { id: Number(req.params.id) },
      data,
      include: { vehicle: { select: { id: true, registrationNo: true, make: true, model: true } } },
    });
    res.json(formatMaintenance(record));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.maintenance.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Record deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
