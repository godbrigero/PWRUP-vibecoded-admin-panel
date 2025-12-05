// src/components/dashboard/MultiPiGrid.tsx - Purpose: expandable grid of Pi systems with charts and logs
import { useMemo, useState } from "react";
import { PiSystemData } from "@/lib/hooks/useMultiPiDashboard";
import { Card, CardHeader } from "@/components/ui/Card";
import {
  ProgressBar,
  CpuCoresChart,
  SystemUsagePie,
  ProcessChart,
  NetworkChart,
} from "@/components/ui";
import { Terminal } from "./Terminal";
import { formatPercentage, formatBytes } from "@/lib/utils/formatters";

interface MultiPiGridProps {
  piSystems: Map<string, PiSystemData>;
  onClearLogs: (piName: string) => void;
}

export function MultiPiGrid({ piSystems, onClearLogs }: MultiPiGridProps) {
  const [expandedPi, setExpandedPi] = useState<string | null>(null);
  const activeSystems = useMemo(
    () => Array.from(piSystems.values()).filter((pi) => pi.status),
    [piSystems]
  );

  const handlePiClick = (piName: string) => {
    setExpandedPi(expandedPi === piName ? null : piName);
  };

  if (activeSystems.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-gray-700 rounded-lg bg-gray-900/30">
        <div className="text-gray-400 mb-2">No active Pi systems</div>
        <div className="text-xs text-gray-500">
          Systems will appear here when they start sending data
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {activeSystems.map((piData) => {
        const isExpanded = expandedPi === piData.name;

        return (
          <Card
            key={piData.name}
            className="overflow-hidden border border-gray-700 hover:border-emerald-500/50 transition-all bg-gradient-to-br from-gray-800 to-gray-850"
          >
            <div
              className="cursor-pointer hover:bg-gray-700/30 transition-colors duration-200 -m-6 p-6"
              onClick={() => handlePiClick(piData.name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 flex-1 min-w-0">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-2 h-2 rounded-full bg-emerald-400 flex-shrink-0"></div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-lg font-semibold text-gray-200 truncate">
                        {piData.name}
                      </h3>
                      <div className="text-xs text-gray-400 mt-0.5">
                        Last seen: {piData.lastSeen?.toLocaleTimeString() || "Never"}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm flex-shrink-0">
                    <div className="text-center">
                      <div className="text-blue-400 font-semibold">
                        {formatPercentage(piData.status?.cpuUsageTotal || 0)}
                      </div>
                      <div className="text-xs text-gray-500">CPU</div>
                    </div>
                    <div className="text-center">
                      <div className="text-emerald-400 font-semibold">
                        {formatPercentage(piData.status?.memoryUsage || 0)}
                      </div>
                      <div className="text-xs text-gray-500">RAM</div>
                    </div>
                    <div className="text-center">
                      <div className="text-yellow-400 font-semibold">
                        {formatPercentage(piData.status?.diskUsage || 0)}
                      </div>
                      <div className="text-xs text-gray-500">Disk</div>
                    </div>
                  </div>
                </div>
                <div
                  className={`ml-4 transform transition-transform duration-200 text-gray-400 ${
                    isExpanded ? "rotate-180" : ""
                  }`}
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div
              className={`transition-all duration-300 ease-in-out border-t border-gray-700 ${
                isExpanded
                  ? "max-h-[1000px] opacity-100 mt-6 pt-6"
                  : "max-h-0 opacity-0 overflow-hidden"
              }`}
            >
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-blue-400 mb-4">
                      System Usage Overview
                    </h3>
                    <SystemUsagePie
                      cpu={piData.status?.cpuUsageTotal || 0}
                      memory={piData.status?.memoryUsage || 0}
                      disk={piData.status?.diskUsage || 0}
                    />
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-purple-400 mb-4">
                      CPU Cores Usage
                    </h3>
                    {piData.status?.cpuUsageCores &&
                    piData.status.cpuUsageCores.length > 0 ? (
                      <CpuCoresChart cores={piData.status.cpuUsageCores} />
                    ) : (
                      <div className="h-48 flex items-center justify-center bg-gray-700 rounded">
                        <span className="text-gray-400">
                          No CPU core data available
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-green-400 mb-4">
                      Network Activity
                    </h3>
                    <NetworkChart
                      networkIn={piData.status?.netUsageIn || 0}
                      networkOut={piData.status?.netUsageOut || 0}
                    />
                    <div className="grid grid-cols-2 gap-4 mt-4">
                      <div className="bg-gray-700 p-3 rounded text-center">
                        <div className="text-xs text-gray-400">
                          Current Download
                        </div>
                        <div className="text-sm font-mono text-green-400">
                          ↓ {formatBytes(piData.status?.netUsageIn || 0)}/s
                        </div>
                      </div>
                      <div className="bg-gray-700 p-3 rounded text-center">
                        <div className="text-xs text-gray-400">
                          Current Upload
                        </div>
                        <div className="text-sm font-mono text-blue-400">
                          ↑ {formatBytes(piData.status?.netUsageOut || 0)}/s
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="text-lg font-semibold text-orange-400 mb-4">
                      Detailed Statistics
                    </h3>
                    <div className="space-y-4">
                      <div className="bg-gray-700 p-4 rounded">
                        <h4 className="text-sm font-medium text-blue-400 mb-3">
                          CPU Information
                        </h4>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-400">Total Usage:</span>
                            <span className="ml-2 font-mono font-bold text-blue-400">
                              {formatPercentage(
                                piData.status?.cpuUsageTotal || 0
                              )}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Cores:</span>
                            <span className="ml-2 font-mono">
                              {piData.status?.cpuUsageCores?.length || 0}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Max Core:</span>
                            <span className="ml-2 font-mono text-red-400">
                              {piData.status?.cpuUsageCores
                                ? formatPercentage(
                                    Math.max(...piData.status.cpuUsageCores)
                                  )
                                : "0.0%"}
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-400">Min Core:</span>
                            <span className="ml-2 font-mono text-green-400">
                              {piData.status?.cpuUsageCores
                                ? formatPercentage(
                                    Math.min(...piData.status.cpuUsageCores)
                                  )
                                : "0.0%"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-gray-700 p-4 rounded">
                        <h4 className="text-sm font-medium text-green-400 mb-3">
                          Storage Information
                        </h4>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-400">Memory Usage:</span>
                            <span className="font-mono font-bold text-green-400">
                              {formatPercentage(
                                piData.status?.memoryUsage || 0
                              )}
                            </span>
                          </div>
                          <ProgressBar
                            value={piData.status?.memoryUsage || 0}
                            color="green"
                          />

                          <div className="flex justify-between mt-3">
                            <span className="text-gray-400">Disk Usage:</span>
                            <span className="font-mono font-bold text-yellow-400">
                              {formatPercentage(piData.status?.diskUsage || 0)}
                            </span>
                          </div>
                          <ProgressBar
                            value={piData.status?.diskUsage || 0}
                            color="yellow"
                          />
                        </div>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-red-400 mb-4">
                      Top Processes
                    </h3>
                    {piData.status?.top10Processes &&
                    piData.status.top10Processes.length > 0 ? (
                      <ProcessChart processes={piData.status.top10Processes} />
                    ) : (
                      <div className="h-48 flex items-center justify-center bg-gray-700 rounded">
                        <span className="text-gray-400">
                          No process data available
                        </span>
                      </div>
                    )}
                  </div>

                  <div>
                    <Terminal
                      messages={piData.logs.slice(-100)}
                      onClear={() => onClearLogs(piData.name)}
                    />
                  </div>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-700">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-gray-400">System:</span>
                    <span className="ml-2 font-mono">{piData.name}</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Status:</span>
                    <span className="ml-2 text-green-400">Online</span>
                  </div>
                  <div>
                    <span className="text-gray-400">Last Update:</span>
                    <span className="ml-2 font-mono text-xs">
                      {piData.lastSeen?.toLocaleString() || "Never"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Logs:</span>
                    <span className="ml-2 font-mono">
                      {piData.logs.length}/100
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
