import { createContext, useContext, useEffect, useState } from "react";
import { api } from "../../shared/lib/axios";

type User = {
  id: string;
  name: string | null;
  email: string;
  phone?: string | null;
  userCode?: string;
  avatar?: string | null;
  isOnline?: boolean;
  lastSeen?: string | null;
};

type AuthContextType = {
  user: User | null;
  token: string | null;
  loading: boolean;
  signIn: (payload: { email: string; password: string }) => Promise<void>;
  signUp: (formData: FormData) => Promise<void>;
  refreshMe: () => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("chat.token")
  );
  const [loading, setLoading] = useState(true);

  async function loadMe() {
    try {
      if (!localStorage.getItem("chat.token")) {
        setLoading(false);
        return;
      }

      const response = await api.get("/users/me");
      setUser(response.data);
    } catch {
      localStorage.removeItem("chat.token");
      setToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadMe();
  }, [token]);

  async function signIn(payload: { email: string; password: string }) {
    const response = await api.post("/auth/login", payload);

    localStorage.setItem("chat.token", response.data.token);
    setToken(response.data.token);
    setUser(response.data.user);
  }

  async function signUp(formData: FormData) {
    const response = await api.post("/auth/register", formData);

    localStorage.setItem("chat.token", response.data.token);
    setToken(response.data.token);
    setUser(response.data.user);
  }

  async function refreshMe() {
    await loadMe();
  }

  function logout() {
    localStorage.removeItem("chat.token");
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{ user, token, loading, signIn, signUp, refreshMe, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}