const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

router.get('/', async (req, res) => {
  try {
    const { routeId, status, severity } = req.query;
    const where = {};
    if (routeId)  where.routeId  = Number(routeId);
    if (status)   where.status   = status;
    if (severity) where.severity = severity;

    const incidents = await prisma.trafficIncident.findMany({
      where,
      include: { route: { select: { name: true, source: true, destination: true } } },
      orderBy: { reportedAt: 'desc' },
    });
    res.json(incidents);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const incident = await prisma.trafficIncident.findUnique({
      where: { id: Number(req.params.id) },
      include: { route: true },
    });
    if (!incident) return res.status(404).json({ error: 'Incident not found' });
    res.json(incident);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const incident = await prisma.trafficIncident.create({ data: req.body });
    res.status(201).json(incident);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const incident = await prisma.trafficIncident.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(incident);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.trafficIncident.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Incident deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
