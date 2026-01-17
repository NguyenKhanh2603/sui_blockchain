import React, { createContext, useContext, useEffect, useState } from "react";
import { isValidSlushAddress, normalizeSlushAddress } from "../utils/address";

const AuthContext = createContext();

const defaultProfiles = {
  candidate: {
    id: "0x91ab23cc98ddee11223344556677889900aabbccddeeff001122334455667788",
    name: "Linh Tran",
    username: "linh.tran",
    role: "candidate",
    email: "candidate@verifyme.test",
    mobile: "0900000000",
  },
  recruiter: {
    id: "0xa7f9b45de3ffeeddccbbaa99887766554433221100ffeeddccbbaa9988776655",
    name: "Nova Recruiter",
    username: "nova.recruiter",
    role: "recruiter",
    orgName: "NovaHire",
    email: "recruiter@verifyme.test",
    verifiedStatus: true,
    mobile: "0900000001",
  },
  issuer: {
    id: "0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123ab",
    name: "Atlas University",
    username: "atlas.university",
    role: "issuer",
    orgName: "Atlas University",
    email: "issuer@verifyme.test",
    mobile: "0900000002",
  },
  admin: {
    id: "admin-001",
    name: "System Admin",
    username: "admin",
    role: "admin",
    email: "admin@verifyme.test",
  },
};

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("verifyme_user");
    return stored ? JSON.parse(stored) : null;
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem("verifyme_user", JSON.stringify(user));
    } else {
      localStorage.removeItem("verifyme_user");
    }
  }, [user]);

  const login = (role, payload = {}, options = {}) =>
    new Promise((resolve) => {
      setTimeout(() => {
        const { useDefaults = true } = options;
        const profile = useDefaults ? defaultProfiles[role] || {} : {};
        const username = payload.username || profile.username || "";
        const resolved = {
          ...profile,
          ...payload,
          role,
          email: payload.email || profile.email || "",
          username,
          name: payload.name || username || profile.name || (payload.email ? payload.email.split("@")[0] : "Guest"),
          mobile: payload.mobile || profile.mobile || "",
          dob: payload.dob || profile.dob,
          cccd: payload.cccd || profile.cccd,
          walletAddress: payload.walletAddress || profile.walletAddress || "",
          id: payload.id || profile.id || crypto.randomUUID(),
        };
        setUser(resolved);
        resolve(resolved);
      }, 600);
    });

  const setWalletAddress = (address) => {
    const normalized = normalizeSlushAddress(address || "");
    const next = isValidSlushAddress(normalized) ? normalized : "";
    setUser((prev) => {
      if (!prev) return prev;
      if ((prev.walletAddress || "") === next) return prev;
      return { ...prev, walletAddress: next };
    });
  };

  const logout = () =>
    new Promise((resolve) => {
      setTimeout(() => {
        setUser(null);
        resolve(true);
      }, 200);
    });

  const switchRole = (role) => login(role);

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole, setWalletAddress }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
