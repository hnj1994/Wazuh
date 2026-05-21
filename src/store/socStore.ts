import { create } from "zustand";
import { socApi } from "@/services/socApi";
import { useAuthStore } from "@/store/authStore";
import type {
  Agent,
  Alert,
  ChatMessage,
  DashboardData,
  HuntQuery,
  HuntResult,
  Incident,
  MitreTechnique,
  SearchFilters,
  SocReport,
  SoarPlaybook,
  ThreatIntelIndicator
} from "@/types";

interface SocState {
  loading: boolean;
  assistantLoading: boolean;
  dashboard?: DashboardData;
  alerts: Alert[];
  agents: Agent[];
  incidents: Incident[];
  mitre: MitreTechnique[];
  playbooks: SoarPlaybook[];
  huntQueries: HuntQuery[];
  huntResults: HuntResult[];
  threatIntel: ThreatIntelIndicator[];
  selectedAlert?: Alert;
  report?: SocReport;
  chatMessages: ChatMessage[];
  loadDashboard: (tenantId: string, token?: string) => Promise<void>;
  searchAlerts: (filters: SearchFilters, token?: string) => Promise<void>;
  selectAlert: (alert?: Alert) => void;
  selectAlertById: (alertId: string) => Promise<Alert | undefined>;
  runHunt: (query: string, tenantId: string) => Promise<void>;
  loadHuntQueries: () => Promise<void>;
  loadMitre: () => Promise<void>;
  loadPlaybooks: () => Promise<void>;
  runPlaybook: (playbookId: string) => Promise<void>;
  loadThreatIntel: () => Promise<void>;
  enrichIndicator: (value: string) => Promise<ThreatIntelIndicator>;
  generateReport: (tenantId: string) => Promise<void>;
  askAssistant: (content: string, tenantId: string, token?: string) => Promise<void>;
  addLiveAlert: (alert: Alert) => void;
}

const welcomeMessage: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "I am online with Wazuh, OpenSearch, and Ollama context. Ask for failed logins, suspicious PowerShell, alert explanations, or an incident timeline.",
  timestamp: new Date().toISOString()
};

export const useSocStore = create<SocState>((set, get) => ({
  loading: false,
  assistantLoading: false,
  alerts: [],
  agents: [],
  incidents: [],
  mitre: [],
  playbooks: [],
  huntQueries: [],
  huntResults: [],
  threatIntel: [],
  chatMessages: [welcomeMessage],

  async loadDashboard(tenantId, token) {
    set({ loading: true });
    const dashboard = await socApi.getDashboardData(tenantId, token);
    set({
      dashboard,
      alerts: dashboard.alerts,
      agents: dashboard.agents,
      incidents: dashboard.incidents,
      mitre: dashboard.mitre,
      playbooks: dashboard.playbooks,
      loading: false
    });
  },

  async searchAlerts(filters, token) {
    set({ loading: true });
    const results = await socApi.searchAlerts(filters, token);
    set({ alerts: results, loading: false });
  },

  selectAlert(alert) {
    set({ selectedAlert: alert });
  },

  async selectAlertById(alertId) {
    const existing = get().alerts.find((alert) => alert.id === alertId);
    if (existing) {
      set({ selectedAlert: existing });
      return existing;
    }
    const { session } = useAuthStore.getState();
    const alert = await socApi.getAlert(alertId, session?.token);
    set({ selectedAlert: alert });
    return alert;
  },

  async runHunt(query, tenantId) {
    set({ loading: true });
    const { session } = useAuthStore.getState();
    const results = await socApi.runHunt(query, tenantId, session?.token);
    set({ huntResults: results, loading: false });
  },

  async loadHuntQueries() {
    const huntQueries = await socApi.getHuntQueries();
    set({ huntQueries });
  },

  async loadMitre() {
    const mitre = await socApi.getMitreCoverage();
    set({ mitre });
  },

  async loadPlaybooks() {
    const playbooks = await socApi.getPlaybooks();
    set({ playbooks });
  },

  async runPlaybook(playbookId) {
    const current = get().playbooks;
    set({
      playbooks: current.map((playbook) =>
        playbook.id === playbookId
          ? {
              ...playbook,
              steps: playbook.steps.map((step) => ({ ...step, status: step.status === "idle" ? "running" : step.status }))
            }
          : playbook
      )
    });
    const updated = await socApi.runPlaybook(playbookId);
    if (!updated) return;
    set({
      playbooks: get().playbooks.map((playbook) =>
        playbook.id === playbookId
          ? {
              ...updated,
              lastRun: new Date().toISOString(),
              steps: updated.steps.map((step) => ({ ...step, status: "success" }))
            }
          : playbook
      )
    });
  },

  async loadThreatIntel() {
    const threatIntel = await socApi.getThreatIntel();
    set({ threatIntel });
  },

  async enrichIndicator(value) {
    const indicator = await socApi.enrichIndicator(value);
    set({ threatIntel: [indicator, ...get().threatIntel.filter((item) => item.value !== indicator.value)] });
    return indicator;
  },

  async generateReport(tenantId) {
    set({ loading: true });
    const report = await socApi.generateReport(tenantId);
    set({ report, loading: false });
  },

  async askAssistant(content, tenantId, token) {
    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content,
      timestamp: new Date().toISOString()
    };
    const messages = [...get().chatMessages, userMessage];
    set({ chatMessages: messages, assistantLoading: true });
    const answer = await socApi.askAssistant(messages, tenantId, get().selectedAlert, token);
    const assistantMessage: ChatMessage = {
      id: `assistant-${Date.now()}`,
      role: "assistant",
      content: answer,
      timestamp: new Date().toISOString(),
      relatedAlertId: get().selectedAlert?.id
    };
    set({ chatMessages: [...messages, assistantMessage], assistantLoading: false });
  },

  addLiveAlert(alert) {
    const currentAlerts = get().alerts;
    const nextAlerts = [alert, ...currentAlerts].slice(0, 250);
    set({
      alerts: nextAlerts,
      dashboard: get().dashboard
        ? {
            ...get().dashboard,
            alerts: [alert, ...get().dashboard.alerts].slice(0, 250)
          }
        : undefined
    });
  }
}));
