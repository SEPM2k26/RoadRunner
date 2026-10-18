const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

router.get('/', async (req, res) => {
  try {
    const { vehicleId } = req.query;
    const logs = await prisma.fuelLog.findMany({
      where: vehicleId ? { vehicleId: Number(vehicleId) } : {},
      include: { vehicle: { select: { registrationNumber: true, make: true, model: true } } },
      orderBy: { fuelDate: 'desc' },
    });
    res.json(logs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const log = await prisma.fuelLog.create({ data: req.body });
    res.status(201).json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const log = await prisma.fuelLog.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(log);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.fuelLog.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Fuel log deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
