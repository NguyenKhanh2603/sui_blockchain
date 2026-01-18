import React, { createContext, useContext, useEffect, useState } from "react";
import { blockchainService } from "../services/blockchainService";
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
        // If payload has a wallet address, we MUST use it as the ID and not fallback to mock ID.
        // This ensures every wallet is treated as a unique user.
        const id = payload.walletAddress || payload.id || crypto.randomUUID();
        
        const resolved = {
          role,
          email: payload.email || "",
          username: payload.username || "",
          name: payload.name || (payload.walletAddress ? `User ${payload.walletAddress.slice(0, 6)}...` : "Guest"),
          mobile: payload.mobile || "",
          dob: payload.dob,
          cccd: payload.cccd,
          walletAddress: payload.walletAddress || "",
          id: id,
        };
        
        // Only merge defaults if specifically requested AND we are in a pure mock mode (no wallet)
        // Check if we are "forcing" mock profiles for demo purposes, otherwise use real data.
        if (options.useDefaults && !payload.walletAddress) {
             const def = defaultProfiles[role] || {};
             Object.assign(resolved, def);
        }

        // --- BLOCKCHAIN CHECK ---
        // Verify if this user is actually registered on-chain
        if (payload.walletAddress) {
          console.group(`🔗 Checking Blockchain Status for [${role}]`);
          console.log(`Wallet: ${payload.walletAddress}`);
          
          if (role === 'issuer') {
             blockchainService.getIssuerByAddress(payload.walletAddress)
               .then(issuer => {
                 if (issuer) {
                   console.log("✅ ON-CHAIN: User is a registered ISSUER.", issuer);
                 } else {
                   console.warn("⚠️ ON-CHAIN: User is NOT registered as an issuer.");
                 }
               })
               .catch(err => console.error("❌ Blockchain Query Failed:", err));
          } else {
             console.log("ℹ️ Blockchain check skipped (role not fully integrated yet)");
          }
          console.groupEnd();
        }
        // ------------------------

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
