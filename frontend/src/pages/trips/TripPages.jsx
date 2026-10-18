import { useEffect, useState } from 'react';
import { routesAPI, tripsAPI, incidentsAPI, vehiclesAPI, driversAPI } from '../../api';
import { Spinner, ErrorMsg, PageHeader, StatusBadge, EmptyState, CandyIcon } from '../../components/UI';
import { 
  Map, CalendarDays, AlertTriangle, Plus, Search, Filter, 
  Clock, ArrowRight, Play, CheckCircle2, XCircle, X, ShieldAlert, Sparkles 
} from 'lucide-react';

// ============================================================
// 1. ROUTES MANAGEMENT (Person 2)
// ============================================================
export function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    source: '',
    destination: '',
    distanceKm: '',
    expectedDuration: '',
    description: '',
    status: 'ACTIVE'
  });

  const loadRoutes = async () => {
    try {
      setLoading(true);
      const data = await routesAPI.getAll();
      setRoutes(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRoutes();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await routesAPI.create({
        ...formData,
        distanceKm: Number(formData.distanceKm),
        expectedDuration: Number(formData.expectedDuration)
      });
      setShowModal(false);
      setFormData({
        name: '',
        source: '',
        destination: '',
        distanceKm: '',
        expectedDuration: '',
        description: '',
        status: 'ACTIVE'
      });
      loadRoutes();
    } catch (err) {
      alert('Error creating route: ' + err.message);
    }
  };

  return (
    <div className="space-y-8 fade-in">
      <PageHeader
        title="Transit Route Geometry"
        subtitle="Person 2: Route topology, source-destination nodes, estimated timings, and incident hotspots"
        badgeText="Person 2"
        badgeColor="bg-violet-200"
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 stroke-[2.5px]" /> Register Route
          </button>
        }
      />

      {error && <ErrorMsg msg={error} />}

      {loading ? (
        <Spinner />
      ) : routes.length === 0 ? (
        <EmptyState message="No transit routes registered yet." />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {routes.map((r) => (
            <div key={r.id} className="card shadow-pop hover:shadow-pop-md hover:-translate-y-1 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-3 pb-2 border-b-2 border-slate-100">
                  <h4 className="font-heading font-extrabold text-foreground text-base tracking-tight">{r.name}</h4>
                  <StatusBadge value={r.status} />
                </div>
                
                {/* Node pair with arrow */}
                <div className="flex items-center gap-2 p-3 bg-slate-50 border-2 border-foreground/30 rounded-2xl my-3 text-xs font-heading font-bold">
                  <span className="text-accent">{r.source}</span>
                  <ArrowRight className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-quaternary">{r.destination}</span>
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs font-heading mt-3">
                  <div className="p-2.5 rounded-xl bg-amber-50 border border-foreground/20">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Distance</span>
                    <span className="text-foreground font-black text-base">{r.distanceKm} km</span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-sky-50 border border-foreground/20">
                    <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">Duration</span>
                    <span className="text-foreground font-black text-base">{r.expectedDuration} mins</span>
                  </div>
                </div>

                {r.description && (
                  <p className="text-xs text-slate-500 mt-3 font-medium line-clamp-2 italic">
                    "{r.description}"
                  </p>
                )}
              </div>

              <div className="flex items-center justify-between pt-4 mt-4 border-t-2 border-slate-100 text-xs font-heading font-bold text-slate-600">
                <span>Trips: <strong className="text-foreground">{r._count?.trips || 0}</strong></span>
                <span>Active Hazards: <strong className="text-rose-600">{r._count?.incidents || 0}</strong></span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Route Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md bg-white border-2 border-foreground shadow-pop-lg relative fade-in">
            <div className="flex justify-between items-center mb-5 pb-3 border-b-2 border-slate-100">
              <h3 className="text-lg font-heading font-extrabold text-foreground">Define Transit Route</h3>
              <button onClick={() => setShowModal(false)} className="btn-icon">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Route Title *</label>
                <input 
                  required 
                  className="input-field" 
                  placeholder="e.g. Mumbai - Pune Expressway"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Origin Node *</label>
                  <input 
                    required 
                    className="input-field" 
                    placeholder="e.g. Mumbai Central"
                    value={formData.source}
                    onChange={(e) => setFormData({ ...formData, source: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Destination *</label>
                  <input 
                    required 
                    className="input-field" 
                    placeholder="e.g. Pune Hub"
                    value={formData.destination}
                    onChange={(e) => setFormData({ ...formData, destination: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Distance (km) *</label>
                  <input 
                    type="number" 
                    step="0.1" 
                    required 
                    className="input-field" 
                    value={formData.distanceKm}
                    onChange={(e) => setFormData({ ...formData, distanceKm: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Duration (min) *</label>
                  <input 
                    type="number" 
                    required 
                    className="input-field" 
                    value={formData.expectedDuration}
                    onChange={(e) => setFormData({ ...formData, expectedDuration: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Route Notes</label>
                <textarea 
                  className="input-field" 
                  rows={2}
                  placeholder="Toll plazas, ghat sections, dual carriageway..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Corridor
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 2. TRIPS DISPATCH & OPERATIONS (Person 2)
// ============================================================
export function TripsPage() {
  const [trips, setTrips] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    routeId: '',
    vehicleId: '',
    driverId: '',
    scheduledAt: new Date().toISOString().slice(0, 16),
    passengerCount: 0,
    cargoWeightKg: 0,
    notes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const [tripsData, routesData, vehData, drvData] = await Promise.all([
        tripsAPI.getAll(params),
        routesAPI.getAll(),
        vehiclesAPI.getAll({ status: 'AVAILABLE' }),
        driversAPI.getAll({ status: 'AVAILABLE' })
      ]);
      setTrips(tripsData);
      setRoutes(routesData);
      setVehicles(vehData);
      setDrivers(drvData);
      if (routesData.length > 0 && !formData.routeId) {
        setFormData(prev => ({
          ...prev,
          routeId: routesData[0].id,
          vehicleId: vehData[0]?.id || '',
          driverId: drvData[0]?.id || ''
        }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await tripsAPI.create({
        routeId: Number(formData.routeId),
        vehicleId: Number(formData.vehicleId),
        driverId: Number(formData.driverId),
        scheduledAt: new Date(formData.scheduledAt).toISOString(),
        passengerCount: Number(formData.passengerCount) || null,
        cargoWeightKg: Number(formData.cargoWeightKg) || null,
        notes: formData.notes
      });
      setShowModal(false);
      loadData();
    } catch (err) {
      alert('Error scheduling trip: ' + err.message);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      const updateData = { status: newStatus };
      if (newStatus === 'IN_PROGRESS') {
        updateData.departedAt = new Date().toISOString();
      } else if (newStatus === 'COMPLETED') {
        updateData.arrivedAt = new Date().toISOString();
      }
      await tripsAPI.update(id, updateData);
      loadData();
    } catch (err) {
      alert('Error updating trip status: ' + err.message);
    }
  };

  return (
    <div className="space-y-8 fade-in">
      <PageHeader
        title="Trip Scheduling & Live Dispatch"
        subtitle="Person 2: Multi-resource allocation, ACID state transitions, and real-time transit telemetry"
        badgeText="Person 2"
        badgeColor="bg-pink-200"
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 stroke-[2.5px]" /> Dispatch Journey
          </button>
        }
      />

      {error && <ErrorMsg msg={error} />}

      {/* Filter toolbar */}
      <div className="card shadow-pop flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider">
            Filter Status:
          </span>
          <select 
            className="select-field py-1 text-xs font-bold w-auto"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="SCHEDULED">Scheduled</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="COMPLETED">Completed</option>
            <option value="DELAYED">Delayed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
        <div className="text-xs font-heading font-bold text-slate-500">
          Dispatched: <span className="font-black text-foreground">{trips.length}</span> trips
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : trips.length === 0 ? (
        <EmptyState message="No operational trips scheduled." />
      ) : (
        <div className="card shadow-pop p-0 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-heading font-extrabold text-slate-600 uppercase border-b-2 border-foreground">
              <tr>
                <th className="py-3 px-4">Trip ID</th>
                <th className="py-3 px-4">Route Path</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Pilot</th>
                <th className="py-3 px-4">Scheduled</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Delay</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b-2 border-foreground">
              {trips.map((t) => (
                <tr key={t.id} className="hover:bg-amber-50/50 transition">
                  <td className="py-3 px-4 font-mono font-bold text-accent text-xs">TRP-{t.id}</td>
                  <td className="py-3 px-4">
                    <span className="font-heading font-bold text-foreground block text-sm">{t.route?.name}</span>
                    <span className="text-xs text-slate-500 font-medium">
                      {t.route?.source} → {t.route?.destination}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-xs font-mono font-bold text-slate-700">
                    {t.vehicle?.registrationNumber}
                  </td>
                  <td className="py-3 px-4 text-xs">
                    <div className="font-heading font-bold text-foreground">{t.driver?.name}</div>
                    <div className="text-slate-400 font-medium">{t.driver?.phone}</div>
                  </td>
                  <td className="py-3 px-4 text-xs text-slate-700 font-medium">
                    {new Date(t.scheduledAt).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}
                  </td>
                  <td className="py-3 px-4"><StatusBadge value={t.status} /></td>
                  <td className="py-3 px-4 text-xs">
                    {t.delayMinutes ? (
                      <span className="text-rose-600 font-extrabold font-mono">+{t.delayMinutes} min</span>
                    ) : (
                      <span className="text-emerald-700 font-bold">On time</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right space-x-1.5">
                    {t.status === 'SCHEDULED' && (
                      <button 
                        onClick={() => handleUpdateStatus(t.id, 'IN_PROGRESS')}
                        className="px-3 py-1 bg-sky-200 border-2 border-foreground rounded-full text-xs font-heading font-bold shadow-pop-xs hover:shadow-pop transition inline-flex items-center gap-1"
                      >
                        <Play className="w-3 h-3 stroke-[2.5px]" /> Start
                      </button>
                    )}
                    {t.status === 'IN_PROGRESS' && (
                      <button 
                        onClick={() => handleUpdateStatus(t.id, 'COMPLETED')}
                        className="px-3 py-1 bg-quaternary border-2 border-foreground rounded-full text-xs font-heading font-bold shadow-pop-xs hover:shadow-pop transition inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3 h-3 stroke-[2.5px]" /> Finish
                      </button>
                    )}
                    {(t.status === 'SCHEDULED' || t.status === 'IN_PROGRESS') && (
                      <button 
                        onClick={() => handleUpdateStatus(t.id, 'CANCELLED')}
                        className="px-2.5 py-1 bg-slate-100 border-2 border-foreground rounded-full text-xs font-heading font-bold shadow-pop-xs hover:bg-rose-100 transition inline-flex items-center"
                        title="Cancel trip"
                      >
                        <XCircle className="w-3.5 h-3.5 text-rose-600 stroke-[2.5px]" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Dispatch Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-lg bg-white border-2 border-foreground shadow-pop-lg relative fade-in">
            <div className="flex justify-between items-center mb-5 pb-3 border-b-2 border-slate-100">
              <h3 className="text-lg font-heading font-extrabold text-foreground">Dispatch New Journey</h3>
              <button onClick={() => setShowModal(false)} className="btn-icon">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Transit Route *</label>
                <select 
                  required 
                  className="select-field"
                  value={formData.routeId}
                  onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                >
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.source} → {r.destination}, {r.distanceKm} km)
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Available Vehicle *</label>
                  <select 
                    required 
                    className="select-field"
                    value={formData.vehicleId}
                    onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                  >
                    {vehicles.length === 0 ? (
                      <option disabled value="">No available units</option>
                    ) : (
                      vehicles.map(v => (
                        <option key={v.id} value={v.id}>
                          {v.registrationNumber} ({v.vehicleType})
                        </option>
                      ))
                    )}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Available Pilot *</label>
                  <select 
                    required 
                    className="select-field"
                    value={formData.driverId}
                    onChange={(e) => setFormData({ ...formData, driverId: e.target.value })}
                  >
                    {drivers.length === 0 ? (
                      <option disabled value="">No available pilots</option>
                    ) : (
                      drivers.map(d => (
                        <option key={d.id} value={d.id}>
                          {d.name} ({d.phone})
                        </option>
                      ))
                    )}
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Departure Timestamp *</label>
                <input 
                  type="datetime-local" 
                  required 
                  className="input-field" 
                  value={formData.scheduledAt}
                  onChange={(e) => setFormData({ ...formData, scheduledAt: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Passenger Count</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={formData.passengerCount}
                    onChange={(e) => setFormData({ ...formData, passengerCount: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Cargo Payload (kg)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={formData.cargoWeightKg}
                    onChange={(e) => setFormData({ ...formData, cargoWeightKg: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Trip Manifest Notes</label>
                <input 
                  className="input-field" 
                  placeholder="Special instructions or temperature sensitive goods"
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" disabled={!formData.vehicleId || !formData.driverId} className="btn-primary">
                  Confirm Allocation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================
// 3. TRAFFIC INCIDENTS (Person 2)
// ============================================================
export function IncidentsPage() {
  const [incidents, setIncidents] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [severityFilter, setSeverityFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    routeId: '',
    incidentType: 'CONGESTION',
    severity: 'MEDIUM',
    location: '',
    description: '',
    estimatedDelay: 30,
    reportedBy: 'Traffic Operations Central'
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const params = {};
      if (severityFilter) params.severity = severityFilter;
      const [incData, routesData] = await Promise.all([
        incidentsAPI.getAll(params),
        routesAPI.getAll()
      ]);
      setIncidents(incData);
      setRoutes(routesData);
      if (routesData.length > 0 && !formData.routeId) {
        setFormData(prev => ({ ...prev, routeId: routesData[0].id }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [severityFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await incidentsAPI.create({
        routeId: Number(formData.routeId),
        incidentType: formData.incidentType,
        severity: formData.severity,
        location: formData.location,
        description: formData.description,
        estimatedDelay: Number(formData.estimatedDelay),
        reportedAt: new Date().toISOString(),
        reportedBy: formData.reportedBy
      });
      setShowModal(false);
      loadData();
    } catch (err) {
      alert('Error filing incident: ' + err.message);
    }
  };

  const handleResolve = async (id) => {
    try {
      await incidentsAPI.update(id, {
        status: 'RESOLVED',
        resolvedAt: new Date().toISOString()
      });
      loadData();
    } catch (err) {
      alert('Error resolving incident: ' + err.message);
    }
  };

  return (
    <div className="space-y-8 fade-in">
      <PageHeader
        title="Traffic Bottlenecks & Hazards"
        subtitle="Person 2: Real-time hazard logging, severity classification, and delay estimations"
        badgeText="Person 2"
        badgeColor="bg-amber-200"
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 stroke-[2.5px]" /> Report Hazard
          </button>
        }
      />

      {error && <ErrorMsg msg={error} />}

      {/* Filter toolbar */}
      <div className="card shadow-pop flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider">
            Severity Filter:
          </span>
          <select 
            className="select-field py-1 text-xs font-bold w-auto"
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
          >
            <option value="">All Severities</option>
            <option value="LOW">Low</option>
            <option value="MEDIUM">Medium</option>
            <option value="HIGH">High</option>
            <option value="CRITICAL">Critical</option>
          </select>
        </div>
        <div className="text-xs font-heading font-bold text-slate-500">
          Active Bottlenecks: <span className="text-rose-600 font-black">{incidents.filter(i => i.status === 'ACTIVE').length}</span>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : incidents.length === 0 ? (
        <EmptyState message="All transit corridors are currently clear." />
      ) : (
        <div className="card shadow-pop p-0 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-heading font-extrabold text-slate-600 uppercase border-b-2 border-foreground">
              <tr>
                <th className="py-3 px-4">Hazard Type</th>
                <th className="py-3 px-4">Severity</th>
                <th className="py-3 px-4">Affected Route</th>
                <th className="py-3 px-4">Location</th>
                <th className="py-3 px-4">Est. Delay</th>
                <th className="py-3 px-4">Reported</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b-2 border-foreground">
              {incidents.map((inc) => (
                <tr key={inc.id} className="hover:bg-amber-50/50 transition">
                  <td className="py-3 px-4 font-heading font-bold text-foreground">
                    <span className="flex items-center gap-1.5">
                      <AlertTriangle className="w-4 h-4 text-amber-500 stroke-[2.5px]" />
                      {inc.incidentType}
                    </span>
                  </td>
                  <td className="py-3 px-4"><StatusBadge value={inc.severity} /></td>
                  <td className="py-3 px-4 text-xs font-bold text-slate-700">{inc.route?.name}</td>
                  <td className="py-3 px-4 text-xs text-slate-600 font-medium">{inc.location}</td>
                  <td className="py-3 px-4 font-mono font-extrabold text-xs text-rose-600">
                    {inc.estimatedDelay ? `+${inc.estimatedDelay}m` : '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs font-medium">
                    {new Date(inc.reportedAt).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4"><StatusBadge value={inc.status} /></td>
                  <td className="py-3 px-4 text-right">
                    {inc.status === 'ACTIVE' ? (
                      <button 
                        onClick={() => handleResolve(inc.id)}
                        className="px-3 py-1 bg-quaternary border-2 border-foreground rounded-full text-xs font-heading font-bold shadow-pop-xs hover:shadow-pop transition"
                      >
                        Resolve
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">Resolved</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Report Incident Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md bg-white border-2 border-foreground shadow-pop-lg relative fade-in">
            <div className="flex justify-between items-center mb-5 pb-3 border-b-2 border-slate-100">
              <h3 className="text-lg font-heading font-extrabold text-foreground">Log Traffic Incident</h3>
              <button onClick={() => setShowModal(false)} className="btn-icon">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Corridor *</label>
                <select 
                  required 
                  className="select-field"
                  value={formData.routeId}
                  onChange={(e) => setFormData({ ...formData, routeId: e.target.value })}
                >
                  {routes.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} ({r.source} → {r.destination})
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Type *</label>
                  <select 
                    className="select-field"
                    value={formData.incidentType}
                    onChange={(e) => setFormData({ ...formData, incidentType: e.target.value })}
                  >
                    <option value="CONGESTION">CONGESTION</option>
                    <option value="ACCIDENT">ACCIDENT</option>
                    <option value="ROAD_CLOSURE">ROAD_CLOSURE</option>
                    <option value="WEATHER">WEATHER</option>
                    <option value="CONSTRUCTION">CONSTRUCTION</option>
                    <option value="OTHER">OTHER</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Severity *</label>
                  <select 
                    className="select-field"
                    value={formData.severity}
                    onChange={(e) => setFormData({ ...formData, severity: e.target.value })}
                  >
                    <option value="LOW">LOW</option>
                    <option value="MEDIUM">MEDIUM</option>
                    <option value="HIGH">HIGH</option>
                    <option value="CRITICAL">CRITICAL</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Specific Location / Milestone *</label>
                <input 
                  required 
                  className="input-field" 
                  placeholder="e.g. Near Toll Plaza Km 42"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Est. Delay (Min)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={formData.estimatedDelay}
                    onChange={(e) => setFormData({ ...formData, estimatedDelay: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Reported By</label>
                  <input 
                    className="input-field" 
                    value={formData.reportedBy}
                    onChange={(e) => setFormData({ ...formData, reportedBy: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Description</label>
                <textarea 
                  className="input-field" 
                  rows={2}
                  placeholder="Lane blockage details, alternate diversion route..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Log Bottleneck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
