import { useEffect, useState } from "react";
import "./App.css";
import Auth from "./Auth";
import Dashboard from "./Dashboard";
import { api, clearToken, getToken } from "./api";

export default function App() {
  const [user, setUser] = useState(null);
  const [checking, setChecking] = useState(() => !!getToken());

  useEffect(() => {
    if (!getToken()) return;

    api("/auth/me")
      .then(setUser)
      .catch(() => {
        /* 401 hole api.js nijei token muche dey */
      })
      .finally(() => setChecking(false));
  }, []);

  useEffect(() => {
    const onUnauthorized = () => setUser(null);
    window.addEventListener("tm-unauthorized", onUnauthorized);
    return () => window.removeEventListener("tm-unauthorized", onUnauthorized);
  }, []);

  function logout() {
    clearToken();
    setUser(null);
  }

  if (checking) return <div className="boot">Loading...</div>;
  if (!user) return <Auth onAuth={setUser} />;

  return <Dashboard key={user.id} user={user} onLogout={logout} />;
}
