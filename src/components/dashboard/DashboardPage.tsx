// src/components/dashboard/DashboardPage.tsx - Purpose: compose dashboard shell with small sections
"use client";
import {
  ConnectionStatus,
  GlobalOverview,
  PiSystemManager,
  MultiPiGrid,
  TopicConfig,
  PingStatus,
} from "@/components/dashboard";
import { useMultiPiDashboard } from "@/lib/hooks/useMultiPiDashboard";
import Link from "next/link";
import { useMemo } from "react";

export function DashboardPage() {
  const {
    piSystems,
    globalStats,
    isConnected,
    topic,
    setTopic,
    addPiSystem,
    removePiSystem,
    clearLogs,
  } = useMultiPiDashboard();

  const piNames = useMemo(
    () => Array.from(piSystems.keys()),
    [piSystems]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-950 text-white">
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="cursor-pointer text-sm text-gray-400 hover:text-emerald-400 transition-colors flex items-center gap-1"
            >
              <span>←</span>
              <span>Back</span>
            </Link>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
                Multi-Pi Dashboard
              </h1>
              <p className="text-sm text-gray-400 mt-1">
                Monitor and manage multiple Raspberry Pi systems
              </p>
            </div>
          </div>
          <ConnectionStatus isConnected={isConnected} />
        </div>

        {/* Topic Configuration */}
        <TopicConfig topic={topic} onTopicChange={setTopic} />

        {/* Global Overview */}
        <GlobalOverview stats={globalStats} />

        {/* Ping Status */}
        <PingStatus piNames={piNames} />

        {/* Pi Systems Manager */}
        <PiSystemManager
          piSystems={piSystems}
          topic={topic}
          onAddPi={addPiSystem}
          onRemovePi={removePiSystem}
        />

        {/* Pi Systems Grid */}
        <div>
          <h2 className="text-xl font-semibold mb-4 text-gray-200">
            System Details
          </h2>
          <MultiPiGrid piSystems={piSystems} onClearLogs={clearLogs} />
        </div>
      </div>
    </div>
  );
}
