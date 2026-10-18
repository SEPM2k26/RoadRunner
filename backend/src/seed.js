/**
 * RoadRunner — Database Seed Script
 * Inserts realistic sample data for all 8 tables
 * Run with: node src/seed.js  (from backend/)
 */
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding RoadRunner database...');

  // ── Vehicles ────────────────────────────────────────────────
  const vehicles = await Promise.all([
    prisma.vehicle.upsert({ where: { registrationNumber: 'MH01AB1234' }, update: {}, create: { registrationNumber: 'MH01AB1234', vehicleType: 'BUS', make: 'Tata', model: 'Starbus', year: 2020, capacity: 45, fuelType: 'DIESEL', status: 'AVAILABLE', odometer: 120000 } }),
    prisma.vehicle.upsert({ where: { registrationNumber: 'MH02CD5678' }, update: {}, create: { registrationNumber: 'MH02CD5678', vehicleType: 'TRUCK', make: 'Ashok Leyland', model: 'Dost', year: 2019, capacity: 2000, fuelType: 'DIESEL', status: 'AVAILABLE', odometer: 95000 } }),
    prisma.vehicle.upsert({ where: { registrationNumber: 'MH03EF9012' }, update: {}, create: { registrationNumber: 'MH03EF9012', vehicleType: 'VAN', make: 'Mahindra', model: 'Supro', year: 2021, capacity: 900, fuelType: 'CNG', status: 'AVAILABLE', odometer: 45000 } }),
    prisma.vehicle.upsert({ where: { registrationNumber: 'MH04GH3456' }, update: {}, create: { registrationNumber: 'MH04GH3456', vehicleType: 'CAR', make: 'Maruti', model: 'Swift', year: 2022, capacity: 5, fuelType: 'PETROL', status: 'MAINTENANCE', odometer: 32000 } }),
    prisma.vehicle.upsert({ where: { registrationNumber: 'MH05IJ7890' }, update: {}, create: { registrationNumber: 'MH05IJ7890', vehicleType: 'BUS', make: 'Volvo', model: '9400', year: 2018, capacity: 55, fuelType: 'DIESEL', status: 'AVAILABLE', odometer: 280000 } }),
  ]);
  console.log(`✅ ${vehicles.length} vehicles created`);

  // ── Drivers ─────────────────────────────────────────────────
  const drivers = await Promise.all([
    prisma.driver.upsert({ where: { email: 'rajan.kumar@rr.com' }, update: {}, create: { name: 'Rajan Kumar', email: 'rajan.kumar@rr.com', phone: '9876543210', licenceNumber: 'MH2015001', licenceExpiry: new Date('2027-06-30'), status: 'AVAILABLE', hiredAt: new Date('2018-03-01') } }),
    prisma.driver.upsert({ where: { email: 'suresh.patil@rr.com' }, update: {}, create: { name: 'Suresh Patil', email: 'suresh.patil@rr.com', phone: '9876543211', licenceNumber: 'MH2016002', licenceExpiry: new Date('2028-09-15'), status: 'AVAILABLE', hiredAt: new Date('2019-07-15') } }),
    prisma.driver.upsert({ where: { email: 'anita.sharma@rr.com' }, update: {}, create: { name: 'Anita Sharma', email: 'anita.sharma@rr.com', phone: '9876543212', licenceNumber: 'MH2017003', licenceExpiry: new Date('2026-12-31'), status: 'ON_LEAVE', hiredAt: new Date('2020-01-10') } }),
    prisma.driver.upsert({ where: { email: 'mohan.verma@rr.com' }, update: {}, create: { name: 'Mohan Verma', email: 'mohan.verma@rr.com', phone: '9876543213', licenceNumber: 'MH2018004', licenceExpiry: new Date('2029-03-20'), status: 'AVAILABLE', hiredAt: new Date('2021-05-20') } }),
    prisma.driver.upsert({ where: { email: 'priya.nair@rr.com' }, update: {}, create: { name: 'Priya Nair', email: 'priya.nair@rr.com', phone: '9876543214', licenceNumber: 'MH2019005', licenceExpiry: new Date('2027-11-11'), status: 'AVAILABLE', hiredAt: new Date('2022-02-28') } }),
  ]);
  console.log(`✅ ${drivers.length} drivers created`);

  // ── Routes ──────────────────────────────────────────────────
  const routes = await Promise.all([
    prisma.route.create({ data: { name: 'Mumbai–Pune Express', source: 'Mumbai Central', destination: 'Pune Station', distanceKm: 148, expectedDuration: 180, status: 'ACTIVE' } }),
    prisma.route.create({ data: { name: 'Mumbai–Nashik Highway', source: 'Dadar Bus Depot', destination: 'Nashik CBS', distanceKm: 167, expectedDuration: 210, status: 'ACTIVE' } }),
    prisma.route.create({ data: { name: 'Pune–Satara Link', source: 'Pune Station', destination: 'Satara Bus Stand', distanceKm: 110, expectedDuration: 150, status: 'ACTIVE' } }),
    prisma.route.create({ data: { name: 'Mumbai City Loop', source: 'Andheri', destination: 'Churchgate', distanceKm: 35, expectedDuration: 90, status: 'ACTIVE' } }),
    prisma.route.create({ data: { name: 'Nashik–Aurangabad', source: 'Nashik CBS', destination: 'Aurangabad Bus Stand', distanceKm: 190, expectedDuration: 240, status: 'ACTIVE' } }),
  ]);
  console.log(`✅ ${routes.length} routes created`);

  // ── Trips ───────────────────────────────────────────────────
  const now = new Date();
  const trips = await Promise.all([
    prisma.trip.create({ data: { routeId: routes[0].id, vehicleId: vehicles[0].id, driverId: drivers[0].id, scheduledAt: new Date(now.getTime() - 86400000 * 5), departedAt: new Date(now.getTime() - 86400000 * 5 + 600000), arrivedAt: new Date(now.getTime() - 86400000 * 5 + 11400000), status: 'COMPLETED', actualDistanceKm: 151, delayMinutes: 15, passengerCount: 38 } }),
    prisma.trip.create({ data: { routeId: routes[1].id, vehicleId: vehicles[1].id, driverId: drivers[1].id, scheduledAt: new Date(now.getTime() - 86400000 * 4), departedAt: new Date(now.getTime() - 86400000 * 4 + 300000), arrivedAt: new Date(now.getTime() - 86400000 * 4 + 13500000), status: 'COMPLETED', actualDistanceKm: 170, delayMinutes: 25, passengerCount: 22 } }),
    prisma.trip.create({ data: { routeId: routes[2].id, vehicleId: vehicles[2].id, driverId: drivers[2].id, scheduledAt: new Date(now.getTime() - 86400000 * 3), departedAt: new Date(now.getTime() - 86400000 * 3), arrivedAt: new Date(now.getTime() - 86400000 * 3 + 9000000), status: 'COMPLETED', actualDistanceKm: 112, delayMinutes: 0, passengerCount: 15 } }),
    prisma.trip.create({ data: { routeId: routes[3].id, vehicleId: vehicles[4].id, driverId: drivers[3].id, scheduledAt: new Date(now.getTime() - 86400000 * 2), departedAt: new Date(now.getTime() - 86400000 * 2 + 1800000), arrivedAt: new Date(now.getTime() - 86400000 * 2 + 8400000), status: 'COMPLETED', actualDistanceKm: 37, delayMinutes: 30, passengerCount: 50 } }),
    prisma.trip.create({ data: { routeId: routes[0].id, vehicleId: vehicles[0].id, driverId: drivers[0].id, scheduledAt: new Date(now.getTime() + 3600000), status: 'SCHEDULED' } }),
    prisma.trip.create({ data: { routeId: routes[4].id, vehicleId: vehicles[1].id, driverId: drivers[4].id, scheduledAt: new Date(now.getTime() + 7200000), status: 'SCHEDULED' } }),
  ]);
  console.log(`✅ ${trips.length} trips created`);

  // ── Fuel Logs ───────────────────────────────────────────────
  await Promise.all([
    prisma.fuelLog.create({ data: { vehicleId: vehicles[0].id, tripId: trips[0].id, fuelQuantity: 45.5, fuelCost: 3822, odometer: 120100, fuelDate: new Date(now.getTime() - 86400000 * 5), station: 'Hindustan Petroleum, Khopoli' } }),
    prisma.fuelLog.create({ data: { vehicleId: vehicles[1].id, tripId: trips[1].id, fuelQuantity: 60.2, fuelCost: 5056.8, odometer: 95100, fuelDate: new Date(now.getTime() - 86400000 * 4), station: 'Indian Oil, Igatpuri' } }),
    prisma.fuelLog.create({ data: { vehicleId: vehicles[2].id, fuelQuantity: 30, fuelCost: 1890, odometer: 45050, fuelDate: new Date(now.getTime() - 86400000 * 3), station: 'BPCL, Pune' } }),
    prisma.fuelLog.create({ data: { vehicleId: vehicles[0].id, fuelQuantity: 50, fuelCost: 4200, odometer: 120300, fuelDate: new Date(now.getTime() - 86400000 * 1), station: 'Hindustan Petroleum, Dadar' } }),
    prisma.fuelLog.create({ data: { vehicleId: vehicles[4].id, tripId: trips[3].id, fuelQuantity: 80, fuelCost: 6720, odometer: 280050, fuelDate: new Date(now.getTime() - 86400000 * 2), station: 'Indian Oil, Andheri' } }),
  ]);
  console.log('✅ Fuel logs created');

  // ── Maintenance Records ──────────────────────────────────────
  await Promise.all([
    prisma.maintenance.create({ data: { vehicleId: vehicles[3].id, maintenanceType: 'REPAIR', description: 'Engine overhaul and brake replacement', cost: 45000, startDate: new Date(now.getTime() - 86400000 * 2), nextServiceDate: new Date(now.getTime() + 86400000 * 180), odometer: 32000, status: 'IN_PROGRESS', technician: 'Ramesh Auto Works' } }),
    prisma.maintenance.create({ data: { vehicleId: vehicles[0].id, maintenanceType: 'ROUTINE', description: 'Oil change, filter replacement, tyre rotation', cost: 5500, startDate: new Date(now.getTime() - 86400000 * 10), endDate: new Date(now.getTime() - 86400000 * 9), nextServiceDate: new Date(now.getTime() + 86400000 * 80), odometer: 119800, status: 'COMPLETED', technician: 'Fleet Garage Mumbai' } }),
    prisma.maintenance.create({ data: { vehicleId: vehicles[1].id, maintenanceType: 'INSPECTION', description: 'Annual roadworthiness inspection', cost: 2000, startDate: new Date(now.getTime() + 86400000 * 5), nextServiceDate: new Date(now.getTime() + 86400000 * 370), odometer: 95000, status: 'SCHEDULED', technician: 'RTO Approved Garage' } }),
    prisma.maintenance.create({ data: { vehicleId: vehicles[4].id, maintenanceType: 'ROUTINE', description: 'Transmission fluid and air filter change', cost: 8000, startDate: new Date(now.getTime() - 86400000 * 30), endDate: new Date(now.getTime() - 86400000 * 30), nextServiceDate: new Date(now.getTime() + 86400000 * 3), odometer: 279500, status: 'COMPLETED', technician: 'Volvo Service Centre' } }),
  ]);
  console.log('✅ Maintenance records created');

  // ── Traffic Incidents ────────────────────────────────────────
  await Promise.all([
    prisma.trafficIncident.create({ data: { routeId: routes[0].id, incidentType: 'ACCIDENT', severity: 'HIGH', location: 'Khopoli Toll Plaza, NH-48', description: 'Two-vehicle collision blocking one lane', reportedAt: new Date(now.getTime() - 86400000 * 5 + 3600000), resolvedAt: new Date(now.getTime() - 86400000 * 5 + 7200000), estimatedDelay: 20, status: 'RESOLVED', reportedBy: 'Rajan Kumar' } }),
    prisma.trafficIncident.create({ data: { routeId: routes[3].id, incidentType: 'CONGESTION', severity: 'HIGH', location: 'Andheri Link Road', description: 'Heavy traffic jam during peak hours', reportedAt: new Date(now.getTime() - 86400000 * 2 + 7200000), resolvedAt: new Date(now.getTime() - 86400000 * 2 + 14400000), estimatedDelay: 35, status: 'RESOLVED', reportedBy: 'Mohan Verma' } }),
    prisma.trafficIncident.create({ data: { routeId: routes[1].id, incidentType: 'CONSTRUCTION', severity: 'MEDIUM', location: 'Igatpuri Bypass', description: 'Road widening construction causing single-lane movement', reportedAt: new Date(now.getTime() - 86400000 * 7), estimatedDelay: 15, status: 'ACTIVE', reportedBy: 'Traffic Control' } }),
    prisma.trafficIncident.create({ data: { routeId: routes[0].id, incidentType: 'CONGESTION', severity: 'MEDIUM', location: 'Expressway Khed-Shivapur Exit', description: 'Weekend traffic congestion', reportedAt: new Date(now.getTime() - 86400000), estimatedDelay: 10, status: 'ACTIVE', reportedBy: 'Fleet Dispatch' } }),
    prisma.trafficIncident.create({ data: { routeId: routes[3].id, incidentType: 'ROAD_CLOSURE', severity: 'CRITICAL', location: 'Western Express Highway, Goregaon', description: 'Flyover maintenance — complete closure', reportedAt: new Date(now.getTime() - 3600000), estimatedDelay: 60, status: 'ACTIVE', reportedBy: 'MMRDA' } }),
  ]);
  console.log('✅ Traffic incidents created');

  console.log('\n🎉 Seed complete! Database is ready.');
}

main()
  .catch(e => { console.error('❌ Seed failed:', e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });
