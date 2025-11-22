// src/app/system/page.tsx - Purpose: manage system via Watchdog API (status, config, start/stop)
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSettings } from "@/lib/settings";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { Card, CardHeader } from "@/components/ui/Card";
import {
  getSystemStatus,
  setConfig as apiSetConfig,
  startProcesses,
  stopProcesses,
} from "@/lib/watchdogApi";

export default function SystemManagementPage() {
  const { settings } = useSettings();
  const defaultBaseUrl = useMemo(
    () => `http://${settings.host}:5000`,
    [settings.host]
  );
  const [baseUrl, setBaseUrl] = useState<string>(defaultBaseUrl);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const [systemInfo, setSystemInfo] = useState<string>("");
  const [activeProcesses, setActiveProcesses] = useState<string[]>([]);
  const [configSet, setConfigSet] = useState<boolean>(false);

  const [configText, setConfigText] = useState<string>("");
  const [processInput, setProcessInput] = useState<string>("");

  async function refreshStatus() {
    setLoading(true);
    setError(null);
    try {
      const status = await getSystemStatus(baseUrl);
      setSystemInfo(status.system_info);
      setActiveProcesses(status.active_processes);
      setConfigSet(status.config_set);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refreshStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [baseUrl]);

  async function onSaveConfig() {
    setLoading(true);
    setError(null);
    try {
      await apiSetConfig(baseUrl, configText);
      await refreshStatus();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  function parseProcesses(input: string): string[] {
    return input
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
  }

  async function onStart() {
    const proc = parseProcesses(processInput);
    if (!proc.length) return;
    setLoading(true);
    setError(null);
    try {
      await startProcesses(baseUrl, proc);
      await refreshStatus();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  async function onStop() {
    const proc = parseProcesses(processInput);
    if (!proc.length) return;
    setLoading(true);
    setError(null);
    try {
      await stopProcesses(baseUrl, proc);
      await refreshStatus();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

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

        <Card>
          <CardHeader>API Connection</CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="flex flex-col">
              <label className="text-sm text-gray-300 mb-1">Base URL</label>
              <input
                type="text"
                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="http://host:5000"
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
              />
            </div>
            <div className="flex items-end">
              <button
                type="button"
                onClick={refreshStatus}
                className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded"
              >
                Refresh Status
              </button>
            </div>
            <div className="text-xs text-gray-400 flex items-end">
              Defaults to http://{settings.host}:5000
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>System Status</CardHeader>
            <div className="space-y-2">
              {loading && <div className="text-gray-400">Loading...</div>}
              {error && <div className="text-red-400">Error: {error}</div>}
              <div className="text-sm text-gray-300">
                <span className="text-gray-400">System:</span>{" "}
                {systemInfo || "—"}
              </div>
              <div className="text-sm text-gray-300">
                <span className="text-gray-400">Config Set:</span>{" "}
                <span
                  className={configSet ? "text-emerald-400" : "text-red-400"}
                >
                  {configSet ? "Yes" : "No"}
                </span>
              </div>
              <div>
                <div className="text-gray-400 text-sm mb-1">
                  Active Processes
                </div>
                <ul className="list-disc list-inside text-sm text-gray-300 space-y-1">
                  {activeProcesses.length ? (
                    activeProcesses.map((p) => <li key={p}>{p}</li>)
                  ) : (
                    <li className="list-none text-gray-500">None</li>
                  )}
                </ul>
              </div>
            </div>
          </Card>

          <Card>
            <CardHeader>Config</CardHeader>
            <div className="space-y-3">
              <textarea
                className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 min-h-40"
                placeholder="Paste config text here"
                value={configText}
                onChange={(e) => setConfigText(e.target.value)}
              />
              <button
                type="button"
                onClick={onSaveConfig}
                className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded"
              >
                Save Config
              </button>
            </div>
          </Card>

          <Card>
            <CardHeader>Processes</CardHeader>
            <div className="space-y-3">
              <input
                type="text"
                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="Comma-separated names e.g. encoder, relay"
                value={processInput}
                onChange={(e) => setProcessInput(e.target.value)}
              />
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={onStart}
                  className="cursor-pointer bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded"
                >
                  Start
                </button>
                <button
                  type="button"
                  onClick={onStop}
                  className="cursor-pointer bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded"
                >
                  Stop
                </button>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </main>
  );
}
