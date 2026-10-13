import { createContext, useContext, useEffect, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { api, setCsrf } from "../shared/api";
const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null),
    [loading, setLoading] = useState(true),
    [error, setError] = useState("");
  async function refresh() {
    try {
      const data = await api("/auth/me");
      setUser(data.user);
      setCsrf(data.csrf);
      setError("");
    } catch (e) {
      if (e.status !== 401) setError(e.message);
      setUser(null);
      setCsrf("");
    } finally {
      setLoading(false);
    }
  }
  useEffect(() => {
    refresh();
  }, []);
  async function login(values) {
    const data = await api("/auth/login", { method: "POST", body: values });
    setUser(data.user);
    setCsrf(data.csrf);
  }
  async function logout() {
    await api("/auth/logout", { method: "POST" });
    setUser(null);
    setCsrf("");
  }
  return (
    <AuthContext.Provider
      value={{ user, loading, error, login, logout, refresh, setUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
export function Protected({ children }) {
  const { user, loading, error } = useAuth(),
    location = useLocation();
  if (loading)
    return (
      <div className="page-loading" role="status">
        Cargando tu espacio universitario…
      </div>
    );
  if (error)
    return (
      <div className="container">
        <div className="alert error" role="alert">
          {error}{" "}
          <button onClick={() => window.location.reload()}>Reintentar</button>
        </div>
      </div>
    );
  return user ? (
    children
  ) : (
    <Navigate to="/acceso" state={{ from: location.pathname }} replace />
  );
}
