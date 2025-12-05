// src/components/dashboard/GlobalOverview.tsx - Purpose: summarize global stats succinctly
import { GlobalStats } from "@/lib/hooks/useMultiPiDashboard";
import { StatCard } from "./StatCard";
import { ProgressStatCard } from "./ProgressStatCard";
import { formatPercentage, formatBytes } from "@/lib/utils/formatters";

interface GlobalOverviewProps {
  stats: GlobalStats;
}

export function GlobalOverview({ stats }: GlobalOverviewProps) {
  return (
    <div>
      <h2 className="text-xl font-semibold mb-4 text-gray-200">System Overview</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Active Systems"
          value={`${stats.activePis}/${stats.totalPis}`}
          subtitle={`${stats.totalPis > 0 ? Math.round((stats.activePis / stats.totalPis) * 100) : 0}% online`}
          color="green"
        />
        <ProgressStatCard
          label="Average CPU Usage"
          value={stats.avgCpuUsage}
          color="blue"
          format={formatPercentage}
        />
        <ProgressStatCard
          label="Average Memory Usage"
          value={stats.avgMemoryUsage}
          color="green"
          format={formatPercentage}
        />
        <StatCard
          label="Network Traffic"
          value={formatBytes(stats.totalNetworkIn + stats.totalNetworkOut)}
          subtitle={`↓ ${formatBytes(stats.totalNetworkIn)} / ↑ ${formatBytes(stats.totalNetworkOut)}`}
          color="purple"
        />
      </div>
    </div>
  );
}
