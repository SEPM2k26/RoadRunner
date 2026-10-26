-- CreateTable
CREATE TABLE `vehicles` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `registrationNo` VARCHAR(20) NOT NULL,
    `vin` VARCHAR(40) NULL,
    `make` VARCHAR(60) NOT NULL,
    `model` VARCHAR(60) NOT NULL,
    `manufactureYear` INTEGER NULL,
    `vehicleType` VARCHAR(40) NOT NULL,
    `capacity` DECIMAL(10, 2) NOT NULL,
    `fuelType` ENUM('PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'HYBRID', 'OTHER') NOT NULL,
    `status` ENUM('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'INACTIVE') NOT NULL DEFAULT 'AVAILABLE',
    `odometerKm` DECIMAL(12, 2) NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `vehicles_registrationNo_key`(`registrationNo`),
    UNIQUE INDEX `vehicles_vin_key`(`vin`),
    INDEX `vehicles_status_idx`(`status`),
    INDEX `vehicles_vehicleType_status_idx`(`vehicleType`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `drivers` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `firstName` VARCHAR(60) NOT NULL,
    `lastName` VARCHAR(60) NOT NULL,
    `phone` VARCHAR(25) NOT NULL,
    `email` VARCHAR(254) NULL,
    `licenceNumber` VARCHAR(50) NOT NULL,
    `licenceExpiry` DATE NOT NULL,
    `status` ENUM('AVAILABLE', 'ON_TRIP', 'INACTIVE') NOT NULL DEFAULT 'AVAILABLE',
    `hiredAt` DATE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `drivers_phone_key`(`phone`),
    UNIQUE INDEX `drivers_email_key`(`email`),
    UNIQUE INDEX `drivers_licenceNumber_key`(`licenceNumber`),
    INDEX `drivers_status_idx`(`status`),
    INDEX `drivers_licenceExpiry_idx`(`licenceExpiry`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `fuel_logs` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicleId` INTEGER NOT NULL,
    `refuelledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `quantityLitres` DECIMAL(10, 2) NOT NULL,
    `cost` DECIMAL(10, 2) NOT NULL,
    `odometerKm` DECIMAL(12, 2) NULL,
    `station` VARCHAR(120) NULL,
    `notes` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `fuel_logs_vehicleId_refuelledAt_idx`(`vehicleId`, `refuelledAt`),
    INDEX `fuel_logs_refuelledAt_idx`(`refuelledAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `maintenance_records` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicleId` INTEGER NOT NULL,
    `serviceDate` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `description` VARCHAR(500) NOT NULL,
    `cost` DECIMAL(10, 2) NOT NULL DEFAULT 0,
    `odometerKm` DECIMAL(12, 2) NULL,
    `nextServiceDate` DATE NULL,
    `status` ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED') NOT NULL DEFAULT 'COMPLETED',
    `provider` VARCHAR(120) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    INDEX `maintenance_records_vehicleId_serviceDate_idx`(`vehicleId`, `serviceDate`),
    INDEX `maintenance_records_status_nextServiceDate_idx`(`status`, `nextServiceDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FuelLog` ADD CONSTRAINT `fuel_logs_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `maintenance_records` ADD CONSTRAINT `maintenance_records_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `vehicles`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

