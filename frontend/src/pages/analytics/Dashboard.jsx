import { useEffect, useState } from 'react';
import { reportsAPI } from '../../api';
import { Spinner, ErrorMsg, PageHeader, CandyIcon } from '../../components/UI';
import {
  Truck, Users, Route, CalendarDays,
  AlertTriangle, Fuel, Clock, TrendingUp, Sparkles, Terminal
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

// Playful Geometric high-saturation chart palette
const POP_COLORS = ['#8B5CF6', '#F472B6', '#FBBF24', '#34D399', '#38BDF8', '#FB7185'];

function StatCard({ icon: Icon, label, value, sub, iconBg = 'bg-accent', shadowColor = 'shadow-pop' }) {
  return (
    <div className={`card ${shadowColor} hover:-translate-x-0.5 hover:-translate-y-1 hover:shadow-pop-md transition-all duration-300 relative group overflow-hidden`}>
      {/* Decorative tiny corner shape */}
      <div className="absolute top-2 right-2 w-2 h-2 rounded-full border border-foreground/30 bg-slate-100 group-hover:scale-150 transition-transform" />
      
      <div className="flex items-start gap-4">
        <CandyIcon icon={Icon} color={iconBg} size="md" />
        <div className="flex-1 min-w-0">
          <p className="text-3xl font-heading font-black text-foreground tracking-tight leading-none mb-1">
            {value}
          </p>
          <p className="text-xs font-heading font-bold text-slate-500 uppercase tracking-wider">
            {label}
          </p>
          {sub && (
            <span className="inline-block mt-2 text-[11px] font-bold text-foreground bg-muted px-2 py-0.5 rounded-full border border-foreground/30">
              {sub}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

// Custom tooltip with Playful Geometric pop shadow
function PopTooltip({ active, payload, label }) {
  if (active && payload && payload.length) {
    return (
      <div className="bg-white border-2 border-foreground rounded-xl p-3 shadow-pop text-xs font-heading font-bold">
        {label && <p className="text-slate-500 mb-1">{label}</p>}
        {payload.map((item, idx) => (
          <p key={idx} className="text-foreground" style={{ color: item.color || item.payload?.fill }}>
            {item.name}: <span className="font-extrabold text-foreground">{item.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
}

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    reportsAPI.fleet()
      .then(setData)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error) return <ErrorMsg msg={error} />;

  const vehicleStatusData = (data.vehiclesByStatus || []).map(v => ({
    name: v.status.replace(/_/g, ' '),
    value: v._count.id,
  }));
  const tripStatusData = (data.tripsByStatus || []).map(t => ({
    name: t.status.replace(/_/g, ' '),
    value: t._count.id,
  }));
  const driverStatusData = (data.driversByStatus || []).map(d => ({
    name: d.status.replace(/_/g, ' '),
    value: d._count.id,
  }));

  const availableVehicles = data.vehiclesByStatus?.find(v => v.status === 'AVAILABLE')?._count?.id ?? 0;
  const activeTrips = data.tripsByStatus?.find(t => t.status === 'IN_PROGRESS')?._count?.id ?? 0;
  const completedTrips = data.tripsByStatus?.find(t => t.status === 'COMPLETED')?._count?.id ?? 0;

  return (
    <div className="space-y-8 fade-in">
      {/* Playful Header */}
      <PageHeader
        title="Fleet Intelligence"
        subtitle="Real-time telemetry, operational metrics, and aggregate SQL KPIs"
        badgeText="Live Stream"
        badgeColor="bg-quaternary"
      />

      {/* 8 Playful Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <StatCard 
          icon={Truck} 
          label="Total Vehicles" 
          value={data.totalVehicles} 
          sub={`${availableVehicles} ready to roll`} 
          iconBg="bg-sky-200" 
        />
        <StatCard 
          icon={Users} 
          label="Total Drivers" 
          value={data.totalDrivers} 
          sub="certified pilots" 
          iconBg="bg-emerald-200" 
        />
        <StatCard 
          icon={CalendarDays} 
          label="Active Trips" 
          value={activeTrips} 
          sub={`${completedTrips} completed`} 
          iconBg="bg-violet-200" 
        />
        <StatCard 
          icon={AlertTriangle} 
          label="Active Hazards" 
          value={data.totalIncidents} 
          sub="traffic alerts" 
          iconBg="bg-amber-200" 
        />
        <StatCard 
          icon={Clock} 
          label="Average Delay" 
          value={`${(data.avgDelayMinutes || 0).toFixed(1)}m`} 
          sub="on completed trips" 
          iconBg="bg-rose-200" 
        />
        <StatCard 
          icon={Fuel} 
          label="Fuel Dispensed" 
          value={`₹${(data.totalFuelCost || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`} 
          sub="total fleet energy" 
          iconBg="bg-amber-300" 
        />
        <StatCard 
          icon={TrendingUp} 
          label="Trips Finished" 
          value={completedTrips} 
          sub="100% logged" 
          iconBg="bg-pink-200" 
        />
        <StatCard 
          icon={Route} 
          label="Availability Rate" 
          value={data.totalVehicles > 0 ? `${Math.round((availableVehicles/data.totalVehicles)*100)}%` : '0%'} 
          sub="standby capacity" 
          iconBg="bg-emerald-300" 
        />
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Vehicle Status Pie */}
        <div className="card hover:shadow-pop-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title text-base mb-0">Vehicle Fleet Status</h3>
            <span className="w-3 h-3 rounded-full bg-accent border border-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie 
                data={vehicleStatusData} 
                cx="50%" 
                cy="50%" 
                outerRadius={80} 
                dataKey="value" 
                stroke="#1E293B" 
                strokeWidth={2}
                label={({ name, value }) => `${name} (${value})`} 
                labelLine={false}
              >
                {vehicleStatusData.map((_, i) => (
                  <Cell key={i} fill={POP_COLORS[i % POP_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PopTooltip />} />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Trip Status Bar */}
        <div className="card hover:shadow-pop-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title text-base mb-0">Trip Operations</h3>
            <span className="w-3 h-3 rounded-full bg-secondary border border-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={tripStatusData} barSize={34}>
              <XAxis dataKey="name" tick={{ fill: '#1E293B', fontSize: 11, fontWeight: 700 }} />
              <YAxis tick={{ fill: '#64748B', fontSize: 11, fontWeight: 600 }} />
              <Tooltip content={<PopTooltip />} />
              <Bar dataKey="value" stroke="#1E293B" strokeWidth={2} radius={[8, 8, 0, 0]}>
                {tripStatusData.map((_, i) => (
                  <Cell key={i} fill={POP_COLORS[i % POP_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Driver Status Pie */}
        <div className="card hover:shadow-pop-md transition-all">
          <div className="flex items-center justify-between mb-4">
            <h3 className="section-title text-base mb-0">Driver Availability</h3>
            <span className="w-3 h-3 rounded-full bg-tertiary border border-foreground" />
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie 
                data={driverStatusData} 
                cx="50%" 
                cy="50%" 
                outerRadius={80} 
                dataKey="value"
                stroke="#1E293B" 
                strokeWidth={2}
              >
                {driverStatusData.map((_, i) => (
                  <Cell key={i} fill={POP_COLORS[i % POP_COLORS.length]} />
                ))}
              </Pie>
              <Tooltip content={<PopTooltip />} />
              <Legend formatter={(v) => <span className="text-xs font-heading font-bold text-foreground">{v}</span>} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* SQL Post-it Sticker Card */}
      <div className="card bg-amber-50 border-2 border-foreground shadow-pop relative overflow-hidden">
        {/* Fake decorative washi tape on top center */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-4 bg-amber-200/80 border-b border-foreground/20 rotate-1" />
        
        <div className="flex items-center gap-2 mb-2 text-foreground font-heading font-extrabold text-sm">
          <Terminal className="w-4 h-4 text-accent" />
          <span>Under the Hood: Real MySQL Queries Powering This Dashboard</span>
        </div>
        <p className="text-xs text-slate-700 font-mono leading-relaxed bg-white/70 p-3 rounded-xl border border-foreground/30">
          <span className="text-accent font-bold">SELECT</span> status, <span className="text-accent font-bold">COUNT</span>(*) <span className="text-accent font-bold">FROM</span> vehicles <span className="text-accent font-bold">GROUP BY</span> status;<br />
          <span className="text-accent font-bold">SELECT</span> status, <span className="text-accent font-bold">COUNT</span>(*) <span className="text-accent font-bold">FROM</span> trips <span className="text-accent font-bold">GROUP BY</span> status;<br />
          <span className="text-accent font-bold">SELECT AVG</span>(delay_minutes) <span className="text-accent font-bold">FROM</span> trips <span className="text-accent font-bold">WHERE</span> status = <span className="text-emerald-700">&apos;COMPLETED&apos;</span>;<br />
          <span className="text-accent font-bold">SELECT SUM</span>(fuel_cost) <span className="text-accent font-bold">FROM</span> fuel_logs;
        </p>
      </div>
    </div>
  );
}
