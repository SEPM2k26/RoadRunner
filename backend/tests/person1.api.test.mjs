import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const apiBase = process.env.API_BASE_URL || "http://localhost:4000/api";
const suffix = `${Date.now().toString().slice(-8)}${String(process.pid).slice(-3)}`;
const vehiclePayload = { registrationNo: `AT${suffix}`, make: "Test", model: "Fleet", vehicleType: "Test van", capacity: 5, fuelType: "DIESEL", status: "AVAILABLE", odometerKm: 100 };
const driverPayload = { firstName: "Test", lastName: "Driver", phone: `+91${suffix}`, email: `test.${suffix}@example.test`, licenceNumber: `QA-${suffix}`, licenceExpiry: "2030-12-31", status: "AVAILABLE" };
let vehicleId;
let driverId;
let fuelId;
let maintenanceId;

async function call(path, method = "GET", data) {
  const response = await fetch(`${apiBase}/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(data === undefined ? {} : { body: JSON.stringify(data) })
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  return { status: response.status, body };
}

test("Person 1 fleet and driver API integration", async (t) => {
  try {
    await t.test("API health is available", async () => {
      const result = await call("health");
      assert.equal(result.status, 200);
      assert.equal(result.body.status, "ok");
    });

    await t.test("vehicle create, search, update, deactivate, duplicate, and validation", async () => {
      const created = await call("vehicles", "POST", vehiclePayload);
      assert.equal(created.status, 201, JSON.stringify(created.body));
      vehicleId = created.body.id;
      assert.equal(created.body.registrationNo, vehiclePayload.registrationNo);
      assert.equal((await call(`vehicles?search=${vehiclePayload.registrationNo}`)).body.some((row) => row.id === vehicleId), true);
      assert.equal((await call("vehicles", "POST", vehiclePayload)).status, 409);
      assert.equal((await call("vehicles", "POST", { ...vehiclePayload, registrationNo: `NEG${suffix}`, capacity: -1 })).status, 400);
      const updated = await call(`vehicles/${vehicleId}`, "PUT", { status: "MAINTENANCE", odometerKm: 150 });
      assert.equal(updated.status, 200);
      assert.equal(updated.body.status, "MAINTENANCE");
      assert.equal((await call("vehicles?status=MAINTENANCE")).body.some((row) => row.id === vehicleId), true);
      const deactivated = await call(`vehicles/${vehicleId}`, "DELETE");
      assert.equal(deactivated.status, 200);
      assert.equal(deactivated.body.vehicle.status, "INACTIVE");
      const reactivated = await call(`vehicles/${vehicleId}`, "PUT", { status: "AVAILABLE" });
      assert.equal(reactivated.status, 200);
    });

    await t.test("driver create, search, update, deactivate, duplicate, and validation", async () => {
      const created = await call("drivers", "POST", driverPayload);
      assert.equal(created.status, 201, JSON.stringify(created.body));
      driverId = created.body.id;
      assert.equal((await call(`drivers?search=${driverPayload.licenceNumber}`)).body.some((row) => row.id === driverId), true);
      assert.equal((await call("drivers", "POST", driverPayload)).status, 409);
      assert.equal((await call("drivers", "POST", { ...driverPayload, phone: `+91${Number(suffix) + 1}`, licenceNumber: `QA-BAD-${suffix}`, email: "bad-email" })).status, 400);
      const updated = await call(`drivers/${driverId}`, "PUT", { status: "ON_TRIP" });
      assert.equal(updated.status, 200);
      assert.equal(updated.body.status, "ON_TRIP");
      const deactivated = await call(`drivers/${driverId}`, "DELETE");
      assert.equal(deactivated.status, 200);
      assert.equal(deactivated.body.driver.status, "INACTIVE");
    });

    await t.test("fuel entry create, filter, update, summary, validation, and delete", async () => {
      assert.equal((await call("fuel", "POST", { vehicleId, quantityLitres: -1, cost: 12 })).status, 400);
      const created = await call("fuel", "POST", { vehicleId, quantityLitres: 12.5, cost: 1250, refuelledAt: "2026-10-01", odometerKm: 120, station: "API test" });
      assert.equal(created.status, 201, JSON.stringify(created.body));
      fuelId = created.body.id;
      assert.equal((await call(`fuel?vehicleId=${vehicleId}`)).body.some((row) => row.id === fuelId), true);
      const updated = await call(`fuel/${fuelId}`, "PUT", { cost: 1300, quantityLitres: 13 });
      assert.equal(updated.status, 200);
      assert.equal(Number(updated.body.cost), 1300);
      const summary = await call("fuel/summary");
      assert.equal(summary.status, 200);
      assert.equal(summary.body.some((row) => row.vehicle.id === vehicleId && Number(row.totalCost) >= 1300), true);
      assert.equal((await call(`fuel/${fuelId}`, "DELETE")).status, 204);
      fuelId = undefined;
    });

    await t.test("maintenance create, due filter, update, and cancel", async () => {
      const created = await call("maintenance", "POST", { vehicleId, serviceDate: "2026-01-01", description: "API test due item", cost: 25, nextServiceDate: "2020-01-01", status: "SCHEDULED" });
      assert.equal(created.status, 201, JSON.stringify(created.body));
      maintenanceId = created.body.id;
      assert.equal((await call(`maintenance?due=true&vehicleId=${vehicleId}`)).body.some((row) => row.id === maintenanceId), true);
      const updated = await call(`maintenance/${maintenanceId}`, "PUT", { cost: 50, description: "API test updated item" });
      assert.equal(updated.status, 200);
      assert.equal(Number(updated.body.cost), 50);
      const cancelled = await call(`maintenance/${maintenanceId}`, "DELETE");
      assert.equal(cancelled.status, 200);
      assert.equal(cancelled.body.maintenance.status, "CANCELLED");
    });

    await t.test("fuel and due-maintenance SQL views exist and return data", async () => {
      const fuelView = await prisma.$queryRaw`SELECT COUNT(*) AS total FROM vw_vehicle_fuel_spend`;
      const dueView = await prisma.$queryRaw`SELECT COUNT(*) AS total FROM vw_maintenance_due`;
      assert.ok(Number(fuelView[0].total) > 0);
      assert.ok(Number(dueView[0].total) > 0);
    });

    await t.test("database CHECK constraints reject invalid direct writes", async () => {
      await assert.rejects(prisma.vehicle.create({ data: { ...vehiclePayload, registrationNo: `CK${suffix}`, capacity: -10 } }));
    });
  } finally {
    if (vehicleId || driverId) {
      await prisma.$transaction([
        prisma.fuelLog.deleteMany({ where: vehicleId ? { vehicleId } : { id: -1 } }),
        prisma.maintenance.deleteMany({ where: vehicleId ? { vehicleId } : { id: -1 } })
      ]);
    }
    if (fuelId) await prisma.fuelLog.deleteMany({ where: { id: fuelId } });
    if (maintenanceId) await prisma.maintenance.deleteMany({ where: { id: maintenanceId } });
    if (vehicleId) await prisma.vehicle.deleteMany({ where: { id: vehicleId } });
    if (driverId) await prisma.driver.deleteMany({ where: { id: driverId } });
    await prisma.$disconnect();
  }
});
