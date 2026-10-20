import AsyncStorage from "@react-native-async-storage/async-storage";
import axios from "axios";

const BASE_URL = "https://vendify-api-p7ka.onrender.com/api/v1";

// Lets the app know when the login has expired (used in AuthContext.tsx)
let onUnauthorized: (() => void) | null = null;

export function setUnauthorizedHandler(handler: (() => void) | null) {
  onUnauthorized = handler;
}

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: { "Content-Type": "application/json" },
});

api.interceptors.request.use(async (config) => {
  try {
    const token = await AsyncStorage.getItem("vendify_token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {}
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const isAuthCall = String(error.config?.url ?? "").includes("/auth/");
    if (error.response?.status === 401 && !isAuthCall) {
      await AsyncStorage.removeItem("vendify_token");
      await AsyncStorage.removeItem("vendify_refresh");
      await AsyncStorage.removeItem("vendify_user");
      if (onUnauthorized) onUnauthorized();
    }
    return Promise.reject(error);
  },
);

export default api;
