// src/components/dashboard/ConnectionStatus.tsx - Purpose: pill indicator for connection state
interface ConnectionStatusProps {
  isConnected: boolean;
}

export function ConnectionStatus({ isConnected }: ConnectionStatusProps) {
  return (
    <a
      className={`px-3 py-1 rounded-full text-sm cursor-pointer ${
        isConnected ? "bg-green-600" : "bg-red-600"
      }`}
      href="/settings"
    >
      {isConnected ? "Connected" : "Disconnected"}
    </a>
  );
}
