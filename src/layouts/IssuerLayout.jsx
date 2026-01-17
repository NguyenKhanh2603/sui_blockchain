import React, { useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  ShieldCheck,
  Inbox,
  Stamp,
  FileCheck2,
  Ban,
  HeartHandshake,
  FolderUp,
  ScrollText,
  Settings,
  LogOut,
} from "lucide-react";
import { issuerService } from "../services/issuerService";
import { useAuth } from "../store/AuthContext";

const navItems = [
  { to: "/issuer/status", label: "Status & Identity", icon: <ShieldCheck className="h-5 w-5" />, protected: false },
  { to: "/issuer/verification", label: "Verification", icon: <Inbox className="h-5 w-5" />, protected: false },
  { to: "/issuer/issue", label: "Issue", icon: <Stamp className="h-5 w-5" />, protected: true },
  { to: "/issuer/issued", label: "Issued", icon: <FileCheck2 className="h-5 w-5" />, protected: true },
  { to: "/issuer/revoke", label: "Revoke", icon: <Ban className="h-5 w-5" />, protected: true },
  { to: "/issuer/trust-page", label: "Trust Page", icon: <HeartHandshake className="h-5 w-5" />, protected: true },
  { to: "/issuer/compliance", label: "Compliance", icon: <FolderUp className="h-5 w-5" />, protected: false },
  { to: "/issuer/audit", label: "Audit / Logs", icon: <ScrollText className="h-5 w-5" />, protected: true },
  { to: "/issuer/settings", label: "Settings", icon: <Settings className="h-5 w-5" />, protected: false },
];

function IssuerLayout() {
  const [status, setStatus] = useState(null);
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    issuerService.getIssuerProfile().then(setStatus);
  }, []);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const isCoop = status?.issuerType === "COOP";
  const isLegallyVerified = (status?.verificationLevel || 0) >= 2;
  const isVerified = (status?.verificationLevel || 0) >= 1;

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex text-slate-900">
      <aside className="hidden xl:flex w-72 flex-col border-r border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <div className="h-11 w-11 rounded-2xl bg-gradient-to-br from-navy-500 to-navy-700 text-white flex items-center justify-center font-bold">
            V
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">VerifyMe</p>
            <p className="font-bold text-lg">Issuer</p>
          </div>
        </div>
        <div className="px-5 py-4 space-y-1">
          <p className="text-xs font-semibold text-slate-500">Organization</p>
          <p className="font-bold">{status?.orgName || user?.orgName}</p>
          <p className="text-xs text-slate-500">Environment: {status?.environment || "Test"}</p>
          <p className="text-xs text-slate-600">Type: {status?.issuerType || "Unknown"}</p>
        </div>
        <nav className="flex-1 px-3 space-y-1">
          {navItems.map((item) => {
            const isIssue = item.to === "/issuer/issue";
            const isDisabled =
              (isIssue && isCoop && (status?.verificationLevel || 0) < 1) ||
              (isIssue && status?.issuerType === "NON_COOP");
            return (
              <NavLink
                key={item.to}
                to={isDisabled ? "/issuer/status" : item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    isDisabled
                      ? "cursor-not-allowed opacity-50"
                      : isActive
                      ? "bg-navy-50 text-navy-700"
                      : "text-slate-600 hover:bg-slate-100"
                  }`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            );
          })}
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
            <div>
              <p className="text-xs font-semibold text-slate-500">Issuer</p>
              <p className="text-sm font-semibold">{status?.orgName || user?.orgName}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${isLegallyVerified ? "bg-green-100 text-green-700" : isVerified ? "bg-emerald-50 text-emerald-800" : "bg-amber-50 text-amber-700"}`}>
                {isLegallyVerified ? "Legally verified" : isVerified ? "Verified" : "Not verified"}
              </span>
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                <div className="h-9 w-9 rounded-full bg-gradient-to-br from-navy-500 to-navy-700 text-white flex items-center justify-center font-semibold">
                  {user?.name?.slice(0, 1) || "I"}
                </div>
                <div className="hidden sm:block">
                  <p className="text-xs text-slate-500">{user?.orgName}</p>
                  <p className="text-sm font-semibold">{user?.name}</p>
                </div>
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

export default IssuerLayout;
