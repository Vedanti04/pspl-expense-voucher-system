import React, { createContext, useContext, useState, useEffect } from "react";
import { authApi } from "../services/api.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem("pspl_user");
      return savedUser ? JSON.parse(savedUser) : null;
    } catch {
      return null;
    }
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("pspl_auth_token") || null;
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function verifySession() {
      if (token) {
        try {
          const res = await authApi.getMe();
          setUser(res.user);
          localStorage.setItem("pspl_user", JSON.stringify(res.user));
        } catch (err) {
          console.warn("Session verification failed, logging out:", err.message);
          logout();
        }
      }
      setLoading(false);
    }
    verifySession();
  }, [token]);

  async function login(email, password) {
    const res = await authApi.login(email, password);
    setToken(res.token);
    setUser(res.user);
    localStorage.setItem("pspl_auth_token", res.token);
    localStorage.setItem("pspl_user", JSON.stringify(res.user));
    return res.user;
  }

  function logout() {
    setUser(null);
    setToken(null);
    localStorage.removeItem("pspl_auth_token");
    localStorage.removeItem("pspl_user");
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}