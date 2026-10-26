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

const VALID_ROUTE_STATUSES = ['ACTIVE', 'INACTIVE', 'SUSPENDED'];

function routeInput(body, partial = false) {
  const fields = ['name', 'source', 'destination', 'distanceKm', 'expectedDuration', 'description', 'status'];
  const missing = partial ? [] : missingFields(body, ['name', 'source', 'destination', 'distanceKm', 'expectedDuration']);
  if (missing.length) return { error: `Missing required fields: ${missing.join(', ')}` };
  const data = pick(body, fields);

  for (const key of ['name', 'source', 'destination']) {
    if (data[key] !== undefined) {
      data[key] = String(data[key]).trim();
      if (!data[key]) return { error: `${key} cannot be blank` };
    }
  }

  if (data.name !== undefined && data.name.length > 100) return { error: 'Name must be at most 100 characters' };
  if (data.source !== undefined && data.source.length > 100) return { error: 'Source must be at most 100 characters' };
  if (data.destination !== undefined && data.destination.length > 100) return { error: 'Destination must be at most 100 characters' };

  if (data.source !== undefined && data.destination !== undefined && data.source === data.destination) {
    return { error: 'Source and destination must be different' };
  }

  if (!partial || data.distanceKm !== undefined) {
    const result = parseNumber(data.distanceKm, 'Distance', { min: 0, strictMin: true });
    if (result.error) return result;
    data.distanceKm = result.value;
  }

  if (!partial || data.expectedDuration !== undefined) {
    const result = parseNumber(data.expectedDuration, 'Expected duration', { min: 0, strictMin: true });
    if (result.error) return result;
    data.expectedDuration = result.value;
  }

  if (data.status !== undefined && !VALID_ROUTE_STATUSES.includes(data.status)) {
    return { error: `Invalid status. Must be one of: ${VALID_ROUTE_STATUSES.join(', ')}` };
  }

  if (data.description !== undefined && data.description === '') data.description = null;

  return { value: data };
}

function handlePrismaError(err, res) {
  if (err.code === 'P2002') return badRequest(res, 'A record with that unique value already exists');
  if (err.code === 'P2003') return badRequest(res, 'Referenced record does not exist or is still in use');
  if (err.code === 'P2025') return notFound(res, 'Record');
  return res.status(500).json({ error: err.message });
}

// GET /api/routes — list with search and status filters
router.get('/', asyncRoute(async (req, res) => {
  try {
    const { status, search } = req.query;
    const where = {};
    if (status) {
      if (!VALID_ROUTE_STATUSES.includes(status)) return badRequest(res, 'Invalid status filter');
      where.status = status;
    }
    if (search) {
      where.OR = [
        { name: { contains: String(search) } },
        { source: { contains: String(search) } },
        { destination: { contains: String(search) } },
      ];
    }
    const routes = await prisma.route.findMany({
      where,
      include: { _count: { select: { trips: true, incidents: true } } },
      orderBy: { createdAt: 'desc' },
    });
    res.json(routes);
  } catch (err) {
    handlePrismaError(err, res);
  }
}));

// GET /api/routes/:id — retrieve one
router.get('/:id', asyncRoute(async (req, res) => {
  try {
    const id = positiveId(req.params.id);
    if (!id) return badRequest(res, 'Invalid route id');
    const route = await prisma.route.findUnique({
      where: { id },
      include: {
        trips: { take: 10, orderBy: { scheduledAt: 'desc' } },
        incidents: { take: 10, orderBy: { reportedAt: 'desc' } },
      },
    });
    if (!route) return notFound(res, 'Route');
    res.json(route);
  } catch (err) {
    handlePrismaError(err, res);
  }
}));

// POST /api/routes — create a route
router.post('/', asyncRoute(async (req, res) => {
  try {
    const parsed = routeInput(req.body);
    if (parsed.error) return badRequest(res, parsed.error);
    const route = await prisma.route.create({ data: parsed.value });
    res.status(201).json(route);
  } catch (err) {
    handlePrismaError(err, res);
  }
}));

// PUT /api/routes/:id — update a route
router.put('/:id', asyncRoute(async (req, res) => {
  try {
    const id = positiveId(req.params.id);
    if (!id) return badRequest(res, 'Invalid route id');
    const parsed = routeInput(req.body, true);
    if (parsed.error) return badRequest(res, parsed.error);
    if (!Object.keys(parsed.value).length) return badRequest(res, 'Provide at least one field to update');

    const existing = await prisma.route.findUnique({ where: { id } });
    if (!existing) return notFound(res, 'Route');

    const source = parsed.value.source !== undefined ? parsed.value.source : existing.source;
    const destination = parsed.value.destination !== undefined ? parsed.value.destination : existing.destination;
    if (source === destination) return badRequest(res, 'Source and destination must be different');

    const route = await prisma.route.update({ where: { id }, data: parsed.value });
    res.json(route);
  } catch (err) {
    handlePrismaError(err, res);
  }
}));

// PATCH /api/routes/:id/toggle — safe status change (activate/deactivate/suspend)
router.patch('/:id/toggle', asyncRoute(async (req, res) => {
  try {
    const id = positiveId(req.params.id);
    if (!id) return badRequest(res, 'Invalid route id');
    const { status } = req.body;
    if (!status || !VALID_ROUTE_STATUSES.includes(status)) {
      return badRequest(res, `Status is required and must be one of: ${VALID_ROUTE_STATUSES.join(', ')}`);
    }
    const route = await prisma.route.findUnique({ where: { id } });
    if (!route) return notFound(res, 'Route');
    const updated = await prisma.route.update({ where: { id }, data: { status } });
    res.json(updated);
  } catch (err) {
    handlePrismaError(err, res);
  }
}));

// DELETE /api/routes/:id — soft deactivation (preserve historical trips/incidents)
router.delete('/:id', asyncRoute(async (req, res) => {
  try {
    const id = positiveId(req.params.id);
    if (!id) return badRequest(res, 'Invalid route id');
    const route = await prisma.route.findUnique({ where: { id } });
    if (!route) return notFound(res, 'Route');
    const updated = await prisma.route.update({ where: { id }, data: { status: 'INACTIVE' } });
    res.json({ message: 'Route deactivated', route: updated });
  } catch (err) {
    handlePrismaError(err, res);
  }
}));

module.exports = router;
