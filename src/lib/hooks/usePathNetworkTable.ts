"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NetworkTables, NetworkTablesTypeInfos } from "ntcore-ts-client";
import { ntPathFromTableAndEntry, useSettings } from "@/lib/settings";

type StringTopicApi = {
  publish: () => Promise<void | unknown>;
  setValue: (value: string) => void;
  subscribe: (callback: (nextValue: string | null) => void) => number;
  unsubscribe: (subUid: number) => void;
  publisher: boolean;
};

export interface PathNetworkTableState {
  robotIp: string;
  topic: string;
  isConnected: boolean;
  selectedAutoFromRobot: string | null;
  lastUpdatedMs: number | null;
  publishSelectedAuto: (autoName: string) => Promise<void>;
  lastPublishMs: number | null;
  publishError: string | null;
}

export function usePathNetworkTable(): PathNetworkTableState {
  const { settings } = useSettings();
  const [isConnected, setIsConnected] = useState(false);
  const [selectedAutoFromRobot, setSelectedAutoFromRobot] = useState<string | null>(null);
  const [lastUpdatedMs, setLastUpdatedMs] = useState<number | null>(null);
  const [lastPublishMs, setLastPublishMs] = useState<number | null>(null);
  const [publishError, setPublishError] = useState<string | null>(null);
  const topicRef = useRef<StringTopicApi | null>(null);

  const robotIp = useMemo(
    () => settings.networkTables.host.trim(),
    [settings.networkTables.host],
  );

  const topic = useMemo(
    () =>
      ntPathFromTableAndEntry(
        settings.networkTables.sharedTable,
        settings.networkTables.autonomousSelectedEntry,
      ),
    [
      settings.networkTables.sharedTable,
      settings.networkTables.autonomousSelectedEntry,
    ],
  );

  useEffect(() => {
    if (!robotIp) {
      setIsConnected(false);
      return;
    }
    const nt = NetworkTables.getInstanceByURI(robotIp, settings.networkTables.port);
    const selectedAutoTopic = nt.createTopic<string>(topic, NetworkTablesTypeInfos.kString, "NONE");
    topicRef.current = selectedAutoTopic;

    const removeConnectionListener = nt.addRobotConnectionListener((connected) => {
      setIsConnected(connected);
    }, true);

    const subUid = selectedAutoTopic.subscribe((nextValue) => {
      if (typeof nextValue !== "string") return;
      const trimmed = nextValue.trim();
      if (!trimmed || trimmed.toUpperCase() === "NONE") {
        setSelectedAutoFromRobot(null);
      } else {
        setSelectedAutoFromRobot(trimmed);
      }
      setLastUpdatedMs(Date.now());
    });

    return () => {
      removeConnectionListener();
      selectedAutoTopic.unsubscribe(subUid);
      topicRef.current = null;
    };
  }, [robotIp, settings.networkTables.port, topic]);

  const publishSelectedAuto = useCallback(async (autoName: string) => {
    const topicApi = topicRef.current;
    if (!topicApi) {
      throw new Error("NetworkTables topic is not ready.");
    }

    const nextValue = autoName.trim().length > 0 ? autoName.trim() : "NONE";
    try {
      if (!topicApi.publisher) {
        await topicApi.publish();
      }
      topicApi.setValue(nextValue);
      setPublishError(null);
      setLastPublishMs(Date.now());
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      setPublishError(message);
      throw error;
    }
  }, []);

  return {
    robotIp,
    topic,
    isConnected,
    selectedAutoFromRobot,
    lastUpdatedMs,
    publishSelectedAuto,
    lastPublishMs,
    publishError,
  };
}
