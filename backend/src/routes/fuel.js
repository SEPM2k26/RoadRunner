const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

function formatFuelLog(l) {
  if (!l) return l;
  return {
    ...l,
    fuelQuantity: Number(l.quantityLitres),
    fuelCost: Number(l.cost),
    fuelDate: l.refuelledAt,
    odometer: l.odometerKm ? Number(l.odometerKm) : null,
    vehicle: l.vehicle ? {
      ...l.vehicle,
      registrationNumber: l.vehicle.registrationNo,
    } : null,
  };
}

function parseFuelPayload(body) {
  const data = { ...body };
  if (data.fuelQuantity !== undefined && data.quantityLitres === undefined) {
    data.quantityLitres = data.fuelQuantity;
  }
  delete data.fuelQuantity;
  if (data.fuelCost !== undefined && data.cost === undefined) {
    data.cost = data.fuelCost;
  }
  delete data.fuelCost;
  if (data.fuelDate !== undefined && data.refuelledAt === undefined) {
    data.refuelledAt = data.fuelDate;
  }
  delete data.fuelDate;
  if (data.odometer !== undefined && data.odometerKm === undefined) {
    data.odometerKm = data.odometer;
  }
  delete data.odometer;

  if (data.vehicleId !== undefined) data.vehicleId = Number(data.vehicleId);
  if (data.tripId !== undefined && data.tripId !== null && data.tripId !== '') {
    data.tripId = Number(data.tripId);
  } else {
    delete data.tripId;
  }
  if (data.quantityLitres !== undefined) data.quantityLitres = Number(data.quantityLitres);
  if (data.cost !== undefined) data.cost = Number(data.cost);
  if (data.odometerKm !== undefined && data.odometerKm !== null && data.odometerKm !== '') {
    data.odometerKm = Number(data.odometerKm);
  } else {
    delete data.odometerKm;
  }
  if (data.refuelledAt) data.refuelledAt = new Date(data.refuelledAt);
  return data;
}

router.get('/', async (req, res) => {
  try {
    const { vehicleId } = req.query;
    const logs = await prisma.fuelLog.findMany({
      where: vehicleId ? { vehicleId: Number(vehicleId) } : {},
      include: { vehicle: { select: { id: true, registrationNo: true, make: true, model: true } } },
      orderBy: { refuelledAt: 'desc' },
    });
    res.json(logs.map(formatFuelLog));
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const data = parseFuelPayload(req.body);
    const log = await prisma.fuelLog.create({
      data,
      include: { vehicle: { select: { id: true, registrationNo: true, make: true, model: true } } },
    });
    res.status(201).json(formatFuelLog(log));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const data = parseFuelPayload(req.body);
    const log = await prisma.fuelLog.update({
      where: { id: Number(req.params.id) },
      data,
      include: { vehicle: { select: { id: true, registrationNo: true, make: true, model: true } } },
    });
    res.json(formatFuelLog(log));
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
