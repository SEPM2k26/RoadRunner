import { useEffect, useState } from 'react';
import { reportsAPI } from '../../api';
import { Spinner, ErrorMsg, PageHeader, CandyIcon } from '../../components/UI';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Cell, CartesianGrid,
} from 'recharts';
import { BarChart3, RefreshCw, Terminal, Fuel, Users, Map, AlertTriangle, Wrench, CheckCircle } from 'lucide-react';

const POP_PALETTE = ['#8B5CF6', '#F472B6', '#FBBF24', '#34D399', '#38BDF8', '#FB7185', '#A78BFA'];

function PopTooltip({ active, payload, label, prefix = '', suffix = '' }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-foreground rounded-xl p-3 shadow-pop text-xs font-heading font-bold">
        {label && <p className="text-slate-500 mb-1">{label}</p>}
        {payload.map((item, idx) => (
          <p key={idx} className="text-foreground">
            {item.name}: <span className="font-extrabold text-accent">{prefix}{item.value}{suffix}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

const SQL_QUERIES = {
  fuel: `-- Report 1: Total fuel expenditure per vehicle
SELECT v.registration_number, v.make, v.model,
       SUM(f.fuel_cost)     AS total_cost,
       SUM(f.fuel_quantity) AS total_litres,
       COUNT(f.id)          AS fill_ups
FROM fuel_logs f
JOIN vehicles v ON f.vehicle_id = v.id
GROUP BY v.id
ORDER BY total_cost DESC;

-- Report 8: Vehicles with fuel cost above fleet average (Subquery)
SELECT v.registration_number, SUM(f.fuel_cost) AS total_cost
FROM fuel_logs f JOIN vehicles v ON f.vehicle_id = v.id
GROUP BY v.id
HAVING total_cost > (
  SELECT AVG(sub.cost) FROM (
    SELECT SUM(fuel_cost) AS cost FROM fuel_logs GROUP BY vehicle_id
  ) sub
);`,

  trips: `-- Report 2: Driver trips completed & punctuality
SELECT d.name, COUNT(t.id) AS trips_completed, AVG(t.delay_minutes) AS avg_delay
FROM trips t JOIN drivers d ON t.driver_id = d.id
GROUP BY d.id
ORDER BY trips_completed DESC;

-- Report 4: Average delay per route
SELECT r.name, r.source, r.destination, AVG(t.delay_minutes) AS avg_delay
FROM trips t JOIN routes r ON t.route_id = r.id
WHERE t.status = 'COMPLETED'
GROUP BY r.id
ORDER BY avg_delay DESC;

-- Report 7: Severe delay corridors (HAVING filter)
SELECT r.name, AVG(t.delay_minutes) AS avg_delay
FROM trips t JOIN routes r ON t.route_id = r.id
GROUP BY r.id
HAVING avg_delay > 10;`,

  incidents: `-- Report 3: High-frequency incident corridors
SELECT r.name, COUNT(i.id) AS incident_count, AVG(i.estimated_delay) AS avg_delay
FROM traffic_incidents i JOIN routes r ON i.route_id = r.id
GROUP BY r.id
ORDER BY incident_count DESC;

-- Report 5: Maintenance due in next 30 days
SELECT v.registration_number, m.maintenance_type, m.next_service_date
FROM maintenance_records m JOIN vehicles v ON m.vehicle_id = v.id
WHERE m.next_service_date <= DATE_ADD(NOW(), INTERVAL 30 DAY)
  AND m.status != 'COMPLETED'
ORDER BY m.next_service_date ASC;`,
};

function SqlBlock({ sql }) {
  const [show, setShow] = useState(false);
  return (
    <div className="mt-4 pt-3 border-t-2 border-slate-100">
      <button 
        onClick={() => setShow(s => !s)} 
        className="text-xs font-heading font-extrabold text-foreground hover:text-accent flex items-center gap-1.5 transition"
      >
        <Terminal className="w-3.5 h-3.5 text-accent" />
        <span>{show ? '▲ Hide SQL Statement' : '▼ Inspect Underlying MySQL Logic'}</span>
      </button>
      {show && (
        <pre className="mt-2 bg-slate-900 border-2 border-foreground rounded-xl p-3.5 text-xs text-quaternary font-mono overflow-auto shadow-pop-xs leading-relaxed">
          {sql}
        </pre>
      )}
    </div>
  );
}

export default function Reports() {
  const [fuel, setFuel]         = useState(null);
  const [trips, setTrips]       = useState(null);
  const [incidents, setIncidents] = useState(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);
  const [threshold, setThreshold] = useState(10);

  const load = () => {
    setLoading(true);
    Promise.all([
      reportsAPI.fuel(), 
      reportsAPI.trips({ delayThreshold: threshold }), 
      reportsAPI.incidents()
    ])
      .then(([f, t, i]) => { setFuel(f); setTrips(t); setIncidents(i); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [threshold]);

  if (loading) return <Spinner />;
  if (error)   return <ErrorMsg msg={error} />;

  const fuelChartData = (fuel?.fuelPerVehicle || []).slice(0, 8).map(f => ({
    name: f.vehicle?.registrationNo || f.vehicle?.registrationNumber || `V${f.vehicleId}`,
    cost: parseFloat(Number(f._sum?.cost ?? f._sum?.fuelCost ?? 0).toFixed(0)),
    litres: parseFloat(Number(f._sum?.quantityLitres ?? f._sum?.fuelQuantity ?? 0).toFixed(1)),
  }));

  const delayChartData = (trips?.delayPerRoute || []).slice(0, 8).map(d => ({
    name: d.route?.name || `Route ${d.routeId}`,
    delay: parseFloat(Number(d._avg?.delayMinutes ?? 0).toFixed(1)),
    trips: d._count?.id || 0,
  }));

  const incidentChartData = (incidents?.incidentsPerRoute || []).slice(0, 8).map(i => ({
    name: i.route?.name || `Route ${i.routeId}`,
    count: i._count?.id || 0,
    avgDelay: parseFloat(Number(i._avg?.estimatedDelay ?? 0).toFixed(1)),
  }));

  return (
    <div className="space-y-8 fade-in">
      <PageHeader
        title="SQL Analytical Reports"
        subtitle="Multi-table joins, correlated subqueries, aggregations & HAVING filters"
        badgeText="8 Reports"
        badgeColor="bg-tertiary"
        action={
          <button onClick={load} className="btn-secondary">
            <RefreshCw className="w-4 h-4 stroke-[2.5px]" /> Refresh Data
          </button>
        }
      />

      {/* Report 1: Fuel per Vehicle */}
      <div className="card shadow-pop">
        <div className="flex items-center gap-3 mb-4">
          <CandyIcon icon={Fuel} color="bg-amber-200" size="sm" />
          <div>
            <h3 className="section-title text-base mb-0">Report 1 — Fuel Expenditure per Fleet Vehicle</h3>
            <p className="text-xs text-slate-500 font-medium">Group by vehicle with aggregate cost and fill-up frequency</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={fuelChartData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#1E293B', fontSize: 11, fontWeight: 700 }} />
            <YAxis tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }} />
            <Tooltip content={<PopTooltip prefix="₹" />} />
            <Bar dataKey="cost" name="Total Fuel Cost" stroke="#1E293B" strokeWidth={2} radius={[6, 6, 0, 0]}>
              {fuelChartData.map((_, i) => (
                <Cell key={i} fill={POP_PALETTE[i % POP_PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {fuel?.aboveAverage?.length > 0 && (
          <div className="mt-5 p-4 bg-amber-50 border-2 border-foreground rounded-2xl shadow-pop-xs">
            <p className="text-xs font-heading font-extrabold text-foreground mb-2 flex items-center gap-1.5">
              <span>⚠️</span> Report 8 — Vehicles Exceeding Fleet Average (₹{Number(fuel.fleetAvg ?? 0).toFixed(0)})
            </p>
            <div className="flex flex-wrap gap-2">
              {fuel.aboveAverage.map(f => (
                <span key={f.vehicleId} className="badge-yellow">
                  {f.vehicle?.registrationNo || f.vehicle?.registrationNumber}: ₹{Number(f._sum?.cost ?? f._sum?.fuelCost ?? 0).toFixed(0)}
                </span>
              ))}
            </div>
          </div>
        )}

        <SqlBlock sql={SQL_QUERIES.fuel} />
      </div>

      {/* Report 2 & 6: Drivers & Completion */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Report 2: Trips per Driver Table */}
        <div className="card shadow-pop">
          <div className="flex items-center gap-3 mb-4">
            <CandyIcon icon={Users} color="bg-emerald-200" size="sm" />
            <div>
              <h3 className="section-title text-base mb-0">Report 2 — Trips & Delays per Driver</h3>
              <p className="text-xs text-slate-500 font-medium">Aggregated journey performance by operator</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-heading font-extrabold text-slate-600 uppercase border-b-2 border-foreground">
                <tr>
                  <th className="py-2.5 px-3">Pilot Name</th>
                  <th className="py-2.5 px-3 text-right">Trips Logged</th>
                  <th className="py-2.5 px-3 text-right">Avg Delay</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 border-b-2 border-foreground">
                {(trips?.tripsPerDriver || []).map((t, i) => (
                  <tr key={i} className="hover:bg-amber-50/50 transition">
                    <td className="py-2.5 px-3 font-heading font-bold text-foreground">
                      {t.driver?.name || `Driver #${t.driverId}`}
                    </td>
                    <td className="py-2.5 px-3 text-right font-extrabold text-foreground">
                      {t._count?.id}
                    </td>
                    <td className="py-2.5 px-3 text-right font-mono text-xs">
                      {Number(t._avg?.delayMinutes ?? 0).toFixed(1)}m
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Report 6: Trip Completion Breakdown */}
        <div className="card shadow-pop flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <CandyIcon icon={CheckCircle} color="bg-quaternary" size="sm" />
              <div>
                <h3 className="section-title text-base mb-0">Report 6 — Overall Trip Status Breakdown</h3>
                <p className="text-xs text-slate-500 font-medium">Operational completion counts</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3.5 mt-4">
              {(trips?.completionStats || []).map((s, idx) => {
                const colors = ['bg-emerald-100', 'bg-sky-100', 'bg-amber-100', 'bg-rose-100', 'bg-purple-100'];
                return (
                  <div key={s.status} className={`p-4 rounded-2xl border-2 border-foreground shadow-pop-xs text-center ${colors[idx % colors.length]}`}>
                    <p className="text-3xl font-heading font-black text-foreground">
                      {s._count?.id}
                    </p>
                    <p className="text-xs font-heading font-extrabold text-slate-600 uppercase tracking-wider mt-1">
                      {s.status.replace(/_/g, ' ')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          <SqlBlock sql="SELECT status, COUNT(*) AS total_trips FROM trips GROUP BY status;" />
        </div>
      </div>

      {/* Reports 4 & 7: Delay per Route with Interactive HAVING filter */}
      <div className="card shadow-pop">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div className="flex items-center gap-3">
            <CandyIcon icon={Map} color="bg-violet-200" size="sm" />
            <div>
              <h3 className="section-title text-base mb-0">Reports 4 & 7 — Delay per Route Corridor</h3>
              <p className="text-xs text-slate-500 font-medium">Interactive HAVING clause threshold evaluation</p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border-2 border-foreground shadow-pop-xs">
            <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider">
              HAVING Threshold:
            </label>
            <input
              type="number"
              value={threshold}
              min={0}
              max={120}
              onChange={e => setThreshold(Number(e.target.value))}
              className="w-16 text-center text-sm font-bold bg-white border-2 border-foreground rounded-lg py-1 shadow-pop-xs"
            />
            <span className="text-xs font-bold text-slate-500">mins</span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={230}>
          <BarChart data={delayChartData} barSize={32}>
            <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" vertical={false} />
            <XAxis dataKey="name" tick={{ fill: '#1E293B', fontSize: 11, fontWeight: 700 }} />
            <YAxis tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }} />
            <Tooltip content={<PopTooltip suffix=" min delay" />} />
            <Bar dataKey="delay" name="Average Delay" stroke="#1E293B" strokeWidth={2} radius={[6, 6, 0, 0]}>
              {delayChartData.map((_, i) => (
                <Cell key={i} fill={POP_PALETTE[(i + 2) % POP_PALETTE.length]} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>

        {trips?.aboveThreshold?.length > 0 && (
          <div className="mt-4 p-4 bg-rose-50 border-2 border-foreground rounded-2xl shadow-pop-xs">
            <p className="text-xs font-heading font-extrabold text-rose-900 mb-2 flex items-center gap-1.5">
              <span>🚨</span> Report 7 — Severe Delay Corridors (Exceeding {threshold} mins):
            </p>
            <div className="flex flex-wrap gap-2">
              {trips.aboveThreshold.map((r, i) => (
                <span key={i} className="badge-red">
                  {r.route?.name}: +{Number(r._avg?.delayMinutes ?? 0).toFixed(1)}m delay
                </span>
              ))}
            </div>
          </div>
        )}

        <SqlBlock sql={SQL_QUERIES.trips} />
      </div>

      {/* Report 3 & 5: Incidents and Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Report 3: Incidents Chart */}
        <div className="card shadow-pop">
          <div className="flex items-center gap-3 mb-4">
            <CandyIcon icon={AlertTriangle} color="bg-rose-200" size="sm" />
            <div>
              <h3 className="section-title text-base mb-0">Report 3 — Incident-Dense Routes</h3>
              <p className="text-xs text-slate-500 font-medium">Historical hazard counts along corridors</p>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={incidentChartData} barSize={28}>
              <CartesianGrid strokeDasharray="3 3" stroke="#CBD5E1" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: '#1E293B', fontSize: 10, fontWeight: 700 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }} />
              <Tooltip content={<PopTooltip suffix=" incidents" />} />
              <Bar dataKey="count" name="Incidents" fill="#F472B6" stroke="#1E293B" strokeWidth={2} radius={[6, 6, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
          <SqlBlock sql={SQL_QUERIES.incidents} />
        </div>

        {/* Report 5: Maintenance Due */}
        <div className="card shadow-pop flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <CandyIcon icon={Wrench} color="bg-sky-200" size="sm" />
              <div>
                <h3 className="section-title text-base mb-0">Report 5 — Preventive Maintenance Due</h3>
                <p className="text-xs text-slate-500 font-medium">Next scheduled servicing cutoff (30 days)</p>
              </div>
            </div>

            {incidents?.maintenanceDue?.length === 0 ? (
              <p className="text-slate-500 text-sm py-4">No vehicles requiring immediate service.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead className="bg-slate-50 text-xs font-heading font-extrabold text-slate-600 uppercase border-b-2 border-foreground">
                    <tr>
                      <th className="py-2.5 px-3">Reg #</th>
                      <th className="py-2.5 px-3">Service Type</th>
                      <th className="py-2.5 px-3">Due Date</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 border-b-2 border-foreground">
                    {(incidents?.maintenanceDue || []).map(m => (
                      <tr key={m.id} className="hover:bg-amber-50/50 transition">
                        <td className="py-2.5 px-3 font-mono font-bold text-accent text-xs">
                          {m.vehicle?.registrationNo || m.vehicle?.registrationNumber}
                        </td>
                        <td className="py-2.5 px-3 text-xs font-bold text-foreground">
                          {m.maintenanceType}
                        </td>
                        <td className="py-2.5 px-3 text-xs text-slate-600">
                          {m.nextServiceDate ? new Date(m.nextServiceDate).toLocaleDateString() : '—'}
                        </td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={m.status === 'IN_PROGRESS' ? 'badge-blue' : 'badge-yellow'}>
                            {m.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
