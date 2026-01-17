import React from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { ShieldCheck, LayoutDashboard, Inbox, ScrollText, LogOut } from "lucide-react";
import { useAuth } from "../store/AuthContext";

const navItems = [
  { to: "/admin/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { to: "/admin/verifications", label: "Verifications", icon: <Inbox className="h-5 w-5" /> },
  { to: "/admin/audit", label: "Audit Log", icon: <ScrollText className="h-5 w-5" /> },
];

function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex text-slate-900">
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-navy-500 to-navy-700 text-white flex items-center justify-center font-bold">
            A
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">VerifyMe</p>
            <p className="font-bold text-lg">Admin</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive ? "bg-navy-50 text-navy-700" : "text-slate-600 hover:bg-slate-100"
                }`
              }
            >
              {item.icon}
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="px-4 py-5 border-t border-slate-100 space-y-3">
          <button
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-navy-200 hover:text-navy-700"
          >
            <LogOut className="h-4 w-4" /> Logout
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col">
        <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-navy-600" />
              <div>
                <p className="text-xs font-semibold text-slate-500">Admin</p>
                <p className="text-sm font-semibold">{user?.name || "Administrator"}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-navy-500 to-navy-700 text-white flex items-center justify-center font-semibold">
                {user?.name?.slice(0, 1) || "A"}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs text-slate-500">Role</p>
                <p className="text-sm font-semibold">Verified admin</p>
              </div>
            </div>
          </div>
        </header>
        <main className="flex-1 p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

export default AdminLayout;
