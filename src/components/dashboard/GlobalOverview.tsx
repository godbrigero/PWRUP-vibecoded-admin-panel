import { GlobalStats } from "@/lib/hooks/useMultiPiDashboard";
import { Card, CardHeader } from "@/components/ui/Card";
import { ProgressBar } from "@/components/ui/ProgressBar";
import { formatPercentage, formatBytes } from "@/lib/utils/formatters";

interface GlobalOverviewProps {
  stats: GlobalStats;
}

export function GlobalOverview({ stats }: GlobalOverviewProps) {
  return (
    <Card>
      <CardHeader>Global Overview</CardHeader>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Pi Count */}
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-400">
            {stats.activePis}/{stats.totalPis}
          </div>
          <div className="text-sm text-gray-400">Active Pis</div>
        </div>

        {/* Average CPU */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm">Avg CPU</span>
            <span className="text-sm font-mono">
              {formatPercentage(stats.avgCpuUsage)}
            </span>
          </div>
          <ProgressBar value={stats.avgCpuUsage} color="blue" />
        </div>

        {/* Average Memory */}
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-sm">Avg Memory</span>
            <span className="text-sm font-mono">
              {formatPercentage(stats.avgMemoryUsage)}
            </span>
          </div>
          <ProgressBar value={stats.avgMemoryUsage} color="green" />
        </div>

        {/* Total Network */}
        <div>
          <div className="text-xs text-gray-400 mb-1">Total Network</div>
          <div className="text-xs">
            <div>↓ {formatBytes(stats.totalNetworkIn)}</div>
            <div>↑ {formatBytes(stats.totalNetworkOut)}</div>
          </div>
        </div>
      </div>
    </Card>
  );
}
