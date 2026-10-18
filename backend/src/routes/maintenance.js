const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

router.get('/', async (req, res) => {
  try {
    const { vehicleId, status } = req.query;
    const where = {};
    if (vehicleId) where.vehicleId = Number(vehicleId);
    if (status) where.status = status;
    const records = await prisma.maintenance.findMany({
      where,
      include: { vehicle: { select: { registrationNumber: true, make: true, model: true } } },
      orderBy: { startDate: 'desc' },
    });
    res.json(records);
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
      include: { vehicle: true },
      orderBy: { nextServiceDate: 'asc' },
    });
    res.json(due);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const record = await prisma.maintenance.create({ data: req.body });
    res.status(201).json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const record = await prisma.maintenance.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(record);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.maintenance.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Maintenance record deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
