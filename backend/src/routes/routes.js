const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const routes = await prisma.route.findMany({
      where: status ? { status } : {},
      include: { _count: { select: { trips: true, incidents: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(routes);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const route = await prisma.route.findUnique({
      where: { id: Number(req.params.id) },
      include: {
        trips: { take: 10, orderBy: { scheduledAt: 'desc' } },
        incidents: { take: 10, orderBy: { reportedAt: 'desc' } },
      },
    });
    if (!route) return res.status(404).json({ error: 'Route not found' });
    res.json(route);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const route = await prisma.route.create({ data: req.body });
    res.status(201).json(route);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const route = await prisma.route.update({
      where: { id: Number(req.params.id) },
      data: req.body,
    });
    res.json(route);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.route.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Route deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
