// src/components/dashboard/pi/PiHeader.tsx - Purpose: clickable card header for a Pi
import { CardHeader } from "@/components/ui/Card";
import { formatPercentage } from "@/lib/utils/formatters";
import { PiSystemData } from "@/lib/hooks/useMultiPiDashboard";

interface PiHeaderProps {
  pi: PiSystemData;
  isExpanded: boolean;
  onClick: () => void;
}

export function PiHeader({ pi, isExpanded, onClick }: PiHeaderProps) {
  return (
    <div
      className="cursor-pointer hover:bg-gray-700/50 transition-colors duration-200 -m-6 p-6"
      onClick={onClick}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <CardHeader className="mb-0">
            {pi.name}
            <span className="text-sm text-green-400 ml-2">●</span>
          </CardHeader>
          <div className="flex space-x-4 text-sm">
            <span className="text-blue-400">
              CPU: {formatPercentage(pi.status?.cpuUsageTotal || 0)}
            </span>
            <span className="text-green-400">
              RAM: {formatPercentage(pi.status?.memoryUsage || 0)}
            </span>
            <span className="text-yellow-400">
              Disk: {formatPercentage(pi.status?.diskUsage || 0)}
            </span>
          </div>
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
  );
}
