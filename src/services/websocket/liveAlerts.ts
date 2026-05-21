import { alerts as demoAlerts } from "@/data/demoData";
import { runtimeConfig } from "@/services/api/client";
import type { Alert } from "@/types";

type AlertCallback = (alert: Alert) => void;
type StatusCallback = (connected: boolean) => void;

export class LiveAlertClient {
  private socket?: WebSocket;
  private timer?: number;
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

  connect() {
    if (runtimeConfig.useMocks || !runtimeConfig.wazuhWsUrl) {
      this.startDemoStream();
      return;
    }

    const wsUrl = runtimeConfig.wazuhWsUrl.startsWith("/")
      ? `${window.location.protocol === "https:" ? "wss" : "ws"}://${window.location.host}${runtimeConfig.wazuhWsUrl}`
      : runtimeConfig.wazuhWsUrl;

    this.socket = new WebSocket(wsUrl);
    this.socket.onopen = () => this.setConnected(true);
    this.socket.onclose = () => this.setConnected(false);
    this.socket.onerror = () => this.setConnected(false);
    this.socket.onmessage = (event) => {
      try {
        const alert = JSON.parse(event.data) as Alert;
        this.emit(alert);
      } catch {
        return;
      }
    };
  }

  disconnect() {
    if (this.timer) window.clearInterval(this.timer);
    this.timer = undefined;
    this.socket?.close();
    this.socket = undefined;
    this.setConnected(false);
  }

  private startDemoStream() {
    this.setConnected(true);
    if (this.timer) return;
    this.timer = window.setInterval(() => {
      const source = demoAlerts[this.counter % demoAlerts.length];
      this.counter += 1;
      this.emit({
        ...source,
        id: `${source.id}-LIVE-${this.counter}`,
        timestamp: new Date().toISOString(),
        status: "new",
        riskScore: Math.min(99, source.riskScore + (this.counter % 4))
      });
    }, 12000);
  }

  private emit(alert: Alert) {
    this.callbacks.forEach((callback) => callback(alert));
  }

  private setConnected(connected: boolean) {
    this.statusCallbacks.forEach((callback) => callback(connected));
  }
}

export const liveAlertClient = new LiveAlertClient();
