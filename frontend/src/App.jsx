import { Navigate, NavLink, Route, Routes, useNavigate } from "react-router-dom";
import { Activity, LogOut, ShieldCheck } from "lucide-react";
import { useEffect, useState } from "react";
import { fetchMe, logout } from "./api/auth";
import Dashboard from "./components/Dashboard";
import History from "./pages/History";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Register from "./pages/Register";

function ProtectedRoute({ children }) {
  return localStorage.getItem("afi_token") ? children : <Navigate to="/login" replace />;
}

function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const onLogout = async () => {
    await logout();
    setUser(null);
    navigate("/login");
  };
  return (
    <header className="sticky top-0 z-20 border-b border-white/10 bg-slate-950/90 text-white backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3">
        <NavLink to="/" className="flex items-center gap-3 font-semibold">
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-mint/15 text-mint ring-1 ring-mint/30">
            <ShieldCheck className="h-5 w-5" />
          </span>
          <span>
            <span className="block leading-5">API Failure Investigator</span>
            <span className="flex items-center gap-1 text-xs font-normal text-mint"><Activity className="h-3 w-3" /> Agentic incident console</span>
          </span>
        </NavLink>
        <nav className="flex items-center gap-2 text-sm">
          {["/", "/dashboard", "/history"].map((path, index) => (
            <NavLink key={path} to={path} className={({ isActive }) => `rounded-md px-3 py-2 ${isActive ? "bg-white/10 text-mint" : "text-slate-300 hover:bg-white/5"}`}>
              {["Investigate", "Dashboard", "History"][index]}
            </NavLink>
          ))}
          <span className="hidden max-w-48 truncate rounded-md border border-white/10 px-3 py-2 text-slate-300 sm:inline">{user?.full_name || user?.email}</span>
          <button title="Logout" onClick={onLogout} className="rounded-md border border-white/10 p-2 text-slate-300 hover:bg-white/5">
            <LogOut className="h-4 w-4" />
          </button>
        </nav>
      </div>
    </header>
  );
}

export default function App() {
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem("afi_user") || "null"));
  const authed = Boolean(localStorage.getItem("afi_token"));

  useEffect(() => {
    if (authed) fetchMe().then(setUser).catch(() => setUser(null));
  }, [authed]);

  return (
    <div className="min-h-screen bg-[#071014] text-slate-100 signal-grid">
      {authed && <Navbar user={user} setUser={setUser} />}
      <Routes>
        <Route path="/login" element={<Login onAuthed={setUser} />} />
        <Route path="/register" element={<Register />} />
        <Route path="/" element={<ProtectedRoute><Home /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}
