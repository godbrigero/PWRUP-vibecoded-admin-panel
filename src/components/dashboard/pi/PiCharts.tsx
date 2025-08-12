// src/components/dashboard/pi/PiCharts.tsx - Purpose: charts column for a Pi
import { CpuCoresChart, SystemUsagePie, NetworkChart } from "@/components/ui";
import { formatBytes } from "@/lib/utils/formatters";
import { PiSystemData } from "@/lib/hooks/useMultiPiDashboard";

export function PiCharts({ pi }: { pi: PiSystemData }) {
  const status = pi.status;
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-blue-400 mb-4">
          System Usage Overview
        </h3>
        <SystemUsagePie
          cpu={status?.cpuUsageTotal || 0}
          memory={status?.memoryUsage || 0}
          disk={status?.diskUsage || 0}
        />
      </div>
      <div>
        <h3 className="text-lg font-semibold text-purple-400 mb-4">
          CPU Cores Usage
        </h3>
        {status?.cpuUsageCores && status.cpuUsageCores.length > 0 ? (
          <CpuCoresChart cores={status.cpuUsageCores} />
        ) : (
          <div className="h-48 flex items-center justify-center bg-gray-700 rounded">
            <span className="text-gray-400">No CPU core data available</span>
          </div>
        )}
      </div>
      <div>
        <h3 className="text-lg font-semibold text-green-400 mb-4">
          Network Activity
        </h3>
        <NetworkChart
          networkIn={status?.netUsageIn || 0}
          networkOut={status?.netUsageOut || 0}
        />
        <div className="grid grid-cols-2 gap-4 mt-4">
          <div className="bg-gray-700 p-3 rounded text-center">
            <div className="text-xs text-gray-400">Current Download</div>
            <div className="text-sm font-mono text-green-400">
              ↓ {formatBytes(status?.netUsageIn || 0)}/s
            </div>
          </div>
          <div className="bg-gray-700 p-3 rounded text-center">
            <div className="text-xs text-gray-400">Current Upload</div>
            <div className="text-sm font-mono text-blue-400">
              ↑ {formatBytes(status?.netUsageOut || 0)}/s
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
