-- Run after the Prisma migration. These are read-only reporting views for Person 1's module.
CREATE OR REPLACE VIEW vw_vehicle_fuel_spend AS
SELECT v.id AS vehicle_id,
       v.registrationNo AS registration_no,
       v.make,
       v.model,
       COUNT(f.id) AS refuel_count,
       COALESCE(SUM(f.quantityLitres), 0) AS total_litres,
       COALESCE(SUM(f.cost), 0) AS total_fuel_cost
FROM Vehicle v
LEFT JOIN FuelLog f ON f.vehicleId = v.id
GROUP BY v.id, v.registrationNo, v.make, v.model;

CREATE OR REPLACE VIEW vw_maintenance_due AS
SELECT m.id AS maintenance_id,
       v.id AS vehicle_id,
       v.registrationNo AS registration_no,
       m.description,
       m.nextServiceDate AS next_service_date,
       m.status
FROM Maintenance m
JOIN Vehicle v ON v.id = m.vehicleId
WHERE m.nextServiceDate IS NOT NULL
  AND m.nextServiceDate <= CURRENT_DATE()
  AND m.status <> 'CANCELLED';

-- DBMS demonstrations (adapt string/date literals to the data you insert).
-- JOIN: fuel entries with their fleet vehicles
SELECT v.registrationNo, f.refuelledAt, f.quantityLitres, f.cost
FROM FuelLog f JOIN Vehicle v ON v.id = f.vehicleId
ORDER BY f.refuelledAt DESC;

-- GROUP BY + aggregate: per-vehicle fuel expenditure
SELECT registration_no, total_litres, total_fuel_cost
FROM vw_vehicle_fuel_spend
ORDER BY total_fuel_cost DESC;

-- HAVING: vehicles whose total fuel bill exceeds the chosen threshold
SELECT v.registrationNo, SUM(f.cost) AS fuel_spend
FROM Vehicle v JOIN FuelLog f ON f.vehicleId = v.id
GROUP BY v.id, v.registrationNo
HAVING SUM(f.cost) > 1000;

-- Subquery: vehicles whose fuel spend is above the fleet average
SELECT v.registrationNo, SUM(f.cost) AS fuel_spend
FROM Vehicle v JOIN FuelLog f ON f.vehicleId = v.id
GROUP BY v.id, v.registrationNo
HAVING SUM(f.cost) > (
  SELECT AVG(vehicle_spend)
  FROM (
    SELECT SUM(cost) AS vehicle_spend
    FROM FuelLog GROUP BY vehicleId
  ) AS per_vehicle
);

-- Due maintenance
SELECT * FROM vw_maintenance_due ORDER BY next_service_date;

-- GROUP BY + HAVING: maintenance spend per vehicle above a chosen threshold
SELECT v.registrationNo, COUNT(m.id) AS service_count, SUM(m.cost) AS maintenance_spend
FROM Vehicle v JOIN Maintenance m ON m.vehicleId = v.id
GROUP BY v.id, v.registrationNo
HAVING SUM(m.cost) > 5000;

-- GROUP BY + HAVING: vehicles with one or more overdue next-service dates
SELECT v.registrationNo, COUNT(m.id) AS overdue_service_count
FROM Vehicle v JOIN Maintenance m ON m.vehicleId = v.id
WHERE m.nextServiceDate IS NOT NULL
  AND m.nextServiceDate <= CURRENT_DATE()
  AND m.status <> 'CANCELLED'
GROUP BY v.id, v.registrationNo
HAVING COUNT(m.id) > 0;
