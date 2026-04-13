import React from "react";
import { Navigate } from "react-router-dom";
import { getDefaultRouteByRole, getSession, getSessionRole } from "../services/session";

export default function ProtectedRoute({ children, allowedRoles = [] }) {
  const session = getSession();
  const role = getSessionRole();

  if (!session?.token || !role) {
    return <Navigate to="/" replace />;
  }

  if (allowedRoles.length > 0 && !allowedRoles.includes(role)) {
    return <Navigate to={getDefaultRouteByRole(role)} replace />;
  }

  return children;
}
