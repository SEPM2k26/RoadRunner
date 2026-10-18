import { useEffect, useState } from 'react';
import { vehiclesAPI, driversAPI, fuelAPI, maintenanceAPI } from '../../api';
import { Spinner, ErrorMsg, PageHeader, StatusBadge, EmptyState, CandyIcon } from '../../components/UI';
import { 
  Truck, Users, Fuel, Wrench, Plus, Search, Filter, 
  AlertTriangle, X, Trash2, CheckCircle2 
} from 'lucide-react';

// ============================================================
// 1. VEHICLES MANAGEMENT (Person 1)
// ============================================================
export function VehiclesPage() {
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterType, setFilterType] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    registrationNumber: '',
    vehicleType: 'TRUCK',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    capacity: 10,
    fuelType: 'DIESEL',
    status: 'AVAILABLE',
    odometer: 0
  });

  const loadVehicles = async () => {
    try {
      setLoading(true);
      const params = {};
      if (filterStatus) params.status = filterStatus;
      if (filterType) params.type = filterType;
      const data = await vehiclesAPI.getAll(params);
      setVehicles(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVehicles();
  }, [filterStatus, filterType]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await vehiclesAPI.create({
        ...formData,
        year: Number(formData.year),
        capacity: Number(formData.capacity),
        odometer: Number(formData.odometer)
      });
      setShowModal(false);
      setFormData({
        registrationNumber: '',
        vehicleType: 'TRUCK',
        make: '',
        model: '',
        year: new Date().getFullYear(),
        capacity: 10,
        fuelType: 'DIESEL',
        status: 'AVAILABLE',
        odometer: 0
      });
      loadVehicles();
    } catch (err) {
      alert('Error creating vehicle: ' + err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Are you sure you want to delete this vehicle?')) return;
    try {
      await vehiclesAPI.remove(id);
      loadVehicles();
    } catch (err) {
      alert('Error deleting vehicle: ' + err.message);
    }
  };

  return (
    <div className="space-y-8 fade-in">
      <PageHeader
        title="Fleet Vehicle Roster"
        subtitle="Person 1: Asset inventory, classification, capacity tracking, and status transitions"
        badgeText="Person 1"
        badgeColor="bg-sky-200"
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 stroke-[2.5px]" /> Add Vehicle
          </button>
        }
      />

      {error && <ErrorMsg msg={error} />}

      {/* Filter Toolbar */}
      <div className="card shadow-pop flex flex-wrap gap-4 items-center justify-between">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-heading font-extrabold text-foreground uppercase tracking-wider">
            <Filter className="w-4 h-4 text-accent" /> Filter By:
          </div>
          <select 
            className="select-field py-1.5 text-xs font-bold"
            value={filterStatus} 
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">All Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="IN_USE">In Use</option>
            <option value="MAINTENANCE">Maintenance</option>
            <option value="RETIRED">Retired</option>
          </select>
          <select 
            className="select-field py-1.5 text-xs font-bold"
            value={filterType} 
            onChange={(e) => setFilterType(e.target.value)}
          >
            <option value="">All Vehicle Types</option>
            <option value="TRUCK">Truck</option>
            <option value="BUS">Bus</option>
            <option value="VAN">Van</option>
            <option value="CAR">Car</option>
            <option value="MOTORCYCLE">Motorcycle</option>
          </select>
        </div>
        <div className="text-xs font-heading font-bold text-slate-500">
          Showing <span className="text-foreground font-black">{vehicles.length}</span> fleet units
        </div>
      </div>

      {/* Vehicle Grid Table */}
      {loading ? (
        <Spinner />
      ) : vehicles.length === 0 ? (
        <EmptyState message="No vehicles found matching current filter." />
      ) : (
        <div className="card shadow-pop p-0 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-heading font-extrabold text-slate-600 uppercase border-b-2 border-foreground">
              <tr>
                <th className="py-3 px-4">Plate #</th>
                <th className="py-3 px-4">Make & Model</th>
                <th className="py-3 px-4">Category</th>
                <th className="py-3 px-4">Fuel</th>
                <th className="py-3 px-4">Capacity</th>
                <th className="py-3 px-4">Odometer</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Trips</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b-2 border-foreground">
              {vehicles.map((v) => (
                <tr key={v.id} className="hover:bg-amber-50/50 transition">
                  <td className="py-3.5 px-4 font-mono font-bold text-xs text-accent">{v.registrationNumber}</td>
                  <td className="py-3.5 px-4 font-heading font-bold text-foreground">{v.make} {v.model} ({v.year})</td>
                  <td className="py-3.5 px-4 text-xs font-semibold text-slate-700">{v.vehicleType}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-500">{v.fuelType}</td>
                  <td className="py-3.5 px-4 text-xs text-slate-700">{v.capacity} pax/ton</td>
                  <td className="py-3.5 px-4 text-xs font-mono text-slate-700">{v.odometer.toLocaleString()} km</td>
                  <td className="py-3.5 px-4"><StatusBadge value={v.status} /></td>
                  <td className="py-3.5 px-4 text-xs font-bold text-foreground">{v._count?.trips || 0}</td>
                  <td className="py-3.5 px-4 text-right">
                    <button 
                      onClick={() => handleDelete(v.id)} 
                      className="btn-icon text-rose-600 hover:bg-rose-50"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md bg-white border-2 border-foreground shadow-pop-lg relative fade-in">
            <div className="flex justify-between items-center mb-5 pb-3 border-b-2 border-slate-100">
              <h3 className="text-lg font-heading font-extrabold text-foreground">Add Fleet Vehicle</h3>
              <button onClick={() => setShowModal(false)} className="btn-icon">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Registration Plate *</label>
                <input 
                  required 
                  className="input-field uppercase" 
                  placeholder="e.g. MH-02-AB-1234"
                  value={formData.registrationNumber}
                  onChange={(e) => setFormData({ ...formData, registrationNumber: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Make *</label>
                  <input 
                    required 
                    className="input-field" 
                    placeholder="e.g. Tata"
                    value={formData.make}
                    onChange={(e) => setFormData({ ...formData, make: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Model *</label>
                  <input 
                    required 
                    className="input-field" 
                    placeholder="e.g. Prima 4028"
                    value={formData.model}
                    onChange={(e) => setFormData({ ...formData, model: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Type</label>
                  <select 
                    className="select-field"
                    value={formData.vehicleType}
                    onChange={(e) => setFormData({ ...formData, vehicleType: e.target.value })}
                  >
                    <option value="TRUCK">TRUCK</option>
                    <option value="BUS">BUS</option>
                    <option value="VAN">VAN</option>
                    <option value="CAR">CAR</option>
                    <option value="MOTORCYCLE">MOTORCYCLE</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Fuel</label>
                  <select 
                    className="select-field"
                    value={formData.fuelType}
                    onChange={(e) => setFormData({ ...formData, fuelType: e.target.value })}
                  >
                    <option value="DIESEL">DIESEL</option>
                    <option value="PETROL">PETROL</option>
                    <option value="CNG">CNG</option>
                    <option value="ELECTRIC">ELECTRIC</option>
                    <option value="HYBRID">HYBRID</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Year</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={formData.year}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Capacity</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={formData.capacity}
                    onChange={(e) => setFormData({ ...formData, capacity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Odometer (km)</label>
                  <input 
                    type="number" 
                    className="input-field" 
                    value={formData.odometer}
                    onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Vehicle
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
// 2. DRIVERS MANAGEMENT (Person 1)
// ============================================================
export function DriversPage() {
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    licenceNumber: '',
    licenceExpiry: '',
    address: '',
    status: 'AVAILABLE'
  });

  const loadDrivers = async () => {
    try {
      setLoading(true);
      const params = {};
      if (statusFilter) params.status = statusFilter;
      const data = await driversAPI.getAll(params);
      setDrivers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDrivers();
  }, [statusFilter]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await driversAPI.create({
        ...formData,
        licenceExpiry: new Date(formData.licenceExpiry).toISOString()
      });
      setShowModal(false);
      setFormData({
        name: '',
        email: '',
        phone: '',
        licenceNumber: '',
        licenceExpiry: '',
        address: '',
        status: 'AVAILABLE'
      });
      loadDrivers();
    } catch (err) {
      alert('Error creating driver: ' + err.message);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      await driversAPI.update(id, { status: newStatus });
      loadDrivers();
    } catch (err) {
      alert('Failed to update driver status: ' + err.message);
    }
  };

  const filtered = drivers.filter(d => 
    d.name.toLowerCase().includes(search.toLowerCase()) ||
    d.licenceNumber.toLowerCase().includes(search.toLowerCase()) ||
    d.phone.includes(search)
  );

  return (
    <div className="space-y-8 fade-in">
      <PageHeader
        title="Fleet Drivers & Compliance"
        subtitle="Person 1: Operator roster, licensing validity, contact directories, and active availability"
        badgeText="Person 1"
        badgeColor="bg-emerald-200"
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 stroke-[2.5px]" /> Register Driver
          </button>
        }
      />

      {error && <ErrorMsg msg={error} />}

      <div className="card shadow-pop flex flex-wrap gap-4 items-center justify-between">
        <div className="flex items-center gap-3 flex-1 min-w-[280px]">
          <Search className="w-4 h-4 text-slate-400 stroke-[2.5px]" />
          <input 
            type="text" 
            placeholder="Search by name, license number, or phone..." 
            className="input-field text-xs py-1.5"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-3">
          <select 
            className="select-field py-1.5 text-xs font-bold"
            value={statusFilter} 
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All Driver Statuses</option>
            <option value="AVAILABLE">Available</option>
            <option value="ON_TRIP">On Trip</option>
            <option value="ON_LEAVE">On Leave</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="RETIRED">Retired</option>
          </select>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : filtered.length === 0 ? (
        <EmptyState message="No drivers found matching criteria." />
      ) : (
        <div className="card shadow-pop p-0 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-heading font-extrabold text-slate-600 uppercase border-b-2 border-foreground">
              <tr>
                <th className="py-3 px-4">Operator Name</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Licence Number</th>
                <th className="py-3 px-4">Expiry Date</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Trips Completed</th>
                <th className="py-3 px-4 text-right">Quick Toggle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b-2 border-foreground">
              {filtered.map((d) => (
                <tr key={d.id} className="hover:bg-amber-50/50 transition">
                  <td className="py-3.5 px-4 font-heading font-bold text-foreground">{d.name}</td>
                  <td className="py-3.5 px-4 text-xs">
                    <div className="font-semibold text-slate-700">{d.phone}</div>
                    <div className="text-slate-400">{d.email}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono font-bold text-accent text-xs">{d.licenceNumber}</td>
                  <td className="py-3.5 px-4 text-slate-700 text-xs">
                    {new Date(d.licenceExpiry).toLocaleDateString()}
                  </td>
                  <td className="py-3.5 px-4"><StatusBadge value={d.status} /></td>
                  <td className="py-3.5 px-4 font-bold text-foreground text-xs">{d._count?.trips || 0}</td>
                  <td className="py-3.5 px-4 text-right">
                    <select
                      className="select-field py-1 text-xs font-bold w-auto"
                      value={d.status}
                      onChange={(e) => handleStatusChange(d.id, e.target.value)}
                    >
                      <option value="AVAILABLE">AVAILABLE</option>
                      <option value="ON_TRIP">ON_TRIP</option>
                      <option value="ON_LEAVE">ON_LEAVE</option>
                      <option value="SUSPENDED">SUSPENDED</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Driver Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md bg-white border-2 border-foreground shadow-pop-lg relative fade-in">
            <div className="flex justify-between items-center mb-5 pb-3 border-b-2 border-slate-100">
              <h3 className="text-lg font-heading font-extrabold text-foreground">Register Operator</h3>
              <button onClick={() => setShowModal(false)} className="btn-icon">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Full Legal Name *</label>
                <input 
                  required 
                  className="input-field" 
                  placeholder="e.g. Rajesh Kumar"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Email *</label>
                  <input 
                    type="email" 
                    required 
                    className="input-field" 
                    placeholder="rajesh@roadrunner.com"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Phone *</label>
                  <input 
                    required 
                    className="input-field" 
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Licence Number *</label>
                  <input 
                    required 
                    className="input-field uppercase" 
                    placeholder="DL-0420110012345"
                    value={formData.licenceNumber}
                    onChange={(e) => setFormData({ ...formData, licenceNumber: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Licence Expiry *</label>
                  <input 
                    type="date" 
                    required 
                    className="input-field" 
                    value={formData.licenceExpiry}
                    onChange={(e) => setFormData({ ...formData, licenceExpiry: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Operator
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
// 3. FUEL LOGS (Person 1)
// ============================================================
export function FuelPage() {
  const [logs, setLogs] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: '',
    fuelQuantity: '',
    fuelCost: '',
    odometer: '',
    fuelDate: new Date().toISOString().split('T')[0],
    station: '',
    notes: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [fuelData, vehData] = await Promise.all([
        fuelAPI.getAll(),
        vehiclesAPI.getAll()
      ]);
      setLogs(fuelData);
      setVehicles(vehData);
      if (vehData.length > 0 && !formData.vehicleId) {
        setFormData(prev => ({ ...prev, vehicleId: vehData[0].id }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await fuelAPI.create({
        vehicleId: Number(formData.vehicleId),
        fuelQuantity: Number(formData.fuelQuantity),
        fuelCost: Number(formData.fuelCost),
        odometer: Number(formData.odometer),
        fuelDate: new Date(formData.fuelDate).toISOString(),
        station: formData.station,
        notes: formData.notes
      });
      setShowModal(false);
      loadData();
    } catch (err) {
      alert('Error logging fuel: ' + err.message);
    }
  };

  const totalFuel = logs.reduce((sum, l) => sum + l.fuelQuantity, 0);
  const totalCost = logs.reduce((sum, l) => sum + l.fuelCost, 0);
  const avgCostPerLitre = totalFuel > 0 ? (totalCost / totalFuel).toFixed(2) : 0;

  return (
    <div className="space-y-8 fade-in">
      <PageHeader
        title="Fuel Logs & Expenses"
        subtitle="Person 1: Fuel consumption logs, expenditure tracking, and station transactions"
        badgeText="Person 1"
        badgeColor="bg-amber-200"
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 stroke-[2.5px]" /> Log Fuel Refill
          </button>
        }
      />

      {error && <ErrorMsg msg={error} />}

      {/* Fuel Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <div className="card shadow-pop bg-amber-50">
          <div className="text-xs font-heading font-extrabold text-slate-600 uppercase tracking-wider">Total Fuel Dispensed</div>
          <div className="text-3xl font-heading font-black text-foreground mt-1">{totalFuel.toLocaleString()} L</div>
        </div>
        <div className="card shadow-pop bg-emerald-50">
          <div className="text-xs font-heading font-extrabold text-slate-600 uppercase tracking-wider">Total Fuel Expenditure</div>
          <div className="text-3xl font-heading font-black text-foreground mt-1">₹{totalCost.toLocaleString()}</div>
        </div>
        <div className="card shadow-pop bg-sky-50">
          <div className="text-xs font-heading font-extrabold text-slate-600 uppercase tracking-wider">Average Rate</div>
          <div className="text-3xl font-heading font-black text-foreground mt-1">₹{avgCostPerLitre} / L</div>
        </div>
      </div>

      {loading ? (
        <Spinner />
      ) : logs.length === 0 ? (
        <EmptyState message="No fuel entries recorded yet." />
      ) : (
        <div className="card shadow-pop p-0 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-heading font-extrabold text-slate-600 uppercase border-b-2 border-foreground">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Quantity</th>
                <th className="py-3 px-4">Total Cost</th>
                <th className="py-3 px-4">Unit Rate</th>
                <th className="py-3 px-4">Odometer</th>
                <th className="py-3 px-4">Station</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b-2 border-foreground">
              {logs.map((l) => (
                <tr key={l.id} className="hover:bg-amber-50/50 transition">
                  <td className="py-3 px-4 text-slate-600 text-xs font-semibold">
                    {new Date(l.fuelDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs text-accent block font-bold">
                      {l.vehicle?.registrationNumber}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {l.vehicle?.make} {l.vehicle?.model}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-heading font-bold text-foreground">{l.fuelQuantity} L</td>
                  <td className="py-3 px-4 text-emerald-800 font-bold">₹{l.fuelCost.toLocaleString()}</td>
                  <td className="py-3 px-4 text-slate-600 text-xs font-mono">
                    ₹{(l.fuelCost / l.fuelQuantity).toFixed(2)}/L
                  </td>
                  <td className="py-3 px-4 text-slate-700 text-xs font-mono">{l.odometer.toLocaleString()} km</td>
                  <td className="py-3 px-4 text-slate-600 text-xs">{l.station || '—'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Fuel Log Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md bg-white border-2 border-foreground shadow-pop-lg relative fade-in">
            <div className="flex justify-between items-center mb-5 pb-3 border-b-2 border-slate-100">
              <h3 className="text-lg font-heading font-extrabold text-foreground">Record Fuel Refill</h3>
              <button onClick={() => setShowModal(false)} className="btn-icon">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Target Vehicle *</label>
                <select 
                  required 
                  className="select-field"
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} — {v.make} {v.model}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Quantity (Litres) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    className="input-field" 
                    value={formData.fuelQuantity}
                    onChange={(e) => setFormData({ ...formData, fuelQuantity: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Total Cost (₹) *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    required 
                    className="input-field" 
                    value={formData.fuelCost}
                    onChange={(e) => setFormData({ ...formData, fuelCost: e.target.value })}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Odometer (km) *</label>
                  <input 
                    type="number" 
                    required 
                    className="input-field" 
                    value={formData.odometer}
                    onChange={(e) => setFormData({ ...formData, odometer: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Date *</label>
                  <input 
                    type="date" 
                    required 
                    className="input-field" 
                    value={formData.fuelDate}
                    onChange={(e) => setFormData({ ...formData, fuelDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Refill
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
// 4. MAINTENANCE (Person 1)
// ============================================================
export function MaintenancePage() {
  const [records, setRecords] = useState([]);
  const [dueRecords, setDueRecords] = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    vehicleId: '',
    maintenanceType: 'ROUTINE',
    description: '',
    cost: '',
    startDate: new Date().toISOString().split('T')[0],
    nextServiceDate: '',
    odometer: '',
    status: 'SCHEDULED',
    technician: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [mRecords, due, vehData] = await Promise.all([
        maintenanceAPI.getAll(),
        maintenanceAPI.getDue(),
        vehiclesAPI.getAll()
      ]);
      setRecords(mRecords);
      setDueRecords(due);
      setVehicles(vehData);
      if (vehData.length > 0 && !formData.vehicleId) {
        setFormData(prev => ({ ...prev, vehicleId: vehData[0].id }));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await maintenanceAPI.create({
        vehicleId: Number(formData.vehicleId),
        maintenanceType: formData.maintenanceType,
        description: formData.description,
        cost: Number(formData.cost),
        startDate: new Date(formData.startDate).toISOString(),
        nextServiceDate: formData.nextServiceDate ? new Date(formData.nextServiceDate).toISOString() : null,
        odometer: Number(formData.odometer),
        status: formData.status,
        technician: formData.technician
      });
      setShowModal(false);
      loadData();
    } catch (err) {
      alert('Error creating maintenance record: ' + err.message);
    }
  };

  const handleUpdateStatus = async (id, status) => {
    try {
      await maintenanceAPI.update(id, { 
        status,
        endDate: status === 'COMPLETED' ? new Date().toISOString() : null 
      });
      loadData();
    } catch (err) {
      alert('Error updating maintenance status: ' + err.message);
    }
  };

  return (
    <div className="space-y-8 fade-in">
      <PageHeader
        title="Fleet Maintenance & Servicing"
        subtitle="Person 1: Preventative schedules, repair bills, technician notes, and due alerts"
        badgeText="Person 1"
        badgeColor="bg-rose-200"
        action={
          <button onClick={() => setShowModal(true)} className="btn-primary">
            <Plus className="w-4 h-4 stroke-[2.5px]" /> Schedule Service
          </button>
        }
      />

      {error && <ErrorMsg msg={error} />}

      {/* Due Alert Banner */}
      {dueRecords.length > 0 && (
        <div className="card bg-amber-100 border-2 border-foreground shadow-pop p-4 flex items-start gap-3">
          <CandyIcon icon={AlertTriangle} color="bg-tertiary" size="sm" />
          <div className="flex-1">
            <h4 className="font-heading font-extrabold text-foreground text-sm">
              Vehicles Due for Maintenance (Next 7 Days)
            </h4>
            <div className="mt-2 flex flex-wrap gap-2">
              {dueRecords.map(item => (
                <span key={item.id} className="badge-yellow text-xs">
                  {item.vehicle?.registrationNumber} ({item.maintenanceType}) - Due {new Date(item.nextServiceDate).toLocaleDateString()}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {loading ? (
        <Spinner />
      ) : records.length === 0 ? (
        <EmptyState message="No maintenance records found." />
      ) : (
        <div className="card shadow-pop p-0 overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs font-heading font-extrabold text-slate-600 uppercase border-b-2 border-foreground">
              <tr>
                <th className="py-3 px-4">Vehicle</th>
                <th className="py-3 px-4">Service Type</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Cost</th>
                <th className="py-3 px-4">Serviced Date</th>
                <th className="py-3 px-4">Next Due</th>
                <th className="py-3 px-4">Technician</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 border-b-2 border-foreground">
              {records.map((r) => (
                <tr key={r.id} className="hover:bg-amber-50/50 transition">
                  <td className="py-3 px-4">
                    <span className="font-mono text-xs text-accent font-bold block">
                      {r.vehicle?.registrationNumber}
                    </span>
                    <span className="text-xs text-slate-500 font-medium">
                      {r.vehicle?.make} {r.vehicle?.model}
                    </span>
                  </td>
                  <td className="py-3 px-4 font-heading font-bold text-foreground text-xs">{r.maintenanceType}</td>
                  <td className="py-3 px-4 text-slate-600 text-xs max-w-xs truncate">{r.description}</td>
                  <td className="py-3 px-4 font-heading font-bold text-emerald-800">₹{r.cost.toLocaleString()}</td>
                  <td className="py-3 px-4 text-slate-600 text-xs font-medium">
                    {new Date(r.startDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 text-slate-500 text-xs font-medium">
                    {r.nextServiceDate ? new Date(r.nextServiceDate).toLocaleDateString() : '—'}
                  </td>
                  <td className="py-3 px-4 text-slate-700 text-xs">{r.technician || '—'}</td>
                  <td className="py-3 px-4"><StatusBadge value={r.status} /></td>
                  <td className="py-3 px-4 text-right">
                    {r.status !== 'COMPLETED' ? (
                      <button 
                        onClick={() => handleUpdateStatus(r.id, 'COMPLETED')}
                        className="px-3 py-1 bg-quaternary border-2 border-foreground rounded-full text-xs font-heading font-bold shadow-pop-xs hover:shadow-pop transition"
                      >
                        Mark Done
                      </button>
                    ) : (
                      <span className="text-xs font-bold text-slate-400">Completed</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Add Maintenance Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-foreground/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="card w-full max-w-md bg-white border-2 border-foreground shadow-pop-lg relative fade-in">
            <div className="flex justify-between items-center mb-5 pb-3 border-b-2 border-slate-100">
              <h3 className="text-lg font-heading font-extrabold text-foreground">Schedule Servicing</h3>
              <button onClick={() => setShowModal(false)} className="btn-icon">
                <X className="w-4 h-4" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Target Vehicle *</label>
                <select 
                  required 
                  className="select-field"
                  value={formData.vehicleId}
                  onChange={(e) => setFormData({ ...formData, vehicleId: e.target.value })}
                >
                  {vehicles.map(v => (
                    <option key={v.id} value={v.id}>
                      {v.registrationNumber} — {v.make} {v.model}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Type *</label>
                  <select 
                    className="select-field"
                    value={formData.maintenanceType}
                    onChange={(e) => setFormData({ ...formData, maintenanceType: e.target.value })}
                  >
                    <option value="ROUTINE">ROUTINE</option>
                    <option value="REPAIR">REPAIR</option>
                    <option value="INSPECTION">INSPECTION</option>
                    <option value="EMERGENCY">EMERGENCY</option>
                    <option value="UPGRADE">UPGRADE</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Cost (₹) *</label>
                  <input 
                    type="number" 
                    required 
                    className="input-field" 
                    value={formData.cost}
                    onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Description *</label>
                <textarea 
                  required 
                  className="input-field" 
                  rows={2}
                  placeholder="Engine oil replacement, brake pad tuning..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Start Date *</label>
                  <input 
                    type="date" 
                    required 
                    className="input-field" 
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1">Next Service Due</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={formData.nextServiceDate}
                    onChange={(e) => setFormData({ ...formData, nextServiceDate: e.target.value })}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 pt-3">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary">
                  Cancel
                </button>
                <button type="submit" className="btn-primary">
                  Save Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
