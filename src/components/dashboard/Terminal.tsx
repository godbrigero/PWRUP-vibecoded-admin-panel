// src/components/dashboard/Terminal.tsx - Purpose: scrollable log viewer
import { useRef, useEffect } from "react";
import { LogMessage } from "@/generated/status/PiStatus";

interface TerminalProps {
  messages: LogMessage[];
  onClear: (e?: unknown) => void;
}

export function Terminal({ messages, onClear }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="bg-black rounded-lg p-4 h-fit lg:h-[800px] flex flex-col border border-gray-700">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-gray-800">
        <h3 className="text-lg font-semibold text-emerald-400">Terminal Logs</h3>
        <button
          onClick={onClear}
          className="cursor-pointer text-xs text-gray-400 hover:text-emerald-400 hover:border-emerald-500 px-3 py-1.5 border border-gray-600 rounded transition-colors"
        >
          Clear
        </button>
      </div>
      <div
        ref={terminalRef}
        className="flex-1 overflow-y-auto font-mono text-sm space-y-1 min-h-[400px]"
      >
        {messages.length === 0 ? (
          <div className="text-gray-500 text-center py-8">
            Waiting for log messages...
          </div>
        ) : (
          messages.map((log, index) => (
            <div key={index} className="flex">
              {log.prefix && (
                <span
                  className="text-blue-400 mr-2"
                  style={{ color: log.color || "#60A5FA" }}
                >
                  [{log.prefix}]
                </span>
              )}
              <span
                className="flex-1"
                style={{ color: log.color || "#FFFFFF" }}
              >
                {log.message}
              </span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
