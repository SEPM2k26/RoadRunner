# Person 2: Routes, Trips, Dispatching & Traffic Incidents

## Scope and business rules

- Routes define source-destination corridors with distance, expected duration, and status (`ACTIVE` / `INACTIVE` / `SUSPENDED`). Route names are not unique in the schema; a route is identified by its `id`.
- Trips link exactly one route, one vehicle, and one driver for a scheduled departure. A trip's status lifecycle is `SCHEDULED → IN_PROGRESS → COMPLETED` (with `CANCELLED` / `DELAYED` as terminal or exception states).
- Trip scheduling validates that the referenced route, vehicle, and driver exist. Vehicle/driver status is coordinated with trip status (e.g., `IN_USE` / `ON_TRIP` while active, freed on completion or cancellation).
- Deactivating a route (`status = INACTIVE`) does **not** cascade-delete historical trips or incidents. Foreign keys use `ON DELETE RESTRICT`, so a route with existing trips or incidents cannot be deleted until those records are removed or re-pointed.
- Traffic incidents are associated with exactly one route and record type, severity, location, estimated delay, and resolution timestamp.
- Trip scheduling must reject overlapping assignments for the same vehicle or driver within a conflicting time window (enforced by the API layer in Phase 2, supported by indexes in this migration).

## Tables, keys, and relationships

| Relation | Primary key | Candidate/alternate keys | Foreign keys |
|---|---|---|---|
| `routes` | `id` | — | — |
| `trips` | `id` | — | `route_id → routes.id`, `vehicle_id → vehicles.id`, `driver_id → drivers.id` |
| `traffic_incidents` | `id` | — | `route_id → routes.id` |

A route has zero or more trips and zero or more traffic incidents. Each trip belongs to exactly one route, one vehicle, and one driver. Each traffic incident belongs to exactly one route.

The `trips` table is shared with Person 1 (vehicle/driver assignment), Person 3 (delay predictions reference trips), and this module. The `traffic_incidents` table is shared with Person 3 (delay predictions reference routes and count active incidents per route).

## Functional dependencies and normalization

The functional dependencies used for the current design are:

- `routes.id → name, source, destination, distance_km, expected_duration, description, status, created_at, updated_at`
- `trips.id → route_id, vehicle_id, driver_id, scheduled_at, departed_at, arrived_at, status, actual_distance_km, delay_minutes, passenger_count, cargo_weight_kg, notes, created_at, updated_at`
- `traffic_incidents.id → route_id, incident_type, severity, location, description, reported_at, resolved_at, estimated_delay, status, reported_by, created_at, updated_at`

The model is in 1NF: every field stores one atomic value, with no repeating groups. It is in 2NF because every table has a single-column primary key, so each non-key attribute depends on the whole key. It is in 3NF (and BCNF under the stated dependencies) because each non-trivial determinant is the primary key; descriptive route, trip, and incident facts are not duplicated across unrelated rows. All foreign keys reference candidate keys (the `id` of the parent table), satisfying Boyce-Codd Normal Form.

## Constraints and indexes

This migration (`20261025120000_person2_routes_trips_incidents`) creates:

**Tables** (matching `prisma/schema.prisma` `@@map` names):
- `routes` — `id` (PK, auto-increment), `name`, `source`, `destination`, `distance_km` (DOUBLE), `expected_duration` (INT), `description` (TEXT, nullable), `status` (ENUM ACTIVE/INACTIVE/SUSPENDED, default ACTIVE), `created_at`, `updated_at` (DATETIME(3))
- `trips` — `id` (PK, auto-increment), `route_id`, `vehicle_id`, `driver_id` (all NOT NULL), `scheduled_at` (DATETIME(3), NOT NULL), `departed_at` / `arrived_at` (nullable DATETIME(3)), `status` (ENUM SCHEDULED/IN_PROGRESS/COMPLETED/CANCELLED/DELAYED, default SCHEDULED), `actual_distance_km`, `delay_minutes`, `passenger_count`, `cargo_weight_kg`, `notes` (all nullable), `created_at`, `updated_at`
- `traffic_incidents` — `id` (PK, auto-increment), `route_id` (NOT NULL), `incident_type` (ENUM), `severity` (ENUM LOW/MEDIUM/HIGH/CRITICAL), `location` (VARCHAR(255)), `description` (TEXT, nullable), `reported_at` (DATETIME(3), NOT NULL), `resolved_at` (nullable), `estimated_delay` (INT, nullable), `status` (ENUM ACTIVE/RESOLVED/MONITORING, default ACTIVE), `reported_by` (VARCHAR(100), nullable), `created_at`, `updated_at`

