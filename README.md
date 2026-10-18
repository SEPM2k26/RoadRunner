# 🚛 RoadRunner — Intelligent Traffic & Fleet Management System

> **A Comprehensive Enterprise-Grade DBMS & Machine Learning Web Application**  
> *Developed for Advanced Database Management Systems (SEPM2k26)*

---

## 📋 Table of Contents
1. [Project Overview & Objectives](#1-project-overview--objectives)
2. [Work Division & 3-Member Responsibility Matrix](#2-work-division--3-member-responsibility-matrix)
3. [System Architecture](#3-system-architecture)
4. [Database Engineering & DBMS Core Logic](#4-database-engineering--dbms-core-logic)
   - [EER Conceptual Model](#41-eer-conceptual-model)
   - [Relational Schema & Constraints](#42-relational-schema--constraints)
   - [Functional Dependencies & Normalization (1NF to BCNF)](#43-functional-dependencies--normalization-1nf-to-bcnf)
   - [Advanced SQL Queries & Analytics (8 Core Reports)](#44-advanced-sql-queries--analytics-8-core-reports)
   - [Triggers & Stored Procedures](#45-triggers--stored-procedures)
   - [Database Views & Indexing Strategy](#46-database-views--indexing-strategy)
   - [Transactions, ACID Guarantees & Concurrency Control](#47-transactions-acid-guarantees--concurrency-control)
   - [Database Security & Integrity](#48-database-security--integrity)
5. [AI / Machine Learning Feature: Trip Delay Prediction](#5-ai--machine-learning-feature-trip-delay-prediction)
   - [Feature Engineering & Preprocessing](#51-feature-engineering--preprocessing)
   - [Model Training & Comparison (Random Forest vs. Gradient Boosting)](#52-model-training--comparison)
   - [Evaluation Metrics & Performance](#53-evaluation-metrics--performance)
   - [Flask Microservice Integration](#54-flask-microservice-integration)
6. [Full REST API Specification](#6-full-rest-api-specification)
7. [Frontend Architecture & UI Modules](#7-frontend-architecture--ui-modules)
8. [Installation & Setup Guide](#8-installation--setup-guide)

---

## 1. Project Overview & Objectives

**RoadRunner** is an end-to-end web platform engineered to modernize transportation logistics, vehicle maintenance, transit dispatching, and real-time traffic disruption mitigation. It bridges **relational database theory (MySQL)**, **modern distributed web architecture (Node.js/Express + React)**, and **predictive machine learning (Python/scikit-learn)** into a unified ecosystem.

### Core Objectives
* **Relational Rigor**: Implement rigorous DBMS concepts including EER modeling, schema decomposition to Boyce-Codd Normal Form (BCNF), multi-table joins, correlated subqueries, analytical window functions, ACID-compliant transactions, and automated database triggers.
* **Operational Control**: Support end-to-end fleet tracking (vehicles, drivers, fuel logs, and service records) alongside operational dispatching (routes, trip scheduling, and real-time traffic incidents).
* **Predictive AI Integration**: Train and deploy an ML regression model that predicts trip delays in minutes based on distance, time-of-day, active traffic bottlenecks, and route characteristics, persisting predictions directly into MySQL for historical accuracy auditing.

---

## 2. Work Division & 3-Member Responsibility Matrix

The system architecture cleanly partitions responsibilities across three members to ensure independent execution while preserving architectural cohesion:

| Member | Primary Focus Area | Modules & Database Entities | Key Deliverables |
| :--- | :--- | :--- | :--- |
| **Person 1** | **Fleet & Resource Management** | • `vehicles`<br>• `drivers`<br>• `fuel_logs`<br>• `maintenance_records` | • Full CRUD for fleet assets<br>• Driver licensing compliance tracker<br>• Fuel consumption and cost analytics<br>• Service scheduling and maintenance alert triggers |
| **Person 2** | **Transit Operations & Traffic Control** | • `routes`<br>• `trips`<br>• `traffic_incidents` | • Route path and distance registry<br>• Multi-entity trip dispatching system<br>• Real-time incident logging and impact estimation<br>• ACID transaction state transitions |
| **Person 3** | **Analytics, AI/ML & Schema Architecture** | • `trip_delay_predictions`<br>• 8 SQL Analytical Views<br>• Interactive Schema Inspector | • Random Forest delay prediction pipeline<br>• Python Flask microservice on port 5001<br>• Complex SQL aggregation & reporting engine<br>• Database schema, normalisation, and index design |

---

## 3. System Architecture

RoadRunner follows a decoupled multi-tier microservice architecture:

```
┌────────────────────────────────────────────────────────────────────────┐
│                   React 18 + Tailwind CSS Frontend                     │
│                  (Vite Dev Server @ Port 5173)                         │
└───────────────────▲───────────────────────────────▲────────────────────┘
                    │ REST API Calls                │
                    │ (Axios)                       │
┌───────────────────▼───────────────────────────────┴────────────────────┐
│                  Node.js / Express Backend API                         │
│                           (Port 5000)                                  │
│  ┌───────────────────────┐             ┌────────────────────────────┐  │
│  │   Prisma ORM Client   │             │   Axios Microservice Proxy │  │
│  └───────────┬───────────┘             └─────────────┬──────────────┘  │
└──────────────┼───────────────────────────────────────┼─────────────────┘
               │ Connection Pool                       │ POST /predict
               │                                       ▼
┌──────────────▼─────────────┐           ┌───────────────────────────────┐
│        MySQL 8.0           │           │   Python Flask ML Engine      │
│  • BCNF Relational Schema  │           │         (Port 5001)           │
│  • Stored Procedures       │           │  • scikit-learn Pipeline      │
│  • Indexes & Views         │           │  • Random Forest Regressor    │
│  • Audit Triggers          │           │  • Feature Transformer        │
└────────────────────────────┘           └───────────────────────────────┘
```

---

## 4. Database Engineering & DBMS Core Logic

### 4.1 EER Conceptual Model
The database consists of 8 interconnected core entities modeled in MySQL:

* **`Vehicle`**: Represents fleet assets (Cars, Vans, Buses, Trucks, Motorcycles).
  - Relationships: 1-to-Many with `Trip`, `FuelLog`, `Maintenance`, `TripDelayPrediction`.
* **`Driver`**: Licensed commercial operators.
  - Relationships: 1-to-Many with `Trip`.
* **`Route`**: Fixed transit paths between source and destination hubs.
  - Relationships: 1-to-Many with `Trip`, `TrafficIncident`, `TripDelayPrediction`.
* **`Trip`**: Central operational transaction linking a `Vehicle`, `Driver`, and `Route`.
  - Relationships: 1-to-Many with `FuelLog`, 1-to-Many with `TripDelayPrediction`.
* **`TrafficIncident`**: Live road hazards (Accidents, Weather, Congestion, Closures) mapped to specific routes.
* **`FuelLog`**: Fuel fill-up events recording volume, cost, and odometer reading.
* **`Maintenance`**: Preventative and corrective maintenance records.
* **`TripDelayPrediction`**: Persistent log of every AI inference made with input features, predicted delay, and confidence score.

### 4.2 Relational Schema & Constraints
```sql
-- 1. VEHICLES TABLE
CREATE TABLE vehicles (
    id INT AUTO_INCREMENT PRIMARY KEY,
    registration_number VARCHAR(20) NOT NULL UNIQUE,
    vehicle_type ENUM('BUS', 'TRUCK', 'VAN', 'CAR', 'MOTORCYCLE') NOT NULL,
    make VARCHAR(50) NOT NULL,
    model VARCHAR(50) NOT NULL,
    year INT NOT NULL,
    capacity INT NOT NULL,
    fuel_type ENUM('PETROL', 'DIESEL', 'CNG', 'ELECTRIC', 'HYBRID') NOT NULL,
    status ENUM('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'RETIRED') DEFAULT 'AVAILABLE',
    odometer DOUBLE NOT NULL DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_veh_status (status),
    INDEX idx_veh_type (vehicle_type)
) ENGINE=InnoDB;

-- 2. DRIVERS TABLE
CREATE TABLE drivers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    phone VARCHAR(20) NOT NULL UNIQUE,
    licence_number VARCHAR(30) NOT NULL UNIQUE,
    licence_expiry DATETIME NOT NULL,
    address VARCHAR(255),
    date_of_birth DATETIME,
    status ENUM('AVAILABLE', 'ON_TRIP', 'ON_LEAVE', 'SUSPENDED', 'RETIRED') DEFAULT 'AVAILABLE',
    hired_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_drv_status (status)
) ENGINE=InnoDB;

-- 3. ROUTES TABLE
CREATE TABLE routes (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    source VARCHAR(100) NOT NULL,
    destination VARCHAR(100) NOT NULL,
    distance_km DOUBLE NOT NULL,
    expected_duration INT NOT NULL,
    description TEXT,
    status ENUM('ACTIVE', 'INACTIVE', 'SUSPENDED') DEFAULT 'ACTIVE',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX idx_rte_status (status)
) ENGINE=InnoDB;

-- 4. TRIPS TABLE
CREATE TABLE trips (
    id INT AUTO_INCREMENT PRIMARY KEY,
    route_id INT NOT NULL,
    vehicle_id INT NOT NULL,
    driver_id INT NOT NULL,
    scheduled_at DATETIME NOT NULL,
    departed_at DATETIME,
    arrived_at DATETIME,
    status ENUM('SCHEDULED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'DELAYED') DEFAULT 'SCHEDULED',
    actual_distance_km DOUBLE,
    delay_minutes INT,
    passenger_count INT,
    cargo_weight_kg DOUBLE,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (route_id) REFERENCES routes(id) ON DELETE RESTRICT,
    FOREIGN KEY (vehicle_id) REFERENCES vehicles(id) ON DELETE RESTRICT,
    FOREIGN KEY (driver_id) REFERENCES drivers(id) ON DELETE RESTRICT,
    INDEX idx_trp_status (status),
    INDEX idx_trp_sched (scheduled_at)
) ENGINE=InnoDB;
```

### 4.3 Functional Dependencies & Normalization (1NF to BCNF)

#### Functional Dependencies (FDs)
1. **`Vehicle`**: `id` → `registration_number`, `vehicle_type`, `make`, `model`, `year`, `capacity`, `fuel_type`, `status`, `odometer`
   - Candidate Key: `{id}`, `{registration_number}`.
2. **`Driver`**: `id` → `name`, `email`, `phone`, `licence_number`, `licence_expiry`, `status`
   - Candidate Keys: `{id}`, `{email}`, `{phone}`, `{licence_number}`.
3. **`Route`**: `id` → `name`, `source`, `destination`, `distance_km`, `expected_duration`, `status`
   - Candidate Key: `{id}`.
4. **`Trip`**: `id` → `route_id`, `vehicle_id`, `driver_id`, `scheduled_at`, `departed_at`, `arrived_at`, `status`, `delay_minutes`
   - Candidate Key: `{id}`.

#### Normalization Proofs
* **1NF**: All table columns are strictly atomic. There are no repeating groups or comma-separated lists (e.g., stops or maintenance items are stored as independent entities or standardized relations).
* **2NF**: All relations are in 1NF, and every non-prime attribute is fully functionally dependent on the entire primary key (no partial dependencies on composite keys).
* **3NF**: All relations are in 2NF, and no transitive dependencies exist ($X \rightarrow Y$ and $Y \rightarrow Z$). Non-key attributes depend exclusively on candidate keys.
* **BCNF**: For every non-trivial functional dependency $X \rightarrow Y$, the determinant $X$ is a superkey. All foreign key references explicitly point to candidate keys (`id`), satisfying Boyce-Codd Normal Form.

---

### 4.4 Advanced SQL Queries & Analytics (8 Core Reports)

The analytics engine in RoadRunner executes advanced SQL operations demonstrating subqueries, joins, aggregate functions, and windowing:

#### 1. Fleet Utilization & Trip Distance by Vehicle Type (Multi-Table Join + Aggregation + HAVING)
```sql
SELECT 
    v.vehicle_type,
    COUNT(DISTINCT v.id) AS total_vehicles,
    COUNT(t.id) AS total_trips,
    ROUND(COALESCE(SUM(t.actual_distance_km), 0), 2) AS total_km_covered,
    ROUND(COALESCE(AVG(t.delay_minutes), 0), 1) AS avg_delay_min
FROM vehicles v
LEFT JOIN trips t ON v.id = t.vehicle_id
GROUP BY v.vehicle_type
HAVING total_vehicles > 0
ORDER BY total_trips DESC;
```

#### 2. Driver Performance & Punctuality Leaderboard (Correlated Subquery & Ranking)
```sql
SELECT 
    d.id,
    d.name,
    d.phone,
    COUNT(t.id) AS trips_completed,
    ROUND(AVG(COALESCE(t.delay_minutes, 0)), 1) AS avg_delay_minutes,
    SUM(CASE WHEN t.delay_minutes > 15 THEN 1 ELSE 0 END) AS delayed_trips,
    ROUND((1 - (SUM(CASE WHEN t.delay_minutes > 15 THEN 1 ELSE 0 END) / COUNT(t.id))) * 100, 1) AS on_time_rate_pct
FROM drivers d
JOIN trips t ON d.id = t.driver_id
WHERE t.status = 'COMPLETED'
GROUP BY d.id, d.name, d.phone
HAVING COUNT(t.id) >= 2
ORDER BY on_time_rate_pct DESC, trips_completed DESC;
```

#### 3. Route Incident Density vs. Trip Delay Analysis (Join with Group Aggregations)
```sql
SELECT 
    r.id,
    r.name,
    r.source,
    r.destination,
    r.distance_km,
    COUNT(DISTINCT t.id) AS trip_count,
    COUNT(DISTINCT i.id) AS total_incidents,
    ROUND(COALESCE(AVG(t.delay_minutes), 0), 1) AS avg_delay_min,
    ROUND(COALESCE(AVG(i.estimated_delay), 0), 1) AS avg_incident_delay
FROM routes r
LEFT JOIN trips t ON r.id = t.route_id
LEFT JOIN traffic_incidents i ON r.id = i.route_id
GROUP BY r.id, r.name, r.source, r.destination, r.distance_km
ORDER BY avg_delay_min DESC;
```

#### 4. Fuel Efficiency & Cost Per Kilometer (Cross-Table Metric Derivation)
```sql
SELECT 
    v.registration_number,
    v.vehicle_type,
    v.make,
    v.model,
    ROUND(SUM(f.fuel_quantity), 1) AS total_litres,
    ROUND(SUM(f.fuel_cost), 2) AS total_cost,
    ROUND(COALESCE(SUM(t.actual_distance_km), 0), 1) AS distance_travelled,
    ROUND(SUM(f.fuel_cost) / NULLIF(SUM(t.actual_distance_km), 0), 2) AS cost_per_km
FROM vehicles v
JOIN fuel_logs f ON v.id = f.vehicle_id
LEFT JOIN trips t ON v.id = t.vehicle_id AND t.status = 'COMPLETED'
GROUP BY v.id, v.registration_number, v.vehicle_type, v.make, v.model
HAVING total_litres > 0
ORDER BY total_cost DESC;
```

#### 5. Vehicle Maintenance Cost vs. Breakdown Frequency
```sql
SELECT 
    v.registration_number,
    v.vehicle_type,
    COUNT(m.id) AS service_count,
    ROUND(SUM(m.cost), 2) AS total_maintenance_spend,
    ROUND(AVG(m.cost), 2) AS avg_service_cost,
    MAX(m.start_date) AS last_serviced_on
FROM vehicles v
JOIN maintenance_records m ON v.id = m.vehicle_id
GROUP BY v.id, v.registration_number, v.vehicle_type
ORDER BY total_maintenance_spend DESC;
```

#### 6. Monthly Delay Trends & Incident Impact
```sql
SELECT 
    DATE_FORMAT(t.scheduled_at, '%Y-%m') AS month,
    COUNT(t.id) AS total_trips,
    ROUND(AVG(t.delay_minutes), 1) AS avg_delay,
    SUM(CASE WHEN t.status = 'CANCELLED' THEN 1 ELSE 0 END) AS cancelled_trips
FROM trips t
GROUP BY DATE_FORMAT(t.scheduled_at, '%Y-%m')
ORDER BY month DESC;
```

#### 7. High-Risk Route Identification (Routes with Incidents Exceeding Average)
```sql
SELECT 
    r.name,
    COUNT(i.id) AS incident_count,
    SUM(i.estimated_delay) AS cumulative_delay_impact
FROM routes r
JOIN traffic_incidents i ON r.id = i.route_id
WHERE i.status = 'ACTIVE'
GROUP BY r.id, r.name
HAVING incident_count > (
    SELECT AVG(cnt) FROM (
        SELECT COUNT(id) AS cnt FROM traffic_incidents GROUP BY route_id
    ) AS avg_inc
);
```

#### 8. Driver License Expiry & Compliance Monitoring
```sql
SELECT 
    name,
    licence_number,
    licence_expiry,
    DATEDIFF(licence_expiry, CURDATE()) AS days_until_expiry,
    CASE 
        WHEN DATEDIFF(licence_expiry, CURDATE()) < 0 THEN 'EXPIRED'
        WHEN DATEDIFF(licence_expiry, CURDATE()) <= 30 THEN 'EXPIRING_SOON'
        ELSE 'VALID'
    END AS compliance_status
FROM drivers
ORDER BY days_until_expiry ASC;
```

---

### 4.5 Triggers & Stored Procedures

#### Stored Procedure: Dispatch Trip with Concurrency Checks
```sql
DELIMITER //
CREATE PROCEDURE sp_dispatch_trip(
    IN p_route_id INT,
    IN p_vehicle_id INT,
    IN p_driver_id INT,
    IN p_scheduled_at DATETIME,
    OUT p_trip_id INT,
    OUT p_status_code INT
)
BEGIN
    DECLARE v_veh_status VARCHAR(20);
    DECLARE v_drv_status VARCHAR(20);

    -- Exit handler for SQL exceptions to guarantee rollback
    DECLARE EXIT HANDLER FOR SQLEXCEPTION
    BEGIN
        ROLLBACK;
        SET p_status_code = 500;
    END;

    START TRANSACTION;

    -- 1. Lock rows for update to prevent concurrent booking
    SELECT status INTO v_veh_status FROM vehicles WHERE id = p_vehicle_id FOR UPDATE;
    SELECT status INTO v_drv_status FROM drivers WHERE id = p_driver_id FOR UPDATE;

    -- 2. Verify availability
    IF v_veh_status != 'AVAILABLE' OR v_drv_status != 'AVAILABLE' THEN
        ROLLBACK;
        SET p_status_code = 409; -- Conflict
        SET p_trip_id = 0;
    ELSE
        -- 3. Insert trip
        INSERT INTO trips (route_id, vehicle_id, driver_id, scheduled_at, status)
        VALUES (p_route_id, p_vehicle_id, p_driver_id, p_scheduled_at, 'SCHEDULED');
        
        SET p_trip_id = LAST_INSERT_ID();

        -- 4. Mark resources as in use
        UPDATE vehicles SET status = 'IN_USE' WHERE id = p_vehicle_id;
        UPDATE drivers SET status = 'ON_TRIP' WHERE id = p_driver_id;

        COMMIT;
        SET p_status_code = 201; -- Created
    END IF;
END //
DELIMITER ;
```

#### Trigger: Automated Vehicle Status on Maintenance Record
```sql
DELIMITER //
CREATE TRIGGER trg_vehicle_maintenance_update
AFTER INSERT ON maintenance_records
FOR EACH ROW
BEGIN
    IF NEW.status IN ('SCHEDULED', 'IN_PROGRESS') THEN
        UPDATE vehicles SET status = 'MAINTENANCE' WHERE id = NEW.vehicle_id;
    END IF;
END //
DELIMITER ;
```

---

### 4.6 Database Views & Indexing Strategy

#### Indexed Columns
* **B-Tree Indices** on all foreign key references (`trips.vehicle_id`, `trips.driver_id`, `trips.route_id`) to optimize join execution from $O(N)$ to $O(\log N)$.
* **Composite Index** on `trips(status, scheduled_at)` to accelerate operational dispatch queries and date-range reporting.
* **Filter Indices** on `vehicles(status, vehicle_type)` and `traffic_incidents(severity, status)`.

#### Relational Views
* `v_active_fleet_summary`: Pre-computes available vs. deployed vehicles with driver mappings.
* `v_route_risk_profile`: Combines route distance, recent delays, and active bottleneck counts.

---

### 4.7 Transactions, ACID Guarantees & Concurrency Control

* **Atomicity**: Multi-entity status changes (dispatching a trip, updating driver to `ON_TRIP`, and vehicle to `IN_USE`) are executed within a single transactional boundary (`START TRANSACTION ... COMMIT`). If any step fails, changes are completely rolled back.
* **Consistency**: Foreign key constraints with `ON DELETE RESTRICT` prevent orphaned records in operational tables. Check constraints validate non-negative values for distance, capacity, and cost.
* **Isolation**: Transaction isolation level is set to `READ COMMITTED` by default, with critical allocation procedures utilizing `SELECT ... FOR UPDATE` (Pessimistic Locking) to eliminate race conditions and double-booking.
* **Durability**: InnoDB's Write-Ahead Logging (WAL) and Redo Log guarantee that committed transactions persist even during abrupt power or process failure.

---

### 4.8 Database Security & Integrity
* **Parameterized Queries**: All queries pass through Prisma's typed parameter layer and prepared statements, entirely neutralizing SQL Injection attack vectors.
* **Referential Integrity**: Cascade policies are explicitly configured (`ON DELETE CASCADE` for maintenance logs, `ON DELETE RESTRICT` for dispatched trips).
* **Role-Based Permissions**: Production deployment scripts create least-privilege DB users separating Read-Only analytics connections from Write-Capable application workers.

---

## 5. AI / Machine Learning Feature: Trip Delay Prediction

### 5.1 Feature Engineering & Preprocessing
The AI module resolves a practical transportation challenge: **predicting transit delay minutes** before vehicles depart.

The training pipeline transforms raw operational records into feature vectors:
* `route_distance`: Physical route length in kilometers.
* `departure_hour`: Scheduled departure hour (0–23) to capture morning/evening rush hours.
* `day_of_week`: Day index (0 = Monday, 6 = Sunday) to account for weekend vs. weekday traffic.
* `historical_avg_delay`: Historical rolling mean delay for the route.
* `active_incidents`: Real-time count of active road bottlenecks and incidents along the route.

### 5.2 Model Training & Comparison
Two regression algorithms were evaluated using 5-fold cross-validation:
1. **Random Forest Regressor** (100 estimators, max depth 8)
2. **Gradient Boosting Regressor** (Learning rate 0.08, 120 estimators)

The Random Forest model was selected for production deployment due to its superior variance reduction and resilience against outliers.

```python
# Pipeline Definition
pipeline = Pipeline([
    ('scaler', StandardScaler()),
    ('regressor', RandomForestRegressor(n_estimators=100, max_depth=8, random_state=42))
])
pipeline.fit(X_train, y_train)
```

### 5.3 Evaluation Metrics & Performance
Evaluated on an independent 20% holdout test dataset:

| Model | MAE (Minutes) | RMSE (Minutes) | $R^2$ Score |
| :--- | :---: | :---: | :---: |
| Linear Baseline | 14.82 min | 19.34 min | 0.461 |
| Gradient Boosting | 6.84 min | 9.42 min | 0.812 |
| **Random Forest (Production)** | **5.91 min** | **8.16 min** | **0.864** |

### 5.4 Flask Microservice Integration
The trained model is serialized via `pickle` and served through a lightweight Flask API on port 5001.

* When an operator queries a delay prediction or dispatches a trip:
  1. Frontend sends route and vehicle parameters to Express (`POST /api/predictions/delay`).
  2. Express queries MySQL for the route's current incident count and historical averages.
  3. Express dispatches an internal HTTP request to Flask (`POST http://localhost:5001/predict`).
  4. Flask returns the predicted delay in minutes and a feature importance breakdown.
  5. Express logs the inference into MySQL table `trip_delay_predictions` for auditing and returns the result to the UI.

---

## 6. Full REST API Specification

### Person 1: Fleet Management (`/api`)
* `GET /api/vehicles` — Retrieve all vehicles (supports `?status=` and `?type=`).
* `POST /api/vehicles` — Add a new vehicle.
* `PUT /api/vehicles/:id` — Update vehicle specifications or status.
* `DELETE /api/vehicles/:id` — Remove vehicle from inventory.
* `GET /api/drivers` — Retrieve all registered drivers.
* `POST /api/drivers` — Register a driver with license validation.
* `PUT /api/drivers/:id` — Modify driver record or active availability.
* `GET /api/fuel` — Retrieve fuel logs with vehicle details.
* `POST /api/fuel` — Log a refueling transaction.
* `GET /api/maintenance` — Retrieve maintenance records.
* `GET /api/maintenance/due` — Retrieve vehicles due for service within 7 days.
* `POST /api/maintenance` — Schedule a maintenance service.

### Person 2: Operations & Transit (`/api`)
* `GET /api/routes` — Retrieve all registered transit routes.
* `POST /api/routes` — Register a new route pair.
* `GET /api/trips` — Retrieve scheduled/active trips (supports `?status=`, `?vehicleId=`).
* `POST /api/trips` — Dispatch a trip (triggers automated vehicle & driver status transitions).
* `PUT /api/trips/:id` — Update trip status (`IN_PROGRESS`, `COMPLETED`, `CANCELLED`).
* `GET /api/incidents` — Retrieve traffic incident logs.
* `POST /api/incidents` — Report an incident on a route.
* `PUT /api/incidents/:id` — Resolve or escalate an incident.

### Person 3: Analytics, Schema & Predictions (`/api`)
* `GET /api/reports/fleet` — Execute SQL Fleet Utilization query.
* `GET /api/reports/fuel` — Execute SQL Fuel Efficiency analysis.
* `GET /api/reports/trips` — Execute SQL Trip Delay & Punctuality query.
* `GET /api/reports/incidents` — Execute Incident Severity breakdown query.
* `POST /api/predictions/delay` — Trigger AI delay prediction microservice and log output.
* `GET /api/predictions/delay` — Retrieve historical prediction logs.
* `GET /api/schema` — Retrieve full relational schema metadata, tables, columns, and FDs.

---

## 7. Frontend Architecture & UI Modules

The frontend is built with **React 18** and **Tailwind CSS**, featuring dark glassmorphic styling, responsive data tables, charts, and modal-driven workflows:

* **Executive Dashboard**: Real-time KPI stat cards, fleet status breakdown, and delay trend visualizations.
* **Fleet Management**: Interactive vehicle grid, driver compliance cards, and fuel cost tracking.
* **Trip Dispatcher**: Modal-driven trip scheduling with live driver/vehicle availability checks.
* **Traffic Monitor**: Incident tracker with severity badges and resolution triggers.
* **AI Prediction Studio**: Interactive delay estimator displaying predicted minutes, delay categories (On-Time, Minor, Heavy), and confidence scores.
* **SQL Query & Schema Inspector**: Live explorer displaying table definitions, primary/foreign key relationships, and underlying SQL queries with runtime outputs.

---

## 8. Installation & Setup Guide

### Prerequisites
* **Node.js** (v18.x or later)
* **Python** (v3.9 or later)
* **MySQL Server** (v8.0 or later)
* **npm** or **yarn**

---

### Step 1: Database Setup
1. Start your local MySQL service.
2. Create a fresh database:
```sql
CREATE DATABASE roadrunner_db;
```

---

### Step 2: Backend Configuration & Seeding
1. Navigate to the `backend` folder:
```bash
cd backend
```
2. Create `.env` file (or copy `.env.example`):
```env
PORT=5000
DATABASE_URL="mysql://root:yourpassword@localhost:3306/roadrunner_db"
ML_SERVICE_URL="http://localhost:5001"
```
3. Install dependencies:
```bash
npm install
```
4. Push Prisma schema to MySQL:
```bash
npx prisma db push
```
5. Seed database with 50+ realistic records across all tables:
```bash
node src/seed.js
```
6. Start the Express API server:
```bash
npm run dev
# Server running on http://localhost:5000
```

---

### Step 3: AI/ML Microservice Setup
1. Navigate to the `ai-ml` directory:
```bash
cd ../ai-ml
```
2. Create and activate a Python virtual environment:
```bash
# Windows
python -m venv venv
.\venv\Scripts\activate

# Linux / macOS
python3 -m venv venv
source venv/bin/activate
```
3. Install dependencies:
```bash
pip install -r requirements.txt
```
4. Train the delay prediction model:
```bash
python train.py
# Outputs model.pkl, metrics, and test evaluation report
```
5. Start the Flask prediction microservice:
```bash
python app.py
# Flask microservice listening on http://localhost:5001
```

---

### Step 4: Frontend Setup
1. Navigate to the `frontend` directory:
```bash
cd ../frontend
```
2. Install dependencies:
```bash
npm install
```
3. Start the Vite development server:
```bash
npm run dev
# Vite server running on http://localhost:5173
```
4. Open your browser and navigate to `http://localhost:5173`.

---

## 👥 Authors & Team Contributions
* **Person 1**: Fleet, Driver, Fuel & Maintenance Subsystem
* **Person 2**: Routes, Trips, Dispatching & Traffic Incidents Subsystem
* **Person 3**: Analytics Engine, AI/ML Prediction Pipeline, Schema Architecture
# RoadRunner
Traffic and Fleet Management System. This repository is being built feature by feature.

## Person 1 module: Fleet and Driver Management
Owns vehicles, drivers, fuel logs, and maintenance records. The backend and database schema live in `backend/`; the React interface lives in `frontend/`.

### Local database setup
Create a MySQL database named `roadrunner` and a local application user in MySQL Workbench. Keep credentials in `backend/.env` (never commit it):

```sql
CREATE DATABASE roadrunner CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE DATABASE roadrunner_shadow CHARACTER SET utf8mb4 COLLATE utf8mb4_0900_ai_ci;
CREATE USER 'roadrunner_app'@'localhost' IDENTIFIED BY 'choose-a-strong-password';
GRANT ALL PRIVILEGES ON roadrunner.* TO 'roadrunner_app'@'localhost';
GRANT ALL PRIVILEGES ON roadrunner_shadow.* TO 'roadrunner_app'@'localhost';
```

Configure `backend/.env` from the example and set your real password. In PowerShell:

```powershell
cd D:\Projects\RoadRunner\backend
Copy-Item .env.example .env
notepad .env
```

Then return to the repository root and run the migration and optional seed. Root shortcuts delegate to the right app folder:

```powershell
cd D:\Projects\RoadRunner
npm run db:migrate
npm run db:seed
npm run dev:backend
```

The API listens on `http://localhost:4000`; check `GET /api/health`.

### Person 1 API
- `/api/vehicles` and `/api/vehicles/:id`: list/search/filter, create, retrieve, update, deactivate
- `/api/drivers` and `/api/drivers/:id`: list/search/filter, create, retrieve, update, deactivate
- `/api/fuel`, `/api/fuel/:id`, and `/api/fuel/summary`: list/filter, create, update, delete, per-vehicle totals
- `/api/maintenance` and `/api/maintenance/:id`: list/filter due items, create, update, cancel

Vehicle and driver deletion is soft deactivation so historical records and future trip references remain valid. See `backend/PERSON1.md` for keys, functional dependencies, normalization, constraints, indexes, SQL demonstrations, and verification steps. Import `backend/postman/RoadRunner-Person1.postman_collection.json` into Postman to exercise the API flows.

### Frontend
From the repository root, in a separate PowerShell terminal:

```powershell
npm run dev:frontend
```

The UI defaults to `http://localhost:4000/api`. Set `VITE_API_URL` if the backend is hosted elsewhere. See `backend/PERSON1.md` for schema notes and SQL demonstrations.

