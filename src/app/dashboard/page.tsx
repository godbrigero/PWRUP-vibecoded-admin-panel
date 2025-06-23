"use client";

import {
  ConnectionStatus,
  GlobalOverview,
  PiSystemManager,
  MultiPiGrid,
} from "@/components/dashboard";
import { useMultiPiDashboard } from "@/lib/hooks/useMultiPiDashboard";

export default function Dashboard() {
  const {
    piSystems,
    globalStats,
    isConnected,
    addPiSystem,
    removePiSystem,
    clearLogs,
  } = useMultiPiDashboard();

  return (
    <div className="min-h-screen text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">Multi-Pi Dashboard</h1>
          <ConnectionStatus isConnected={isConnected} />
        </div>

        {/* Global Overview */}
        <div className="mb-8">
          <GlobalOverview stats={globalStats} />
        </div>

        {/* Pi Systems Manager */}
        <div className="mb-8">
          <PiSystemManager
            piSystems={piSystems}
            onAddPi={addPiSystem}
            onRemovePi={removePiSystem}
          />
        </div>

        {/* Individual Pi Systems */}
        <MultiPiGrid piSystems={piSystems} onClearLogs={clearLogs} />
      </div>
    </div>
  );
}
