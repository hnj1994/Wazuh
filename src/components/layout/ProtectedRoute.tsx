import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuthStore } from "@/store/authStore";

export function ProtectedRoute() {
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const location = useLocation();

  const isExpired = session ? new Date(session.expiresAt).getTime() < Date.now() : false;

  // Clear the persisted stale session so the user isn't stuck in a loop
  useEffect(() => {
    if (isExpired) logout();
  }, [isExpired, logout]);

  if (!session || isExpired) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return <Outlet />;
}
