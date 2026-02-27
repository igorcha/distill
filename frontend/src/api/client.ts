import axios from "axios";

let accessToken: string | null = null;

export function setAccessToken(token: string | null) {
  accessToken = token;
}

const API_URL = import.meta.env.VITE_API_URL;

const client = axios.create({
  baseURL: API_URL,
});

client.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refreshToken = localStorage.getItem("refresh_token");
      if (!refreshToken) {
        accessToken = null;
        window.location.href = "/auth";
        return Promise.reject(error);
      }

      try {
        const { data } = await axios.post(
          `${API_URL}/auth/token/refresh/`,
          { refresh: refreshToken }
        );
        accessToken = data.access;
        originalRequest.headers.Authorization = `Bearer ${data.access}`;
        return client(originalRequest);
      } catch {
        accessToken = null;
        localStorage.removeItem("refresh_token");
        window.location.href = "/auth";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

export default client;
