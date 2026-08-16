import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { authApi, getToken, setToken as persistToken, ApiError } from "@/lib/api";

type User = { id: string; name: string; email: string; homeCurrency: string } | null;

type AuthContextType = {
  user: User;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await authApi.me();
        setUser(res.user);
      } catch (err) {
        // token expired/invalid — clear it silently
        await persistToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await authApi.login({ email, password });
    await persistToken(res.token);
    setUser(res.user);
  };

  const register = async (name: string, email: string, password: string) => {
    const res = await authApi.register({ name, email, password });
    await persistToken(res.token);
    setUser(res.user);
  };

  const logout = async () => {
    await persistToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}

/** Redirects to /login once auth state has resolved and no user is present. */
export function useRequireAuth() {
  const { user, loading } = useAuth();
  useEffect(() => {
    if (!loading && !user) {
      // Deferred import to avoid a circular dependency at module init time.
      import("expo-router").then(({ router }) => router.replace("/login"));
    }
  }, [loading, user]);
  return { user, loading };
}

export { ApiError };
