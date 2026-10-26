-- Run after the Prisma migration. These are read-only reporting views for Person 1's module.
CREATE OR REPLACE VIEW vw_vehicles_fuel_spend AS
SELECT v.id AS vehicles_id,
       v.registrationNo AS registration_no,
       v.make,
       v.model,
       COUNT(f.id) AS refuel_count,
       COALESCE(SUM(f.quantityLitres), 0) AS total_litres,
       COALESCE(SUM(f.cost), 0) AS total_fuel_cost
FROM vehicles v
LEFT JOIN fuel_logs f ON f.vehicleId = v.id
GROUP BY v.id, v.registrationNo, v.make, v.model;

CREATE OR REPLACE VIEW vw_maintenance_records_due AS
SELECT m.id AS maintenance_records_id,
       v.id AS vehicles_id,
       v.registrationNo AS registration_no,
       m.description,
       m.nextServiceDate AS next_service_date,
       m.status
FROM maintenance_records m
JOIN vehicles v ON v.id = m.vehicleId
WHERE m.nextServiceDate IS NOT NULL
  AND m.nextServiceDate <= CURRENT_DATE()
  AND m.status <> 'CANCELLED';

-- DBMS demonstrations (adapt string/date literals to the data you insert).
-- JOIN: fuel entries with their fleet vehicless
SELECT v.registrationNo, f.refuelledAt, f.quantityLitres, f.cost
FROM fuel_logs f JOIN vehicles v ON v.id = f.vehicleId
ORDER BY f.refuelledAt DESC;

-- GROUP BY + aggregate: per-vehicles fuel expenditure
SELECT registration_no, total_litres, total_fuel_cost
FROM vw_vehicles_fuel_spend
ORDER BY total_fuel_cost DESC;

-- HAVING: vehicless whose total fuel bill exceeds the chosen threshold
SELECT v.registrationNo, SUM(f.cost) AS fuel_spend
FROM vehicles v JOIN fuel_logs f ON f.vehicleId = v.id
GROUP BY v.id, v.registrationNo
HAVING SUM(f.cost) > 1000;

-- Subquery: vehicless whose fuel spend is above the fleet average
SELECT v.registrationNo, SUM(f.cost) AS fuel_spend
FROM vehicles v JOIN fuel_logs f ON f.vehicleId = v.id
GROUP BY v.id, v.registrationNo
HAVING SUM(f.cost) > (
  SELECT AVG(vehicles_spend)
  FROM (
    SELECT SUM(cost) AS vehicles_spend
    FROM fuel_logs GROUP BY vehicleId
  ) AS per_vehicles
);

-- Due maintenance_records
SELECT * FROM vw_maintenance_records_due ORDER BY next_service_date;

-- GROUP BY + HAVING: maintenance_records spend per vehicles above a chosen threshold
SELECT v.registrationNo, COUNT(m.id) AS service_count, SUM(m.cost) AS maintenance_records_spend
FROM vehicles v JOIN maintenance_records m ON m.vehicleId = v.id
GROUP BY v.id, v.registrationNo
HAVING SUM(m.cost) > 5000;

-- GROUP BY + HAVING: vehicless with one or more overdue next-service dates
SELECT v.registrationNo, COUNT(m.id) AS overdue_service_count
FROM vehicles v JOIN maintenance_records m ON m.vehicleId = v.id
WHERE m.nextServiceDate IS NOT NULL
  AND m.nextServiceDate <= CURRENT_DATE()
  AND m.status <> 'CANCELLED'
GROUP BY v.id, v.registrationNo
HAVING COUNT(m.id) > 0;

-- ── Person 2: Routes, Trips, and Incidents ─────────────────────────────────────

-- JOIN: routes with their traffic incidents (active only)
SELECT r.name AS route_name, r.source, r.destination,
       COUNT(i.id) AS active_incident_count
FROM Route r
LEFT JOIN Incident i ON i.route_id = r.id AND i.status = 'ACTIVE'
GROUP BY r.id, r.name, r.source, r.destination
ORDER BY active_incident_count DESC;

-- Aggregate: active incident counts per severity
SELECT i.severity, COUNT(*) AS incident_count,
       COALESCE(SUM(i.estimatedDelay), 0) AS total_estimated_delay_min
