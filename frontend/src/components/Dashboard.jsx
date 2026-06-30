import { useEffect, useState } from "react";
import { Activity, Clock, Gauge, ShieldCheck, TimerReset, TrendingUp } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import api from "../api/client";

const colors = ["#2fbf9f", "#ff6b5f", "#476072", "#f59e0b", "#6366f1"];

function StatCard({ icon: Icon, label, value, helper, tone = "text-mint" }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.04] p-5 shadow-xl">
      <div className="flex items-center justify-between">
        <p className="text-sm text-slate-400">{label}</p>
        <Icon className={`h-5 w-5 ${tone}`} />
      </div>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-xs text-slate-500">{helper}</p>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    api.get("/api/dashboard/stats").then(({ data }) => setStats(data));
  }, []);

  if (!stats) return <main className="mx-auto max-w-7xl px-4 py-6 text-slate-400">Loading dashboard...</main>;

  return (
    <main className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <section className="glass-panel rounded-lg p-6">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-mint"><Activity className="h-4 w-4" /> Reliability Command Center</p>
            <h1 className="mt-3 text-3xl font-semibold text-white">Incident Intelligence Dashboard</h1>
          </div>
          <div className="rounded-md border border-mint/30 bg-mint/10 px-4 py-2 text-sm font-semibold text-mint">Health {stats.api_health_score}/100</div>
        </div>
      </section>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatCard icon={ShieldCheck} label="Total Incidents" value={stats.total_incidents} helper="Analyzed by your agents" />
        <StatCard icon={Gauge} label="API Health Score" value={stats.api_health_score} helper="Lowered by severe incidents" />
        <StatCard icon={Clock} label="MTTD" value={`${stats.mttd_minutes || 0}m`} helper="Mean time to detect" tone="text-coral" />
        <StatCard icon={TimerReset} label="MTTR" value={`${stats.mttr_minutes || 0}m`} helper="Mean time to resolve" tone="text-amber-300" />
        <StatCard icon={TrendingUp} label="Avg Confidence" value={`${stats.average_confidence || 0}%`} helper="Across saved incidents" />
      </section>
      <section className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border border-white/10 bg-white p-5 text-ink">
          <h2 className="font-semibold">Error Type Distribution</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <PieChart>
                <Pie data={stats.error_type_distribution} dataKey="value" nameKey="name" outerRadius={92} innerRadius={45} label>
                  {stats.error_type_distribution.map((_, index) => <Cell key={index} fill={colors[index % colors.length]} />)}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white p-5 text-ink">
          <h2 className="font-semibold">Severity Breakdown</h2>
          <div className="mt-4 h-72">
            <ResponsiveContainer>
              <BarChart data={stats.severity_breakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="severity" />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Bar dataKey="count" fill="#ff6b5f" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>
      <section className="rounded-lg border border-white/10 bg-white p-5 text-ink">
        <h2 className="font-semibold">Recent Incidents</h2>
        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-slate-500">
              <tr><th className="py-2">Root Cause</th><th>Severity</th><th>Confidence</th><th>Created</th></tr>
            </thead>
            <tbody>
              {stats.recent_incidents.map((incident) => (
                <tr key={incident.id} className="border-t border-slate-100">
                  <td className="py-3">{incident.root_cause}</td>
                  <td>{incident.severity}</td>
                  <td>{incident.confidence_score}%</td>
                  <td>{new Date(incident.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </main>
  );
}