**Indexes** (all from `prisma/schema.prisma`):
- `routes_status_idx` — on `routes(status)` for status-based filtering and activation queries
- `trips_status_idx` — on `trips(status)` for status-based trip listings
- `trips_scheduled_at_idx` — on `trips(scheduled_at)` for time-window overlap checks
- `trips_vehicle_id_idx` — on `trips(vehicle_id)` for per-vehicle trip history and overlap validation
- `trips_driver_id_idx` — on `trips(driver_id)` for per-driver trip history and overlap validation
- `trips_route_id_idx` — on `trips(route_id)` for per-route trip listings
- `traffic_incidents_route_id_idx` — on `traffic_incidents(route_id)` for route-associated incident lookups
- `traffic_incidents_status_idx` — on `traffic_incidents(status)` for active/resolved filtering
- `traffic_incidents_severity_idx` — on `traffic_incidents(severity)` for severity-based filtering
- `traffic_incidents_reported_at_idx` — on `traffic_incidents(reported_at)` for chronological incident queries

**Foreign keys** (all `ON DELETE RESTRICT ON UPDATE CASCADE`):
- `trips_route_id_fkey` — `trips.route_id → routes.id`: prevents deleting a route that has trips
- `trips_vehicle_id_fkey` — `trips.vehicle_id → vehicles.id`: prevents deleting a vehicle that has trips
- `trips_driver_id_fkey` — `trips.driver_id → drivers.id`: prevents deleting a driver that has trips
- `traffic_incidents_route_id_fkey` — `traffic_incidents.route_id → routes.id`: prevents deleting a route that has incidents

RESTRICT on all foreign keys ensures historical trips and incidents are preserved when a route is deactivated; a route can only be removed after its dependent records are handled.

MySQL must support CHECK constraints and ENUM types (MySQL 8.0.16 or later). The API validates the same rules before writes for clear user-facing errors.

## API and frontend (Phase 3)

### API endpoints and filters (Person 2)

All endpoints are under `/api/*` on port 5000 (default, configurable via `PORT` env var).

**Routes** (`/api/routes`)
- `GET /api/routes` — list routes; optional query: `?status=ACTIVE` / `?search=<name>`
- `GET /api/routes/:id` — retrieve one route
- `POST /api/routes` — create route; required: `name`, `source`, `destination`, `distanceKm`, `expectedDuration`, `status`; optional: `description`
- `PUT /api/routes/:id` — update route; arbitrary fields
- `PATCH /api/routes/:id/toggle` — toggle status (ACTIVE ↔ INACTIVE)
- `DELETE /api/routes/:id` — soft deactivate (sets status to INACTIVE, RESTRICT blocks if trips/exist)

**Trips** (`/api/trips`)
- `GET /api/trips` — list trips; optional filters: `?status=SCHEDULED&vehicleId=1&routeId=1&driverId=1&dateFrom=2026-01-01&dateTo=2026-12-31`
- `GET /api/trips/:id` — retrieve one trip
- `POST /api/trips` — create trip; required: `routeId`, `vehicleId`, `driverId`, `status`, `scheduledAt`; optional: `departedAt`, `arrivedAt`
- `PUT /api/trips/:id` — update trip status; valid transitions: `SCHEDULED → IN_PROGRESS → COMPLETED`; `departedAt` auto-populated on `IN_PROGRESS`; `arrivedAt` auto-populated on `COMPLETED`; invalid transitions return 400
- `DELETE /api/trips/:id` — soft cancel (sets status to CANCELLED)

