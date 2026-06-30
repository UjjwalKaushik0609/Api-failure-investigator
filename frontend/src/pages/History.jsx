import { Search, ServerCrash } from "lucide-react";
import { useEffect, useState } from "react";
import api from "../api/client";
import AnalysisResult from "../components/AnalysisResult";

export default function History() {
  const [incidents, setIncidents] = useState([]);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    const handle = setTimeout(() => {
      api.get("/api/incidents", { params: { search: search || undefined } }).then(({ data }) => setIncidents(data));
    }, 250);
    return () => clearTimeout(handle);
  }, [search]);

  const openIncident = async (id) => {
    const { data } = await api.get(`/api/incidents/${id}`);
    setSelected({ incident_id: data.id, ...data.result });
  };

  return (
    <main className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[420px_minmax(0,1fr)]">
      <section className="glass-panel rounded-lg p-4">
        <div className="mb-4">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-mint">Incident Memory</p>
          <h1 className="mt-2 text-2xl font-semibold text-white">History</h1>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-white/10 bg-black/30 px-3 py-2">
          <Search className="h-4 w-4 text-mint" />
          <input className="w-full bg-transparent text-slate-100 outline-none placeholder:text-slate-500" placeholder="Search type, date, severity" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="mt-4 space-y-3">
          {incidents.map((incident) => (
            <button key={incident.id} onClick={() => openIncident(incident.id)} className="block w-full rounded-md border border-white/10 bg-white/[0.04] p-4 text-left transition hover:border-mint/50 hover:bg-mint/10">
              <div className="flex items-start gap-3">
                <span className="mt-1 flex h-9 w-9 items-center justify-center rounded-md bg-coral/15 text-coral">
                  <ServerCrash className="h-4 w-4" />
                </span>
                <span className="min-w-0">
                  <span className="block font-medium text-white">{incident.root_cause}</span>
                  <span className="mt-1 block text-sm text-slate-400">{incident.severity} | {incident.confidence_score}% | {new Date(incident.created_at).toLocaleString()}</span>
                </span>
              </div>
            </button>
          ))}
        </div>
      </section>
      <AnalysisResult result={selected} />
    </main>
  );
}
