import { Bot, FileWarning, Play, Radar, Sparkles, X } from "lucide-react";
import { useState } from "react";

const progress = ["Parsing logs", "Root-cause trace", "Fix synthesis", "Security scan", "Report writer"];
const sampleLog = `2026-06-29T10:15:21Z service=auth-service ERROR TokenExpiredError: jwt expired
GET /api/incidents HTTP/1.1 401 Unauthorized
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9
component=api-gateway message="All authenticated API calls are failing"`;

export default function LogInput({ onSubmit, loading, error }) {
  const [logs, setLogs] = useState("");
  const [sampleLoaded, setSampleLoaded] = useState(false);
  const [format, setFormat] = useState("auto");

  const submit = (event) => {
    event.preventDefault();
    onSubmit({ logs, format });
  };

  return (
    <section className="glass-panel rounded-lg p-5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-mint">
            <Radar className="h-4 w-4" /> Live Triage
          </div>
          <h1 className="mt-3 text-2xl font-semibold text-white">Investigate Failure</h1>
          <p className="mt-2 text-sm text-slate-400">Paste API logs, stack traces, HTTP responses, Docker, or Kubernetes output.</p>
        </div>
        <select className="rounded-md border border-white/10 bg-slate-900 px-3 py-2 text-sm text-slate-200 outline-none focus:border-mint" value={format} onChange={(e) => setFormat(e.target.value)}>
          <option value="auto">Auto-detect</option>
          <option value="json">JSON</option>
          <option value="stack_trace">Stack trace</option>
          <option value="http">HTTP</option>
          <option value="kubernetes">Kubernetes</option>
          <option value="plain_text">Plain text</option>
        </select>
      </div>
      <form onSubmit={submit} className="mt-4">
        <div className="mb-3 flex flex-wrap gap-2">
          <button type="button" onClick={() => { setLogs(sampleLog); setSampleLoaded(true); }} className="flex items-center gap-2 rounded-md border border-mint/30 bg-mint/10 px-3 py-2 text-sm font-medium text-mint hover:bg-mint/15">
            <Sparkles className="h-4 w-4" /> Load JWT sample
          </button>
          <button type="button" onClick={() => { setLogs(""); setSampleLoaded(false); }} className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-medium text-slate-300 hover:bg-white/[0.07]">
            <X className="h-4 w-4" /> Clear
          </button>
          <div className="flex items-center gap-2 rounded-md border border-white/10 px-3 py-2 text-sm text-slate-400">
            <FileWarning className="h-4 w-4 text-coral" /> {logs.length.toLocaleString()} chars
          </div>
        </div>
        <textarea
          className="min-h-[520px] w-full resize-y rounded-md border border-white/10 bg-black/45 p-4 font-mono text-sm leading-6 text-emerald-100 outline-none focus:border-mint"
          value={logs}
          onFocus={(event) => {
            if (sampleLoaded && logs === sampleLog) {
              event.target.select();
            }
          }}
          onChange={(e) => {
            setLogs(e.target.value);
            setSampleLoaded(false);
          }}
          placeholder="2026-06-29T10:15:21Z service=auth-service ERROR TokenExpiredError: jwt expired..."
          required
        />
        {error && <div className="mt-3 rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</div>}
        {loading && (
          <div className="mt-4 grid gap-2 sm:grid-cols-5">
            {progress.map((step, index) => (
              <div key={step} className="rounded-md border border-mint/20 bg-mint/10 px-3 py-3 text-xs text-slate-200">
                <span className="mb-2 block h-1 rounded-full bg-mint/30">
                  <span className="block h-1 rounded-full bg-mint" style={{ width: `${Math.min(100, 35 + index * 14)}%` }} />
                </span>
                {step}
              </div>
            ))}
          </div>
        )}
        <button disabled={loading || logs.length < 10} className="mt-4 flex items-center justify-center gap-2 rounded-md bg-mint px-5 py-3 font-semibold text-slate-950 shadow-lg shadow-mint/20 hover:bg-emerald-300 disabled:opacity-60">
          {loading ? <span className="spinner" /> : <Play className="h-4 w-4" />} Run Agent Investigation
        </button>
      </form>
      <div className="mt-5 grid gap-3 sm:grid-cols-3">
        {["Parser", "SRE Reasoner", "Fix Writer"].map((name) => (
          <div key={name} className="flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-slate-300">
            <Bot className="h-4 w-4 text-mint" /> {name}
          </div>
        ))}
      </div>
    </section>
  );
}
