import { useState } from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { PiSystemData } from "@/lib/hooks/useMultiPiDashboard";

interface PiSystemManagerProps {
  piSystems: Map<string, PiSystemData>;
  onAddPi: (name: string) => void;
  onRemovePi: (name: string) => void;
}

export function PiSystemManager({
  piSystems,
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
    if (e.key === "Enter") {
      handleAddPi();
    }
  };

  const getStatusColor = (piData: PiSystemData) => {
    if (!piData.lastSeen) return "text-gray-500";
    const timeDiff = Date.now() - piData.lastSeen.getTime();
    if (timeDiff < 30000) return "text-green-400"; // Within 30 seconds
    if (timeDiff < 60000) return "text-yellow-400"; // Within 1 minute
    return "text-red-400"; // Over 1 minute
  };

  const getStatusText = (piData: PiSystemData) => {
    if (!piData.lastSeen) return "Never connected";
    const timeDiff = Date.now() - piData.lastSeen.getTime();
    if (timeDiff < 5000) return "Active";
    if (timeDiff < 30000) return "Recent";
    if (timeDiff < 60000) return "Inactive";
    return "Offline";
  };

  return (
    <Card>
      <CardHeader>Pi Systems Manager</CardHeader>

      {/* Add new Pi */}
      <div className="mb-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={newPiName}
            onChange={(e) => setNewPiName(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Enter Pi name (e.g., 'pi-livingroom')"
            className="flex-1 px-3 py-2 bg-gray-700 text-white rounded border border-gray-600 focus:border-blue-500 focus:outline-none"
          />
          <button
            onClick={handleAddPi}
            disabled={!newPiName.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
          >
            Add Pi
          </button>
        </div>
        <div className="text-xs text-gray-400 mt-1">
          Topic will be:{" "}
          {newPiName.trim() ? `${newPiName.trim()}/logs` : "<name>/logs"}
        </div>
      </div>

      {/* Pi Systems List */}
      {piSystems.size === 0 ? (
        <div className="text-gray-400 text-center py-4">
          No Pi systems added yet. Add one above to get started.
        </div>
      ) : (
        <div className="space-y-2">
          {Array.from(piSystems.values()).map((piData) => (
            <div
              key={piData.name}
              className="flex items-center justify-between p-3 bg-gray-700 rounded"
            >
              <div className="flex items-center space-x-3">
                <div className="flex flex-col">
                  <span className="font-medium">{piData.name}</span>
                  <span className="text-xs text-gray-400">
                    Topic: {piData.name}/logs
                  </span>
                </div>
                <span className={`text-sm ${getStatusColor(piData)}`}>
                  {getStatusText(piData)}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                {piData.status && (
                  <div className="text-xs text-gray-400">
                    CPU: {piData.status.cpuUsageTotal.toFixed(1)}%
                  </div>
                )}
                <button
                  onClick={() => onRemovePi(piData.name)}
                  className="text-red-400 hover:text-red-300 text-sm px-2 py-1 rounded hover:bg-red-900/20 transition-colors"
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
