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

  // ── Person 2: Routes, Trips, and Incidents ──────────────────────────────────
  // Add routes (reference existing vehicles for driver assignment later)
  const existingRoutes = await prisma.route.count();
  if (existingRoutes === 0) {
    const routeCreatePromises = [
      { name: "Airport Express", source: "Airport", destination: "City Center", distanceKm: 25, expectedDuration: 45, status: "ACTIVE" },
      { name: "Highway Route 6", source: "North Terminal", destination: "South Station", distanceKm: 60, expectedDuration: 90, status: "ACTIVE" },
      { name: "Coastal Highway", source: "Seaport", destination: "Beach Resort", distanceKm: 45, expectedDuration: 70, status: "ACTIVE" },
      { name: "Downtown Loop", source: "Downtown", destination: "University", distanceKm: 12, expectedDuration: 20, status: "ACTIVE" },
    ];
    for (const r of routeCreatePromises) await prisma.route.create({ data: r });
    console.log("Person 2 routes seeded.");
  } else {
    console.log("Routes already seeded, skipping.");
  }

  // Add trips (reference seeded vehicles/drivers from Person 1 + routes above)
  const existingTrips = await prisma.trip.count();
  if (existingTrips === 0) {
    const vehicle = await prisma.vehicle.findFirst({ orderBy: { id: "asc" } });
    const driver = await prisma.driver.findFirst({ orderBy: { id: "asc" } });
    const routes = await prisma.route.findMany({ take: 4 });

    const tripCreatePromises = [
      {
        routeId: routes[0]?.id,
        vehicleId: vehicle?.id,
        driverId: driver?.id,
        status: "SCHEDULED",
        scheduledAt: new Date(Date.now() + 86400000), // tomorrow
      },
      {
        routeId: routes[1]?.id,
        vehicleId: vehicle?.id,
        driverId: driver?.id,
        status: "SCHEDULED",
        scheduledAt: new Date(Date.now() + 172800000), // day after tomorrow
      },
      {
        routeId: routes[2]?.id,
        vehicleId: vehicle?.id,
        driverId: driver?.id,
        status: "IN_PROGRESS",
        scheduledAt: new Date(Date.now() - 3600000), // 1 hour ago
        departedAt: new Date(Date.now() - 3600000),
      },
    ];
    for (const t of tripCreatePromises) {
      if (vehicle && driver && routes.some(r => r.id === t.routeId)) {
        await prisma.trip.create({ data: t });
      }
    }
    console.log("Person 2 trips seeded.");
  } else {
    console.log("Trips already seeded, skipping.");
  }

  // Add incidents (reference seeded routes)
  const existingIncidents = await prisma.incident.count();
  if (existingIncidents === 0) {
    const routes = await prisma.route.findMany({ take: 3 });

    const incidentCreatePromises = [
      {
        routeId: routes[0]?.id,
        incidentType: "CONGESTION",
        severity: "MEDIUM",
        location: "Km 15 - Main junction",
        reportedAt: new Date(Date.now() - 86400000), // 1 day ago
        estimatedDelay: 20,
        reportedBy: "Traffic Officer J. Smith",
      },
      {
        routeId: routes[1]?.id,
        incidentType: "ACCIDENT",
        severity: "HIGH",
        location: "Km 32 - Near overpass",
        reportedAt: new Date(Date.now() - 259200000), // 3 days ago
        estimatedDelay: 45,
        reportedBy: "Highway Patrol",
      },
    ];
    for (const i of incidentCreatePromises) {
      if (routes.some(r => r.id === i.routeId)) {
        await prisma.incident.create({ data: i });
      }
    }
    console.log("Person 2 incidents seeded.");
  } else {
    console.log("Incidents already seeded, skipping.");
  }

