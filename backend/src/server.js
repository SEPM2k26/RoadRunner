import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient, Prisma } from "@prisma/client";

const app = express();
const prisma = new PrismaClient();
const enumValues = {
  vehicleStatus: ["AVAILABLE", "IN_USE", "MAINTENANCE", "INACTIVE"],
  driverStatus: ["AVAILABLE", "ON_TRIP", "INACTIVE"],
  fuelType: ["PETROL", "DIESEL", "CNG", "ELECTRIC", "HYBRID", "OTHER"],
  maintenanceStatus: ["SCHEDULED", "IN_PROGRESS", "COMPLETED", "CANCELLED"]
};

app.use(cors());
app.use(express.json({ limit: "100kb" }));

const asyncRoute = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);
const positiveId = (value) => /^\d+$/.test(String(value)) && Number(value) > 0 ? Number(value) : null;
const missingFields = (body, fields) => fields.filter((field) => body[field] === undefined || body[field] === null || body[field] === "");
const badRequest = (res, message) => res.status(400).json({ error: message });
const notFound = (res, entity) => res.status(404).json({ error: `${entity} not found` });
const parseDate = (value, field, { optional = false } = {}) => {
  if ((value === undefined || value === null || value === "") && optional) return { value: null };
  if (value === undefined || value === null || value === "") return { error: `${field} is required` };
  const date = new Date(value);
  return Number.isNaN(date.valueOf()) ? { error: `${field} must be a valid date` } : { value: date };
};
const parseNumber = (value, field, { min = 0, strictMin = false, optional = false } = {}) => {
  if ((value === undefined || value === null || value === "") && optional) return { value: null };
  const number = Number(value);
  if (!Number.isFinite(number) || (strictMin ? number <= min : number < min)) {
    return { error: `${field} must be ${strictMin ? "greater than" : "at least"} ${min}` };
  }
  return { value: number };
};
const pick = (body, keys) => Object.fromEntries(keys.filter((key) => body[key] !== undefined).map((key) => [key, body[key]]));

function vehicleInput(body, partial = false) {
  const fields = ["registrationNo", "vin", "make", "model", "manufactureYear", "vehicleType", "capacity", "fuelType", "status", "odometerKm"];
  const missing = partial ? [] : missingFields(body, ["registrationNo", "make", "model", "vehicleType", "capacity", "fuelType"]);
  if (missing.length) return { error: `Missing required fields: ${missing.join(", ")}` };
  const data = pick(body, fields);
  for (const key of ["registrationNo", "make", "model", "vehicleType"]) {
    if (data[key] !== undefined) {
      data[key] = String(data[key]).trim();
      if (!data[key]) return { error: `${key} cannot be blank` };
    }
  }
  if (data.registrationNo !== undefined) data.registrationNo = data.registrationNo.toUpperCase();
  if (data.vin !== undefined) data.vin = data.vin ? String(data.vin).trim().toUpperCase() : null;
  if (!partial || data.capacity !== undefined) {
    const result = parseNumber(data.capacity, "Capacity", { min: 0, strictMin: true });
    if (result.error) return result;
    data.capacity = result.value;
  }
  if (data.odometerKm !== undefined) {
    const result = parseNumber(data.odometerKm, "Odometer", { optional: true });
    if (result.error) return result;
    data.odometerKm = result.value ?? 0;
  }
  if (data.manufactureYear !== undefined) {
    if (data.manufactureYear === "" || data.manufactureYear === null) data.manufactureYear = null;
    else {
      const year = Number(data.manufactureYear);
      if (!Number.isInteger(year) || year < 1900 || year > 2100) return { error: "Manufacture year must be between 1900 and 2100" };
      data.manufactureYear = year;
    }
  }
  if (data.fuelType !== undefined && !enumValues.fuelType.includes(data.fuelType)) return { error: "Invalid fuel type" };
  if (data.status !== undefined && !enumValues.vehicleStatus.includes(data.status)) return { error: "Invalid vehicle status" };
  return { value: data };
}

