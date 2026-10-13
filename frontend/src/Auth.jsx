import { useState } from "react";
import Icon from "./Icon";
import { api, setToken } from "./api";

export default function Auth({ onAuth }) {
  const [mode, setMode] = useState("login");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setError("");
    setBusy(true);

    try {
      const res = await api(`/auth/${mode}`, {
        method: "POST",
        body: { username: username.trim(), password },
      });
      setToken(res.access_token);
      onAuth(res.user);
    } catch (err) {
      setError(err.message || "Kichu ekta vul hoyeche.");
    } finally {
      setBusy(false);
    }
  }

  const isLogin = mode === "login";

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-brand">
          <div className="brand-mark">
            <Icon name="check" size={22} />
          </div>
          <div>
            <strong>Task Manager</strong>
            <small>Organize • Focus • Achieve</small>
          </div>
        </div>

        <h1>{isLogin ? "Welcome back" : "Create your account"}</h1>
        <p className="auth-sub">
          {isLogin ? "Login kore apnar task gulo dekhun." : "Apnar nijer alada task list paben."}
        </p>

        <div className="auth-tabs" role="tablist">
          <button type="button" className={isLogin ? "on" : ""} onClick={() => setMode("login")}>
            Login
          </button>
          <button type="button" className={!isLogin ? "on" : ""} onClick={() => setMode("register")}>
            Register
          </button>
        </div>

        <form onSubmit={submit}>
          <label className="auth-field">
            <Icon name="user" size={17} />
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              autoComplete="username"
              minLength={3}
              maxLength={30}
              required
            />
          </label>

          <label className="auth-field">
            <Icon name="lock" size={17} />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password (min 6 characters)"
              autoComplete={isLogin ? "current-password" : "new-password"}
              minLength={6}
              maxLength={72}
              required
            />
          </label>

          {error && (
            <div className="error-banner auth-error">
              <Icon name="alert" size={15} /> {error}
            </div>
          )}

          <button className="add-button auth-submit" type="submit" disabled={busy}>
            {busy ? "Please wait..." : isLogin ? "Login" : "Create account"}
          </button>
        </form>
      </div>
    </div>
  );
}
