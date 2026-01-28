// src/services/api.js
import axios from "axios";

// TEMPORARY: Hardcode production API URL for testing
const API_BASE = "https://ddi-2n0x.onrender.com/api";
// Original code (commented out):
// const API_BASE = (import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api").replace(/\/$/, "");

const API = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// ---------- simple local token store ----------
const store = {
  get access() { return localStorage.getItem("access") || ""; },
  get refresh() { return localStorage.getItem("refresh") || ""; },
  set(access, refresh, user) {
    if (access) localStorage.setItem("access", access);
    if (refresh) localStorage.setItem("refresh", refresh);
    if (user) localStorage.setItem("user", JSON.stringify(user));
  },
  clear() {
    localStorage.removeItem("access");
    localStorage.removeItem("refresh");
    localStorage.removeItem("user");
  },
};
export const setTokens = (access, refresh, user) => store.set(access, refresh, user);
export const clearTokens = () => store.clear();

// ---------- public paths (no Authorization header) ----------
const NO_AUTH = [
  /^\/auth\/login\/?$/i,
  /^\/auth\/token\/refresh\/?$/i,
  /^\/auth\/token\/verify\/?$/i,
  /^\/invitations\/[^/]+\/?$/i,            // GET invite info
  /^\/invitations\/[^/]+\/accept\/?$/i,     // POST accept invite
  /^\/ddi\/anonymous/i,                     // if you expose an anonymous checker
  /^\/schema\/?$/i,                         // docs/schema
];

function isNoAuthPath(url = "") {
  const path = url.startsWith("http") ? url.replace(API_BASE, "") : url;
  return NO_AUTH.some((rx) => rx.test(path));
}

// ---------- request: attach Bearer token when needed ----------
API.interceptors.request.use((config) => {
  if (!isNoAuthPath(config.url || "") && store.access) {
    config.headers.Authorization = `Bearer ${store.access}`;
  } else {
    // ensure public endpoints don't send stale headers
    delete config.headers.Authorization;
  }
  return config;
});

// ---------- response: refresh once on 401, queue in-flight 401s ----------
let refreshing = false;
let waiters = [];

function resumeQueued(newAccess) {
  waiters.forEach((resume) => resume(newAccess));
  waiters = [];
}

API.interceptors.response.use(
  (res) => res,
  async (error) => {
    const { response, config } = error || {};
    const status = response?.status;
    const original = config || {};

    // only try refresh for protected endpoints
    if (status === 401 && !original._retry && store.refresh && !isNoAuthPath(original.url || "")) {
      original._retry = true;

      // if a refresh is already happening, queue this request
      if (refreshing) {
        return new Promise((resolve) => {
          waiters.push((newAccess) => {
            original.headers = original.headers || {};
            original.headers.Authorization = `Bearer ${newAccess}`;
            resolve(API(original));
          });
        });
      }

      try {
        refreshing = true;
        const { data } = await axios.post(`${API_BASE}/auth/token/refresh/`, { refresh: store.refresh }, {
          headers: { "Content-Type": "application/json" },
        });
        const newAccess = data?.access || "";
        if (!newAccess) throw new Error("No access token in refresh response");
        // persist new token
        store.set(newAccess, store.refresh, JSON.parse(localStorage.getItem("user") || "null"));
        resumeQueued(newAccess);
        // retry original
        original.headers = original.headers || {};
        original.headers.Authorization = `Bearer ${newAccess}`;
        return API(original);
      } catch (e) {
        // refresh failed → hard logout
        store.clear();
        if (window.location.pathname !== "/login") window.location.assign("/login");
        return Promise.reject(e);
      } finally {
        refreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default API;
