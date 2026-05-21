import { Navigate, Route, Routes } from "react-router-dom";
import { AppShell } from "@/components/layout/AppShell";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import { useThemeSync } from "@/hooks/useThemeSync";
import { AdminPage } from "@/pages/AdminPage";
import { AgentsPage } from "@/pages/AgentsPage";
import { AlertDetailPage } from "@/pages/AlertDetailPage";
import { AlertsPage } from "@/pages/AlertsPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { HuntPage } from "@/pages/HuntPage";
import { IncidentsPage } from "@/pages/IncidentsPage";
import { LoginPage } from "@/pages/LoginPage";
import { MitrePage } from "@/pages/MitrePage";
import { ReportsPage } from "@/pages/ReportsPage";
import { SoarPage } from "@/pages/SoarPage";
import { ThreatIntelPage } from "@/pages/ThreatIntelPage";

export default function App() {
  useThemeSync();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute />}>
        <Route element={<AppShell />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/alerts" element={<AlertsPage />} />
          <Route path="/alerts/:alertId" element={<AlertDetailPage />} />
          <Route path="/hunt" element={<HuntPage />} />
          <Route path="/mitre" element={<MitrePage />} />
          <Route path="/investigations" element={<IncidentsPage />} />
          <Route path="/soar" element={<SoarPage />} />
          <Route path="/reports" element={<ReportsPage />} />
          <Route path="/agents" element={<AgentsPage />} />
          <Route path="/threat-intel" element={<ThreatIntelPage />} />
          <Route path="/admin" element={<AdminPage />} />
        </Route>
      </Route>
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}
