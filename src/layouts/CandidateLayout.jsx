import React, { useEffect, useMemo, useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import { Shield, FileText, Bell, Settings, Wallet, LogOut } from "lucide-react";
import { ConnectButton, useCurrentAccount } from "@mysten/dapp-kit";
import { useAuth } from "../store/AuthContext";
import { isValidSlushAddress, maskAddress, normalizeSlushAddress } from "../utils/address";
import { candidateService } from "../services/candidateService";

const navItems = [
    {
        to: "/candidate/vault",
        label: "Vault",
        icon: <Shield className="h-5 w-5" />,
    },
    {
        to: "/candidate/cv-builder",
        label: "CV Builder",
        icon: <FileText className="h-5 w-5" />,
    },
    {
        to: "/candidate/requests",
        label: "Requests",
        icon: <Bell className="h-5 w-5" />,
    },
    {
        to: "/candidate/settings",
        label: "Settings",
        icon: <Settings className="h-5 w-5" />,
    },
];

function CandidateLayout() {
    const { user, logout } = useAuth();
    const currentAccount = useCurrentAccount();
    const navigate = useNavigate();
    const [profile, setProfile] = useState(null);
    const connectedAddress = useMemo(() => {
      const fromAccount = currentAccount?.address ? normalizeSlushAddress(currentAccount.address) : "";
      if (isValidSlushAddress(fromAccount)) return fromAccount;
      const stored = user?.walletAddress ? normalizeSlushAddress(user.walletAddress) : "";
      return isValidSlushAddress(stored) ? stored : "";
    }, [currentAccount?.address, user?.walletAddress]);

  useEffect(() => {
    let active = true;
    const loadProfile = async () => {
      const data = await candidateService.getCandidateProfile(user.id);
      if (active) setProfile(data);
    };
    loadProfile();
    return () => {
      active = false;
    };
  }, [user.id]);

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

    return (
        <div className="min-h-screen bg-[#f6f8ff] flex text-slate-900">
            <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white/90 backdrop-blur">
                <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
                    <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-navy-500 to-navy-700 text-white flex items-center justify-center font-bold">
                        V
                    </div>
                    <div>
                        <p className="text-xs font-semibold text-slate-500">
                            VerifyMe
                        </p>
                        <p className="font-bold text-lg">Candidate</p>
                    </div>
                </div>
                <div className="px-5 py-4">
                    <p className="text-xs font-semibold text-slate-500">
                        Candidate ID
                    </p>
                    <div className="mt-2 flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3 py-2">
                        <Wallet className="h-4 w-4 text-navy-500" />
                        <span className="text-sm font-semibold">
                            {connectedAddress ? maskAddress(connectedAddress) : "Not connected"}
                        </span>
                    </div>
                </div>
                <nav className="flex-1 px-3 space-y-1">
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
                <header className="sticky top-0 z-30 border-b border-slate-200 bg-white/80 backdrop-blur px-4 py-3">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-xs font-semibold text-slate-500">
                                Signed in as
                            </p>
                            <p className="text-sm font-semibold">
                                {user?.name}
                            </p>
                        </div>
            <div className="flex items-center gap-3">
              <ConnectButton
                connectText="Connect wallet"
                className="rounded-lg border border-slate-200 px-3 py-2 text-sm font-semibold text-slate-700 hover:border-navy-200"
                variant="outline"
              />
              <div className="flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5">
                <div className="h-8 w-8 rounded-full bg-gradient-to-br from-navy-500 to-navy-700 text-white flex items-center justify-center font-semibold">
                  {user?.name?.slice(0, 1) || "C"}
                                </div>
                                <div className="hidden sm:block">
                                    <p className="text-xs text-slate-500">
                                        Trust
                                    </p>
                                    <p className="text-sm font-semibold">92%</p>
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

export default CandidateLayout;
