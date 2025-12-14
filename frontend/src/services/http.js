import axios from "axios";

export const API_BASE = "http://localhost:5000/api";

export const http = axios.create({
  baseURL: API_BASE,
  withCredentials: true,
});

// attach access token
http.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing = false;
let queue = [];

function processQueue(error, token = null) {
  queue.forEach((p) => (error ? p.reject(error) : p.resolve(token)));
  queue = [];
}

http.interceptors.response.use(
  (res) => res,
  async (err) => {
    const original = err.config;

    const url = original?.url || "";
    const isAuthEndpoint =
      url.includes("/auth/login") ||
      url.includes("/auth/register") ||
      url.includes("/auth/refresh") ||
      url.includes("/auth/logout");

    if (err.response?.status === 401 && isAuthEndpoint) {
      throw err;
    }

    if (err.response?.status === 401 && !original._retry) {
      original._retry = true;

      if (refreshing) {
        return new Promise((resolve, reject) =>
          queue.push({ resolve, reject })
        ).then((token) => {
          original.headers.Authorization = `Bearer ${token}`;
          return http(original);
        });
      }

      refreshing = true;
      try {
        const r = await axios.post(
          `${API_BASE}/auth/refresh`,
          {},
          { withCredentials: true }
        );
        const newToken = r.data?.data?.accessToken;
        if (!newToken) throw new Error("No accessToken from refresh");

        localStorage.setItem("accessToken", newToken);
        processQueue(null, newToken);

        original.headers.Authorization = `Bearer ${newToken}`;
        return http(original);
      } catch (e) {
        localStorage.removeItem("accessToken");
        processQueue(e, null);
        throw e;
      } finally {
        refreshing = false;
      }
    }

    throw err;
  }
);
