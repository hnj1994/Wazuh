import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export function ProtectedRoute() {
  const session = useAuthStore((state) => state.session);
  const location = useLocation();

  if (!session) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (new Date(session.expiresAt).getTime() < Date.now()) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
