const express = require('express');
const router = express.Router();
const prisma = require('../prisma');

const asyncRoute = (handler) => (req, res, next) =>
  Promise.resolve(handler(req, res, next)).catch(next);

const positiveId = (value) =>
  /^\d+$/.test(String(value)) && Number(value) > 0 ? Number(value) : null;

const missingFields = (body, fields) =>
  fields.filter((f) => body[f] === undefined || body[f] === null || body[f] === '');

const pick = (body, keys) =>
  Object.fromEntries(keys.filter((k) => body[k] !== undefined).map((k) => [k, body[k]]));

const badRequest = (res, message) => res.status(400).json({ error: message });
const notFound = (res, entity) => res.status(404).json({ error: `${entity} not found` });

const parseNumber = (value, field, { min = 0, strictMin = false, optional = false } = {}) => {
  if ((value === undefined || value === null || value === '') && optional) return { value: null };
  const number = Number(value);
  if (!Number.isFinite(number) || (strictMin ? number <= min : number < min)) {
    return { error: `${field} must be ${strictMin ? 'greater than' : 'at least'} ${min}` };
  }
  return { value: number };
};

const parseDate = (value, field, { optional = false } = {}) => {
  if ((value === undefined || value === null || value === '') && optional) return { value: null };
  if (value === undefined || value === null || value === '') return { error: `${field} is required` };
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? { error: `${field} must be a valid date` } : { value: date };
};

const VALID_TRIP_STATUSES = ['SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED'];
const ACTIVE_TRIP_STATUSES = ['SCHEDULED', 'IN_PROGRESS'];

// Route.expectedDuration is stored as an integer. Unit is minutes (assumption based on
// typical transit scheduling; no unit is explicitly annotated in schema.prisma).
const DURATION_UNIT_MINUTES = 1;

function tripInput(body, partial = false) {
  const fields = [
    'routeId', 'vehicleId', 'driverId', 'scheduledAt', 'departedAt', 'arrivedAt',
    'status', 'actualDistanceKm', 'delayMinutes', 'passengerCount', 'cargoWeightKg', 'notes',
  ];
  const missing = partial ? [] : missingFields(body, ['routeId', 'vehicleId', 'driverId', 'scheduledAt']);
  if (missing.length) return { error: `Missing required fields: ${missing.join(', ')}` };
  const data = pick(body, fields);

  for (const key of ['routeId', 'vehicleId', 'driverId']) {
    if (data[key] !== undefined) {
      const id = positiveId(data[key]);
      if (!id) return { error: `Invalid ${key}` };
      data[key] = id;
    }
  }

  if (data.scheduledAt !== undefined) {
    const result = parseDate(data.scheduledAt, 'Scheduled at');
    if (result.error) return result;
    data.scheduledAt = result.value;
  }
  if (data.departedAt !== undefined) {
    const result = parseDate(data.departedAt, 'Departed at', { optional: true });
    if (result.error) return result;
    data.departedAt = result.value;
  }
  if (data.arrivedAt !== undefined) {
    const result = parseDate(data.arrivedAt, 'Arrived at', { optional: true });
    if (result.error) return result;
    data.arrivedAt = result.value;
  }

  if (data.status !== undefined && !VALID_TRIP_STATUSES.includes(data.status)) {
    return { error: `Invalid status. Must be one of: ${VALID_TRIP_STATUSES.join(', ')}` };
  }

  if (!partial || data.actualDistanceKm !== undefined) {
    const result = parseNumber(data.actualDistanceKm, 'Actual distance', { min: 0, strictMin: true, optional: true });
    if (result.error) return result;
    data.actualDistanceKm = result.value;
  }
  if (data.delayMinutes !== undefined) {
    const result = parseNumber(data.delayMinutes, 'Delay minutes', { min: 0, optional: true });
    if (result.error) return result;
    data.delayMinutes = result.value;
  }
  if (data.passengerCount !== undefined) {
    const result = parseNumber(data.passengerCount, 'Passenger count', { min: 0, strictMin: true, optional: true });
    if (result.error) return result;
    data.passengerCount = result.value;
  }
  if (data.cargoWeightKg !== undefined) {
    const result = parseNumber(data.cargoWeightKg, 'Cargo weight', { min: 0, strictMin: true, optional: true });
    if (result.error) return result;
    data.cargoWeightKg = result.value;
  }
  if (data.notes !== undefined && data.notes === '') data.notes = null;

  return { value: data };
}

