// src/components/dashboard/ConnectionStatus.tsx - Purpose: pill indicator for connection state
import Link from "next/link";

interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <Link
      href="/settings"
      className={`cursor-pointer px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
        isConnected
          ? "bg-emerald-600/20 text-emerald-400 border border-emerald-500/50 hover:bg-emerald-600/30"
          : "bg-red-600/20 text-red-400 border border-red-500/50 hover:bg-red-600/30"
      }`}
    >
      <span
        className={`w-2 h-2 rounded-full ${
          isConnected ? "bg-emerald-400" : "bg-red-400"
        }`}
      ></span>
      {isConnected ? "Connected" : "Disconnected"}
    </Link>
  );
}
