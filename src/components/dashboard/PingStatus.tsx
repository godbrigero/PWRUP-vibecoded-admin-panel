// src/components/dashboard/PingStatus.tsx - Purpose: ping/pong latency display and controls
"use client";
import { usePing } from "@/lib/hooks/usePing";
import { Card } from "@/components/ui/Card";
import { useMemo } from "react";

interface PingStatusProps {
  piNames: string[];
}

export function PingStatus({ piNames }: PingStatusProps) {
  const { pingResults, sendPing, pingAll, isConnected } = usePing();

  const sortedResults = useMemo(() => {
    return Array.from(pingResults.values()).sort((a, b) =>
      a.piName.localeCompare(b.piName)
    );
  }, [pingResults]);

  const getLatencyColor = (latency: number) => {
    if (latency < 50) return "text-emerald-400";
    if (latency < 100) return "text-yellow-400";
    if (latency < 200) return "text-orange-400";
    return "text-red-400";
  };

  const getLatencyLabel = (latency: number) => {
    if (latency < 50) return "Excellent";
    if (latency < 100) return "Good";
    if (latency < 200) return "Fair";
    return "Poor";
  };

  return (
    <Card className="bg-gradient-to-br from-gray-800 to-gray-850 border border-gray-700">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-200">Ping Status</h2>
        <div className="flex gap-2">
          <button
            onClick={() => pingAll(piNames)}
            disabled={!isConnected || piNames.length === 0}
            className="cursor-pointer px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded text-sm transition-colors font-medium"
          >
            Ping All
          </button>
        </div>
      </div>

      {piNames.length === 0 ? (
        <div className="text-center py-8 text-gray-400">
          No Pi systems to ping. Add systems above to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {piNames.map((piName) => {
            const result = pingResults.get(piName);
            const hasResult = result !== undefined;
            const timeSincePing = result
              ? Date.now() - result.timestamp.getTime()
              : null;

            return (
              <div
                key={piName}
                className="flex items-center justify-between p-3 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-emerald-500/50 transition-all"
              >
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-gray-200 truncate">
                      {piName}
                    </div>
                    {hasResult && timeSincePing !== null && (
                      <div className="text-xs text-gray-400 mt-0.5">
                        {timeSincePing < 1000
                          ? `Updated ${Math.round(timeSincePing)}ms ago`
                          : `Updated ${Math.round(timeSincePing / 1000)}s ago`}
                      </div>
                    )}
                  </div>
                  {hasResult ? (
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <div
                        className={`text-lg font-bold font-mono ${getLatencyColor(
                          result.latency
                        )}`}
                      >
                        {result.latency.toFixed(0)}ms
                      </div>
                      <div
                        className={`text-xs px-2 py-0.5 rounded ${
                          result.latency < 50
                            ? "bg-emerald-900/30 text-emerald-400 border border-emerald-700/50"
                            : result.latency < 100
                            ? "bg-yellow-900/30 text-yellow-400 border border-yellow-700/50"
                            : result.latency < 200
                            ? "bg-orange-900/30 text-orange-400 border border-orange-700/50"
                            : "bg-red-900/30 text-red-400 border border-red-700/50"
                        }`}
                      >
                        {getLatencyLabel(result.latency)}
                      </div>
                    </div>
                  ) : (
                    <div className="text-sm text-gray-500 flex-shrink-0">
                      No ping data
                    </div>
                  )}
                </div>
                <button
                  onClick={() => sendPing(piName)}
                  disabled={!isConnected}
                  className="cursor-pointer ml-3 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded text-sm transition-colors flex-shrink-0"
                >
                  Ping
                </button>
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
}






