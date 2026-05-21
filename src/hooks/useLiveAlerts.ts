import { useCallback, useEffect } from "react";
import { liveAlertClient } from "@/services/websocket/liveAlerts";
import { useSocStore } from "@/store/socStore";
import { useUiStore } from "@/store/uiStore";

export function useLiveAlerts(enabled: boolean, tenantId?: string) {
  const addLiveAlert = useSocStore((state) => state.addLiveAlert);
  const setLiveConnected = useUiStore((state) => state.setLiveConnected);
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
    liveAlertClient.connect();

    return () => {
      unsubscribeAlert();
      unsubscribeStatus();
      liveAlertClient.disconnect();
    };
  }, [enabled, handleAlert, setLiveConnected]);
}
