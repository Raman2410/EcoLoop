import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
});

// ── Request interceptor: attach JWT token ────────────────────────────────────
axiosInstance.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ── Response interceptor: handle 401 (expired / invalidated token) ───────────
//
// When the server returns 401 it means the token is either expired or the
// tokenVersion no longer matches (e.g. the user was logged out on another
// device).  Without this interceptor the app silently receives empty arrays
// and shows 0s on every page after a refresh.
//
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Clear stale credentials
      localStorage.removeItem("token");
      localStorage.removeItem("user");

      // Only redirect if we're not already on the login page to avoid an
      // infinite redirect loop (every pathname begins with "/" so the old
      // includes("/") check was always true and always triggered replace).
      if (window.location.pathname !== "/") {
        window.location.replace("/");
      }
    }
    return Promise.reject(error);
  }
);

export default axiosInstance;
