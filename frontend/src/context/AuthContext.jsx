import { createContext, useContext, useEffect, useState, useCallback } from "react";
import { loginUser, registerUser, fetchMe, updateMe } from "../api/auth";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("clientflow_user");
    return stored ? JSON.parse(stored) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem("clientflow_token"));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function bootstrap() {
      if (token) {
        try {
          const data = await fetchMe();
          setUser(data.user);
          localStorage.setItem("clientflow_user", JSON.stringify(data.user));
        } catch (err) {
          setUser(null);
          setToken(null);
          localStorage.removeItem("clientflow_token");
          localStorage.removeItem("clientflow_user");
        }
      }
      setLoading(false);
    }
    bootstrap();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = useCallback(async (credentials) => {
    const data = await loginUser(credentials);
    localStorage.setItem("clientflow_token", data.token);
    localStorage.setItem("clientflow_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const register = useCallback(async (payload) => {
    const data = await registerUser(payload);
    localStorage.setItem("clientflow_token", data.token);
    localStorage.setItem("clientflow_user", JSON.stringify(data.user));
    setToken(data.token);
    setUser(data.user);
    return data;
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem("clientflow_token");
    localStorage.removeItem("clientflow_user");
    setToken(null);
    setUser(null);
    window.location.href = "/login";
  }, []);

  const updateProfile = useCallback(async (payload) => {
    const data = await updateMe(payload);
    setUser(data.user);
    localStorage.setItem("clientflow_user", JSON.stringify(data.user));
    return data.user;
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
