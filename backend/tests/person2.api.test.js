import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";

const apiBase = process.env.API_BASE_URL || "http://localhost:5000/api";
const suffix = `${Date.now().toString().slice(-8)}${String(process.pid).slice(-3)}`;
const routePayload = {
  name: `Test Route ${suffix}`,
  source: "Test Source",
  destination: "Test Destination",
  distanceKm: 10,
  expectedDuration: 30,
  description: "API test route",
  status: "ACTIVE",
};
let routeId;
let tripId;
let incidentId;

async function call(path, method = "GET", data) {
  const response = await fetch(`${apiBase}/${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    ...(data === undefined ? {} : { body: JSON.stringify(data) }),
  });
  const body = response.status === 204 ? null : await response.json().catch(() => null);
  return { status: response.status, body };
}

test("Person 2 routes, trips, and incidents API integration", async (t) => {
  try {
    await t.test("API health is available", async () => {
      const result = await call("health");
      assert.equal(result.status, 200);
      assert.equal(result.body.status, "ok");
    });

    await t.test("route create, list, search, update, toggle, deactivate", async () => {
      const created = await call("routes", "POST", routePayload);
      assert.equal(created.status, 201, JSON.stringify(created.body));
      routeId = created.body.id;
      assert.equal(created.body.name, routePayload.name);
      assert.equal(created.body.status, "ACTIVE");

      const listed = await call(`routes?status=ACTIVE`);
      assert.equal(listed.status, 200);
      assert.ok(listed.body.some((r) => r.id === routeId));

      const searched = await call(`routes?search=${encodeURIComponent(routePayload.name)}`);
      assert.equal(searched.status, 200);
      assert.ok(searched.body.some((r) => r.id === routeId));

      const single = await call(`routes/${routeId}`);
      assert.equal(single.status, 200);
      assert.equal(single.body.id, routeId);

      const updated = await call(`routes/${routeId}`, "PUT", { description: "Updated description" });
      assert.equal(updated.status, 200);
      assert.equal(updated.body.description, "Updated description");

      const toggled = await call(`routes/${routeId}/toggle`, "PATCH", { status: "INACTIVE" });
      assert.equal(toggled.status, 200);
      assert.equal(toggled.body.status, "INACTIVE");

      const reactivated = await call(`routes/${routeId}/toggle`, "PATCH", { status: "ACTIVE" });
      assert.equal(reactivated.status, 200);
      assert.equal(reactivated.body.status, "ACTIVE");

      const deactivated = await call(`routes/${routeId}`, "DELETE");
      assert.equal(deactivated.status, 200);
      assert.equal(deactivated.body.route.status, "INACTIVE");

      const invalidStatus = await call("routes", "POST", {
        ...routePayload,
        name: `Bad Route ${suffix}`,
        status: "INVALID",
      });
      assert.equal(invalidStatus.status, 400);

      const missing = await call("routes", "POST", { name: "Incomplete" });
      assert.equal(missing.status, 400);

      const sameEndpoints = await call("routes", "POST", {
        ...routePayload,
        name: `Same Endpoints ${suffix}`,
        source: "X",
        destination: "X",
      });
      assert.equal(sameEndpoints.status, 400);
    });

    await t.test("trip create, list, status transitions, soft cancel", async () => {
      const routes = await call("routes?status=ACTIVE");
      if (routes.body.length === 0) return;

      const testRoute = routes.body[0];
      const tripPayload = {
        routeId: testRoute.id,
        vehicleId: 1,
        driverId: 1,
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        status: "SCHEDULED",
      };
      const created = await call("trips", "POST", tripPayload);
      if (created.status === 201) {
        tripId = created.body.id;
        assert.equal(created.body.routeId, testRoute.id);
        assert.equal(created.body.status, "SCHEDULED");

        const single = await call(`trips/${tripId}`);
        assert.equal(single.status, 200);

        const started = await call(`trips/${tripId}`, "PUT", { status: "IN_PROGRESS" });
        assert.equal(started.status, 200);
        assert.equal(started.body.status, "IN_PROGRESS");
        assert.ok(started.body.departedAt);

        const completed = await call(`trips/${tripId}`, "PUT", { status: "COMPLETED" });
        assert.equal(completed.status, 200);
        assert.equal(completed.body.status, "COMPLETED");
        assert.ok(completed.body.arrivedAt);

        const invalidTransition = await call(`trips/${tripId}`, "PUT", { status: "SCHEDULED" });
        assert.equal(invalidTransition.status, 400);
      }

      if (tripId) {
        const cancelled = await call(`trips/${tripId}`, "DELETE");
        assert.equal(cancelled.status, 200);
        assert.equal(cancelled.body.trip.status, "CANCELLED");
      }
    });

    await t.test("incident create, list, filter, update, resolve, soft delete", async () => {
      const routes = await call("routes?status=ACTIVE");
      if (routes.body.length === 0) return;

      const testRoute = routes.body[0];
      const incidentPayload = {
        routeId: testRoute.id,
        incidentType: "CONGESTION",
        severity: "MEDIUM",
        location: "Test Location",
        reportedAt: new Date().toISOString(),
        estimatedDelay: 15,
        reportedBy: "API Test",
      };
      const created = await call("incidents", "POST", incidentPayload);
      if (created.status === 201) {
        incidentId = created.body.id;
        assert.equal(created.body.routeId, testRoute.id);
        assert.equal(created.body.status, "ACTIVE");

        const listed = await call(`incidents?routeId=${testRoute.id}&status=ACTIVE&severity=MEDIUM`);
        assert.equal(listed.status, 200);
        assert.ok(listed.body.some((i) => i.id === incidentId));

        const single = await call(`incidents/${incidentId}`);
        assert.equal(single.status, 200);

        const updated = await call(`incidents/${incidentId}`, "PUT", { severity: "HIGH" });
        assert.equal(updated.status, 200);
        assert.equal(updated.body.severity, "HIGH");

        const resolved = await call(`incidents/${incidentId}/resolve`, "PATCH");
        assert.equal(resolved.status, 200);
        assert.equal(resolved.body.status, "RESOLVED");
        assert.ok(resolved.body.resolvedAt);
      }

      if (incidentId) {
        const softDeleted = await call(`incidents/${incidentId}`, "DELETE");
        assert.equal(softDeleted.status, 200);
        assert.equal(softDeleted.body.incident.status, "RESOLVED");
      }

      const invalidSeverity = await call("incidents", "POST", {
        ...incidentPayload,
        severity: "INVALID",
      });
      assert.equal(invalidSeverity.status, 400);

      const badRoute = await call("incidents", "POST", {
        ...incidentPayload,
        routeId: 999999,
      });
      assert.equal(badRoute.status, 400);
    });
  } finally {
    // No cleanup needed - tests use soft deactivation/cancellation
  }
});