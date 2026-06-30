import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { register } from "../api/auth";

export default function Register() {
  const [form, setForm] = useState({ full_name: "", email: "", password: "", confirm: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const onSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (form.password !== form.confirm) {
      setError("Passwords do not match");
      return;
    }
    setLoading(true);
    try {
      await register({ full_name: form.full_name, email: form.email, password: form.password });
      setMessage("Account created. Redirecting to login...");
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      setError(err.response?.data?.detail || "Could not create account");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-8">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-ink shadow-sm">
        <h1 className="text-2xl font-semibold">Create Account</h1>
        {message && <div className="mt-4 rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">{message}</div>}
        {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <label className="mt-6 block text-sm font-medium">Full name</label>
        <input className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-ink outline-none placeholder:text-slate-400 focus:border-mint" value={form.full_name} onChange={(e) => update("full_name", e.target.value)} required />
        <label className="mt-4 block text-sm font-medium">Email</label>
        <input className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-ink outline-none placeholder:text-slate-400 focus:border-mint" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} required />
        <label className="mt-4 block text-sm font-medium">Password</label>
        <div className="mt-2 flex rounded-md border border-slate-300 focus-within:border-mint">
          <input className="w-full rounded-md bg-white px-3 py-2 text-ink outline-none placeholder:text-slate-400" type={showPassword ? "text" : "password"} value={form.password} onChange={(e) => update("password", e.target.value)} required minLength={8} />
          <button type="button" title={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="px-3 text-slate-500">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <label className="mt-4 block text-sm font-medium">Confirm password</label>
        <input className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-ink outline-none placeholder:text-slate-400 focus:border-mint" type={showPassword ? "text" : "password"} value={form.confirm} onChange={(e) => update("confirm", e.target.value)} required />
        <button disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 font-medium text-white hover:bg-slate-800 disabled:opacity-70">
          {loading && <span className="spinner" />} Create Account
        </button>
        <p className="mt-5 text-center text-sm text-slate-500">
          Already have an account? <Link className="font-medium text-mint" to="/login">Login</Link>
        </p>
      </form>
    </main>
  );
}
