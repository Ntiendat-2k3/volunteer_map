import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { authApi } from "../services/authApi";
import PropTypes from "prop-types";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    const token = localStorage.getItem("accessToken");
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await authApi.me();
      setUser(res.data.data.user);
    } catch {
      setUser(null);
      localStorage.removeItem("accessToken");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
  }, []);

  async function login(email, password) {
    const res = await authApi.login({ email, password });
    const { accessToken, user } = res.data.data;
    localStorage.setItem("accessToken", accessToken);
    setUser(user);
  }

  async function register(payload) {
    await authApi.register(payload);
  }

  async function logout() {
    try {
      await authApi.logout();
    } finally {
      localStorage.removeItem("accessToken");
      setUser(null);
    }
  }

  async function refreshSession() {
    const res = await authApi.refresh(); // POST /api/auth/refresh (withCredentials)
    const { accessToken, user } = res.data.data;
    localStorage.setItem("accessToken", accessToken);
    setUser(user);
    return { accessToken, user };
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      register,
      logout,
      reload: loadMe,
      refreshSession,
    }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

AuthProvider.propTypes = {
  children: PropTypes.node.isRequired,
};

export function useAuth() {
  return useContext(AuthContext);
}
