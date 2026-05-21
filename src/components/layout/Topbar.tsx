import { Bot, LogOut, Menu, Moon, Radio, Sun, X } from "lucide-react";
import { useState } from "react";
import { NavLink } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlobalSearch } from "@/components/search/GlobalSearch";
import { TenantSwitcher } from "@/components/layout/TenantSwitcher";
import { navItems } from "@/components/layout/Sidebar";
import { roleLabel } from "@/lib/rbac";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/authStore";
import { useUiStore } from "@/store/uiStore";

export function Topbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const session = useAuthStore((state) => state.session);
  const logout = useAuthStore((state) => state.logout);
  const theme = useUiStore((state) => state.theme);
  const toggleTheme = useUiStore((state) => state.toggleTheme);
  const assistantOpen = useUiStore((state) => state.assistantOpen);
  const setAssistantOpen = useUiStore((state) => state.setAssistantOpen);
  const liveConnected = useUiStore((state) => state.liveConnected);

  return (
    <header className="sticky top-0 z-30 flex min-h-16 items-center gap-3 border-b bg-background/80 px-4 backdrop-blur-xl">
      <Button variant="ghost" size="icon" className="lg:hidden" aria-label="Open navigation" onClick={() => setMobileOpen(true)}>
        <Menu className="h-5 w-5" />
      </Button>
      <GlobalSearch />
      <div className="ml-auto hidden items-center gap-2 md:flex">
        <Badge variant="outline" className={cn(liveConnected ? "border-emerald-500/40 text-emerald-300" : "")}>
          <Radio className="mr-1 h-3.5 w-3.5 animate-pulse-line" />
          {liveConnected ? "Live" : "Offline"}
        </Badge>
        <TenantSwitcher />
        <Button variant="outline" size="icon" onClick={toggleTheme} aria-label="Toggle theme">
          {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Button
          variant={assistantOpen ? "premium" : "outline"}
          size="icon"
          onClick={() => setAssistantOpen(!assistantOpen)}
          aria-label="Toggle SOC copilot"
        >
          <Bot className="h-4 w-4" />
        </Button>
        {session ? (
          <div className="hidden min-w-0 border-l pl-3 xl:block">
            <p className="truncate text-sm font-medium">{session.user.name}</p>
            <p className="truncate text-xs text-muted-foreground">{roleLabel(session.user.role)}</p>
          </div>
        ) : null}
        <Button variant="ghost" size="icon" onClick={logout} aria-label="Sign out">
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
      {mobileOpen ? (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button className="absolute inset-0 bg-background/80" aria-label="Close navigation" onClick={() => setMobileOpen(false)} />
          <div className="absolute left-0 top-0 h-full w-[300px] border-r bg-card p-4 shadow-panel">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">Helios AI SOC</p>
                <p className="text-xs text-muted-foreground">Navigation</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setMobileOpen(false)} aria-label="Close navigation">
                <X className="h-4 w-4" />
              </Button>
            </div>
            <nav className="space-y-1">
              {navItems.map((item) => (
                <NavLink
                  key={item.href}
                  to={item.href}
                  onClick={() => setMobileOpen(false)}
                  className={({ isActive }) =>
                    cn(
                      "flex h-10 items-center gap-3 rounded-md px-3 text-sm font-medium text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                      isActive && "border border-primary/20 bg-primary/10 text-primary"
                    )
                  }
                >
                  <item.icon className="h-4 w-4" />
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>
        </div>
      ) : null}
    </header>
  );
}
