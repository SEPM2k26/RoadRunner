-- CreateTable
CREATE TABLE `Vehicle` (
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

    UNIQUE INDEX `Vehicle_registrationNo_key`(`registrationNo`),
    UNIQUE INDEX `Vehicle_vin_key`(`vin`),
    INDEX `Vehicle_status_idx`(`status`),
    INDEX `Vehicle_vehicleType_status_idx`(`vehicleType`, `status`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Driver` (
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

    UNIQUE INDEX `Driver_phone_key`(`phone`),
    UNIQUE INDEX `Driver_email_key`(`email`),
    UNIQUE INDEX `Driver_licenceNumber_key`(`licenceNumber`),
    INDEX `Driver_status_idx`(`status`),
    INDEX `Driver_licenceExpiry_idx`(`licenceExpiry`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FuelLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicleId` INTEGER NOT NULL,
    `refuelledAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `quantityLitres` DECIMAL(10, 2) NOT NULL,
    `cost` DECIMAL(10, 2) NOT NULL,
    `odometerKm` DECIMAL(12, 2) NULL,
    `station` VARCHAR(120) NULL,
    `notes` VARCHAR(500) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `FuelLog_vehicleId_refuelledAt_idx`(`vehicleId`, `refuelledAt`),
    INDEX `FuelLog_refuelledAt_idx`(`refuelledAt`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Maintenance` (
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

    INDEX `Maintenance_vehicleId_serviceDate_idx`(`vehicleId`, `serviceDate`),
    INDEX `Maintenance_status_nextServiceDate_idx`(`status`, `nextServiceDate`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `FuelLog` ADD CONSTRAINT `FuelLog_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Maintenance` ADD CONSTRAINT `Maintenance_vehicleId_fkey` FOREIGN KEY (`vehicleId`) REFERENCES `Vehicle`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

