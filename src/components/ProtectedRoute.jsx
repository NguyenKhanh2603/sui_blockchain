import React from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../store/AuthContext";

function ProtectedRoute({ children, allowedRoles }) {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default ProtectedRoute;
