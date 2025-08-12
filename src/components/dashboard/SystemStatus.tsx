// src/components/dashboard/SystemStatus.tsx - Purpose: detailed single-Pi metrics view
import { PiStatus } from "@/generated/status/PiStatus";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatPercentage, formatBytes } from "@/lib/utils/formatters";

interface SystemStatusProps {
  piStats: PiStatus | null;
}

export function SystemStatus({ piStats }: SystemStatusProps) {
  if (!piStats) {
    return (
      <Card>
        <CardHeader>System Status</CardHeader>
        <div className="text-gray-400 text-center py-8">
          Waiting for Pi status data...
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>System Status</CardHeader>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium text-blue-400">
            {piStats.piName || "Unknown Pi"}
          </h3>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">CPU Usage</h4>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total</span>
              <span className="text-sm font-mono">
                {formatPercentage(piStats.cpuUsageTotal)}
              </span>
            </div>
            <ProgressBar value={piStats.cpuUsageTotal} color="blue" />
            {piStats.cpuUsageCores.map((core, index) => (
              <div key={index} className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Core {index + 1}</span>
                <span className="text-xs font-mono">
                  {formatPercentage(core)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">
            Memory Usage
          </h4>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm">RAM</span>
            <span className="text-sm font-mono">
              {formatPercentage(piStats.memoryUsage)}
            </span>
          </div>
          <ProgressBar value={piStats.memoryUsage} color="green" />
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Disk Usage</h4>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm">Storage</span>
            <span className="text-sm font-mono">
              {formatPercentage(piStats.diskUsage)}
            </span>
          </div>
          <ProgressBar value={piStats.diskUsage} color="yellow" />
        </div>

        <div>
          <h4 className="text-sm font-medium text-gray-300 mb-2">Network</h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-xs text-gray-400">In</span>
              <div className="text-sm font-mono">
                {formatBytes(piStats.netUsageIn)}/s
              </div>
            </div>
            <div>
              <span className="text-xs text-gray-400">Out</span>
              <div className="text-sm font-mono">
                {formatBytes(piStats.netUsageOut)}/s
              </div>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