function validateStatusTransition(currentStatus, newStatus) {
  const allowed = {
    SCHEDULED: ['IN_PROGRESS', 'CANCELLED', 'DELAYED'],
    IN_PROGRESS: ['COMPLETED', 'CANCELLED', 'DELAYED'],
    COMPLETED: [],
    CANCELLED: [],
    DELAYED: ['IN_PROGRESS', 'COMPLETED', 'CANCELLED'],
  };
  if (!allowed[currentStatus].includes(newStatus)) {
    return `Invalid transition from ${currentStatus} to ${newStatus}`;
  }
  return null;
}

function intervalsOverlap(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}

function handlePrismaError(err, res) {
  if (err.code === 'P2002') return badRequest(res, 'A record with that unique value already exists');
  if (err.code === 'P2003') return badRequest(res, 'Referenced record does not exist or is still in use');
  if (err.code === 'P2025') return notFound(res, 'Record');
  return res.status(500).json({ error: err.message });
}

// GET /api/trips — list with filters (status, vehicleId, driverId, routeId, from, to)
router.get('/', asyncRoute(async (req, res) => {
  try {
    const { status, vehicleId, driverId, routeId, from, to } = req.query;
    const where = {};
    if (status) where.status = status;
    if (vehicleId) where.vehicleId = Number(vehicleId);
    if (driverId) where.driverId = Number(driverId);
    if (routeId) where.routeId = Number(routeId);
    if (from || to) {
      where.scheduledAt = {};
      if (from) where.scheduledAt.gte = new Date(from);
      if (to) where.scheduledAt.lte = new Date(to);
    }
    const trips = await prisma.trip.findMany({
      where,
      include: {
        route: { select: { id: true, name: true, source: true, destination: true, expectedDuration: true } },
        vehicle: { select: { id: true, registrationNo: true, make: true, model: true, status: true } },
        driver: { select: { id: true, firstName: true, lastName: true, phone: true, status: true } },
      },
      orderBy: { scheduledAt: 'desc' },
    });
    const formatted = trips.map((t) => ({
      ...t,
      vehicle: t.vehicle ? { ...t.vehicle, registrationNumber: t.vehicle.registrationNo } : null,
      driver: t.driver ? { ...t.driver, name: `${t.driver.firstName || ''} ${t.driver.lastName || ''}`.trim() } : null,
    }));
    res.json(formatted);
  } catch (err) {
    handlePrismaError(err, res);
  }
}));

// GET /api/trips/:id — retrieve one trip detail
router.get('/:id', asyncRoute(async (req, res) => {
  try {
    const id = positiveId(req.params.id);
    if (!id) return badRequest(res, 'Invalid trip id');
    const trip = await prisma.trip.findUnique({
      where: { id },
      include: { route: true, vehicle: true, driver: true, fuelLogs: true },
    });
    if (!trip) return notFound(res, 'Trip');
    res.json(trip);
  } catch (err) {
    handlePrismaError(err, res);
  }
}));

