import {
  Bell,
  BookOpen,
  BrainCircuit,
  Crosshair,
  FileText,
  LayoutDashboard,
  Network,
  Radar,
  Search,
  Server,
  Settings,
  Shield,
  ShieldCheck,
  Workflow
} from "lucide-react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { useUiStore } from "@/store/uiStore";

export const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Alerts", href: "/alerts", icon: Bell },
  { label: "Threat Hunt", href: "/hunt", icon: Search },
  { label: "MITRE ATT&CK", href: "/mitre", icon: Crosshair },
  { label: "Investigations", href: "/investigations", icon: BrainCircuit },
  { label: "SOAR", href: "/soar", icon: Workflow },
  { label: "Reports", href: "/reports", icon: FileText },
  { label: "Endpoints", href: "/agents", icon: Server },
  { label: "Threat Intel", href: "/threat-intel", icon: Radar },
  { label: "Admin", href: "/admin", icon: Settings }
];

export function Sidebar() {
  const collapsed = useUiStore((state) => state.sidebarCollapsed);
  const setCollapsed = useUiStore((state) => state.setSidebarCollapsed);

  return (
    <aside
      className={cn(
        "sticky top-0 hidden h-screen shrink-0 border-r bg-card/95 backdrop-blur-xl lg:flex lg:flex-col",
        collapsed ? "w-[76px]" : "w-[280px]"
      )}
    >
      <div className="flex h-16 items-center gap-3 border-b px-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-md border border-primary/25 bg-primary/15 text-primary">
          <ShieldCheck className="h-5 w-5" />
        </div>
        {!collapsed ? (
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold">Helios AI SOC</p>
            <p className="truncate text-xs text-muted-foreground">Open security operations</p>
          </div>
        ) : null}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => (
          <NavLink
            key={item.href}
            to={item.href}
            className={({ isActive }) =>
              cn(
                "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted/70 hover:text-foreground",
                isActive && "border border-primary/20 bg-primary/10 text-primary shadow-glow",
                collapsed && "justify-center px-0"
              )
            }
            title={collapsed ? item.label : undefined}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed ? <span className="truncate">{item.label}</span> : null}
          </NavLink>
        ))}
      </nav>

      <div className="border-t p-3">
        <div className={cn("rounded-md border bg-muted/30 p-3", collapsed && "p-2")}>
          <div className={cn("flex items-center gap-2", collapsed && "justify-center")}>
            <Shield className="h-4 w-4 text-emerald-400" />
            {!collapsed ? <span className="text-xs font-medium">Detection fabric healthy</span> : null}
          </div>
          {!collapsed ? (
            <p className="mt-2 text-xs text-muted-foreground">Wazuh, OpenSearch, Ollama, SOAR bus online</p>
          ) : null}
        </div>
        <Button
          variant="ghost"
          size={collapsed ? "icon" : "sm"}
          className="mt-3 w-full justify-center"
          onClick={() => setCollapsed(!collapsed)}
        >
          <Network className="h-4 w-4" />
          {!collapsed ? <span>Collapse</span> : null}
        </Button>
      </div>
    </aside>
  );
}
