  if (!response.ok) throw new Error(body.error || `Request failed (${response.status})`);
  return body;
}
const valueAt = (row, key) => key.split(".").reduce((value, part) => value?.[part], row);
const display = (value) => value == null || value === "" ? "—" : String(value).includes("T") ? String(value).slice(0, 10) : String(value);
const currency = (value) => new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 2 }).format(Number(value || 0));

function ModulePage({ title, config, vehicles, reloadSignal, onChanged }) {
  const [rows, setRows] = useState([]); const [search, setSearch] = useState(""); const [filter, setFilter] = useState(""); const [dueOnly, setDueOnly] = useState(false);
  const [summary, setSummary] = useState([]); const [form, setForm] = useState({}); const [editing, setEditing] = useState(null); const [message, setMessage] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);
  const load = useCallback(async () => {
    const query = new URLSearchParams();
    if (search && ["vehicles", "drivers"].includes(config.path)) query.set("search", search);
    if (filter && ["vehicles", "drivers"].includes(config.path)) query.set("status", filter);
    if (filter && ["fuel", "maintenance"].includes(config.path)) query.set("vehicleId", filter);
    if (dueOnly && config.path === "maintenance") query.set("due", "true");
    try {
      const [data, fuelTotals] = await Promise.all([
        request(config.path + (query.size ? `?${query}` : "")),
        config.path === "fuel" ? request("fuel/summary") : Promise.resolve([])
      ]);
      setRows(data); setSummary(fuelTotals); setError("");
    } catch (e) { setError(e.message); }
  }, [config.path, search, filter, dueOnly]);
  useEffect(() => { load(); }, [load, reloadSignal]);
  const reset = () => { setForm({}); setEditing(null); };
  const submit = async (event) => {
    event.preventDefault(); setBusy(true); setError(""); setMessage("");
    const data = Object.fromEntries(Object.entries(form).filter(([, value]) => value !== "" && value !== undefined));
    try {
      if (editing) await request(`${config.path}/${editing}`, { method: "PUT", body: JSON.stringify(data) });
      else await request(config.path, { method: "POST", body: JSON.stringify(data) });
      setMessage(editing ? "Record updated." : "Record added."); reset(); await load(); onChanged();
    } catch (e) { setError(e.message); } finally { setBusy(false); }
  };
  const edit = (row) => {
    const next = {};
    for (const field of config.fields) {
      const v = valueAt(row, field[0]);
      next[field[0]] = field[2] === "date" && v ? String(v).slice(0, 10) : field[2] === "vehicle" ? String(row.vehicleId) : v == null ? "" : String(v);
    }
    setForm(next); setEditing(row.id); window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const remove = async (row) => {
    const action = ["vehicles", "drivers"].includes(config.path) ? "deactivate" : config.path === "maintenance" ? "cancel" : "delete";
    if (!window.confirm(`${action[0].toUpperCase()}${action.slice(1)} this ${title.toLowerCase()} record?`)) return;
    try { await request(`${config.path}/${row.id}`, { method: "DELETE" }); setMessage(`Record ${action === "cancel" ? "cancelled" : action === "deactivate" ? "deactivated" : action === "delete" ? "deleted" : "updated"}.`); await load(); onChanged(); }
    catch (e) { setError(e.message); }
  };
  const filterLabel = config.path === "vehicles" || config.path === "drivers" ? "All statuses" : "All vehicles";
  return <section className="module">
    <div className="module-heading"><div><p className="eyebrow">FLEET OPERATIONS</p><h2>{title}</h2><p>Manage {title.toLowerCase()} records connected to the RoadRunner database.</p></div><div className="count"><strong>{rows.length}</strong><span>{dueOnly ? "due records" : "records"}</span></div></div>
    <form className="form-card" onSubmit={submit}><div className="form-top"><h3>{editing ? `Edit ${config.singular}` : `Add ${config.singular}`}</h3>{editing && <button type="button" className="text-button" onClick={reset}>Cancel edit</button>}</div>
      <div className="form-grid">{config.fields.map(([key, label, type, required, options]) => <label key={key}>{label}{type === "select" ? <select required={required} value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })}><option value="">Choose…</option>{options.map((option) => <option key={option}>{option}</option>)}</select> : type === "vehicle" ? <select required={required} value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })}><option value="">Choose vehicle…</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.registrationNo} — {v.make} {v.model} ({v.status})</option>)}</select> : <input required={required} type={type} min={type === "number" ? "0" : undefined} step={type === "number" ? "any" : undefined} value={form[key] || ""} onChange={(e) => setForm({ ...form, [key]: e.target.value })} />}</label>)}</div>
      <div className="form-actions"><button className="primary" disabled={busy}>{busy ? "Saving…" : editing ? "Save changes" : "Add record"}</button></div>
    </form>
    {(error || message) && <div className={error ? "notice error" : "notice success"}>{error || message}</div>}
    {config.path === "fuel" && <div className="table-card summary-card"><div className="table-heading"><h3>Fuel expenditure by vehicle</h3></div><div className="table-scroll"><table><thead><tr><th>Vehicle</th><th>Refuels</th><th>Total litres</th><th>Total spend</th></tr></thead><tbody>{summary.map((item) => <tr key={item.vehicle.id}><td>{item.vehicle.registrationNo} — {item.vehicle.make} {item.vehicle.model}</td><td>{item.refuelCount}</td><td>{display(item.totalLitres)}</td><td>{currency(item.totalCost)}</td></tr>)}{!summary.length && <tr><td className="empty" colSpan="4">No fuel data to summarize yet.</td></tr>}</tbody></table></div></div>}
    <div className="table-card"><div className="table-heading"><h3>{title} records</h3><div className="table-filters">{["vehicles", "drivers"].includes(config.path) && <input className="search" placeholder="Search records…" value={search} onChange={(e) => setSearch(e.target.value)} />}{(config.path === "vehicles" || config.path === "drivers") && <select className="search" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">{filterLabel}</option>{statusOptions[config.path].map((item) => <option key={item}>{item}</option>)}</select>}{["fuel", "maintenance"].includes(config.path) && <select className="search" value={filter} onChange={(e) => setFilter(e.target.value)}><option value="">{filterLabel}</option>{vehicles.map((v) => <option key={v.id} value={v.id}>{v.registrationNo}</option>)}</select>}{config.path === "maintenance" && <label className="due-filter"><input type="checkbox" checked={dueOnly} onChange={(e) => setDueOnly(e.target.checked)} /> Due only</label>}</div></div>
      <div className="table-scroll"><table><thead><tr>{config.columns.map(([, label]) => <th key={label}>{label}</th>)}<th>Actions</th></tr></thead><tbody>{rows.map((row) => <tr key={row.id}>{config.columns.map(([key]) => <td key={key}>{display(valueAt(row, key))}</td>)}<td><div className="row-actions"><button className="text-button" onClick={() => edit(row)}>Edit</button><button className="text-button danger-text" onClick={() => remove(row)}>{["vehicles", "drivers"].includes(config.path) ? "Deactivate" : config.path === "maintenance" ? "Cancel" : "Delete"}</button></div></td></tr>)}{!rows.length && <tr><td className="empty" colSpan={config.columns.length + 1}>No records found. Add your first record above.</td></tr>}</tbody></table></div>
    </div>
  </section>;
}