function driverInput(body, partial = false) {
  const fields = ["firstName", "lastName", "phone", "email", "licenceNumber", "licenceExpiry", "status", "hiredAt"];
  const missing = partial ? [] : missingFields(body, ["firstName", "lastName", "phone", "licenceNumber", "licenceExpiry"]);
  if (missing.length) return { error: `Missing required fields: ${missing.join(", ")}` };
  const data = pick(body, fields);
  for (const key of ["firstName", "lastName", "phone", "licenceNumber"]) {
    if (data[key] !== undefined) {
      data[key] = String(data[key]).trim();
      if (!data[key]) return { error: `${key} cannot be blank` };
    }
  }
  if (data.licenceNumber !== undefined) data.licenceNumber = data.licenceNumber.toUpperCase();
  if (data.email !== undefined) {
    data.email = data.email ? String(data.email).trim().toLowerCase() : null;
    if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) return { error: "Email address is invalid" };
  }
  if (!partial || data.licenceExpiry !== undefined) {
    const result = parseDate(data.licenceExpiry, "Licence expiry date");
    if (result.error) return result;
    data.licenceExpiry = result.value;
  }
  if (data.hiredAt !== undefined) {
    const result = parseDate(data.hiredAt, "Hire date", { optional: true });
    if (result.error) return result;
    data.hiredAt = result.value;
  }
  if (data.status !== undefined && !enumValues.driverStatus.includes(data.status)) return { error: "Invalid driver status" };
  return { value: data };
}

function fuelInput(body, partial = false) {
  const fields = ["vehicleId", "refuelledAt", "quantityLitres", "cost", "odometerKm", "station", "notes"];
  const missing = partial ? [] : missingFields(body, ["vehicleId", "quantityLitres", "cost"]);
  if (missing.length) return { error: `Missing required fields: ${missing.join(", ")}` };
  const data = pick(body, fields);
  if (data.vehicleId !== undefined) {
    data.vehicleId = positiveId(data.vehicleId);
    if (!data.vehicleId) return { error: "Vehicle id must be a positive integer" };
  }
  if (!partial || data.quantityLitres !== undefined) {
    const result = parseNumber(data.quantityLitres, "Fuel quantity (litres)", { min: 0, strictMin: true });
    if (result.error) return result;
    data.quantityLitres = result.value;
  }
  if (!partial || data.cost !== undefined) {
    const result = parseNumber(data.cost, "Fuel cost");
    if (result.error) return result;
    data.cost = result.value;
  }
  if (data.odometerKm !== undefined) {
    const result = parseNumber(data.odometerKm, "Odometer", { optional: true });
    if (result.error) return result;
    data.odometerKm = result.value;
  }
  if (data.refuelledAt !== undefined) {
    const result = parseDate(data.refuelledAt, "Fuel date");
    if (result.error) return result;
    data.refuelledAt = result.value;
  }
  for (const key of ["station", "notes"]) if (data[key] === "") data[key] = null;
  return { value: data };
}

function maintenanceInput(body, partial = false) {
  const fields = ["vehicleId", "serviceDate", "description", "cost", "odometerKm", "nextServiceDate", "status", "provider"];
  const missing = partial ? [] : missingFields(body, ["vehicleId", "description"]);
  if (missing.length) return { error: `Missing required fields: ${missing.join(", ")}` };
  const data = pick(body, fields);
  if (data.vehicleId !== undefined) {
    data.vehicleId = positiveId(data.vehicleId);
    if (!data.vehicleId) return { error: "Vehicle id must be a positive integer" };
  }
  if (data.description !== undefined) {
    data.description = String(data.description).trim();
    if (!data.description) return { error: "Description cannot be blank" };
  }
  if (data.cost !== undefined || !partial) {
    const result = parseNumber(data.cost ?? 0, "Maintenance cost");
    if (result.error) return result;
    data.cost = result.value;
  }
  if (data.odometerKm !== undefined) {
    const result = parseNumber(data.odometerKm, "Odometer", { optional: true });
    if (result.error) return result;
    data.odometerKm = result.value;
  }
  if (data.serviceDate !== undefined) {
    const result = parseDate(data.serviceDate, "Service date");
    if (result.error) return result;
    data.serviceDate = result.value;
  }
  if (data.nextServiceDate !== undefined) {
    const result = parseDate(data.nextServiceDate, "Next service date", { optional: true });
    if (result.error) return result;
    data.nextServiceDate = result.value;
  }
  if (data.status !== undefined && !enumValues.maintenanceStatus.includes(data.status)) return { error: "Invalid maintenance status" };
  if (data.provider === "") data.provider = null;
  return { value: data };
}

app.get("/api/health", (_req, res) => res.json({ status: "ok", module: "fleet-driver" }));

