import React, { useContext } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthContext } from "../auth/AuthProvider";

export default function ProtectedRoute({ children, requireSubscription = false }) {
  const auth = useContext(AuthContext);
  const location = useLocation();

  if (auth.loading) return <div className="p-10 text-slate-300">Loading...</div>;
  if (!auth.token) return <Navigate to="/login" state={{ from: location.pathname }} replace />;

  if (requireSubscription) {
    const status = auth.user?.subscription_status || auth.user?.subscriptionStatus;
    if (status !== "active") return <Navigate to="/subscribe" replace />;
  }

  return children;
}

