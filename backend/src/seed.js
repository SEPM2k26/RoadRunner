/**
 * RoadRunner - Database Seed Script (updated field names)
 * Run with: node src/seed.js  (from backend/)
 */
const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding RoadRunner database...");

  // Vehicles
  const vehicles = await Promise.all([
    prisma.vehicle.create({ data: { registrationNo: "MH01AB1234", make: "Tata",          model: "Starbus",   vehicleType: "BUS",   capacity: 45,   fuelType: "DIESEL",  status: "AVAILABLE",   odometerKm: 120000 } }),
    prisma.vehicle.create({ data: { registrationNo: "MH02CD5678", make: "Ashok Leyland", model: "Dost",      vehicleType: "TRUCK", capacity: 2000, fuelType: "DIESEL",  status: "AVAILABLE",   odometerKm: 95000  } }),
    prisma.vehicle.create({ data: { registrationNo: "MH03EF9012", make: "Mahindra",      model: "Supro",     vehicleType: "VAN",   capacity: 900,  fuelType: "CNG",     status: "AVAILABLE",   odometerKm: 45000  } }),
    prisma.vehicle.create({ data: { registrationNo: "MH04GH3456", make: "Maruti",        model: "Swift",     vehicleType: "CAR",   capacity: 5,    fuelType: "PETROL",  status: "MAINTENANCE", odometerKm: 32000  } }),
    prisma.vehicle.create({ data: { registrationNo: "MH05IJ7890", make: "Volvo",         model: "9400",      vehicleType: "BUS",   capacity: 55,   fuelType: "DIESEL",  status: "AVAILABLE",   odometerKm: 280000 } }),
  ]);
  console.log(`${vehicles.length} vehicles created`);

  // Drivers
  const drivers = await Promise.all([
    prisma.driver.create({ data: { firstName: "Rajan",  lastName: "Kumar",  email: "rajan.kumar@rr.com",   phone: "9876543210", licenceNumber: "MH2015001", licenceExpiry: new Date("2027-06-30"), status: "AVAILABLE", hiredAt: new Date("2018-03-01") } }),
    prisma.driver.create({ data: { firstName: "Suresh", lastName: "Patil",  email: "suresh.patil@rr.com",  phone: "9876543211", licenceNumber: "MH2016002", licenceExpiry: new Date("2028-09-15"), status: "AVAILABLE", hiredAt: new Date("2019-07-15") } }),
    prisma.driver.create({ data: { firstName: "Anita",  lastName: "Sharma", email: "anita.sharma@rr.com",  phone: "9876543212", licenceNumber: "MH2017003", licenceExpiry: new Date("2026-12-31"), status: "ON_LEAVE",  hiredAt: new Date("2020-01-10") } }),
    prisma.driver.create({ data: { firstName: "Mohan",  lastName: "Verma",  email: "mohan.verma@rr.com",   phone: "9876543213", licenceNumber: "MH2018004", licenceExpiry: new Date("2029-03-20"), status: "AVAILABLE", hiredAt: new Date("2021-05-20") } }),
    prisma.driver.create({ data: { firstName: "Priya",  lastName: "Nair",   email: "priya.nair@rr.com",    phone: "9876543214", licenceNumber: "MH2019005", licenceExpiry: new Date("2027-11-11"), status: "AVAILABLE", hiredAt: new Date("2022-02-28") } }),
  ]);
  console.log(`${drivers.length} drivers created`);

  // Routes
  const routes = await Promise.all([
    prisma.route.create({ data: { name: "Mumbai-Pune Express",    source: "Mumbai Central",  destination: "Pune Station",         distanceKm: 148, expectedDuration: 180, status: "ACTIVE" } }),
    prisma.route.create({ data: { name: "Mumbai-Nashik Highway",  source: "Dadar Bus Depot", destination: "Nashik CBS",           distanceKm: 167, expectedDuration: 210, status: "ACTIVE" } }),
    prisma.route.create({ data: { name: "Pune-Satara Link",       source: "Pune Station",    destination: "Satara Bus Stand",     distanceKm: 110, expectedDuration: 150, status: "ACTIVE" } }),
    prisma.route.create({ data: { name: "Mumbai City Loop",       source: "Andheri",         destination: "Churchgate",           distanceKm: 35,  expectedDuration: 90,  status: "ACTIVE" } }),
    prisma.route.create({ data: { name: "Nashik-Aurangabad",      source: "Nashik CBS",      destination: "Aurangabad Bus Stand", distanceKm: 190, expectedDuration: 240, status: "ACTIVE" } }),
  ]);
  console.log(`${routes.length} routes created`);

  // Trips
  const now = new Date();
  const d = (days, ms = 0) => new Date(now.getTime() - 86400000 * days + ms);
  const trips = await Promise.all([
    prisma.trip.create({ data: { routeId: routes[0].id, vehicleId: vehicles[0].id, driverId: drivers[0].id, scheduledAt: d(5), departedAt: d(5, 600000),  arrivedAt: d(5, 11400000), status: "COMPLETED", actualDistanceKm: 151, delayMinutes: 15, passengerCount: 38 } }),
    prisma.trip.create({ data: { routeId: routes[1].id, vehicleId: vehicles[1].id, driverId: drivers[1].id, scheduledAt: d(4), departedAt: d(4, 300000),  arrivedAt: d(4, 13500000), status: "COMPLETED", actualDistanceKm: 170, delayMinutes: 25, passengerCount: 22 } }),
    prisma.trip.create({ data: { routeId: routes[2].id, vehicleId: vehicles[2].id, driverId: drivers[2].id, scheduledAt: d(3), departedAt: d(3),           arrivedAt: d(3, 9000000),  status: "COMPLETED", actualDistanceKm: 112, delayMinutes: 0,  passengerCount: 15 } }),
    prisma.trip.create({ data: { routeId: routes[3].id, vehicleId: vehicles[4].id, driverId: drivers[3].id, scheduledAt: d(2), departedAt: d(2, 1800000), arrivedAt: d(2, 8400000),  status: "COMPLETED", actualDistanceKm: 37,  delayMinutes: 30, passengerCount: 50 } }),
    prisma.trip.create({ data: { routeId: routes[0].id, vehicleId: vehicles[0].id, driverId: drivers[0].id, scheduledAt: new Date(now.getTime() + 3600000),  status: "SCHEDULED" } }),
    prisma.trip.create({ data: { routeId: routes[4].id, vehicleId: vehicles[1].id, driverId: drivers[4].id, scheduledAt: new Date(now.getTime() + 7200000),  status: "SCHEDULED" } }),
  ]);
  console.log(`${trips.length} trips created`);

  // Fuel Logs
  await Promise.all([
    prisma.fuelLog.create({ data: { vehicleId: vehicles[0].id, tripId: trips[0].id, quantityLitres: 45.5, cost: 3822,   station: "Hindustan Petroleum, Khopoli", refuelledAt: d(5) } }),
    prisma.fuelLog.create({ data: { vehicleId: vehicles[1].id, tripId: trips[1].id, quantityLitres: 60.2, cost: 5056.8, station: "Indian Oil, Igatpuri",          refuelledAt: d(4) } }),
    prisma.fuelLog.create({ data: { vehicleId: vehicles[2].id,                      quantityLitres: 30,   cost: 1890,   station: "BPCL, Pune",                    refuelledAt: d(3) } }),
    prisma.fuelLog.create({ data: { vehicleId: vehicles[0].id,                      quantityLitres: 50,   cost: 4200,   station: "Hindustan Petroleum, Dadar",    refuelledAt: d(1) } }),
    prisma.fuelLog.create({ data: { vehicleId: vehicles[4].id, tripId: trips[3].id, quantityLitres: 80,   cost: 6720,   station: "Indian Oil, Andheri",           refuelledAt: d(2) } }),
  ]);
  console.log("Fuel logs created");

  // Maintenance Records
  await Promise.all([
    prisma.maintenance.create({ data: { vehicleId: vehicles[3].id, maintenanceType: "REPAIR",     description: "Engine overhaul and brake replacement",               cost: 45000, nextServiceDate: new Date(now.getTime() + 86400000 * 180), odometerKm: 32000,  status: "IN_PROGRESS", technician: "Ramesh Auto Works"       } }),
    prisma.maintenance.create({ data: { vehicleId: vehicles[0].id, maintenanceType: "ROUTINE",    description: "Oil change, filter replacement, tyre rotation",       cost: 5500,  nextServiceDate: new Date(now.getTime() + 86400000 * 80),  odometerKm: 119800, status: "COMPLETED",   technician: "Fleet Garage Mumbai"     } }),
    prisma.maintenance.create({ data: { vehicleId: vehicles[1].id, maintenanceType: "INSPECTION", description: "Annual roadworthiness inspection",                    cost: 2000,  nextServiceDate: new Date(now.getTime() + 86400000 * 370), odometerKm: 95000,  status: "SCHEDULED",   technician: "RTO Approved Garage"     } }),
    prisma.maintenance.create({ data: { vehicleId: vehicles[4].id, maintenanceType: "ROUTINE",    description: "Transmission fluid and air filter change",            cost: 8000,  nextServiceDate: new Date(now.getTime() + 86400000 * 3),   odometerKm: 279500, status: "COMPLETED",   technician: "Volvo Service Centre"    } }),
  ]);
  console.log("Maintenance records created");

  // Traffic Incidents
  await Promise.all([
    prisma.trafficIncident.create({ data: { routeId: routes[0].id, incidentType: "ACCIDENT",     severity: "HIGH",     location: "Khopoli Toll Plaza, NH-48",           description: "Two-vehicle collision blocking one lane",        reportedAt: d(5, 3600000),  resolvedAt: d(5, 7200000),  estimatedDelay: 20, status: "RESOLVED", reportedBy: "Rajan Kumar"    } }),
    prisma.trafficIncident.create({ data: { routeId: routes[3].id, incidentType: "CONGESTION",   severity: "HIGH",     location: "Andheri Link Road",                   description: "Heavy traffic jam during peak hours",           reportedAt: d(2, 7200000),  resolvedAt: d(2, 14400000), estimatedDelay: 35, status: "RESOLVED", reportedBy: "Mohan Verma"    } }),
    prisma.trafficIncident.create({ data: { routeId: routes[1].id, incidentType: "CONSTRUCTION", severity: "MEDIUM",   location: "Igatpuri Bypass",                     description: "Road widening causing single-lane movement",    reportedAt: d(7),           estimatedDelay: 15, status: "ACTIVE",    reportedBy: "Traffic Control" } }),
    prisma.trafficIncident.create({ data: { routeId: routes[0].id, incidentType: "CONGESTION",   severity: "MEDIUM",   location: "Expressway Khed-Shivapur Exit",       description: "Weekend traffic congestion",                    reportedAt: d(1),           estimatedDelay: 10, status: "ACTIVE",    reportedBy: "Fleet Dispatch"  } }),
    prisma.trafficIncident.create({ data: { routeId: routes[3].id, incidentType: "ROAD_CLOSURE", severity: "CRITICAL", location: "Western Express Highway, Goregaon",   description: "Flyover maintenance - complete closure",        reportedAt: new Date(now.getTime() - 3600000), estimatedDelay: 60, status: "ACTIVE", reportedBy: "MMRDA" } }),
  ]);
  console.log("Traffic incidents created");

  console.log("\nSeed complete! Database is ready.");
}

main()
  .catch(e => { console.error("Seed failed:", e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });