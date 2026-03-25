import React, { useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../auth/AuthProvider";

export default function AdminRoute({ children }) {
  const auth = useContext(AuthContext);

  if (auth.loading) return <div className="p-10 text-slate-300">Loading...</div>;
  if (!auth.token) return <Navigate to="/login" replace />;
  if (auth.user?.role !== "admin") return <Navigate to="/dashboard" replace />;

  return children;
}

