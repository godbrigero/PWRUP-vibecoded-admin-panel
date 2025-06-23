import { useState, useCallback, useEffect } from "react";
import { useSubscription } from "@/lib/useSubscription";
import { AutobahnClient, Address } from "@/lib/AutobahnClient";
import {
  PiStatus,
  LogMessage,
  StatusType,
  StatusBase,
} from "@/generated/status/PiStatus";

const client = new AutobahnClient(new Address("10.47.65.7", 8080));

export function useDashboardData() {
  const [piStats, setPiStats] = useState<PiStatus | null>(null);
  const [logMessages, setLogMessages] = useState<LogMessage[]>([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    client.begin();
    setIsConnected(true);
    return () => {
      setIsConnected(false);
    };
  }, []);

  const handleStatusMessage = useCallback(async (payload: Uint8Array) => {
    try {
      const baseMessage = StatusBase.decode(payload);

      if (baseMessage.type === StatusType.SYSTEM_STATUS) {
        const status = PiStatus.decode(payload);
        setPiStats(status);
      } else if (baseMessage.type === StatusType.LOG_MESSAGE) {
        const logMsg = LogMessage.decode(payload);
        setLogMessages((prev) => {
          const newMessages = [...prev, logMsg];
          return newMessages.slice(-100);
        });
      }
    } catch (error) {
      console.error("Failed to decode status message:", error);
    }
  }, []);

  const clearLogs = useCallback(() => {
    setLogMessages([]);
  }, []);

  useSubscription("tripoli/logs", handleStatusMessage, client);

  return {
    piStats,
    logMessages,
    isConnected,
    clearLogs,
  };
}
