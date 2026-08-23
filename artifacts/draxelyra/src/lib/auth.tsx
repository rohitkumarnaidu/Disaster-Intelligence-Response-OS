import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { customFetch } from "@workspace/api-client-react";
import { useLocation } from "wouter";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: any) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [, setLocation] = useLocation();

  useEffect(() => {
    customFetch<User>("/api/auth/me")
      .then((u: User) => setUser(u))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const login = async (data: any) => {
    const u = await customFetch<User>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(data),
    });
    setUser(u);
    setLocation("/");
  };

  const logout = async () => {
    await customFetch("/api/auth/logout", { method: "POST" });
    setUser(null);
    setLocation("/login");
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
