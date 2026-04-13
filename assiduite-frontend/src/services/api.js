import axios from "axios";
import { clearSession, getAuthToken } from "./session";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://127.0.0.1:8000/api",
  headers: {
    Accept: "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = getAuthToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  if (!(config.data instanceof FormData)) {
    config.headers["Content-Type"] = "application/json";
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      clearSession();
    }

    return Promise.reject(error);
  }
);

export default api;