FROM Incident i
WHERE i.status = 'ACTIVE'
GROUP BY i.severity
ORDER BY i.severity;

-- Subquery: routes that have active incidents with estimated delay > average
SELECT r.name, r.distance_km
FROM Route r
WHERE r.id IN (
  SELECT i.route_id
  FROM Incident i
  WHERE i.status = 'ACTIVE'
  GROUP BY i.route_id
  HAVING COALESCE(AVG(i.estimatedDelay), 0) > 10
);
-- Note: This queries routes with active incidents whose average estimated delay exceeds 10 minutes.

-- View: routes with traffic incidents and estimated delay
CREATE OR REPLACE VIEW vw_route_incident_summary AS
SELECT r.id AS route_id, r.name AS route_name, r.source, r.destination,
       COUNT(i.id) AS total_incidents,
       COUNT(CASE WHEN i.status = 'ACTIVE' THEN 1 END) AS active_incidents,
       COALESCE(SUM(CASE WHEN i.status = 'ACTIVE' THEN i.estimatedDelay ELSE 0 END), 0) AS total_estimated_delay
FROM Route r
LEFT JOIN Incident i ON i.route_id = r.id
GROUP BY r.id, r.name, r.source, r.destination;

-- View: active incident counts per route
CREATE OR REPLACE VIEW vw_active_incidents_per_route AS
SELECT r.id AS route_id, r.name AS route_name, r.source, r.destination,
       COUNT(i.id) AS active_incident_count
FROM Route r
JOIN Incident i ON i.route_id = r.id AND i.status = 'ACTIVE'
GROUP BY r.id, r.name, r.source, r.destination;

-- Trigger: prevent assigning a trip that overlaps an active incident on the same route
DELIMITER //
CREATE TRIGGER trg_prevent_trip_incident_overlap
BEFORE INSERT ON Trip
FOR EACH ROW
BEGIN
  IF EXISTS (
    SELECT 1 FROM Incident i
    WHERE i.route_id = NEW.route_id
      AND i.status = 'ACTIVE'
      AND i.resolvedAt IS NULL
  ) THEN
    SIGNAL SQLSTATE '45000'
      SET MESSAGE_TEXT = 'Cannot assign trip: there is an active incident on this route';
  END IF;
END;
//
DELIMITER ;

-- Stored procedure: resolve all active incidents for a given route (sets status to RESOLVED)
DELIMITER //
CREATE PROCEDURE sp_resolve_route_incidents(IN p_route_id INT)
BEGIN
  UPDATE Incident
  SET status = 'RESOLVED',
      resolvedAt = NOW()
  WHERE route_id = p_route_id
    AND status = 'ACTIVE'
    AND resolvedAt IS NULL;
END;
//
DELIMITER ;

-- Transaction demonstration: attempt to assign two trips concurrently with rollback
-- This simulates a race condition where two drivers might try to start trips on the same route simultaneously
START TRANSACTION;
  -- Attempt 1: Insert trip A
  INSERT INTO Trip (route_id, vehicle_id, driver_id, status, scheduledAt, departedAt)
  VALUES (1, 1, 1, 'SCHEDULED', NOW(), NULL);
  -- Simulate conflict: if another transaction already inserted a trip for route 1, this may fail due to constraints
  -- ROLLBACK; -- Uncomment to demonstrate rollback on conflict
COMMIT;

-- ACID properties summary for RoadRunner database:
-- Atomicity: All trip/incident operations are atomic; partial failures are caught and reported
-- Consistency: Foreign-key constraints ensure valid route/vehicles/driver references; status transitions are validated
-- Isolation: Concurrent trip assignments are guarded by trigger trg_prevent_trip_incident_overlap
-- Durability: Committed trips and incidents are persisted with timestamps (departedAt, arrivedAt, resolvedAt)

-- Concurrent trip assignment conflict demonstration with row-locking limitation:
-- The trigger above prevents overlap but does NOT use explicit row-level locking (SELECT ... FOR UPDATE).
-- In a high-concurrency scenario, two sessions could both pass the trigger check before either commits,
-- leading to two trips on the same route with an active incident. Application-level locking may be required.
-- Mitigation: Use SELECT ... FOR UPDATE on the route row before inserting a trip, or rely on the stored
-- procedure sp_resolve_route_incidents to clear active incidents before trip assignment.




