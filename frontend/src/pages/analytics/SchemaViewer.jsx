import { useEffect, useState } from 'react';
import { schemaAPI } from '../../api';
import { Spinner, ErrorMsg, PageHeader, CandyIcon } from '../../components/UI';
import { Database, Link, Key, Info, Sparkles, Layers, ArrowRight } from 'lucide-react';

function TableCard({ table, selected, onSelect }) {
  const pks = table.columns.filter(c => c.pk);
  const fks = table.columns.filter(c => c.fk);
  const isSelected = selected?.name === table.name;

  return (
    <div
      onClick={() => onSelect(table)}
      className={`card cursor-pointer transition-all duration-200 p-4 relative ${
        isSelected
          ? 'bg-amber-100 border-2 border-foreground shadow-pop translate-x-1.5'
          : 'bg-white border-2 border-foreground/40 hover:border-foreground hover:shadow-pop-xs hover:-translate-y-0.5'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <h4 className="font-heading font-extrabold text-foreground text-sm tracking-tight flex items-center gap-1.5">
          <Database className="w-3.5 h-3.5 text-accent" />
          <span>{table.name}</span>
        </h4>
        <span className="text-[10px] font-heading font-extrabold px-2 py-0.5 rounded-full bg-white border border-foreground shadow-xs">
          {table.owner}
        </span>
      </div>
      <p className="text-xs text-slate-500 font-medium mb-2.5">
        {table.columns.length} columns · {table.indexes?.length || 0} indices
      </p>
      <div className="flex flex-wrap gap-1.5">
        {pks.map(c => (
          <span key={c.name} className="badge-yellow text-[10px] px-2 py-0.5">
            🔑 {c.name}
          </span>
        ))}
        {fks.map(c => (
          <span key={c.name} className="badge-blue text-[10px] px-2 py-0.5">
            🔗 {c.name}
          </span>
        ))}
      </div>
    </div>
  );
}

export default function SchemaViewer() {
  const [schema,   setSchema]   = useState(null);
  const [selected, setSelected] = useState(null);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState(null);

  useEffect(() => {
    schemaAPI.get()
      .then(d => { setSchema(d); setSelected(d.tables[0]); })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Spinner />;
  if (error)   return <ErrorMsg msg={error} />;

  const norm = schema.normalisation?.[selected?.name];

  return (
    <div className="space-y-8 fade-in">
      <PageHeader
        title="Relational Schema Inspector"
        subtitle="Complete DBMS table specifications, foreign keys, and BCNF normalization proofs"
        badgeText="BCNF Verified"
        badgeColor="bg-quaternary"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
        {/* Table List Column */}
        <div className="space-y-3">
          <div className="flex items-center justify-between px-1 mb-1">
            <span className="text-xs font-heading font-extrabold text-slate-600 uppercase tracking-wider flex items-center gap-1.5">
              <Layers className="w-3.5 h-3.5 text-accent" />
              <span>Registered Tables ({schema.tables.length})</span>
            </span>
          </div>
          {schema.tables.map(t => (
            <TableCard key={t.name} table={t} selected={selected} onSelect={setSelected} />
          ))}
        </div>

        {/* Selected Table Detail Column */}
        <div className="lg:col-span-2 space-y-6">
          {selected && (
            <>
              {/* Header Card with Normalisation Proof */}
              <div className="card shadow-pop">
                <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-slate-100">
                  <div className="flex items-center gap-3">
                    <CandyIcon icon={Database} color="bg-accent" size="sm" />
                    <div>
                      <h3 className="font-heading font-black text-xl text-foreground">
                        {selected.name}
                      </h3>
                      <p className="text-xs text-slate-500 font-medium">Subsystem Owner: {selected.owner}</p>
                    </div>
                  </div>
                  <span className="text-xs font-heading font-extrabold px-3 py-1 bg-tertiary border-2 border-foreground rounded-full shadow-pop-xs">
                    BCNF Form
                  </span>
                </div>

                {norm && (
                  <div className="p-3.5 bg-emerald-50 border-2 border-foreground rounded-2xl shadow-pop-xs flex items-start gap-2.5">
                    <Info className="w-4 h-4 text-emerald-700 mt-0.5 shrink-0" />
                    <p className="text-xs font-medium text-emerald-950 leading-relaxed">{norm}</p>
                  </div>
                )}
              </div>

              {/* Columns Table Card */}
              <div className="card shadow-pop">
                <div className="flex items-center justify-between mb-4">
                  <h4 className="font-heading font-extrabold text-foreground text-sm uppercase tracking-wider">
                    Attributes & Integrity Constraints ({selected.columns.length})
                  </h4>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-xs font-heading font-extrabold text-slate-600 uppercase border-b-2 border-foreground">
                      <tr>
                        <th className="py-2.5 px-3">Column Name</th>
                        <th className="py-2.5 px-3">Data Type</th>
                        <th className="py-2.5 px-3">Constraints & Role</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200 border-b-2 border-foreground">
                      {selected.columns.map(col => (
                        <tr key={col.name} className="hover:bg-amber-50/50 transition">
                          <td className="py-2.5 px-3 font-mono font-bold text-xs text-foreground flex items-center gap-2">
                            {col.pk && <Key className="w-3.5 h-3.5 text-amber-500 shrink-0" />}
                            {col.fk && <Link className="w-3.5 h-3.5 text-accent shrink-0" />}
                            <span>{col.name}</span>
                          </td>
                          <td className="py-2.5 px-3 font-mono text-xs text-slate-600">
                            {col.type}
                          </td>
                          <td className="py-2.5 px-3">
                            <div className="flex flex-wrap gap-1">
                              {col.pk     && <span className="badge-yellow text-[10px] px-2 py-0.5">PK</span>}
                              {col.unique && !col.pk && <span className="badge-blue text-[10px] px-2 py-0.5">UNIQUE</span>}
                              {col.notNull && <span className="badge-gray text-[10px] px-2 py-0.5">NOT NULL</span>}
                              {col.fk     && <span className="badge-purple text-[10px] px-2 py-0.5">FK→{col.fk}</span>}
                              {col.nullable && <span className="badge-gray text-[10px] px-2 py-0.5">NULLABLE</span>}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Indices */}
              {selected.indexes?.length > 0 && (
                <div className="card shadow-pop">
                  <h4 className="font-heading font-extrabold text-foreground text-sm uppercase tracking-wider mb-3">
                    B-Tree Performance Indices
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {selected.indexes.map(idx => (
                      <span key={idx} className="font-mono text-xs font-bold px-3 py-1 rounded-xl bg-slate-100 border-2 border-foreground shadow-pop-xs">
                        INDEX({idx})
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Foreign Key Relationships */}
          <div className="card shadow-pop">
            <h4 className="font-heading font-extrabold text-foreground text-sm uppercase tracking-wider mb-3">
              Relational Cardinalities & Foreign Keys ({schema.relationships?.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {schema.relationships?.map((rel, i) => (
                <div key={i} className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border-2 border-foreground/30 text-xs font-mono">
                  <span className="font-bold text-accent">{rel.from}</span>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-bold text-quaternary">{rel.to}</span>
                  <span className="badge-gray ml-auto text-[10px]">{rel.type}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
