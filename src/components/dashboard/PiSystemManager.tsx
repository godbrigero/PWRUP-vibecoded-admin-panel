// src/components/dashboard/PiSystemManager.tsx - Purpose: CRUD list for Pi systems
import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { PiSystemData } from "@/lib/hooks/useMultiPiDashboard";
import { formatPercentage } from "@/lib/utils/formatters";

interface PiSystemManagerProps {
  piSystems: Map<string, PiSystemData>;
  topic: string;
  onAddPi: (name: string) => void;
  onRemovePi: (name: string) => void;
}

export function PiSystemManager({
  piSystems,
  topic,
  onAddPi,
  onRemovePi,
}: PiSystemManagerProps) {
  const [newPiName, setNewPiName] = useState("");

  const handleAddPi = () => {
    if (newPiName.trim()) {
      onAddPi(newPiName.trim());
      setNewPiName("");
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleAddPi();
  };

  const getStatusBadge = (piData: PiSystemData) => {
    if (!piData.lastSeen) {
      return (
        <span className="px-2 py-0.5 rounded text-xs bg-gray-700 text-gray-400 border border-gray-600">
          Never connected
        </span>
      );
    }
    const timeDiff = Date.now() - piData.lastSeen.getTime();
    if (timeDiff < 5000) {
      return (
        <span className="px-2 py-0.5 rounded text-xs bg-emerald-900/30 text-emerald-400 border border-emerald-700/50">
          Active
        </span>
      );
    }
    if (timeDiff < 30000) {
      return (
        <span className="px-2 py-0.5 rounded text-xs bg-yellow-900/30 text-yellow-400 border border-yellow-700/50">
          Recent
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-xs bg-red-900/30 text-red-400 border border-red-700/50">
        Offline
      </span>
    );
  };

  return (
    <Card className="bg-gradient-to-br from-gray-800 to-gray-850 border border-gray-700">
      <div className="mb-4">
        <h2 className="text-xl font-semibold mb-2 text-gray-200">
          Pi Systems
        </h2>
        <div className="flex gap-2">
          <input
            type="text"
            value={newPiName}
            onChange={(e) => setNewPiName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter Pi name to pre-initialize"
            className="flex-1 px-3 py-2 bg-gray-900/50 text-white rounded border border-gray-600 focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
          <button
            onClick={handleAddPi}
            disabled={!newPiName.trim()}
            className="cursor-pointer px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded transition-colors font-medium"
          >
            Add
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-2">
          Systems are auto-discovered from topic:{" "}
          <span className="font-mono text-emerald-400">{topic}</span>
        </div>
      </div>

      {piSystems.size === 0 ? (
        <div className="text-center py-8 border border-dashed border-gray-700 rounded-lg">
          <div className="text-gray-400 mb-2">No Pi systems detected</div>
          <div className="text-xs text-gray-500">
            Systems will appear automatically when messages are received
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {Array.from(piSystems.values()).map((piData) => (
            <div
              key={piData.name}
              className="p-4 bg-gray-900/50 rounded-lg border border-gray-700 hover:border-emerald-500/50 transition-all hover:shadow-lg hover:shadow-emerald-500/10"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-200 truncate mb-1">
                    {piData.name}
                  </div>
                  <div className="text-xs text-gray-500 font-mono truncate">
                    {topic}
                  </div>
                </div>
                {getStatusBadge(piData)}
              </div>
              <div className="flex items-center justify-between text-sm">
                {piData.status ? (
                  <>
                    <div className="text-gray-400">CPU</div>
                    <div className="font-mono font-semibold text-emerald-400">
                      {formatPercentage(piData.status.cpuUsageTotal)}
                    </div>
                  </>
                ) : (
                  <div className="text-xs text-gray-500">No data yet</div>
                )}
              </div>
              <div className="mt-3 pt-3 border-t border-gray-700">
                <button
                  onClick={() => onRemovePi(piData.name)}
                  className="cursor-pointer w-full text-xs text-red-400 hover:text-red-300 hover:bg-red-900/20 px-2 py-1 rounded transition-colors"
                >
                  Remove
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
