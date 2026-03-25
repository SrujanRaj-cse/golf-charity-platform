import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import AuthProvider from "./auth/AuthProvider.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminRoute from "./components/AdminRoute.jsx";

import Home from "./pages/Home.jsx";
import Login from "./pages/Login.jsx";
import Signup from "./pages/Signup.jsx";
import Subscribe from "./pages/Subscribe.jsx";
import Charities from "./pages/Charities.jsx";
import CharityProfile from "./pages/CharityProfile.jsx";
import About from "./pages/About.jsx";

import Dashboard from "./pages/Dashboard/Dashboard.jsx";
import AdminPanel from "./pages/Admin/AdminPanel.jsx";

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/charities" element={<Charities />} />
        <Route path="/charities/:id" element={<CharityProfile />} />
        <Route path="/about" element={<About />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        <Route
          path="/subscribe"
          element={
            <ProtectedRoute>
              <Subscribe />
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard/*"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/admin/*"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}

