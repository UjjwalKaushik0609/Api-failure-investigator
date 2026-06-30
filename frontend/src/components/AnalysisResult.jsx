import { Bot, CheckCircle2, Download, FileText, Gauge, Lightbulb, ShieldAlert, Sparkles, TerminalSquare } from "lucide-react";
import api from "../api/client";
import CodePatch from "./CodePatch";
import IncidentReport from "./IncidentReport";

function severityClass(severity) {
  return {
    CRITICAL: "bg-red-500/15 text-red-200 ring-red-400/30",
    HIGH: "bg-orange-500/15 text-orange-200 ring-orange-400/30",
    MEDIUM: "bg-amber-500/15 text-amber-200 ring-amber-400/30",
    LOW: "bg-emerald-500/15 text-emerald-200 ring-emerald-400/30",
  }[severity] || "bg-slate-500/15 text-slate-200 ring-slate-400/30";
}

function displayCause(cause) {
  return {
    "JWT Expired": "JWT Token Expired",
    "DB Connection Error": "PostgreSQL Connection Failure",
  }[cause] || cause || "Awaiting Analysis";
}

export default function AnalysisResult({ result, loading }) {
  if (loading) {
    return (
      <section className="glass-panel rounded-lg p-6">
        <div className="flex items-center gap-3">
          <span className="pulse-dot h-3 w-3 rounded-full bg-mint" />
          <div>
            <h2 className="text-xl font-semibold text-white">Agents are investigating</h2>
            <p className="mt-1 text-sm text-slate-400">Parser, SRE reasoner, fix writer, security scanner, and report writer are running.</p>
          </div>
        </div>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {["Parsing evidence", "Classifying root cause", "Generating code patch", "Writing incident report"].map((step, index) => (
            <div key={step} className="rounded-md border border-mint/20 bg-mint/10 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-medium text-mint"><Bot className="h-4 w-4" /> Agent {index + 1}</div>
              <div className="text-sm text-slate-300">{step}</div>
              <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-slate-800">
                <div className="h-full rounded-full bg-mint" style={{ width: `${45 + index * 14}%` }} />
              </div>
            </div>
          ))}
        </div>
      </section>
    );
  }
  if (!result) {
    return (
      <section className="glass-panel rounded-lg p-6">
        <div className="flex min-h-[460px] flex-col items-center justify-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-mint/10 text-mint ring-1 ring-mint/25">
            <Sparkles className="h-8 w-8" />
          </div>
          <h2 className="mt-5 text-2xl font-semibold text-white">Analysis panel ready</h2>
          <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">Run an investigation and this panel will show the root cause, confidence score, evidence, code patch, security review, and incident report.</p>
        </div>
      </section>
    );
  }
  const issue = result.root_cause_analysis?.[0] || {};
  const confidence = Number(issue.confidence_score || 0);
  const downloadMarkdown = () => {
    const blob = new Blob([result.incident_report || ""], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `incident-${result.incident_id}.md`;
    anchor.click();
    URL.revokeObjectURL(url);
  };
  const downloadPdf = async () => {
    const response = await api.post("/api/export/pdf", { incident_id: result.incident_id }, { responseType: "blob" });
    const url = URL.createObjectURL(response.data);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `incident-${result.incident_id}.pdf`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="space-y-5">
      <div className="overflow-hidden rounded-lg border border-mint/20 bg-slate-950 text-slate-100 shadow-2xl shadow-mint/5">
        <div className="border-b border-white/10 bg-white/[0.03] px-5 py-3">
          <div className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-mint"><CheckCircle2 className="h-4 w-4" /> Investigation Complete</span>
            <span className="text-xs text-slate-400">Incident {String(result.incident_id || "").slice(0, 8)}</span>
          </div>
        </div>
        <div className="p-5">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm text-slate-400">Root Cause Card</p>
              <h2 className="mt-1 text-3xl font-semibold text-white">{displayCause(issue.root_cause)}</h2>
            </div>
            <div className="flex flex-wrap gap-2">
              <span className="flex items-center gap-2 rounded-md bg-emerald-400/15 px-4 py-2 text-lg font-bold text-emerald-200 ring-1 ring-emerald-300/30">
                <Gauge className="h-5 w-5" /> {confidence}%
              </span>
              <span className={`rounded-md px-4 py-2 text-sm font-bold ring-1 ${severityClass(issue.severity)}`}>{issue.severity || "UNKNOWN"}</span>
            </div>
          </div>
          <div className="mt-5 grid gap-4 lg:grid-cols-[1fr_0.9fr]">
            <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-mint"><Lightbulb className="h-4 w-4" /> Why it happened</h3>
              <p className="mt-3 text-sm leading-6 text-slate-300">{issue.why_it_happened || "No explanation returned."}</p>
            </div>
            <div className="rounded-md border border-coral/25 bg-coral/10 p-4">
              <h3 className="flex items-center gap-2 text-sm font-semibold text-orange-200"><TerminalSquare className="h-4 w-4" /> Evidence</h3>
              <pre className="mt-3 max-h-40 overflow-auto whitespace-pre-wrap rounded bg-black/60 p-3 font-mono text-sm leading-6 text-orange-100">{issue.evidence || "No evidence returned."}</pre>
            </div>
          </div>
        </div>
      </div>
      <CodePatch fixes={result.fixes} />
      <div className="rounded-lg border border-white/10 bg-white p-5 text-ink">
        <h3 className="flex items-center gap-2 font-semibold"><ShieldAlert className="h-4 w-4 text-coral" /> Security Review</h3>
        <div className="mt-3 space-y-2">
          {result.security_findings?.map((finding, index) => (
            <div key={index} className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm">
              <span className="mr-2 rounded bg-slate-900 px-2 py-0.5 text-xs font-semibold text-white">{finding.severity}</span>
              {finding.finding}
            </div>
          ))}
        </div>
      </div>
      {result.similar_incidents?.length > 0 && (
        <div className="rounded-lg border border-white/10 bg-white p-5 text-ink">
          <h3 className="font-semibold">Similar Incidents</h3>
          {result.similar_incidents.map((incident, index) => <p key={index} className="mt-2 text-sm text-slate-600">{incident.summary}</p>)}
        </div>
      )}
      <div className="flex flex-wrap gap-3">
        <button onClick={downloadPdf} className="flex items-center gap-2 rounded-md border border-white/10 bg-white px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-100"><FileText className="h-4 w-4" /> Export PDF</button>
        <button onClick={downloadMarkdown} className="flex items-center gap-2 rounded-md border border-mint/30 bg-mint px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-emerald-300"><Download className="h-4 w-4" /> Export Markdown</button>
      </div>
      <IncidentReport markdown={result.incident_report} />
    </section>
  );
}
