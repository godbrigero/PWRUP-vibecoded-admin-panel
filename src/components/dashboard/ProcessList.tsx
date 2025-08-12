// src/components/dashboard/ProcessList.tsx - Purpose: compact list of top processes by CPU
import { PiProcess } from "@/generated/status/PiStatus";
import { Card, CardHeader } from "@/components/ui/Card";
import { formatPercentage } from "@/lib/utils/formatters";

interface ProcessListProps {
  processes: PiProcess[];
}

export function ProcessList({ processes }: ProcessListProps) {
  if (!processes || processes.length === 0) {
    return null;
  }

  return (
    <Card>
      <CardHeader>Top Processes</CardHeader>
      <div className="space-y-2">
        {processes.map((process, index) => (
          <div
            key={`${process.pid}-${index}`}
            className="flex items-center justify-between text-sm"
          >
            <div className="flex items-center space-x-3">
              <span className="text-gray-400 w-6 text-right">{index + 1}</span>
              <span className="font-mono">{process.name}</span>
              <span className="text-gray-400 text-xs">PID: {process.pid}</span>
            </div>
            <span className="font-mono text-blue-400">
              {formatPercentage(process.cpuUsage)}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
