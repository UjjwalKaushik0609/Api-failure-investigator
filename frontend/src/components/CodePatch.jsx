import { Code2, Hammer, Route } from "lucide-react";

export default function CodePatch({ fixes }) {
  if (!fixes) return null;
  return (
    <div className="rounded-lg border border-white/10 bg-slate-950 p-5 text-slate-100 shadow-xl">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 font-semibold"><Hammer className="h-4 w-4 text-mint" /> Recommended Fix</h3>
        <span className="rounded-md bg-mint/10 px-2 py-1 text-xs font-semibold text-mint">production patch</span>
      </div>
      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
          <h4 className="flex items-center gap-2 text-sm font-semibold text-mint"><Route className="h-4 w-4" /> Immediate Steps</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {fixes.immediate_fix?.map((step, index) => <li key={index}>{step}</li>)}
          </ul>
        </div>
        <div className="rounded-md border border-white/10 bg-white/[0.03] p-4">
          <h4 className="text-sm font-semibold text-coral">Long-Term Architecture</h4>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            {fixes.long_term_fix?.map((step, index) => <li key={index}>{step}</li>)}
          </ul>
        </div>
      </div>
      <div className="mt-4 overflow-hidden rounded-md border border-white/10">
        <div className="flex items-center gap-2 border-b border-white/10 bg-black/40 px-4 py-2 text-xs text-slate-400">
          <Code2 className="h-4 w-4 text-mint" /> fix_patch.py
        </div>
        <pre className="overflow-auto bg-black p-4 text-sm leading-6 text-emerald-100"><code>{fixes.code_patch}</code></pre>
      </div>
    </div>
  );
}
