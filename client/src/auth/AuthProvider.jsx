import React, { createContext, useEffect, useMemo, useState } from "react";
import api, { setAuthToken } from "../api/client";

export const AuthContext = createContext(null);

const TOKEN_KEY = "token";

export default function AuthProvider({ children }) {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setAuthToken(token);
    let cancelled = false;

    async function loadMe() {
      if (!token) {
        setUser(null);
        setLoading(false);
        return;
      }
      try {
        const res = await api.get("/auth/me");
        if (!cancelled) setUser(res.data.user);
      } catch (err) {
        if (!cancelled) setUser(null);
        // If token is invalid, remove it so the app can recover.
        localStorage.removeItem(TOKEN_KEY);
        setToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadMe();
    return () => {
      cancelled = true;
    };
  }, [token]);

  const value = useMemo(
    () => ({
      token,
      user,
      loading,
      login: async (jwt) => {
        localStorage.setItem(TOKEN_KEY, jwt);
        // Set the header immediately to avoid a race in login flows that call refreshUser right away.
        setAuthToken(jwt);
        setToken(jwt);
      },
      logout: () => {
        localStorage.removeItem(TOKEN_KEY);
        setAuthToken(null);
        setToken(null);
        setUser(null);
      },
      refreshUser: async () => {
        try {
          const res = await api.get("/auth/me");
          setUser(res.data.user);
          return res.data.user;
        } catch (err) {
          // If the token is invalid/expired, clear it so protected routes recover gracefully.
          if (err?.response?.status === 401) {
            localStorage.removeItem(TOKEN_KEY);
            setAuthToken(null);
            setToken(null);
            setUser(null);
            return null;
          }
          throw err;
        }
      }
    }),
    [token, user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

