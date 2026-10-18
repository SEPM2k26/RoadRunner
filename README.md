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

