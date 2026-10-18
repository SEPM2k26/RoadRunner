-- Enforce non-negative/positive fleet measurements in MySQL as well as the API.
ALTER TABLE `Vehicle`
  ADD CONSTRAINT `ck_vehicle_capacity_positive` CHECK (`capacity` > 0),
  ADD CONSTRAINT `ck_vehicle_odometer_nonnegative` CHECK (`odometerKm` >= 0),
  ADD CONSTRAINT `ck_vehicle_year_range` CHECK (`manufactureYear` IS NULL OR (`manufactureYear` >= 1900 AND `manufactureYear` <= 2100));

ALTER TABLE `FuelLog`
  ADD CONSTRAINT `ck_fuellog_quantity_positive` CHECK (`quantityLitres` > 0),
  ADD CONSTRAINT `ck_fuellog_cost_nonnegative` CHECK (`cost` >= 0),
  ADD CONSTRAINT `ck_fuellog_odometer_nonnegative` CHECK (`odometerKm` IS NULL OR `odometerKm` >= 0);

ALTER TABLE `Maintenance`
  ADD CONSTRAINT `ck_maintenance_cost_nonnegative` CHECK (`cost` >= 0),
  ADD CONSTRAINT `ck_maintenance_odometer_nonnegative` CHECK (`odometerKm` IS NULL OR `odometerKm` >= 0);

CREATE OR REPLACE VIEW `vw_vehicle_fuel_spend` AS
SELECT v.`id` AS `vehicle_id`,
       v.`registrationNo` AS `registration_no`,
       v.`make`,
       v.`model`,
       COUNT(f.`id`) AS `refuel_count`,
       COALESCE(SUM(f.`quantityLitres`), 0) AS `total_litres`,
       COALESCE(SUM(f.`cost`), 0) AS `total_fuel_cost`
FROM `Vehicle` v
LEFT JOIN `FuelLog` f ON f.`vehicleId` = v.`id`
GROUP BY v.`id`, v.`registrationNo`, v.`make`, v.`model`;

CREATE OR REPLACE VIEW `vw_maintenance_due` AS
SELECT m.`id` AS `maintenance_id`,
       v.`id` AS `vehicle_id`,
       v.`registrationNo` AS `registration_no`,
       m.`description`,
       m.`nextServiceDate` AS `next_service_date`,
       m.`status`
FROM `Maintenance` m
JOIN `Vehicle` v ON v.`id` = m.`vehicleId`
WHERE m.`nextServiceDate` IS NOT NULL
  AND m.`nextServiceDate` <= CURRENT_DATE()
  AND m.`status` <> 'CANCELLED';