// POST /api/trips — schedule a trip with overlap prevention inside a transaction
router.post('/', asyncRoute(async (req, res) => {
  try {
    const parsed = tripInput(req.body);
    if (parsed.error) return badRequest(res, parsed.error);
    const { routeId, vehicleId, driverId, scheduledAt } = parsed.value;
    const newStatus = parsed.value.status || 'SCHEDULED';

    const route = await prisma.route.findUnique({ where: { id: routeId }, select: { expectedDuration: true } });
    if (!route) return badRequest(res, 'Referenced route does not exist');

    const routeDuration = route.expectedDuration * DURATION_UNIT_MINUTES;
    const newStart = scheduledAt;
    const newEnd = new Date(newStart.getTime() + routeDuration * 60000);

    const [vehicle, driver] = await Promise.all([
      prisma.vehicle.findUnique({ where: { id: vehicleId } }),
      prisma.driver.findUnique({ where: { id: driverId } }),
    ]);
    if (!vehicle) return badRequest(res, 'Referenced vehicle does not exist');
    if (!driver) return badRequest(res, 'Referenced driver does not exist');

    try {
      const trip = await prisma.$transaction(async (tx) => {
        await tx.$queryRawUnsafe`SELECT * FROM \`vehicles\` WHERE id = ${vehicleId} FOR UPDATE`;
        await tx.$queryRawUnsafe`SELECT * FROM \`drivers\` WHERE id = ${driverId} FOR UPDATE`;

        const conflicts = await tx.trip.findMany({
          where: {
            OR: [
              { vehicleId, status: { in: ACTIVE_TRIP_STATUSES } },
              { driverId, status: { in: ACTIVE_TRIP_STATUSES } },
            ],
          },
          include: { route: { select: { expectedDuration: true } } },
        });

        for (const c of conflicts) {
          const cStart = c.scheduledAt;
          const cEnd = new Date(cStart.getTime() + c.route.expectedDuration * 60000);
          if (intervalsOverlap(newStart, newEnd, cStart, cEnd)) {
            const conflictType = c.vehicleId === vehicleId ? 'vehicle' : 'driver';
            const err = new Error(`${conflictType} is already assigned to an overlapping trip`);
            err.status = 409;
            throw err;
          }
        }

        const created = await tx.trip.create({
          data: {
            routeId,
            vehicleId,
            driverId,
            scheduledAt,
            status: newStatus,
            ...(parsed.value.departedAt !== undefined ? { departedAt: parsed.value.departedAt } : {}),
            ...(parsed.value.arrivedAt !== undefined ? { arrivedAt: parsed.value.arrivedAt } : {}),
            ...(parsed.value.actualDistanceKm !== undefined ? { actualDistanceKm: parsed.value.actualDistanceKm } : {}),
            ...(parsed.value.delayMinutes !== undefined ? { delayMinutes: parsed.value.delayMinutes } : {}),
            ...(parsed.value.passengerCount !== undefined ? { passengerCount: parsed.value.passengerCount } : {}),
            ...(parsed.value.cargoWeightKg !== undefined ? { cargoWeightKg: parsed.value.cargoWeightKg } : {}),
            ...(parsed.value.notes !== undefined ? { notes: parsed.value.notes } : {}),
          },
        });

        if (newStatus === 'IN_PROGRESS' || newStatus === 'SCHEDULED') {
          await tx.vehicle.update({ where: { id: vehicleId }, data: { status: 'IN_USE' } });
          await tx.driver.update({ where: { id: driverId }, data: { status: 'ON_TRIP' } });
        }

        return created;
      });

      res.status(201).json(trip);
    } catch (err) {
      if (err.status === 409) return badRequest(res, err.message);
      throw err;
    }
  } catch (err) {
    handlePrismaError(err, res);
  }
}));

