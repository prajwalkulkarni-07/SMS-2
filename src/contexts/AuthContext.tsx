import { createContext, useContext, useState, useCallback } from "react";
import type { User, LoginPayload, RegisterPayload } from "@/types";
import { loginApi, registerApi } from "@/services/auth";
import { toast } from "sonner";

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  mustChangePassword: boolean;
  setMustChangePassword: (value: boolean) => void;
  login: (data: LoginPayload) => Promise<void>;
  register: (data: RegisterPayload) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const getRoleDashboard = (userOrRole: User | string) => {
  const role = typeof userOrRole === "string" ? userOrRole : userOrRole.role;
  const mustChange = typeof userOrRole === "string" ? false : !!userOrRole.must_change_password;
  if (mustChange) return "/force-change-password";
  switch (role) {
    case "admin": return "/admin/dashboard";
    case "teacher": return "/teacher/dashboard";
    case "student": return "/student/dashboard";
    default: return "/login";
  }
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem("user");
    if (!stored || stored === "undefined" || stored === "null") return null;
    try {
      return JSON.parse(stored);
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState<string | null>(() => {
    const stored = localStorage.getItem("token");
    if (!stored || stored === "undefined" || stored === "null") return null;
    return stored;
  });
  const [mustChangePassword, setMustChangePasswordState] = useState<boolean>(() => {
    const stored = localStorage.getItem("user");
    if (!stored || stored === "undefined" || stored === "null") return false;
    try {
      const parsed = JSON.parse(stored);
      return !!parsed?.must_change_password;
    } catch {
      return false;
    }
  });

  const setMustChangePassword = useCallback((value: boolean) => {
    setMustChangePasswordState(value);
    setUser((prev) => {
      if (!prev) return prev;
      const next = { ...prev, must_change_password: value };
      localStorage.setItem("user", JSON.stringify(next));
      return next;
    });
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    setMustChangePasswordState(false);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  }, []);

  const login = useCallback(async (data: LoginPayload) => {
    const res = await loginApi(data);
    const { token: t, user: u } = res.data.data;
    setToken(t);
    setUser(u);
    setMustChangePasswordState(!!u.must_change_password);
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
    toast.success("Logged in successfully");
  }, []);

  const register = useCallback(async (data: RegisterPayload) => {
    const res = await registerApi(data);
    const { token: t, user: u } = res.data.data;
    setToken(t);
    setUser(u);
    setMustChangePasswordState(!!u.must_change_password);
    localStorage.setItem("token", t);
    localStorage.setItem("user", JSON.stringify(u));
    toast.success("Registration successful");
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token,
        mustChangePassword,
        setMustChangePassword,
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
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { getRoleDashboard };
