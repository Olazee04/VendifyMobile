import React, {
  createContext, useContext, useState,
  useEffect, ReactNode
} from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import api from "../api/api";

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  hasStore: boolean;
  phoneNumber?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  register: (data: RegisterData) => Promise<{ success: boolean; message: string }>;
  refreshUser: () => Promise<void>;
}

interface RegisterData {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  phoneNumber?: string;
}

const AuthContext = createContext<AuthContextType>(
  {} as AuthContextType
);

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({
  children
}: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadStoredAuth();
  }, []);

  const loadStoredAuth = async () => {
    try {
      const storedToken =
        await AsyncStorage.getItem("vendify_token");
      const storedUser =
        await AsyncStorage.getItem("vendify_user");

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
        api.defaults.headers.common["Authorization"] =
          `Bearer ${storedToken}`;
      }
    } catch (error) {
      console.error("Failed to load auth:", error);
    } finally {
      setLoading(false);
    }
  };

  const login = async (
    email: string,
    password: string
  ) => {
    const res = await api.post("/auth/login", {
      email, password
    });
    const { accessToken, user: userData } =
      res.data.data;

    await AsyncStorage.setItem(
      "vendify_token", accessToken);
    await AsyncStorage.setItem(
      "vendify_user", JSON.stringify(userData));

    api.defaults.headers.common["Authorization"] =
      `Bearer ${accessToken}`;

    setToken(accessToken);
    setUser(userData);
  };

  const register = async (data: RegisterData) => {
    const res = await api.post("/auth/register", {
      ...data,
      role: "Merchant",
    });

    const { user: userData, message } = res.data.data;

    return {
      success: true,
      message: message ?? "Registration successful"
    };
  };

  const logout = async () => {
    await AsyncStorage.removeItem("vendify_token");
    await AsyncStorage.removeItem("vendify_refresh");
    await AsyncStorage.removeItem("vendify_user");
    delete api.defaults.headers.common["Authorization"];
    setToken(null);
    setUser(null);
  };

  const refreshUser = async () => {
    const stored = await AsyncStorage
      .getItem("vendify_user");
    if (stored) setUser(JSON.parse(stored));
  };

  return (
    <AuthContext.Provider value={{
      user, token, loading,
      login, logout, register, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}