// PUT /api/trips/:id — update trip with status transition guards
router.put('/:id', asyncRoute(async (req, res) => {
  try {
    const id = positiveId(req.params.id);
    if (!id) return badRequest(res, 'Invalid trip id');
    const parsed = tripInput(req.body, true);
    if (parsed.error) return badRequest(res, parsed.error);
    if (!Object.keys(parsed.value).length) return badRequest(res, 'Provide at least one field to update');

    const existing = await prisma.trip.findUnique({
      where: { id },
      include: { route: true },
    });
    if (!existing) return notFound(res, 'Trip');

    const newStatus = parsed.value.status;
    if (newStatus) {
      const transitionError = validateStatusTransition(existing.status, newStatus);
      if (transitionError) return badRequest(res, transitionError);
    }

    const effectiveRouteId = parsed.value.routeId !== undefined ? parsed.value.routeId : existing.routeId;
    const effectiveVehicleId = parsed.value.vehicleId !== undefined ? parsed.value.vehicleId : existing.vehicleId;
    const effectiveDriverId = parsed.value.driverId !== undefined ? parsed.value.driverId : existing.driverId;
    const effectiveScheduledAt = parsed.value.scheduledAt !== undefined ? parsed.value.scheduledAt : existing.scheduledAt;

    const schedulingChanged = parsed.value.routeId !== undefined || parsed.value.vehicleId !== undefined ||
      parsed.value.driverId !== undefined || parsed.value.scheduledAt !== undefined;

    if (schedulingChanged) {
      const route = await prisma.route.findUnique({
        where: { id: effectiveRouteId },
        select: { expectedDuration: true },
      });
      if (!route) return badRequest(res, 'Referenced route does not exist');

      const routeDuration = route.expectedDuration * DURATION_UNIT_MINUTES;
      const newStart = effectiveScheduledAt;
      const newEnd = new Date(newStart.getTime() + routeDuration * 60000);

      try {
        await prisma.$transaction(async (tx) => {
          await tx.$queryRawUnsafe`SELECT * FROM \`vehicles\` WHERE id = ${effectiveVehicleId} FOR UPDATE`;
          await tx.$queryRawUnsafe`SELECT * FROM \`drivers\` WHERE id = ${effectiveDriverId} FOR UPDATE`;

          const conflicts = await tx.trip.findMany({
            where: {
              id: { not: id },
              OR: [
                { vehicleId: effectiveVehicleId, status: { in: ACTIVE_TRIP_STATUSES } },
                { driverId: effectiveDriverId, status: { in: ACTIVE_TRIP_STATUSES } },
              ],
            },
            include: { route: { select: { expectedDuration: true } } },
          });

          for (const c of conflicts) {
            const cStart = c.scheduledAt;
            const cEnd = new Date(cStart.getTime() + c.route.expectedDuration * 60000);
            if (intervalsOverlap(newStart, newEnd, cStart, cEnd)) {
              const conflictType = c.vehicleId === effectiveVehicleId ? 'vehicle' : 'driver';
              const err = new Error(`${conflictType} is already assigned to an overlapping trip`);
              err.status = 409;
              throw err;
            }
          }
        });
      } catch (err) {
        if (err.status === 409) return badRequest(res, err.message);
        throw err;
      }
    }

    const data = { ...parsed.value };
    if (newStatus === 'IN_PROGRESS' && !existing.departedAt) {
      data.departedAt = new Date();
    }
    if (newStatus === 'COMPLETED' && !existing.arrivedAt) {
      data.arrivedAt = new Date();
    }

    const trip = await prisma.trip.update({ where: { id }, data });
    res.json(trip);
  } catch (err) {
    handlePrismaError(err, res);
  }
}));

// DELETE /api/trips/:id — soft cancel (preserve historical reporting)
router.delete('/:id', asyncRoute(async (req, res) => {
  try {
    const id = positiveId(req.params.id);
    if (!id) return badRequest(res, 'Invalid trip id');
    const trip = await prisma.trip.findUnique({ where: { id } });
    if (!trip) return notFound(res, 'Trip');
    const updated = await prisma.trip.update({
      where: { id },
      data: { status: 'CANCELLED' },
    });
    res.json({ message: 'Trip cancelled', trip: updated });
  } catch (err) {
    handlePrismaError(err, res);
  }
}));

module.exports = router;
