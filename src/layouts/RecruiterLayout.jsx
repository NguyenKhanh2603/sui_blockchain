import React, { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Bookmark,
  StickyNote,
  Settings,
  LogOut,
  Search,
  Bell,
  Briefcase,
} from "lucide-react";
import { useAuth } from "../store/AuthContext";
import { recruiterService } from "../services/recruiterService";
import { isValidSuiAddressStrict, normalizeSlushAddress } from "../utils/address";
import toast from "react-hot-toast";
import Badge from "../components/ui/Badge";

const navItems = [
  { to: "/recruiter/dashboard", label: "Dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
  { to: "/recruiter/jobs", label: "Jobs", icon: <Briefcase className="h-5 w-5" /> },
  { to: "/recruiter/saved", label: "Saved", icon: <Bookmark className="h-5 w-5" /> },
  { to: "/recruiter/notes", label: "Notes", icon: <StickyNote className="h-5 w-5" /> },
  { to: "/recruiter/settings", label: "Settings", icon: <Settings className="h-5 w-5" /> },
];

function RecruiterLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [quickQuery, setQuickQuery] = useState("");

  const isVerified = Boolean(user?.verifiedStatus || profile?.verifiedStatus);

  React.useEffect(() => {
    if (user?.walletAddress) {
        recruiterService.getRecruiterProfile(user.walletAddress).then(setProfile);
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const handleQuickSearch = async (value) => {
    const query = value ?? quickQuery;
    if (!query.trim()) return;
    const normalized = normalizeSlushAddress(query);
    if (isValidSuiAddressStrict(normalized)) {
      navigate(`/recruiter/candidate/${normalized}`);
      return;
    }
    try {
      const matches = await recruiterService.searchCandidatesByIdOrUsername(query);
      if (matches.length > 0) {
        navigate(`/recruiter/candidate/${matches[0].id}`);
      } else {
        toast.error("No candidate found");
      }
    } catch (err) {
      toast.error("No candidate found");
    }
  };

  return (
    <div className="min-h-screen bg-[#f5f7fb] text-slate-900 flex">
      <aside className="hidden md:flex w-64 flex-col border-r border-slate-200 bg-white/90 backdrop-blur">
        <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
          <div className="h-10 w-10 rounded-xl bg-navy-600 text-white flex items-center justify-center font-bold">
            V
          </div>
          <div>
            <p className="text-xs font-semibold text-slate-500">VerifyMe</p>
            <p className="font-bold text-lg">Recruiter</p>
          </div>
        </div>
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  isActive
                    ? "bg-navy-50 text-navy-700"
                    : "text-slate-600 hover:bg-slate-100"
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
        <header className="sticky top-0 z-30 bg-white/80 backdrop-blur border-b border-slate-200 px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-400" />
              <input
                placeholder="Search by Candidate ID or username"
                className="w-full rounded-xl border border-slate-200 bg-white py-2.5 pl-10 pr-4 text-sm shadow-sm focus:border-navy-300 focus:outline-none"
                value={quickQuery}
                onChange={(e) => setQuickQuery(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleQuickSearch(e.target.value);
                  }
                }}
              />
            </div>
            <button className="rounded-full p-2 hover:bg-slate-100 text-slate-500">
              <Bell className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-navy-500 to-navy-700 text-white flex items-center justify-center font-semibold">
                {user?.name?.slice(0, 1) || "R"}
              </div>
              <div className="hidden sm:block">
                <p className="text-xs text-slate-500">Recruiter</p>
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{user?.name}</p>
                  <Badge variant={isVerified ? "success" : "warning"}>
                    {isVerified ? "Verified" : "Unverified"}
                  </Badge>
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

export default RecruiterLayout;
