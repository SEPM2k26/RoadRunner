-- CreateTable
CREATE TABLE `routes` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(100) NOT NULL,
    `source` VARCHAR(100) NOT NULL,
    `destination` VARCHAR(100) NOT NULL,
    `distance_km` DOUBLE NOT NULL,
    `expected_duration` INTEGER NOT NULL,
    `description` TEXT NULL,
    `status` ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') NOT NULL DEFAULT 'ACTIVE',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `routes_status_idx`(`status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `trips` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `route_id` INTEGER NOT NULL,
    `vehicle_id` INTEGER NOT NULL,
    `driver_id` INTEGER NOT NULL,
    `scheduled_at` DATETIME(3) NOT NULL,
    `departed_at` DATETIME(3) NULL,
    `arrived_at` DATETIME(3) NULL,
    `status` ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED') NOT NULL DEFAULT 'SCHEDULED',
    `actual_distance_km` DOUBLE NULL,
    `delay_minutes` INTEGER NULL,
    `passenger_count` INTEGER NULL,
    `cargo_weight_kg` DOUBLE NULL,
    `notes` TEXT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `trips_status_idx`(`status`),
    INDEX `trips_scheduled_at_idx`(`scheduled_at`),
    INDEX `trips_vehicle_id_idx`(`vehicle_id`),
    INDEX `trips_driver_id_idx`(`driver_id`),
    INDEX `trips_route_id_idx`(`route_id`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `traffic_incidents` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `route_id` INTEGER NOT NULL,
    `incident_type` ENUM('ACCIDENT', 'CONGESTION', 'ROAD_CLOSURE', 'WEATHER', 'CONSTRUCTION', 'OTHER') NOT NULL,
    `severity` ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL') NOT NULL,
    `location` VARCHAR(255) NOT NULL,
    `description` TEXT NULL,
    `reported_at` DATETIME(3) NOT NULL,
    `resolved_at` DATETIME(3) NULL,
    `estimated_delay` INTEGER NULL,
    `status` ENUM('ACTIVE', 'RESOLVED', 'MONITORING') NOT NULL DEFAULT 'ACTIVE',
    `reported_by` VARCHAR(100) NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL,

    INDEX `traffic_incidents_route_id_idx`(`route_id`),
    INDEX `traffic_incidents_status_idx`(`status`),
    INDEX `traffic_incidents_severity_idx`(`severity`),
    INDEX `traffic_incidents_reported_at_idx`(`reported_at`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `trips` ADD CONSTRAINT `trips_route_id_fkey` FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trips` ADD CONSTRAINT `trips_vehicle_id_fkey` FOREIGN KEY (`vehicle_id`) REFERENCES `vehicles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `trips` ADD CONSTRAINT `trips_driver_id_fkey` FOREIGN KEY (`driver_id`) REFERENCES `drivers`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `traffic_incidents` ADD CONSTRAINT `traffic_incidents_route_id_fkey` FOREIGN KEY (`route_id`) REFERENCES `routes`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;