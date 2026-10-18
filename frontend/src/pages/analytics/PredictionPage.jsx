import { useEffect, useState } from 'react';
import { predictionsAPI, routesAPI, vehiclesAPI } from '../../api';
import { Spinner, ErrorMsg, PageHeader, CandyIcon } from '../../components/UI';
import { Brain, Zap, History, AlertCircle, Sparkles, SlidersHorizontal, CheckCircle2 } from 'lucide-react';

function delayLabel(min) {
  if (min < 5)  return { text: 'On Time',      cls: 'badge-green',  bg: 'bg-emerald-100' };
  if (min < 15) return { text: 'Minor Delay',  cls: 'badge-blue',   bg: 'bg-sky-100' };
  if (min < 30) return { text: 'Moderate',     cls: 'badge-yellow', bg: 'bg-amber-100' };
  return { text: 'Severe Delay', cls: 'badge-red',    bg: 'bg-rose-100' };
}

export default function PredictionPage() {
  const [routes,   setRoutes]   = useState([]);
  const [vehicles, setVehicles] = useState([]);
  const [form, setForm] = useState({
    routeId:     '',
    vehicleId:   '',
    scheduledAt: new Date(Date.now() + 3600000).toISOString().slice(0, 16),
  });
  const [result,  setResult]  = useState(null);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [histLoading, setHistLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    routesAPI.getAll().then(setRoutes).catch(console.error);
    vehiclesAPI.getAll().then(setVehicles).catch(console.error);
    predictionsAPI.history({ limit: 20 })
      .then(setHistory)
      .catch(console.error)
      .finally(() => setHistLoading(false));
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await predictionsAPI.predict(form);
      setResult(res);
      predictionsAPI.history({ limit: 20 }).then(setHistory).catch(console.error);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const label = result ? delayLabel(result.prediction?.predictedDelay || 0) : null;

  return (
    <div className="space-y-8 fade-in">
      <PageHeader
        title="AI Delay Predictor"
        subtitle="Random Forest inference engine predicting trip bottlenecks in real-time"
        badgeText="scikit-learn ML"
        badgeColor="bg-accent text-white"
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
        {/* Left: Input Form Card */}
        <div className="card shadow-pop hover:shadow-pop-md transition-all">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b-2 border-slate-100">
            <CandyIcon icon={Brain} color="bg-accent" size="md" />
            <div>
              <h3 className="text-lg font-heading font-extrabold text-foreground">
                Inference Parameters
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Route telemetry, departure time, and vehicle metadata
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1.5">
                Target Route *
              </label>
              <select
                required
                className="select-field"
                value={form.routeId}
                onChange={e => setForm(f => ({ ...f, routeId: e.target.value }))}
              >
                <option value="">Choose a transit corridor…</option>
                {routes.map(r => (
                  <option key={r.id} value={r.id}>
                    {r.name} ({r.distanceKm} km · {r.source} → {r.destination})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1.5">
                Assigned Vehicle (Optional)
              </label>
              <select
                className="select-field"
                value={form.vehicleId}
                onChange={e => setForm(f => ({ ...f, vehicleId: e.target.value }))}
              >
                <option value="">Any available vehicle</option>
                {vehicles.map(v => (
                  <option key={v.id} value={v.id}>
                    {v.registrationNo || v.registrationNumber} — {v.make} {v.model} ({v.vehicleType})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider block mb-1.5">
                Scheduled Departure Time *
              </label>
              <input
                type="datetime-local"
                required
                className="input-field"
                value={form.scheduledAt}
                onChange={e => setForm(f => ({ ...f, scheduledAt: e.target.value }))}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || !form.routeId} 
              className="btn-primary w-full py-3.5 text-base mt-2"
            >
              {loading ? (
                <>
                  <span className="w-5 h-5 border-3 border-white/40 border-t-white rounded-full spin" />
                  Calculating Features…
                </>
              ) : (
                <>
                  <Zap className="w-5 h-5 fill-white stroke-[2.5px]" /> Run Delay Prediction
                </>
              )}
            </button>
          </form>

          {error && (
            <div className="mt-4 p-4 bg-rose-50 border-2 border-foreground rounded-2xl shadow-pop-xs flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 mt-0.5 shrink-0" />
              <p className="text-sm font-bold text-rose-900">{error}</p>
            </div>
          )}
        </div>

        {/* Right: Prediction Output Oracle Card */}
        <div className="card shadow-pop-pink relative overflow-hidden bg-white">
          <div className="flex items-center justify-between mb-5 pb-4 border-b-2 border-slate-100">
            <div className="flex items-center gap-3">
              <CandyIcon icon={Sparkles} color="bg-secondary" size="md" />
              <div>
                <h3 className="text-lg font-heading font-extrabold text-foreground">
                  Prediction Studio
                </h3>
                <p className="text-xs text-slate-500 font-medium">Model Output & Explainability</p>
              </div>
            </div>
            {result && (
              <span className="text-xs font-heading font-extrabold px-3 py-1 bg-quaternary border-2 border-foreground rounded-full shadow-pop-xs">
                Inference Complete
              </span>
            )}
          </div>

          {!result ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-20 h-20 rounded-full bg-slate-100 border-2 border-dashed border-slate-300 flex items-center justify-center mb-4 text-slate-400">
                <Brain className="w-10 h-10 stroke-[1.5px]" />
              </div>
              <h4 className="font-heading font-bold text-base text-foreground mb-1">
                Awaiting Input Parameters
              </h4>
              <p className="text-xs text-slate-500 max-w-xs">
                Select a route and departure timestamp on the left to invoke the Python Random Forest model.
              </p>
            </div>
          ) : (
            <div className="space-y-6 fade-in">
              {/* Giant Delay Dial Banner */}
              <div className={`p-6 rounded-2xl border-2 border-foreground shadow-pop text-center ${label?.bg}`}>
                <span className="text-xs font-heading font-extrabold uppercase tracking-wider text-slate-600 block mb-1">
                  Expected Transit Delay
                </span>
                <div className="flex items-baseline justify-center gap-2">
                  <span className="text-6xl font-heading font-black text-foreground tracking-tight">
                    {(result.prediction?.predictedDelay || 0).toFixed(1)}
                  </span>
                  <span className="text-xl font-heading font-extrabold text-slate-600">
                    mins
                  </span>
                </div>
                
                <div className="mt-3 flex items-center justify-center gap-3">
                  <span className={label?.cls}>{label?.text}</span>
                  {result.prediction?.confidence != null && (
                    <span className="text-xs font-heading font-bold text-foreground bg-white px-3 py-1 rounded-full border-2 border-foreground shadow-pop-xs">
                      Confidence: {(result.prediction.confidence * 100).toFixed(0)}%
                    </span>
                  )}
                </div>
              </div>

              {/* Input Features Breakdown */}
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <SlidersHorizontal className="w-4 h-4 text-accent" />
                  <span className="text-xs font-heading font-extrabold text-foreground uppercase tracking-wider">
                    Feature Vector Applied
                  </span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
                  {result.features && Object.entries(result.features).map(([k, v]) => (
                    <div key={k} className="bg-slate-50 border-2 border-slate-200 rounded-xl p-2.5 shadow-xs">
                      <p className="text-[10px] font-heading font-extrabold text-slate-500 uppercase tracking-tight truncate">
                        {k.replace(/_/g, ' ')}
                      </p>
                      <p className="text-sm font-heading font-bold text-foreground mt-0.5">
                        {typeof v === 'number' ? Number(v).toFixed(1) : v}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Persistence Notice */}
              <div className="bg-muted p-3 rounded-xl border border-slate-300 text-xs text-slate-600 flex items-center gap-2 font-medium">
                <CheckCircle2 className="w-4 h-4 text-quaternary shrink-0" />
                <span>Saved into MySQL table <code>trip_delay_predictions</code> for audit verification.</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Prediction History Table */}
      <div className="card shadow-pop">
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-3">
            <CandyIcon icon={History} color="bg-tertiary" size="sm" />
            <h3 className="section-title text-lg mb-0">Historical Inferences</h3>
          </div>
          <span className="text-xs font-heading font-bold text-slate-500">
            Last {history.length} Inferences
          </span>
        </div>

        {histLoading ? (
          <Spinner />
        ) : history.length === 0 ? (
          <p className="text-slate-500 text-sm py-4">No prediction history logged yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-xs font-heading font-extrabold text-slate-600 uppercase border-b-2 border-foreground">
                <tr>
                  <th className="py-3 px-4">Route Corridor</th>
                  <th className="py-3 px-4">Departure Hour</th>
                  <th className="py-3 px-4">Active Bottlenecks</th>
                  <th className="py-3 px-4 text-center">Delay Prediction</th>
                  <th className="py-3 px-4 text-right">Inference Timestamp</th>
                </tr>
              </thead>
              <tbody className="divide-y border-b-2 border-foreground divide-slate-200">
                {history.map(p => {
                  const lbl = delayLabel(p.predictedDelay);
                  return (
                    <tr key={p.id} className="hover:bg-amber-50/50 transition">
                      <td className="py-3 px-4 font-heading font-bold text-foreground">
                        {p.route?.name || `Route #${p.routeId}`}
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-medium">
                        {p.departureHour}:00 hrs
                      </td>
                      <td className="py-3 px-4 text-slate-700 font-medium">
                        <span className="inline-block px-2 py-0.5 rounded-md bg-slate-100 border border-slate-300 text-xs">
                          {p.activeIncidents} incident(s)
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`${lbl.cls} font-mono`}>
                          +{p.predictedDelay.toFixed(1)}m
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right text-xs text-slate-500 font-medium">
                        {new Date(p.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Model Spec Card */}
      <div className="card bg-violet-50 border-2 border-foreground shadow-pop flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <h4 className="font-heading font-extrabold text-foreground text-sm flex items-center gap-2">
            <span>🧠</span> Random Forest Regressor Microservice Architecture
          </h4>
          <p className="text-xs text-slate-600 mt-1 max-w-2xl">
            Trained on distance, hour of day, day of week, active hazards, and rolling historical delays with 100 estimators. Integrated via Flask microservice on port 5001.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="px-3 py-1 rounded-full text-xs font-heading font-bold bg-white border-2 border-foreground shadow-pop-xs">
            MAE: 5.91m
          </span>
          <span className="px-3 py-1 rounded-full text-xs font-heading font-bold bg-white border-2 border-foreground shadow-pop-xs">
            R²: 0.864
          </span>
        </div>
      </div>
    </div>
  );
}
