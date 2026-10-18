# Person 1: Fleet and Driver Management

## Scope and business rules

- Vehicles have a unique registration number; VIN is an optional unique alternate identifier.
- Drivers have unique licence numbers and phone numbers; email is optional and unique when supplied.
- Fuel and maintenance events must belong to an existing vehicle. Historical events remain available if the vehicle is deactivated.
- Vehicle capacity and fuel quantity must be positive. Costs and odometer readings cannot be negative.
- Vehicle and driver deletion is deactivation, preserving trip and service history.
- Driver availability and vehicle availability are status values; Person 2's trip assignment module will later coordinate status changes.
- Fuel logs currently attach to a vehicle. Linking a fuel entry to a trip requires the shared `Trip` model, which is not yet in this Person 1 branch.

## Tables, keys, and relationships

| Relation | Primary key | Candidate/alternate keys | Foreign keys |
|---|---|---|---|
| `Vehicle` | `id` | `registrationNo`; optional `vin` when present | — |
| `Driver` | `id` | `licenceNumber`, `phone`; optional `email` when present | — |
| `FuelLog` | `id` | — | `vehicleId → Vehicle.id` |
| `Maintenance` | `id` | — | `vehicleId → Vehicle.id` |

A vehicle has zero or more fuel logs and zero or more maintenance records. Each fuel log and maintenance record belongs to exactly one vehicle. A driver is independently managed here; trip assignment will link drivers to trips in Person 2's module.

## Functional dependencies and normalization

The functional dependencies used for the current design are:

- `Vehicle.id → registrationNo, vin, make, model, manufactureYear, vehicleType, capacity, fuelType, status, odometerKm, createdAt, updatedAt`; `registrationNo` and a non-NULL `vin` also identify a vehicle.
- `Driver.id → firstName, lastName, phone, email, licenceNumber, licenceExpiry, status, hiredAt, createdAt, updatedAt`; `licenceNumber`, `phone`, and a non-NULL `email` also identify a driver.
- `FuelLog.id → vehicleId, refuelledAt, quantityLitres, cost, odometerKm, station, notes, createdAt`.
- `Maintenance.id → vehicleId, serviceDate, description, cost, odometerKm, nextServiceDate, status, provider, createdAt, updatedAt`.

The model is in 1NF: every field stores one value, with no repeating groups. It is in 2NF because every table has a single-column primary key, so each non-key attribute depends on the whole key. It is in 3NF (and BCNF under the stated dependencies) because each non-trivial determinant is a primary or candidate key; descriptive vehicle, driver, fuel-event, and service-event facts are not duplicated across unrelated rows. Optional unique columns may be NULL; MySQL allows multiple NULL values in these unique indexes.

## Constraints and indexes

Prisma migrations create the primary keys, unique registration/VIN/licence/phone/email constraints, required columns, enum statuses, and foreign keys. The follow-up migration adds MySQL `CHECK` constraints for positive capacity and fuel quantity and non-negative cost/odometer values. The `status`, `(vehicleType, status)`, licence-expiry, vehicle/date, and maintenance status/due-date indexes support the module's filters and history lookup.

MySQL must enforce CHECK constraints (MySQL 8.0.16 or later). The API validates the same rules before writes for clear user-facing errors.

## API and frontend

- Vehicles and drivers: list/search/filter, retrieve, create, update, deactivate.
- Fuel: list/filter, create, update, delete, and per-vehicle expenditure summary.
- Maintenance: list/filter, create, update, cancel, and due-date filtering.
- The React module includes status management, search/filter controls, forms, result tables, fuel totals, and due-maintenance filtering.

## SQL demonstrations

Run `prisma/demonstrations.sql` in MySQL Workbench after applying migrations and the seed. It demonstrates views, joins, aggregates, `GROUP BY`, `HAVING`, and a nested subquery for fuel and maintenance reports. The seed includes a due maintenance item so the due report has a visible result.

## Verification checklist

- `npm run db:migrate` applies the Prisma schema and database CHECK/view migration.
- `npm run db:seed` is idempotent for its demo records.
- `npm run build:frontend` compiles the React/Tailwind UI.
- `npm run test:api` runs the API integration suite against the local API/database.
- Import `postman/RoadRunner-Person1.postman_collection.json` into Postman to demonstrate the same API flows.
- Use the Postman collection or frontend to exercise create/search/update/deactivate/delete, duplicate keys, invalid amounts, bad foreign keys, and due-maintenance filters.

