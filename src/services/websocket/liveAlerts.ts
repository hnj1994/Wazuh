import { alerts as demoAlerts } from "@/data/demoData";
import { runtimeConfig } from "@/services/api/client";
import type { Alert } from "@/types";

type AlertCallback = (alert: Alert) => void;
type StatusCallback = (connected: boolean) => void;

const MAX_RECONNECT_ATTEMPTS = 10;
const RECONNECT_BASE_MS = 2_000;

export class LiveAlertClient {
  private socket?: WebSocket;
  private demoTimer?: number;
  private reconnectTimer?: number;
  private reconnectAttempts = 0;
  private token?: string;
  private callbacks = new Set<AlertCallback>();
  private statusCallbacks = new Set<StatusCallback>();
  private counter = 0;

  subscribe(callback: AlertCallback) {
    this.callbacks.add(callback);
    return () => this.callbacks.delete(callback);
  }

  onStatus(callback: StatusCallback) {
    this.statusCallbacks.add(callback);
    return () => this.statusCallbacks.delete(callback);
  }

  connect(token?: string) {
    this.token = token;

    if (runtimeConfig.useMocks || !runtimeConfig.wazuhWsUrl) {
      this.startDemoStream();
      return;
    }

    this.openSocket();
  }

  disconnect() {
    // Set attempts to max to stop any pending reconnect
    this.reconnectAttempts = MAX_RECONNECT_ATTEMPTS;

    if (this.demoTimer) window.clearInterval(this.demoTimer);
    if (this.reconnectTimer) window.clearTimeout(this.reconnectTimer);

    this.demoTimer = undefined;
    this.reconnectTimer = undefined;
    this.socket?.close();
    this.socket = undefined;
    this.setConnected(false);
  }

  private openSocket() {
    const base = runtimeConfig.wazuhWsUrl.startsWith("/")
      ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}${runtimeConfig.wazuhWsUrl}`
      : runtimeConfig.wazuhWsUrl;

    // Attach the session token as a query param so the BFF can validate it
    const wsUrl = this.token ? `${base}?token=${encodeURIComponent(this.token)}` : base;

    this.socket = new WebSocket(wsUrl);

    this.socket.onopen = () => {
      this.reconnectAttempts = 0;
      this.setConnected(true);
    };

    this.socket.onclose = () => {
      this.setConnected(false);
      this.scheduleReconnect();
    };

    this.socket.onerror = () => {
      this.setConnected(false);
      // onclose fires after onerror, so reconnect is handled there
    };

    this.socket.onmessage = (event) => {
      try {
        const alert = JSON.parse(event.data as string) as Alert;
        this.emit(alert);
      } catch {
        // ignore malformed messages
      }
    };
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) return;

    // Exponential back-off: 2s, 4s, 8s … capped at 60s
    const delay = Math.min(RECONNECT_BASE_MS * 2 ** this.reconnectAttempts, 60_000);
    this.reconnectAttempts += 1;
    this.reconnectTimer = window.setTimeout(() => this.openSocket(), delay);
  }

  private startDemoStream() {
    this.setConnected(true);
    if (this.demoTimer) return;
    this.demoTimer = window.setInterval(() => {
      const source = demoAlerts[this.counter % demoAlerts.length];
      this.counter += 1;
      this.emit({
        ...source,
        id: `${source.id}-LIVE-${this.counter}`,
        timestamp: new Date().toISOString(),
        status: "new",
        riskScore: Math.min(99, source.riskScore + (this.counter % 4))
      });
    }, 12_000);
  }

  private emit(alert: Alert) {
    this.callbacks.forEach((cb) => cb(alert));
  }

  private setConnected(connected: boolean) {
    this.statusCallbacks.forEach((cb) => cb(connected));
  }
}

export const liveAlertClient = new LiveAlertClient();
