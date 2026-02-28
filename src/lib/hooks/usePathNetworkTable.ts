"use client";

import { useEffect, useMemo, useState } from "react";
import { NetworkTables, NetworkTablesTypeInfos } from "ntcore-ts-client";
import { frcTeamToRobotIp, useSettings } from "@/lib/settings";

export interface PathNetworkTableState {
  robotIp: string;
  topic: string;
  isConnected: boolean;
  currentPath: string | null;
  lastUpdatedMs: number | null;
}

export function usePathNetworkTable(): PathNetworkTableState {
  const { settings } = useSettings();
  const [isConnected, setIsConnected] = useState(false);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [lastUpdatedMs, setLastUpdatedMs] = useState<number | null>(null);

  const robotIp = useMemo(
    () =>
      frcTeamToRobotIp(
        settings.networkTables.teamNumber,
        settings.networkTables.robotIpLastOctet,
      ),
    [
      settings.networkTables.teamNumber,
      settings.networkTables.robotIpLastOctet,
    ],
  );

  const topic = settings.networkTables.currentPathTopic.trim();

  useEffect(() => {
    if (!topic) {
      setIsConnected(false);
      setCurrentPath(null);
      setLastUpdatedMs(null);
      return;
    }

    const nt = NetworkTables.getInstanceByURI(robotIp, settings.networkTables.port);
    const pathTopic = nt.createTopic<string>(topic, NetworkTablesTypeInfos.kString, "");

    const removeConnectionListener = nt.addRobotConnectionListener((connected) => {
      setIsConnected(connected);
    }, true);

    const subUid = pathTopic.subscribe((nextValue) => {
      if (typeof nextValue !== "string") return;
      const trimmed = nextValue.trim();
      setCurrentPath(trimmed.length > 0 ? trimmed : null);
      setLastUpdatedMs(Date.now());
    });

    return () => {
      removeConnectionListener();
      pathTopic.unsubscribe(subUid);
    };
  }, [robotIp, settings.networkTables.port, topic]);

  return {
    robotIp,
    topic,
    isConnected,
    currentPath,
    lastUpdatedMs,
  };
}
