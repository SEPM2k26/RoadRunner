import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const vehicles = [
    { registrationNo: "KA01AB1234", make: "Tata", model: "Ace", vehicleType: "Mini Truck", capacity: 750, fuelType: "DIESEL", odometerKm: 28420 },
    { registrationNo: "KA03CD5678", make: "Ashok Leyland", model: "Dost", vehicleType: "Light Truck", capacity: 1250, fuelType: "DIESEL", odometerKm: 61800 },
    { registrationNo: "KA05EF9012", make: "Mahindra", model: "Bolero Pik-Up", vehicleType: "Pickup", capacity: 1500, fuelType: "DIESEL", odometerKm: 47250 },
    { registrationNo: "KA51GH3456", make: "Tata", model: "Nexon EV", vehicleType: "Car", capacity: 5, fuelType: "ELECTRIC", odometerKm: 15300 },
    { registrationNo: "KA02JK7890", make: "Maruti Suzuki", model: "Eeco", vehicleType: "Van", capacity: 7, fuelType: "PETROL", odometerKm: 36100 }
  ];
  for (const vehicle of vehicles) await prisma.vehicle.upsert({ where: { registrationNo: vehicle.registrationNo }, update: {}, create: vehicle });

  const drivers = [
    { firstName: "Aarav", lastName: "Sharma", phone: "+919876540001", email: "aarav.sharma@example.com", licenceNumber: "KA-DRV-10001", licenceExpiry: new Date("2028-06-30") },
    { firstName: "Meera", lastName: "Nair", phone: "+919876540002", email: "meera.nair@example.com", licenceNumber: "KA-DRV-10002", licenceExpiry: new Date("2027-11-15") },
    { firstName: "Rohan", lastName: "Rao", phone: "+919876540003", email: "rohan.rao@example.com", licenceNumber: "KA-DRV-10003", licenceExpiry: new Date("2029-02-20") },
    { firstName: "Kavya", lastName: "Patel", phone: "+919876540004", email: "kavya.patel@example.com", licenceNumber: "KA-DRV-10004", licenceExpiry: new Date("2027-08-01") }
  ];
  for (const driver of drivers) await prisma.driver.upsert({ where: { licenceNumber: driver.licenceNumber }, update: {}, create: driver });

  const vehicle = await prisma.vehicle.findUnique({ where: { registrationNo: "KA01AB1234" } });
  const existingFuel = await prisma.fuelLog.count({ where: { vehicleId: vehicle.id } });
  if (!existingFuel) await prisma.fuelLog.createMany({ data: [
    { vehicleId: vehicle.id, refuelledAt: new Date("2026-09-05T08:30:00Z"), quantityLitres: 35, cost: 3325, odometerKm: 27600, station: "Bengaluru Fuel Point" },
    { vehicleId: vehicle.id, refuelledAt: new Date("2026-09-22T09:15:00Z"), quantityLitres: 32, cost: 3040, odometerKm: 28100, station: "North Gate Service Station" },
    { vehicleId: vehicle.id, refuelledAt: new Date("2026-10-06T07:45:00Z"), quantityLitres: 38, cost: 3610, odometerKm: 28420, station: "Bengaluru Fuel Point" }
  ] });

  const existingMaintenance = await prisma.maintenance.count({ where: { vehicleId: vehicle.id } });
  if (!existingMaintenance) await prisma.maintenance.createMany({ data: [
    { vehicleId: vehicle.id, serviceDate: new Date("2026-06-15T00:00:00Z"), description: "Routine oil and filter service", cost: 4200, odometerKm: 26000, nextServiceDate: new Date("2026-12-15T00:00:00Z"), status: "COMPLETED", provider: "RoadRunner Workshop" },
    { vehicleId: vehicle.id, serviceDate: new Date("2026-10-01T00:00:00Z"), description: "Brake inspection", cost: 1800, odometerKm: 28300, nextServiceDate: new Date("2027-04-01T00:00:00Z"), status: "COMPLETED", provider: "City Auto Care" }
  ] });
  const dueDemo = await prisma.maintenance.findFirst({ where: { vehicleId: vehicle.id, description: "Scheduled inspection due" } });
  if (!dueDemo) await prisma.maintenance.create({ data: {
    vehicleId: vehicle.id,
    serviceDate: new Date("2026-04-10T00:00:00Z"),
    description: "Scheduled inspection due",
    cost: 0,
    odometerKm: 28420,
    nextServiceDate: new Date("2026-10-10T00:00:00Z"),
    status: "SCHEDULED",
    provider: "RoadRunner Workshop"
  } });
  console.log("Sample fleet, driver, fuel, and maintenance data is ready.");
}

main().catch((error) => { console.error(error); process.exitCode = 1; }).finally(() => prisma.$disconnect());

