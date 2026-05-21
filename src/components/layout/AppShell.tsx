import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { AssistantPanel } from "@/components/chat/AssistantPanel";
import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { useLiveAlerts } from "@/hooks/useLiveAlerts";
import { useAuthStore } from "@/store/authStore";
import { useSocStore } from "@/store/socStore";
import { useUiStore } from "@/store/uiStore";

export function AppShell() {
  const session = useAuthStore((state) => state.session);
  const loadDashboard = useSocStore((state) => state.loadDashboard);
  const assistantOpen = useUiStore((state) => state.assistantOpen);
  const location = useLocation();

  useLiveAlerts(Boolean(session), session?.activeTenantId);

  useEffect(() => {
    if (!session) return;
    void loadDashboard(session.activeTenantId, session.token);
  }, [loadDashboard, session?.activeTenantId, session?.token]);

  useEffect(() => {
    document.title = `Helios AI SOC · ${location.pathname === "/" ? "Dashboard" : location.pathname.slice(1)}`;
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 soc-grid opacity-40" />
      <div className="relative flex min-h-screen">
        <Sidebar />
        <div className="min-w-0 flex-1">
          <Topbar />
          <main
            className={`mx-auto w-full max-w-[1680px] px-4 py-6 transition-[padding] duration-300 md:px-6 ${
              assistantOpen ? "xl:pr-[468px]" : ""
            }`}
          >
            <Outlet />
          </main>
        </div>
      </div>
      <AssistantPanel />
    </div>
  );
}
