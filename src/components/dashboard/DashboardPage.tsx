// src/components/dashboard/DashboardPage.tsx - Purpose: compose dashboard shell with small sections
"use client";
import {
  ConnectionStatus,
  GlobalOverview,
  PiSystemManager,
  MultiPiGrid,
} from "@/components/dashboard";
import { useMultiPiDashboard } from "@/lib/hooks/useMultiPiDashboard";

export function DashboardPage() {
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
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Multi-Pi Dashboard</h1>
          <ConnectionStatus isConnected={isConnected} />
        </div>
        <GlobalOverview stats={globalStats} />
        <PiSystemManager
          piSystems={piSystems}
          onAddPi={addPiSystem}
          onRemovePi={removePiSystem}
        />
        <MultiPiGrid piSystems={piSystems} onClearLogs={clearLogs} />
      </div>
    </div>
  );
}
