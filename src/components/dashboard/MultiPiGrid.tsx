import { useState } from "react";
import { PiSystemData } from "@/lib/hooks/useMultiPiDashboard";
import { Card, CardHeader } from "@/components/ui/Card";
import {
  ProgressBar,
  CpuCoresChart,
  SystemUsagePie,
  ProcessChart,
  NetworkChart,
} from "@/components/ui";
import { formatPercentage, formatBytes } from "@/lib/utils/formatters";

interface MultiPiGridProps {
  piSystems: Map<string, PiSystemData>;
  onClearLogs: (piName: string) => void;
}

export function MultiPiGrid({ piSystems, onClearLogs }: MultiPiGridProps) {
  const [expandedPi, setExpandedPi] = useState<string | null>(null);
  const activeSystems = Array.from(piSystems.values()).filter(
    (pi) => pi.status
  );

  if (activeSystems.length === 0) {
    return (
      <Card>
        <CardHeader>Pi Systems</CardHeader>
        <div className="text-gray-400 text-center py-8">
          No active Pi systems. Add some systems above to see their data here.
        </div>
      </Card>
    );
  }

  const handlePiClick = (piName: string) => {
    setExpandedPi(expandedPi === piName ? null : piName);
  };

  return (
    <div className="space-y-4">
      {activeSystems.map((piData) => {
        const isExpanded = expandedPi === piData.name;

        return (
          <Card key={piData.name} className="overflow-hidden">
            {/* Header - Always Visible */}
            <div
              className="cursor-pointer hover:bg-gray-700/50 transition-colors duration-200 -m-6 p-6"
              onClick={() => handlePiClick(piData.name)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <CardHeader className="mb-0">
                    {piData.name}
                    <span className="text-sm text-green-400 ml-2">●</span>
                  </CardHeader>
                  <div className="flex space-x-4 text-sm">
                    <span className="text-blue-400">
                      CPU: {formatPercentage(piData.status?.cpuUsageTotal || 0)}
                    </span>
                    <span className="text-green-400">
                      RAM: {formatPercentage(piData.status?.memoryUsage || 0)}
                    </span>
                    <span className="text-yellow-400">
                      Disk: {formatPercentage(piData.status?.diskUsage || 0)}
                    </span>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <div className="text-xs text-gray-400">
                    Last seen:{" "}
                    {piData.lastSeen?.toLocaleTimeString() || "Never"}
                  </div>
                  <div
                    className={`transform transition-transform duration-200 ${
                      isExpanded ? "rotate-180" : ""
                    }`}
                  >
                    ▼
                  </div>
                </div>
              </div>
            </div>

            {/* Expanded Content */}
            <div
              className={`transition-all duration-300 ease-in-out ${
                isExpanded
                  ? "max-h-[1000px] opacity-100 mt-6"
                  : "max-h-0 opacity-0 overflow-hidden"
              }`}
            >
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {/* Left Column - Charts */}
                <div className="space-y-6">
                  {/* System Overview Pie Chart */}
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

                  {/* CPU Cores Bar Chart */}
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

                  {/* Network Activity Chart */}
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

                {/* Right Column - Details & Processes */}
                <div className="space-y-6">
                  {/* Detailed Stats */}
                  <div>
                    <h3 className="text-lg font-semibold text-orange-400 mb-4">
                      Detailed Statistics
                    </h3>
                    <div className="space-y-4">
                      {/* CPU Details */}
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

                      {/* Memory & Disk Details */}
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

                  {/* Top Processes Chart */}
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

                  {/* Terminal */}
                  <div>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold text-green-400">
                        Terminal Output
                      </h3>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onClearLogs(piData.name);
                        }}
                        className="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700 transition-colors"
                      >
                        Clear Logs
                      </button>
                    </div>
                    <div className="bg-black rounded-lg p-4 h-64 flex flex-col">
                      <div className="flex-1 overflow-y-auto space-y-1 text-xs font-mono">
                        {piData.logs.length === 0 ? (
                          <div className="text-gray-500 text-center py-8">
                            No logs yet...
                          </div>
                        ) : (
                          piData.logs.slice(-15).map((log, index) => (
                            <div key={index} className="flex">
                              {log.prefix && (
                                <span
                                  className="mr-2 flex-shrink-0"
                                  style={{ color: log.color || "#60A5FA" }}
                                >
                                  [{log.prefix}]
                                </span>
                              )}
                              <span
                                className="break-words"
                                style={{ color: log.color || "#FFFFFF" }}
                              >
                                {log.message}
                              </span>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* System Info Footer */}
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