// Vehicles: search and filter by type/status. DELETE is a safe deactivation.
app.get("/api/vehicles", asyncRoute(async (req, res) => {
  const { search, status, type } = req.query;
  if (status && !enumValues.vehicleStatus.includes(String(status).toUpperCase())) return badRequest(res, "Invalid vehicle status filter");
  const rows = await prisma.vehicle.findMany({
    where: {
      ...(status ? { status: String(status).toUpperCase() } : {}),
      ...(type ? { vehicleType: { equals: String(type) } } : {}),
      ...(search ? { OR: [
        { registrationNo: { contains: String(search) } },
        { make: { contains: String(search) } },
        { model: { contains: String(search) } }
      ] } : {})
    }, orderBy: { id: "asc" }
  });
  res.json(rows);
}));
app.post("/api/vehicles", asyncRoute(async (req, res) => {
  const parsed = vehicleInput(req.body);
  if (parsed.error) return badRequest(res, parsed.error);
  const row = await prisma.vehicle.create({ data: parsed.value });
  res.status(201).json(row);
}));
app.get("/api/vehicles/:id", asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id); if (!id) return badRequest(res, "Invalid vehicle id");
  const row = await prisma.vehicle.findUnique({ where: { id } }); return row ? res.json(row) : notFound(res, "Vehicle");
}));
app.put("/api/vehicles/:id", asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id); if (!id) return badRequest(res, "Invalid vehicle id");
  const parsed = vehicleInput(req.body, true); if (parsed.error) return badRequest(res, parsed.error);
  if (!Object.keys(parsed.value).length) return badRequest(res, "Provide at least one vehicle field to update");
  const row = await prisma.vehicle.update({ where: { id }, data: parsed.value }); res.json(row);
}));
app.delete("/api/vehicles/:id", asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id); if (!id) return badRequest(res, "Invalid vehicle id");
  const row = await prisma.vehicle.update({ where: { id }, data: { status: "INACTIVE" } }); res.json({ message: "Vehicle deactivated", vehicle: row });
}));

// Drivers: search and filter by availability. DELETE is a safe deactivation.
app.get("/api/drivers", asyncRoute(async (req, res) => {
  const { search, status } = req.query;
  if (status && !enumValues.driverStatus.includes(String(status).toUpperCase())) return badRequest(res, "Invalid driver status filter");
  const rows = await prisma.driver.findMany({ where: {
    ...(status ? { status: String(status).toUpperCase() } : {}),
    ...(search ? { OR: [
      { firstName: { contains: String(search) } },
      { lastName: { contains: String(search) } },
      { licenceNumber: { contains: String(search) } },
      { phone: { contains: String(search) } }
    ] } : {})
  }, orderBy: [{ lastName: "asc" }, { firstName: "asc" }] });
  res.json(rows);
}));
app.post("/api/drivers", asyncRoute(async (req, res) => {
  const parsed = driverInput(req.body);
  if (parsed.error) return badRequest(res, parsed.error);
  const row = await prisma.driver.create({ data: parsed.value });
  res.status(201).json(row);
}));
app.get("/api/drivers/:id", asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id); if (!id) return badRequest(res, "Invalid driver id");
  const row = await prisma.driver.findUnique({ where: { id } }); return row ? res.json(row) : notFound(res, "Driver");
}));
app.put("/api/drivers/:id", asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id); if (!id) return badRequest(res, "Invalid driver id");
  const parsed = driverInput(req.body, true); if (parsed.error) return badRequest(res, parsed.error);
  if (!Object.keys(parsed.value).length) return badRequest(res, "Provide at least one driver field to update");
  const row = await prisma.driver.update({ where: { id }, data: parsed.value }); res.json(row);
}));
app.delete("/api/drivers/:id", asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id); if (!id) return badRequest(res, "Invalid driver id");
  const row = await prisma.driver.update({ where: { id }, data: { status: "INACTIVE" } }); res.json({ message: "Driver deactivated", driver: row });
}));

