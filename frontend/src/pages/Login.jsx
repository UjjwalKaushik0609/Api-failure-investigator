import { Eye, EyeOff } from "lucide-react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { fetchMe, login } from "../api/auth";

export default function Login({ onAuthed }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const onSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      const user = await fetchMe();
      onAuthed(user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Wrong credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md rounded-lg border border-slate-200 bg-white p-8 text-ink shadow-sm">
        <h1 className="text-2xl font-semibold">Login</h1>
        <p className="mt-2 text-sm text-slate-500">Continue investigating API failures.</p>
        {error && <div className="mt-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
        <label className="mt-6 block text-sm font-medium">Email</label>
        <input className="mt-2 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-ink outline-none placeholder:text-slate-400 focus:border-mint" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <label className="mt-4 block text-sm font-medium">Password</label>
        <div className="mt-2 flex rounded-md border border-slate-300 focus-within:border-mint">
          <input className="w-full rounded-md bg-white px-3 py-2 text-ink outline-none placeholder:text-slate-400" type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} required />
          <button type="button" title={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword(!showPassword)} className="px-3 text-slate-500">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        <button disabled={loading} className="mt-6 flex w-full items-center justify-center gap-2 rounded-md bg-ink px-4 py-2.5 font-medium text-white hover:bg-slate-800 disabled:opacity-70">
          {loading && <span className="spinner" />} Login
        </button>
        <p className="mt-5 text-center text-sm text-slate-500">
          New here? <Link className="font-medium text-mint" to="/register">Create an account</Link>
        </p>
      </form>
    </main>
  );
}
