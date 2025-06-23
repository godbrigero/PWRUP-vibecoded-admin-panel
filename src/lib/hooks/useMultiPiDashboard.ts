import { useState, useCallback, useEffect, useRef } from "react";
import { AutobahnClient, Address } from "@/lib/AutobahnClient";
import {
  PiStatus,
  LogMessage,
  StatusType,
  StatusBase,
} from "@/generated/status/PiStatus";

const client = new AutobahnClient(new Address("10.47.65.7", 8080));

export interface PiSystemData {
  name: string;
  status: PiStatus | null;
  logs: LogMessage[];
  lastSeen: Date | null;
  isConnected: boolean;
}

export interface GlobalStats {
  totalPis: number;
  activePis: number;
  avgCpuUsage: number;
  avgMemoryUsage: number;
  totalNetworkIn: number;
  totalNetworkOut: number;
}

export function useMultiPiDashboard() {
  const [piSystems, setPiSystems] = useState<Map<string, PiSystemData>>(
    new Map()
  );
  const [isConnected, setIsConnected] = useState(false);
  const subscriptionsRef = useRef<Set<string>>(new Set());
  // Track intentionally removed Pi systems to ignore their messages
  const removedPiSystemsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    client.begin();
    setIsConnected(true);
    return () => {
      setIsConnected(false);
    };
  }, []);

  const handleMessage = useCallback((piName: string) => {
    return async (payload: Uint8Array) => {
      // Ignore messages from intentionally removed Pi systems
      if (removedPiSystemsRef.current.has(piName)) {
        return;
      }

      try {
        const baseMessage = StatusBase.decode(payload);

        setPiSystems((prev) => {
          const updated = new Map(prev);
          const existing = updated.get(piName) || {
            name: piName,
            status: null,
            logs: [],
            lastSeen: null,
            isConnected: false,
          };

          if (baseMessage.type === StatusType.SYSTEM_STATUS) {
            const status = PiStatus.decode(payload);
            updated.set(piName, {
              ...existing,
              status,
              lastSeen: new Date(),
              isConnected: true,
            });
          } else if (baseMessage.type === StatusType.LOG_MESSAGE) {
            const logMsg = LogMessage.decode(payload);
            const newLogs = [...existing.logs, logMsg].slice(-100);
            updated.set(piName, {
              ...existing,
              logs: newLogs,
              lastSeen: new Date(),
              isConnected: true,
            });
          }

          return updated;
        });
      } catch (error) {
        console.error(`Failed to decode message for ${piName}:`, error);
      }
    };
  }, []);

  const addPiSystem = useCallback(
    (piName: string) => {
      if (!piName.trim() || subscriptionsRef.current.has(piName)) return;

      const topic = `${piName}/logs`;
      subscriptionsRef.current.add(piName);
      // Remove from the removed list if it was previously removed
      removedPiSystemsRef.current.delete(piName);

      // Initialize Pi system data
      setPiSystems((prev) => {
        const updated = new Map(prev);
        if (!updated.has(piName)) {
          updated.set(piName, {
            name: piName,
            status: null,
            logs: [],
            lastSeen: null,
            isConnected: false,
          });
        }
        return updated;
      });

      // Subscribe to the Pi's topic
      client.subscribe(topic, handleMessage(piName));
    },
    [handleMessage]
  );

  const removePiSystem = useCallback((piName: string) => {
    subscriptionsRef.current.delete(piName);
    // Add to the removed list to ignore future messages
    removedPiSystemsRef.current.add(piName);

    setPiSystems((prev) => {
      const updated = new Map(prev);
      updated.delete(piName);
      return updated;
    });

    // Unsubscribe from the topic
    const topic = `${piName}/logs`;
    client.unsubscribe(topic);
  }, []);

  const clearLogs = useCallback((piName: string) => {
    setPiSystems((prev) => {
      const updated = new Map(prev);
      const existing = updated.get(piName);
      if (existing) {
        updated.set(piName, { ...existing, logs: [] });
      }
      return updated;
    });
  }, []);

  const globalStats: GlobalStats = useCallback(() => {
    const systems = Array.from(piSystems.values());
    const activeSystems = systems.filter((s) => s.status && s.isConnected);

    return {
      totalPis: systems.length,
      activePis: activeSystems.length,
      avgCpuUsage:
        activeSystems.length > 0
          ? activeSystems.reduce(
              (sum, s) => sum + (s.status?.cpuUsageTotal || 0),
              0
            ) / activeSystems.length
          : 0,
      avgMemoryUsage:
        activeSystems.length > 0
          ? activeSystems.reduce(
              (sum, s) => sum + (s.status?.memoryUsage || 0),
              0
            ) / activeSystems.length
          : 0,
      totalNetworkIn: activeSystems.reduce(
        (sum, s) => sum + (s.status?.netUsageIn || 0),
        0
      ),
      totalNetworkOut: activeSystems.reduce(
        (sum, s) => sum + (s.status?.netUsageOut || 0),
        0
      ),
    };
  }, [piSystems])();

  return {
    piSystems,
    globalStats,
    isConnected,
    addPiSystem,
    removePiSystem,
    clearLogs,
  };
}
