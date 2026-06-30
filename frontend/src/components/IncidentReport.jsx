import { FileText } from "lucide-react";

export default function IncidentReport({ markdown }) {
  const preview = (markdown || "").split("\n").filter(Boolean);
  return (
    <div className="rounded-lg border border-white/10 bg-white p-5 text-ink">
      <h3 className="flex items-center gap-2 font-semibold"><FileText className="h-4 w-4 text-mint" /> Incident Report</h3>
      <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-4">
        {preview.map((line, index) => {
          if (line.startsWith("# ")) return <h2 key={index} className="mb-3 text-xl font-semibold">{line.replace("# ", "")}</h2>;
          if (line.startsWith("## ")) return <h4 key={index} className="mt-4 font-semibold text-steel">{line.replace("## ", "")}</h4>;
          if (line.startsWith("- ")) return <p key={index} className="mt-1 text-sm text-slate-700">{line}</p>;
          if (line.startsWith("```")) return null;
          return <p key={index} className="mt-2 text-sm leading-6 text-slate-700">{line}</p>;
        })}
      </div>
    </div>
  );
}
