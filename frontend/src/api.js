export const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

const TOKEN_KEY = "tm_token";

export const getToken = () => {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setToken = (token) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
  } catch {
    /* ignore */
  }
};

export const clearToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
  } catch {
    /* ignore */
  }
};

export class ApiError extends Error {
  constructor(message, status) {
    super(message);
    this.status = status;
  }
}

function readDetail(json) {
  if (!json || json.detail == null) return "";
  if (typeof json.detail === "string") return json.detail;
  if (Array.isArray(json.detail) && json.detail[0]?.msg) {
    return json.detail[0].msg.replace(/^Value error, /, "");
  }
  return "";
}

export async function api(path, { method = "GET", body, keepalive = false } = {}) {
  const headers = {};
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  let res;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      headers,
      keepalive,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError("Backend connection failed. FastAPI server cholche kina check korun.", 0);
  }

  if (res.status === 401) {
    clearToken();
    window.dispatchEvent(new Event("tm-unauthorized"));
  }

  if (!res.ok) {
    let detail = "";
    try {
      detail = readDetail(await res.json());
    } catch {
      /* ignore */
    }
    throw new ApiError(detail || "Request failed", res.status);
  }

  if (res.status === 204) return null;
  return res.json();
}
