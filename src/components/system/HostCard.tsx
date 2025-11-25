// src/components/system/HostCard.tsx - Purpose: clean, uncluttered host card with compact process management
"use client";

import React from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { PingChartModal } from "./PingChartModal";

export interface PingDataPoint {
  time: string;
  ping: number;
  timestamp: number;
}

export interface HostStatus {
  systemInfo: string;
  activeProcesses: string[];
  possibleProcesses: string[];
  configSet: boolean;
  ping?: number | null;
  loading?: boolean;
  error?: string | null;
}

interface HostCardProps {
  hostUrl: string;
  status: HostStatus;
  pingHistory: PingDataPoint[];
  onRefresh: () => void;
  onStartProcess: (processes: string[]) => void;
  onStopProcess: (processes: string[]) => void;
  onSetConfig: (config: string) => void;
  onRemove: () => void;
}

export function HostCard({
  hostUrl,
  status,
  pingHistory,
  onRefresh,
  onStartProcess,
  onStopProcess,
  onSetConfig,
  onRemove,
}: HostCardProps) {
  const activeSet = new Set(status.activeProcesses || []);
  const allProcesses = status.possibleProcesses || [];
  const [showConfig, setShowConfig] = React.useState(false);
  const [configInput, setConfigInput] = React.useState("");
  const [showPingChart, setShowPingChart] = React.useState(false);

  // Continuous refresh when ping chart is open
  React.useEffect(() => {
    if (!showPingChart) return;

    const interval = setInterval(() => {
      onRefresh();
    }, 1000); // Refresh every second

    return () => clearInterval(interval);
  }, [showPingChart, onRefresh]);

  async function handleSetConfig() {
    if (!configInput.trim()) return;
    const configValue = configInput.trim();
    setConfigInput("");
    await onSetConfig(configValue);
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-gray-200">{hostUrl}</span>
            <span className="text-xs text-gray-500">•</span>
            <span className="text-xs text-gray-400">{status.systemInfo || "—"}</span>
            {status.ping !== null && status.ping !== undefined && (
              <>
                <span className="text-xs text-gray-500">•</span>
                <button
                  type="button"
                  onClick={() => setShowPingChart(true)}
                  className="cursor-pointer text-xs text-gray-400 hover:text-blue-400 transition-colors underline"
                >
                  {status.ping}ms
                </button>
              </>
            )}
            {status.configSet ? (
              <span className="text-xs px-2 py-0.5 bg-emerald-900/30 text-emerald-400 rounded border border-emerald-700/50">
                Config Set
              </span>
            ) : (
              <span className="text-xs px-2 py-0.5 bg-red-900/30 text-red-400 rounded border border-red-700/50">
                Config Not Updated
              </span>
            )}
            {status.loading && (
              <span className="text-xs text-gray-400 animate-pulse">Loading...</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRefresh}
              className="cursor-pointer text-xs text-emerald-400 hover:text-emerald-300 px-2 py-1 rounded hover:bg-emerald-900/20 transition-colors"
            >
              Refresh
            </button>
            <button
              type="button"
              onClick={onRemove}
              className="cursor-pointer text-xs text-red-400 hover:text-red-300 px-2 py-1 rounded hover:bg-red-900/20 transition-colors"
            >
              Remove
            </button>
          </div>
        </div>
      </CardHeader>

      <div className="space-y-3">
        {status.error && (
          <div className="text-sm text-red-400 bg-red-900/20 border border-red-700/50 p-2 rounded">
            {status.error}
          </div>
        )}

        <div className="flex items-center justify-between">
          <button
            type="button"
            onClick={() => setShowConfig(!showConfig)}
            className="cursor-pointer text-xs text-gray-400 hover:text-gray-300 px-2 py-1 rounded hover:bg-gray-900/50 transition-colors"
          >
            {showConfig ? "Hide" : "Set"} Config
          </button>
        </div>

        {showConfig && (
          <div className="space-y-2 p-3 bg-gray-900/50 rounded border border-gray-700/50">
            <div className="text-xs text-gray-400 mb-1">Base64 Config String</div>
            <textarea
              value={configInput}
              onChange={(e) => setConfigInput(e.target.value)}
              placeholder="Paste base64 config string here..."
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm font-mono text-gray-200 outline-none focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 resize-none"
              rows={3}
            />
            <button
              type="button"
              onClick={handleSetConfig}
              disabled={!configInput.trim() || status.loading}
              className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-3 py-1.5 rounded text-sm transition-colors"
            >
              Set Config
            </button>
          </div>
        )}

        {allProcesses.length === 0 ? (
          <div className="text-sm text-gray-500 text-center py-6">
            No processes available
          </div>
        ) : (
          <div className="space-y-1">
            {allProcesses.map((process) => {
              const isActive = activeSet.has(process);
              return (
                <div
                  key={process}
                  className="flex items-center justify-between px-3 py-2 bg-gray-900/50 rounded border border-gray-700/50 hover:border-gray-600 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <span className="font-mono text-sm text-gray-200 truncate">
                      {process}
                    </span>
                    {isActive && (
                      <span className="flex-shrink-0 text-xs px-2 py-0.5 bg-emerald-900/30 text-emerald-400 rounded border border-emerald-700/50">
                        Running
                      </span>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      isActive
                        ? onStopProcess([process])
                        : onStartProcess([process])
                    }
                    disabled={status.loading}
                    className={`cursor-pointer text-xs px-3 py-1 rounded font-medium transition-colors flex-shrink-0 ${
                      isActive
                        ? "bg-red-600 hover:bg-red-500 text-white"
                        : "bg-blue-600 hover:bg-blue-500 text-white"
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isActive ? "Stop" : "Start"}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <PingChartModal
        isOpen={showPingChart}
        onClose={() => setShowPingChart(false)}
        hostUrl={hostUrl}
        pingHistory={pingHistory}
      />
    </Card>
  );
}