**Traffic Incidents** (`/api/incidents`)
- `GET /api/incidents` — list incidents; optional filters: `?routeId=1&status=ACTIVE&severity=MEDIUM& incidentType=CONGESTION`
- `GET /api/incidents/:id` — retrieve one incident
- `POST /api/incidents` — create incident; required: `routeId`, `incidentType`, `severity`, `location`, `reportedAt`; optional: `estimatedDelay`, `reportedBy`; `routeId` must reference existing route, `incidentType` enum: `CONGESTION|ACCIDENT|WEATHER|CONSTRUCTION|OTHER`, `severity` enum: `LOW|MEDIUM|HIGH|CRITICAL`
- `PUT /api/incidents/:id` — update incident (e.g., severity)
- `PATCH /api/incidents/:id/resolve` — resolve incident (sets status to RESOLVED, populates `resolvedAt`)
- `DELETE /api/incidents/:id` — soft delete (sets status to RESOLVED, preserves history)

### Frontend features (TripPages.jsx)

The React module `frontend/src/pages/trips/TripPages.jsx` includes three pages:

- **RoutesPage**: Lists routes with search and status filter (ACTIVE/INACTIVE/SUSPENDED). Creates routes via modal form. Edits route details. Deactivates routes (soft delete → sets status to INACTIVE). Shows loading, empty, success, and error states.

- **TripsPage**: Displays route, vehicle, driver, scheduled time, status. Scheduling with overlap prevention (backend-validated). Status transitions: `SCHEDULED → IN_PROGRESS → COMPLETED`. Start trip (populates `departedAt`), Complete trip (populates `arrivedAt`). Cancel trip (sets status to CANCELLED). Filters: status, route, vehicle, driver, date range. Shows validation errors for vehicle/driver conflicts.

- **IncidentsPage**: Lists incidents filtered by route, status, severity, type. Creates incident with validation (valid `routeId`, `incidentType` enum, `severity` enum). Edits incident details. Resolves incident (sets status to RESOLVED, populates `resolvedAt`). Soft delete (sets status to RESOLVED, preserves history).

SQL demonstrations for Person 2 are in `backend/prisma/demonstrations.sql` (appended in Phase 3). To run safely, do not apply against shared/production databases. The file is append-only with clear markings. Each SQL block includes comments about when it is safe to run and when rollback is needed. Use a disposable/local MySQL instance for hands-on verification. Demonstrations include: JOINs, aggregate `GROUP BY` + `HAVING`, subqueries, views, triggers, stored procedures, transaction with rollback, ACID properties, and concurrent trip-assignment conflict with row-locking limitations.

## SQL demonstrations

SQL demonstrations for Person 2 (route/trip/incident reports, views, triggers, transaction rollback, ACID, and concurrency handling) are planned for Phase 2 and will be added to `prisma/demonstrations.sql`. Phase 1 delivers only the base tables, indexes, and foreign keys.

## Verification checklist

- `npx prisma validate` — schema is valid (confirmed with Prisma 6.19.3)
- `npx prisma generate` — Prisma Client generates successfully (confirmed)
- Migration file `prisma/migrations/20261025120000_person2_routes_trips_incidents/migration.sql` matches `prisma migrate diff --from-empty --to-schema-datamodel` output for the three new tables
- `npx prisma migrate dev` (later, against a local MySQL database) applies the migration and creates `routes`, `trips`, `traffic_incidents` tables
- Route deactivation preserves trips/incidents (RESTRICT foreign keys block deletion of referenced routes)
- Trip overlap validation uses `trips_vehicle_id_idx` and `trips_driver_id_idx` indexes for efficient time-window checks
- Import `postman/RoadRunner-Person1.postman_collection.json` into Postman for Person 1 flows; Person 2 API flows to be added in Phase 2

## Command to apply the migration (do not run against shared/production databases)

```powershell
cd D:\RoadRunner
npm run db:migrate -- --name person2_routes_trips_incidents
```

Or directly in the backend directory:

```powershell
cd D:\RoadRunner\backend
npx prisma migrate dev --name person2_routes_trips_incidents
```

This command was **not** executed during Phase 1.