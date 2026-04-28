import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import type { Role } from "@/types";

interface AuthGuardProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export default function AuthGuard({ children, allowedRoles }: AuthGuardProps) {
  const { isAuthenticated, user, mustChangePassword } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && user && !allowedRoles.includes(user.role)) {
    return <Navigate to="/login" replace />;
  }

  if (mustChangePassword && location.pathname !== "/force-change-password") {
    return <Navigate to="/force-change-password" replace />;
  }

  if (!mustChangePassword && location.pathname === "/force-change-password" && user) {
    if (user.role === "admin") return <Navigate to="/admin/dashboard" replace />;
    if (user.role === "teacher") return <Navigate to="/teacher/dashboard" replace />;
    if (user.role === "student") return <Navigate to="/student/dashboard" replace />;
  }

  return <>{children}</>;
}
