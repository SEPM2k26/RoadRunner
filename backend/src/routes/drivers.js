const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

function formatDriver(d) {
  if (!d) return d;
  return {
    ...d,
    name: `${d.firstName || ''} ${d.lastName || ''}`.trim(),
  };
}

function parseDriverPayload(body) {
  const data = { ...body };
  delete data.address; // address is not a column in MySQL driver schema
  if (data.name && (!data.firstName || !data.lastName)) {
    const parts = data.name.trim().split(/\s+/);
    data.firstName = parts[0] || 'Driver';
    data.lastName = parts.slice(1).join(' ') || parts[0] || 'Name';
  }
  delete data.name;
  if (data.licenceExpiry) {
    data.licenceExpiry = new Date(data.licenceExpiry);
  }
  if (data.hiredAt) {
    data.hiredAt = new Date(data.hiredAt);
  }
  return data;
}

router.get('/', async (req, res) => {
  try {
    const { status } = req.query;
    const drivers = await prisma.driver.findMany({
      where: status ? { status } : {},
      include: { _count: { select: { trips: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(drivers.map(formatDriver));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const driver = await prisma.driver.findUnique({
      where: { id: Number(req.params.id) },
      include: { trips: { take: 10, orderBy: { scheduledAt: 'desc' } } },
    });
    if (!driver) return res.status(404).json({ error: 'Driver not found' });
    res.json(formatDriver(driver));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = parseDriverPayload(req.body);
    const driver = await prisma.driver.create({ data });
    res.status(201).json(formatDriver(driver));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = parseDriverPayload(req.body);
    const driver = await prisma.driver.update({
      where: { id: Number(req.params.id) },
      data,
    });
    res.json(formatDriver(driver));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.driver.delete({ where: { id: Number(req.params.id) } });
    res.json({ message: 'Driver deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

module.exports = router;
