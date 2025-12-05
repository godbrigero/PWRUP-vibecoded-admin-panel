// src/app/system/page.tsx - Purpose: manage multiple watchdog hosts with process control
"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useSettings } from "@/lib/settings";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import {
  HostCard,
  type HostStatus,
  type PingDataPoint,
  AddHostForm,
} from "@/components/system";
import {
  getSystemStatus,
  setConfig,
  startProcesses,
  stopProcesses,
  setProcesses,
} from "@/lib/watchdogApi";

const STORAGE_KEY = "blitz.system.hosts";

function loadHostsFromStorage(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed) && parsed.every((h) => typeof h === "string")) {
        return parsed as string[];
      }
    }
  } catch {
    // ignore corrupted storage
  }
  return [];
}

function saveHostsToStorage(hosts: string[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(hosts));
  } catch {
    // storage might be unavailable
  }
}

export default function SystemManagementPage() {
  const { settings } = useSettings();
  const defaultBaseUrl = useMemo(
    () => `http://${settings.host}:5000`,
    [settings.host]
  );

  const [hosts, setHosts] = useState<string[]>(() => {
    const stored = loadHostsFromStorage();
    return stored.length > 0 ? stored : [defaultBaseUrl];
  });

  const [hostStatuses, setHostStatuses] = useState<Record<string, HostStatus>>(
    {}
  );
  const [pingHistories, setPingHistories] = useState<
    Record<string, PingDataPoint[]>
  >({});
  const fetchedHostsRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    saveHostsToStorage(hosts);
  }, [hosts]);

  const refreshHostStatus = useCallback(async (hostUrl: string) => {
    setHostStatuses((prev) => ({
      ...prev,
      [hostUrl]: {
        systemInfo: prev[hostUrl]?.systemInfo || "",
        activeProcesses: prev[hostUrl]?.activeProcesses || [],
        possibleProcesses: prev[hostUrl]?.possibleProcesses || [],
        configSet: prev[hostUrl]?.configSet || false,
        ping: prev[hostUrl]?.ping || null,
        loading: true,
        error: null,
      },
    }));

    const startTime = performance.now();
    try {
      const status = await getSystemStatus(hostUrl);
      const endTime = performance.now();
      const ping = Math.round(endTime - startTime);

      // Add ping to history
      const now = new Date();
      const timeLabel = `${now.getHours().toString().padStart(2, "0")}:${now
        .getMinutes()
        .toString()
        .padStart(2, "0")}:${now.getSeconds().toString().padStart(2, "0")}`;
      const pingPoint: PingDataPoint = {
        time: timeLabel,
        ping,
        timestamp: now.getTime(),
      };

      setPingHistories((prev) => {
        const history = prev[hostUrl] || [];
        const newHistory = [...history, pingPoint];
        // Keep only last 60 data points (1 minute if refreshing every second)
        return {
          ...prev,
          [hostUrl]: newHistory.slice(-60),
        };
      });

      setHostStatuses((prev) => ({
        ...prev,
        [hostUrl]: {
          systemInfo: status.system_info,
          activeProcesses: status.active_processes || [],
          possibleProcesses: status.possible_processes || [],
          configSet: status.config_set,
          ping,
          loading: false,
          error: null,
        },
      }));
    } catch (e) {
      setHostStatuses((prev) => ({
        ...prev,
        [hostUrl]: {
          systemInfo: prev[hostUrl]?.systemInfo || "",
          activeProcesses: prev[hostUrl]?.activeProcesses || [],
          possibleProcesses: prev[hostUrl]?.possibleProcesses || [],
          configSet: prev[hostUrl]?.configSet || false,
          ping: null,
          loading: false,
          error: (e as Error).message,
        },
      }));
    }
  }, []);

  useEffect(() => {
    hosts.forEach((host) => {
      // Fetch if we haven't fetched this host yet
      if (!fetchedHostsRef.current.has(host)) {
        fetchedHostsRef.current.add(host);
        refreshHostStatus(host);
      }
    });
  }, [hosts, refreshHostStatus]);

  const addHost = useCallback((url: string) => {
    setHosts((prev) => {
      if (prev.includes(url)) return prev;
      return [...prev, url];
    });
  }, []);

  const removeHost = useCallback((url: string) => {
    setHosts((prev) => prev.filter((h) => h !== url));
    setHostStatuses((prev) => {
      const next = { ...prev };
      delete next[url];
      return next;
    });
    setPingHistories((prev) => {
      const next = { ...prev };
      delete next[url];
      return next;
    });
    fetchedHostsRef.current.delete(url);
  }, []);

  const handleStartProcess = useCallback(
    async (hostUrl: string, processTypes: string[]) => {
      setHostStatuses((prev) => ({
        ...prev,
        [hostUrl]: {
          systemInfo: prev[hostUrl]?.systemInfo || "",
          activeProcesses: prev[hostUrl]?.activeProcesses || [],
          possibleProcesses: prev[hostUrl]?.possibleProcesses || [],
          configSet: prev[hostUrl]?.configSet || false,
          ping: prev[hostUrl]?.ping || null,
          loading: true,
          error: null,
        },
      }));

      try {
        await startProcesses(hostUrl, processTypes);
        await refreshHostStatus(hostUrl);
      } catch (e) {
        setHostStatuses((prev) => ({
          ...prev,
          [hostUrl]: {
            systemInfo: prev[hostUrl]?.systemInfo || "",
            activeProcesses: prev[hostUrl]?.activeProcesses || [],
            possibleProcesses: prev[hostUrl]?.possibleProcesses || [],
            configSet: prev[hostUrl]?.configSet || false,
            loading: false,
            error: (e as Error).message,
          },
        }));
      }
    },
    [refreshHostStatus]
  );

  const handleStopProcess = useCallback(
    async (hostUrl: string, processTypes: string[]) => {
      setHostStatuses((prev) => ({
        ...prev,
        [hostUrl]: {
          systemInfo: prev[hostUrl]?.systemInfo || "",
          activeProcesses: prev[hostUrl]?.activeProcesses || [],
          possibleProcesses: prev[hostUrl]?.possibleProcesses || [],
          configSet: prev[hostUrl]?.configSet || false,
          ping: prev[hostUrl]?.ping || null,
          loading: true,
          error: null,
        },
      }));

      try {
        await stopProcesses(hostUrl, processTypes);
        await refreshHostStatus(hostUrl);
      } catch (e) {
        setHostStatuses((prev) => ({
          ...prev,
          [hostUrl]: {
            systemInfo: prev[hostUrl]?.systemInfo || "",
            activeProcesses: prev[hostUrl]?.activeProcesses || [],
            possibleProcesses: prev[hostUrl]?.possibleProcesses || [],
            configSet: prev[hostUrl]?.configSet || false,
            loading: false,
            error: (e as Error).message,
          },
        }));
      }
    },
    [refreshHostStatus]
  );

  const handleSetConfig = useCallback(
    async (hostUrl: string, config: string) => {
      try {
        await setConfig(hostUrl, config);
        await refreshHostStatus(hostUrl);
      } catch (e) {
        setHostStatuses((prev) => ({
          ...prev,
          [hostUrl]: {
            systemInfo: prev[hostUrl]?.systemInfo || "",
            activeProcesses: prev[hostUrl]?.activeProcesses || [],
            possibleProcesses: prev[hostUrl]?.possibleProcesses || [],
            configSet: prev[hostUrl]?.configSet || false,
            loading: false,
            error: (e as Error).message,
          },
        }));
      }
    },
    [refreshHostStatus]
  );

  const handleSetProcesses = useCallback(
    async (hostUrl: string, processes: string[]) => {
      setHostStatuses((prev) => ({
        ...prev,
        [hostUrl]: {
          systemInfo: prev[hostUrl]?.systemInfo || "",
          activeProcesses: prev[hostUrl]?.activeProcesses || [],
          possibleProcesses: prev[hostUrl]?.possibleProcesses || [],
          configSet: prev[hostUrl]?.configSet || false,
          ping: prev[hostUrl]?.ping || null,
          loading: true,
          error: null,
        },
      }));

      try {
        await setProcesses(hostUrl, processes);
        await refreshHostStatus(hostUrl);
      } catch (e) {
        setHostStatuses((prev) => ({
          ...prev,
          [hostUrl]: {
            systemInfo: prev[hostUrl]?.systemInfo || "",
            activeProcesses: prev[hostUrl]?.activeProcesses || [],
            possibleProcesses: prev[hostUrl]?.possibleProcesses || [],
            configSet: prev[hostUrl]?.configSet || false,
            loading: false,
            error: (e as Error).message,
          },
        }));
      }
    },
    [refreshHostStatus]
  );

  return (
    <main className="min-h-screen text-white">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-gray-300 hover:text-white underline cursor-pointer"
            >
              Back
            </Link>
            <h1 className="text-2xl font-bold">System Management</h1>
          </div>
          <ConnectionBadge />
        </div>

        <AddHostForm onAdd={addHost} defaultPort={5000} />

        {hosts.length === 0 ? (
          <div className="text-center text-gray-400 py-8">
            No hosts added. Add a host above to get started.
          </div>
        ) : (
          <div className="space-y-4">
            {hosts.map((hostUrl) => (
              <HostCard
                key={hostUrl}
                hostUrl={hostUrl}
                status={
                  hostStatuses[hostUrl] || {
                    systemInfo: "",
                    activeProcesses: [],
                    possibleProcesses: [],
                    configSet: false,
                    ping: null,
                    loading: false,
                  }
                }
                pingHistory={pingHistories[hostUrl] || []}
                onRefresh={() => refreshHostStatus(hostUrl)}
                onStartProcess={(processes) =>
                  handleStartProcess(hostUrl, processes)
                }
                onStopProcess={(processes) =>
                  handleStopProcess(hostUrl, processes)
                }
                onSetConfig={(config) => handleSetConfig(hostUrl, config)}
                onSetProcesses={(processes) =>
                  handleSetProcesses(hostUrl, processes)
                }
                onRemove={() => removeHost(hostUrl)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
}
