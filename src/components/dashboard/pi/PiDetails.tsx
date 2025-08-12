// src/components/dashboard/pi/PiDetails.tsx - Purpose: details & processes & terminal for a Pi
import { ProgressBar, ProcessChart } from "@/components/ui";
import { formatPercentage } from "@/lib/utils/formatters";
import { PiSystemData } from "@/lib/hooks/useMultiPiDashboard";
import { Terminal } from "@/components/dashboard/Terminal";

interface PiDetailsProps {
  pi: PiSystemData;
  onClearLogs: (piName: string) => void;
}

export function PiDetails({ pi, onClearLogs }: PiDetailsProps) {
  const status = pi.status;
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-orange-400 mb-4">
          Detailed Statistics
        </h3>
        <div className="space-y-4 bg-gray-700 p-4 rounded">
          <h4 className="text-sm font-medium text-blue-400 mb-3">
            CPU Information
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-400">Total Usage:</span>
              <span className="ml-2 font-mono font-bold text-blue-400">
                {formatPercentage(status?.cpuUsageTotal || 0)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Cores:</span>
              <span className="ml-2 font-mono">
                {status?.cpuUsageCores?.length || 0}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Max Core:</span>
              <span className="ml-2 font-mono text-red-400">
                {status?.cpuUsageCores
                  ? formatPercentage(Math.max(...status.cpuUsageCores))
                  : "0.0%"}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Min Core:</span>
              <span className="ml-2 font-mono text-green-400">
                {status?.cpuUsageCores
                  ? formatPercentage(Math.min(...status.cpuUsageCores))
                  : "0.0%"}
              </span>
            </div>
          </div>
        </div>
        <div className="space-y-2 bg-gray-700 p-4 rounded mt-4">
          <h4 className="text-sm font-medium text-green-400 mb-1">
            Storage Information
          </h4>
          <div className="flex justify-between">
            <span className="text-gray-400">Memory Usage:</span>
            <span className="font-mono font-bold text-green-400">
              {formatPercentage(status?.memoryUsage || 0)}
            </span>
          </div>
          <ProgressBar value={status?.memoryUsage || 0} color="green" />
          <div className="flex justify-between mt-3">
            <span className="text-gray-400">Disk Usage:</span>
            <span className="font-mono font-bold text-yellow-400">
              {formatPercentage(status?.diskUsage || 0)}
            </span>
          </div>
          <ProgressBar value={status?.diskUsage || 0} color="yellow" />
        </div>
      </div>
      <div>
        <h3 className="text-lg font-semibold text-red-400 mb-4">
          Top Processes
        </h3>
        {status?.top10Processes && status.top10Processes.length > 0 ? (
          <ProcessChart processes={status.top10Processes} />
        ) : (
          <div className="h-48 flex items-center justify-center bg-gray-700 rounded">
            <span className="text-gray-400">No process data available</span>
          </div>
        )}
      </div>
      <Terminal
        messages={pi.logs.slice(-100)}
        onClear={() => onClearLogs(pi.name)}
      />
    </div>
  );
}
