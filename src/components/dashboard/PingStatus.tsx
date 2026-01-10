// src/components/dashboard/PingStatus.tsx - Purpose: ping/pong latency display and controls
"use client";
import { usePing } from "@/lib/hooks/usePing";
import { Card } from "@/components/ui/Card";
import { useMemo, useState, useCallback } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

interface PingStatusProps {
  piNames: string[];
}

type PingTestPoint = {
  seq: number;
  ping: number | null;
};

export function PingStatus({ piNames }: PingStatusProps) {
  const { pingResults, sendPing, pingAll, isConnected, runPingTest } = usePing();
  const [isTesting, setIsTesting] = useState(false);
  const [testPiName, setTestPiName] = useState<string | null>(null);
  const [testSeries, setTestSeries] = useState<PingTestPoint[] | null>(null);

  const sortedResults = useMemo(() => {
    return Array.from(pingResults.values()).sort((a, b) =>
      a.piName.localeCompare(b.piName)
    );
  }, [pingResults]);

  const testStats = useMemo(() => {
    if (!testSeries) return null;
    const valid = testSeries
      .map((p) => p.ping)
      .filter((x): x is number => typeof x === "number");
    if (valid.length === 0) {
      return { count: testSeries.length, ok: 0, avg: null, min: null, max: null };
    }
    const sum = valid.reduce((a, b) => a + b, 0);
    return {
      count: testSeries.length,
      ok: valid.length,
      avg: Math.round(sum / valid.length),
      min: Math.round(Math.min(...valid)),
      max: Math.round(Math.max(...valid)),
    };
  }, [testSeries]);

  const runTest = useCallback(async () => {
    const piName = piNames[0];
    if (!piName) return;
    if (!isConnected) return;
    if (isTesting) return;

    setIsTesting(true);
    setTestPiName(piName);
    setTestSeries(null);
    try {
      const samples = await runPingTest(piName, 20, 50);
      setTestSeries(
        samples.map((ping, idx) => ({
          seq: idx + 1,
          ping,
        }))
      );
    } finally {
      setIsTesting(false);
    }
  }, [isConnected, isTesting, piNames, runPingTest]);

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
        <div>
          <h2 className="text-xl font-semibold text-gray-200">Ping Status</h2>
          <div className="text-xs text-gray-400 mt-1">
            Note: this is client-side RTT; real one-way latency is often ~½ of this. JS/TS timing + message handling can inflate spikes.
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => pingAll(piNames)}
            disabled={!isConnected || piNames.length === 0}
            className="cursor-pointer px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded text-sm transition-colors font-medium"
          >
            Ping All
          </button>
          <button
            onClick={runTest}
            disabled={!isConnected || piNames.length === 0 || isTesting}
            className="cursor-pointer px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded text-sm transition-colors font-medium"
          >
            {isTesting ? "Testing..." : "Test (20x)"}
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

      {testSeries && testPiName ? (
        <div className="mt-4 pt-4 border-t border-gray-700">
          <div className="flex items-center justify-between mb-3">
            <div>
              <div className="text-sm font-semibold text-gray-200">
                Ping Test: {testPiName} (20× @ 50ms)
              </div>
              {testStats ? (
                <div className="text-xs text-gray-400 mt-0.5">
                  ok {testStats.ok}/{testStats.count}
                  {testStats.avg !== null
                    ? ` · avg ${testStats.avg}ms · min ${testStats.min}ms · max ${testStats.max}ms`
                    : " · no successful samples"}
                </div>
              ) : null}
            </div>
          </div>

          <div className="h-44">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={testSeries} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
                <defs>
                  <linearGradient id="pingTestGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#a855f7" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#a855f7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis
                  dataKey="seq"
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  axisLine={{ stroke: "#4b5563" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "#9ca3af" }}
                  axisLine={{ stroke: "#4b5563" }}
                  label={{ value: "ms", angle: -90, position: "insideLeft", fill: "#9ca3af" }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1f2937",
                    border: "1px solid #374151",
                    borderRadius: "6px",
                    color: "#f3f4f6",
                  }}
                  formatter={(value: number | null) => [
                    value === null ? "timeout" : `${Math.round(value)}ms`,
                    "Ping",
                  ]}
                  labelFormatter={(label) => `#${label}`}
                />
                <Area
                  type="monotone"
                  dataKey="ping"
                  stroke="#a855f7"
                  fillOpacity={1}
                  fill="url(#pingTestGradient)"
                  connectNulls={false}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      ) : null}
    </Card>
  );
}






