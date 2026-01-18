import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  // SECURITY FIX: Enforce Wallet Connection.
  // Legacy "mock" users (email/password only) strictly lack a walletAddress.
  // We invalidate them here to prevent unauthorized access via old session data.
  if (!user.walletAddress) {
    // Optionally: could call logout() here if context exposed it, 
    // but redirecting to home usually forces the AuthContext check again or just blocks access.
    localStorage.removeItem("verifyme_user"); // Force clear
    return <Navigate to="/" replace />;
  }

  // If user is connected but NOT registered on-chain, redirect to Register page
  if (user.walletAddress && user.isRegistered === false) {
      // NOTE: We only enforce this for Issuer/Recruiter flows for now, as Candidate isn't fully on-chain yet
      if (allowedRoles && (allowedRoles.includes("issuer") || allowedRoles.includes("recruiter"))) {
        return <Navigate to="/register" replace />;
      }
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
