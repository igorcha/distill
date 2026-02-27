import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useNavigate } from "react-router-dom";
import * as authApi from "@/api/auth";
import { setAccessToken } from "@/api/client";
import type { User } from "@/types";

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [tokenState, setTokenState] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  const clearAuth = () => {
    localStorage.removeItem("refresh_token");
    setAccessToken(null);
    setTokenState(null);
    setUser(null);
  };

  const fetchAndSetUser = async () => {
    try {
      const meRes = await authApi.getMe();
      setUser(meRes.data);
    } catch {
      clearAuth();
      throw new Error("Failed to fetch user data.");
    }
  };

  useEffect(() => {
    const refreshToken = localStorage.getItem("refresh_token");
    if (!refreshToken) {
      setIsLoading(false);
      return;
    }

    authApi
      .refreshToken()
      .then(async (res) => {
        setAccessToken(res.data.access);
        setTokenState(res.data.access);
        await fetchAndSetUser();
      })
      .catch(() => {
        clearAuth();
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    localStorage.setItem("refresh_token", res.data.refresh);
    setAccessToken(res.data.access);
    setTokenState(res.data.access);
    await fetchAndSetUser();
  };

  const register = async (
    email: string,
    password: string,
    firstName: string,
    lastName: string
  ) => {
    const res = await authApi.register(email, password, firstName, lastName);
    localStorage.setItem("refresh_token", res.data.refresh);
    setAccessToken(res.data.access);
    setTokenState(res.data.access);
    await fetchAndSetUser();
  };

  const logout = () => {
    clearAuth();
    navigate("/auth");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken: tokenState,
        isAuthenticated: !!tokenState,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
