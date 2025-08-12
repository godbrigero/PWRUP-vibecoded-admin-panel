// src/components/dashboard/pi/PiCard.tsx - Purpose: expandable Pi card shell
import { Card } from "@/components/ui/Card";
import { PiSystemData } from "@/lib/hooks/useMultiPiDashboard";
import { useState } from "react";
import { PiHeader } from "./PiHeader";
import { PiCharts } from "./PiCharts";
import { PiDetails } from "./PiDetails";

interface PiCardProps {
  pi: PiSystemData;
  onClearLogs: (piName: string) => void;
}

export function PiCard({ pi, onClearLogs }: PiCardProps) {
  const [expanded, setExpanded] = useState(false);
  return (
    <Card className="overflow-hidden">
      <PiHeader
        pi={pi}
        isExpanded={expanded}
        onClick={() => setExpanded(!expanded)}
      />
      <div
        className={`transition-all duration-300 ease-in-out ${
          expanded
            ? "max-h-[1000px] opacity-100 mt-6"
            : "max-h-0 opacity-0 overflow-hidden"
        }`}
      >
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <PiCharts pi={pi} />
          <PiDetails pi={pi} onClearLogs={onClearLogs} />
        </div>
        <div className="mt-6 pt-4 border-t border-gray-700 grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-400">System:</span>
            <span className="ml-2 font-mono">{pi.name}</span>
          </div>
          <div>
            <span className="text-gray-400">Status:</span>
            <span className="ml-2 text-green-400">Online</span>
          </div>
          <div>
            <span className="text-gray-400">Last Update:</span>
            <span className="ml-2 font-mono text-xs">
              {pi.lastSeen?.toLocaleString() || "Never"}
            </span>
          </div>
          <div>
            <span className="text-gray-400">Logs:</span>
            <span className="ml-2 font-mono">{pi.logs.length}/100</span>
          </div>
        </div>
      </div>
    </Card>
  );
}
