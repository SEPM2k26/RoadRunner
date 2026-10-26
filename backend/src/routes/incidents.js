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

const VALID_INCIDENT_TYPES = ['ACCIDENT', 'CONGESTION', 'ROAD_CLOSURE', 'WEATHER', 'CONSTRUCTION', 'OTHER'];
const VALID_SEVERITIES = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
const VALID_INCIDENT_STATUSES = ['ACTIVE', 'RESOLVED', 'MONITORING'];

function incidentInput(body, partial = false) {
  const fields = [
    'routeId', 'incidentType', 'severity', 'location', 'description',
    'reportedAt', 'resolvedAt', 'estimatedDelay', 'status', 'reportedBy',
  ];
  const missing = partial ? [] : missingFields(body, ['routeId', 'incidentType', 'severity', 'location', 'reportedAt']);
  if (missing.length) return { error: `Missing required fields: ${missing.join(', ')}` };
  const data = pick(body, fields);

  if (data.routeId !== undefined) {
    const id = positiveId(data.routeId);
    if (!id) return { error: 'Invalid routeId' };
    data.routeId = id;
  }

  if (data.incidentType !== undefined && !VALID_INCIDENT_TYPES.includes(data.incidentType)) {
    return { error: `Invalid incident type. Must be one of: ${VALID_INCIDENT_TYPES.join(', ')}` };
  }
  if (data.severity !== undefined && !VALID_SEVERITIES.includes(data.severity)) {
    return { error: `Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}` };
  }
  if (data.status !== undefined && !VALID_INCIDENT_STATUSES.includes(data.status)) {
    return { error: `Invalid status. Must be one of: ${VALID_INCIDENT_STATUSES.join(', ')}` };
  }

  if (data.location !== undefined) {
    data.location = String(data.location).trim();
    if (!data.location) return { error: 'Location cannot be blank' };
  }

  if (data.reportedAt !== undefined) {
    const result = parseDate(data.reportedAt, 'Reported at');
    if (result.error) return result;
    data.reportedAt = result.value;
  }
  if (data.resolvedAt !== undefined) {
    const result = parseDate(data.resolvedAt, 'Resolved at', { optional: true });
    if (result.error) return result;
    data.resolvedAt = result.value;
  }

  if (data.estimatedDelay !== undefined) {
    const result = parseNumber(data.estimatedDelay, 'Estimated delay', { min: 0, optional: true });
    if (result.error) return result;
    data.estimatedDelay = result.value;
  }
  if (data.reportedBy !== undefined && data.reportedBy === '') data.reportedBy = null;
  if (data.description !== undefined && data.description === '') data.description = null;

  return { value: data };
}

function handlePrismaError(err, res) {
  if (err.code === 'P2002') return badRequest(res, 'A record with that unique value already exists');
  if (err.code === 'P2003') return badRequest(res, 'Referenced record does not exist or is still in use');
  if (err.code === 'P2025') return notFound(res, 'Record');
  return res.status(500).json({ error: err.message });
}

// GET /api/incidents — list with filters (routeId, status, severity, incidentType)
router.get('/', asyncRoute(async (req, res) => {
  try {
    const { routeId, status, severity, incidentType } = req.query;
    const where = {};
    if (routeId) where.routeId = Number(routeId);
    if (status) where.status = status;
    if (severity) where.severity = severity;
    if (incidentType) where.incidentType = incidentType;

    const incidents = await prisma.trafficIncident.findMany({
      where,
      include: { route: { select: { id: true, name: true, source: true, destination: true } } },
      orderBy: { reportedAt: 'desc' },
    });
    res.json(incidents);
  } catch (err) {
    handlePrismaError(err, res);
  }
}));

// GET /api/incidents/:id — retrieve one incident
router.get('/:id', asyncRoute(async (req, res) => {
  try {
    const id = positiveId(req.params.id);
    if (!id) return badRequest(res, 'Invalid incident id');
    const incident = await prisma.trafficIncident.findUnique({
      where: { id },
      include: { route: true },
    });
    if (!incident) return notFound(res, 'Incident');
    res.json(incident);
  } catch (err) {
    handlePrismaError(err, res);
  }
}));

// POST /api/incidents — create a traffic incident
router.post('/', asyncRoute(async (req, res) => {
  try {
    const parsed = incidentInput(req.body);
    if (parsed.error) return badRequest(res, parsed.error);

    const route = await prisma.route.findUnique({ where: { id: parsed.value.routeId } });
    if (!route) return badRequest(res, 'Referenced route does not exist');

    const incident = await prisma.trafficIncident.create({ data: parsed.value });
    res.status(201).json(incident);
  } catch (err) {
    handlePrismaError(err, res);
  }
}));

// PUT /api/incidents/:id — update a traffic incident
router.put('/:id', asyncRoute(async (req, res) => {
  try {
    const id = positiveId(req.params.id);
    if (!id) return badRequest(res, 'Invalid incident id');
    const parsed = incidentInput(req.body, true);
    if (parsed.error) return badRequest(res, parsed.error);
    if (!Object.keys(parsed.value).length) return badRequest(res, 'Provide at least one field to update');

    const existing = await prisma.trafficIncident.findUnique({ where: { id } });
    if (!existing) return notFound(res, 'Incident');

    if (parsed.value.routeId !== undefined && parsed.value.routeId !== existing.routeId) {
      const route = await prisma.route.findUnique({ where: { id: parsed.value.routeId } });
      if (!route) return badRequest(res, 'Referenced route does not exist');
    }

    const incident = await prisma.trafficIncident.update({ where: { id }, data: parsed.value });
    res.json(incident);
  } catch (err) {
    handlePrismaError(err, res);
  }
}));

// PATCH /api/incidents/:id/resolve — resolve an incident
router.patch('/:id/resolve', asyncRoute(async (req, res) => {
  try {
    const id = positiveId(req.params.id);
    if (!id) return badRequest(res, 'Invalid incident id');
    const incident = await prisma.trafficIncident.findUnique({ where: { id } });
    if (!incident) return notFound(res, 'Incident');
    const updated = await prisma.trafficIncident.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });
    res.json(updated);
  } catch (err) {
    handlePrismaError(err, res);
  }
}));

// DELETE /api/incidents/:id — soft resolve (preserve history)
router.delete('/:id', asyncRoute(async (req, res) => {
  try {
    const id = positiveId(req.params.id);
    if (!id) return badRequest(res, 'Invalid incident id');
    const incident = await prisma.trafficIncident.findUnique({ where: { id } });
    if (!incident) return notFound(res, 'Incident');
    const updated = await prisma.trafficIncident.update({
      where: { id },
      data: { status: 'RESOLVED', resolvedAt: new Date() },
    });
    res.json({ message: 'Incident resolved', incident: updated });
  } catch (err) {
    handlePrismaError(err, res);
  }
}));

module.exports = router;