// Fuel logs and spend summaries.
app.get("/api/fuel/summary", asyncRoute(async (_req, res) => {
  const [totals, vehicles] = await Promise.all([
    prisma.fuelLog.groupBy({ by: ["vehicleId"], _sum: { quantityLitres: true, cost: true }, _count: { id: true }, orderBy: { vehicleId: "asc" } }),
    prisma.vehicle.findMany({ select: { id: true, registrationNo: true, make: true, model: true }, orderBy: { id: "asc" } })
  ]);
  const byId = new Map(totals.map((row) => [row.vehicleId, row]));
  res.json(vehicles.map((vehicle) => {
    const row = byId.get(vehicle.id);
    return { vehicle, refuelCount: row?._count.id ?? 0, totalLitres: row?._sum.quantityLitres ?? 0, totalCost: row?._sum.cost ?? 0 };
  }));
}));
app.get("/api/fuel", asyncRoute(async (req, res) => {
  const vehicleId = req.query.vehicleId ? positiveId(String(req.query.vehicleId)) : undefined;
  if (req.query.vehicleId && !vehicleId) return badRequest(res, "Invalid vehicle id");
  const rows = await prisma.fuelLog.findMany({ where: vehicleId ? { vehicleId } : {}, include: { vehicle: { select: { id: true, registrationNo: true, make: true, model: true } } }, orderBy: { refuelledAt: "desc" } });
  res.json(rows);
}));
app.post("/api/fuel", asyncRoute(async (req, res) => {
  const parsed = fuelInput(req.body); if (parsed.error) return badRequest(res, parsed.error);
  const row = await prisma.fuelLog.create({ data: parsed.value, include: { vehicle: true } });
  res.status(201).json(row);
}));
app.put("/api/fuel/:id", asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id); if (!id) return badRequest(res, "Invalid fuel log id");
  const parsed = fuelInput(req.body, true); if (parsed.error) return badRequest(res, parsed.error);
  if (!Object.keys(parsed.value).length) return badRequest(res, "Provide at least one fuel log field to update");
  const row = await prisma.fuelLog.update({ where: { id }, data: parsed.value, include: { vehicle: true } }); res.json(row);
}));
app.delete("/api/fuel/:id", asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id); if (!id) return badRequest(res, "Invalid fuel log id");
  await prisma.fuelLog.delete({ where: { id } }); res.status(204).end();
}));

// Maintenance records and due-date filtering.
app.get("/api/maintenance", asyncRoute(async (req, res) => {
  const { due, vehicleId, status } = req.query;
  const id = vehicleId ? positiveId(String(vehicleId)) : undefined;
  if (vehicleId && !id) return badRequest(res, "Invalid vehicle id");
  if (status && !enumValues.maintenanceStatus.includes(String(status).toUpperCase())) return badRequest(res, "Invalid maintenance status filter");
  const rows = await prisma.maintenance.findMany({ where: {
    ...(id ? { vehicleId: id } : {}),
    ...(status ? { status: String(status).toUpperCase() } : {}),
    ...(due === "true" ? { nextServiceDate: { lte: new Date() }, status: { not: "CANCELLED" } } : {})
  }, include: { vehicle: { select: { id: true, registrationNo: true, make: true, model: true, status: true } } }, orderBy: { nextServiceDate: "asc" } });
  res.json(rows);
}));
app.post("/api/maintenance", asyncRoute(async (req, res) => {
  const parsed = maintenanceInput(req.body); if (parsed.error) return badRequest(res, parsed.error);
  const row = await prisma.maintenance.create({ data: parsed.value, include: { vehicle: true } });
  res.status(201).json(row);
}));
app.put("/api/maintenance/:id", asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id); if (!id) return badRequest(res, "Invalid maintenance id");
  const parsed = maintenanceInput(req.body, true); if (parsed.error) return badRequest(res, parsed.error);
  if (!Object.keys(parsed.value).length) return badRequest(res, "Provide at least one maintenance field to update");
  const row = await prisma.maintenance.update({ where: { id }, data: parsed.value, include: { vehicle: true } }); res.json(row);
}));
app.delete("/api/maintenance/:id", asyncRoute(async (req, res) => {
  const id = positiveId(req.params.id); if (!id) return badRequest(res, "Invalid maintenance id");
  const row = await prisma.maintenance.update({ where: { id }, data: { status: "CANCELLED" } }); res.json({ message: "Maintenance record cancelled", maintenance: row });
}));

app.use((err, _req, res, _next) => {
  console.error(err);
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") return res.status(409).json({ error: "A record with that unique value already exists" });
    if (err.code === "P2003") return res.status(400).json({ error: "Referenced record does not exist or is still in use" });
    if (err.code === "P2025") return res.status(404).json({ error: "Record not found" });
    if (["P2009", "P2011", "P2012", "P2013"].includes(err.code)) return res.status(400).json({ error: "The submitted data is invalid or incomplete" });
  }
  if (err instanceof Prisma.PrismaClientValidationError) return res.status(400).json({ error: "The submitted data is invalid" });
  res.status(500).json({ error: "Internal server error" });
});

const port = Number(process.env.PORT || 4000);
const server = app.listen(port, () => console.log(`RoadRunner API listening on http://localhost:${port}`));
server.on("error", (error) => {
  if (error.code === "EADDRINUSE") console.error(`Port ${port} is already in use. Stop the other RoadRunner API process or choose another PORT.`);
  else console.error(error);
  process.exitCode = 1;
});
const shutdown = async () => { server.close(); await prisma.$disconnect(); process.exit(0); };
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
