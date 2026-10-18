import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

import Layout from './components/Layout';

// Person 1 - Fleet & Resources
import { VehiclesPage, DriversPage, FuelPage, MaintenancePage } from './pages/fleet/FleetPages';

// Person 2 - Transit & Operations
import { RoutesPage, TripsPage, IncidentsPage } from './pages/trips/TripPages';

// Person 3 - Intelligence & Schema
import Dashboard      from './pages/analytics/Dashboard';
import Reports        from './pages/analytics/Reports';
import PredictionPage from './pages/analytics/PredictionPage';
import SchemaViewer   from './pages/analytics/SchemaViewer';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Person 1 - Fleet & Driver Management */}
          <Route path="vehicles"    element={<VehiclesPage />} />
          <Route path="drivers"     element={<DriversPage />} />
          <Route path="fuel"        element={<FuelPage />} />
          <Route path="maintenance" element={<MaintenancePage />} />

          {/* Person 2 - Routes, Trips & Incidents */}
          <Route path="routes"    element={<RoutesPage />} />
          <Route path="trips"     element={<TripsPage />} />
          <Route path="incidents" element={<IncidentsPage />} />

          {/* Person 3 - Analytics, Reports & AI/ML */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="reports"   element={<Reports />} />
          <Route path="predict"   element={<PredictionPage />} />
          <Route path="schema"    element={<SchemaViewer />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}