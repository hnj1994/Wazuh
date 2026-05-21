import { useCallback, useEffect } from "react";
import { liveAlertClient } from "@/services/websocket/liveAlerts";
import { useAuthStore } from "@/store/authStore";
import { useSocStore } from "@/store/socStore";
import { useUiStore } from "@/store/uiStore";

export function useLiveAlerts(enabled: boolean, tenantId?: string) {
  const addLiveAlert = useSocStore((state) => state.addLiveAlert);
  const setLiveConnected = useUiStore((state) => state.setLiveConnected);
  // Read the session token so the WS connection can authenticate itself
  const token = useAuthStore((state) => state.session?.token);

  const handleAlert = useCallback(
    (alert: Parameters<typeof addLiveAlert>[0]) => {
      if (tenantId && alert.tenantId !== tenantId) return;
      addLiveAlert(alert);
    },
    [addLiveAlert, tenantId]
  );

  useEffect(() => {
    if (!enabled) return;

    const unsubscribeAlert = liveAlertClient.subscribe(handleAlert);
    const unsubscribeStatus = liveAlertClient.onStatus(setLiveConnected);
    // Pass session token so the BFF WebSocket endpoint can validate the caller
    liveAlertClient.connect(token);

    return () => {
      unsubscribeAlert();
      unsubscribeStatus();
      liveAlertClient.disconnect();
    };
    // Re-connect if the token changes (e.g. after re-login)
  }, [enabled, handleAlert, setLiveConnected, token]);
}