function FleetPage({ page: initialPage = "Vehicles" }) {
  const [page, setPage] = useState(initialPage); const [vehicles, setVehicles] = useState([]); const [availableVehicleCount, setAvailableVehicleCount] = useState("—"); const [driverCount, setDriverCount] = useState("—"); const [reloadSignal, setReloadSignal] = useState(0); const [apiOnline, setApiOnline] = useState(null);
  const refreshFleetMetrics = useCallback(async () => {
    try {
      const [vehicleRows, driverRows, availableVehicles] = await Promise.all([request("vehicles"), request("drivers?status=AVAILABLE"), request("vehicles?status=AVAILABLE")]);
      setVehicles(vehicleRows); setAvailableVehicleCount(availableVehicles.length); setDriverCount(driverRows.length);
    } catch { setVehicles([]); setAvailableVehicleCount("—"); setDriverCount("—"); }
  }, []);
  useEffect(() => { request("health").then(() => setApiOnline(true)).catch(() => setApiOnline(false)); refreshFleetMetrics(); }, [refreshFleetMetrics]);
  const current = pages[page];
  return <div className="app-shell"><aside className="sidebar"><a className="brand" href="#"><span className="brand-mark">R</span><span>RoadRunner<small>FLEET MANAGEMENT</small></span></a><p className="nav-label">YOUR WORKSPACE</p><nav>{Object.keys(pages).map((name, index) => <button key={name} className={page === name ? "nav-item active" : "nav-item"} onClick={() => setPage(name)}><span className="nav-icon">{["▦", "♙", "⛽", "⚙"][index]}</span>{name}<span className="nav-arrow">›</span></button>)}</nav><div className="sidebar-foot"><div className="avatar">P1</div><div><strong>Fleet team</strong><small>Person 1 workspace</small></div></div></aside>
    <main className="main"><header className="topbar"><div><p className="breadcrumb">Workspace <span>/</span> Fleet operations</p><h1>Fleet &amp; Driver Management</h1></div><div className="connection"><span className={apiOnline ? "dot online" : apiOnline === false ? "dot offline" : "dot"}></span>{apiOnline ? "API connected" : apiOnline === false ? "API offline" : "Connecting…"}</div></header>
      <div className="content"><div className="intro"><div><span className="pill">PERSON 1 MODULE</span><h2>Keep the fleet moving.</h2><p>Manage vehicles, drivers, fuel use, and maintenance from one place.</p></div><button className="refresh" onClick={() => { setReloadSignal((x) => x + 1); refreshFleetMetrics(); }}>↻ <span>Refresh data</span></button></div>
        <div className="stat-grid"><div className="stat-card"><span>Available vehicles</span><strong>{availableVehicleCount}</strong><small>Ready for assignment</small></div><div className="stat-card"><span>Available drivers</span><strong>{driverCount}</strong><small>View driver records</small></div><div className="stat-card"><span>Fuel &amp; service</span><strong>Live</strong><small>Tracked per vehicle</small></div></div>
        <ModulePage key={page} title={page} config={current} vehicles={vehicles} reloadSignal={reloadSignal} onChanged={refreshFleetMetrics} />
        <footer>RoadRunner · Fleet and driver management · Data is served by the project API</footer>
      </div>
    </main></div>;

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />

          {/* Person 1 - Fleet and Driver Management */}
          <Route path="vehicles" element={<FleetPage page="Vehicles" />} />
          <Route path="drivers" element={<FleetPage page="Drivers" />} />
          <Route path="fuel" element={<FleetPage page="Fuel" />} />
          <Route path="maintenance" element={<FleetPage page="Maintenance" />} />

          {/* Person 2 - Routes, Trips and Incidents */}
          <Route path="routes" element={<RoutesPage />} />
          <Route path="trips" element={<TripsPage />} />
          <Route path="incidents" element={<IncidentsPage />} />

          {/* Person 3 - Analytics, Reports and AI/ML */}
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="reports" element={<Reports />} />
          <Route path="predict" element={<PredictionPage />} />
          <Route path="schema" element={<SchemaViewer />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
