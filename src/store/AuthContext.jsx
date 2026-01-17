import React, { createContext, useContext, useEffect, useState } from "react";

const AuthContext = createContext();

const defaultProfiles = {
  candidate: {
    id: "0x91ab23cc98ddee11223344556677889900aabbccddeeff001122334455667788",
    name: "Linh Tran",
    role: "candidate",
    email: "candidate@verifyme.test",
  },
  recruiter: {
    id: "0xa7f9b45de3ffeeddccbbaa99887766554433221100ffeeddccbbaa9988776655",
    name: "Nova Recruiter",
    role: "recruiter",
    orgName: "NovaHire",
    email: "recruiter@verifyme.test",
  },
  issuer: {
    id: "0xabc123abc123abc123abc123abc123abc123abc123abc123abc123abc123ab",
    name: "Atlas University",
    role: "issuer",
    orgName: "Atlas University",
    email: "issuer@verifyme.test",
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

  const login = (role, payload = {}) =>
    new Promise((resolve) => {
      setTimeout(() => {
        const profile = defaultProfiles[role] || {};
        const resolved = {
          ...profile,
          ...payload,
          role,
          email: payload.email || profile.email || "",
          name: payload.name || profile.name || (payload.email ? payload.email.split("@")[0] : "Guest"),
          id: payload.id || profile.id || crypto.randomUUID(),
        };
        setUser(resolved);
        resolve(resolved);
      }, 600);
    });

  const logout = () =>
    new Promise((resolve) => {
      setTimeout(() => {
        setUser(null);
        resolve(true);
      }, 200);
    });

  const switchRole = (role) => login(role);

  return (
    <AuthContext.Provider value={{ user, login, logout, switchRole }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
