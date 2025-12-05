// src/components/dashboard/Terminal.tsx - Purpose: scrollable log viewer
import { useRef, useEffect } from "react";
import { LogMessage } from "@/generated/status/PiStatus";

interface TerminalProps {
  messages: LogMessage[];
  onClear: (e?: unknown) => void;
}

// Terminal - Purpose: scrollable log viewer; Now ensures log scrolling and correct overflow behavior.
export function Terminal({ messages, onClear }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  // Always scroll to bottom on new log message
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="bg-black rounded-lg flex flex-col border border-gray-700 h-[400px]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-800 flex-shrink-0">
        <h3 className="text-lg font-semibold text-emerald-400">
          Terminal Logs
        </h3>
        <button
          onClick={onClear}
          className="cursor-pointer text-xs text-gray-400 hover:text-emerald-400 hover:border-emerald-500 px-3 py-1.5 border border-gray-600 rounded transition-colors"
        >
          Clear
        </button>
      </div>
      {/* 
        Scrollable log area with proper padding
        - flex-1 allows it to grow and fill available space
        - min-h-0 is critical for flex children to allow scrolling
        - overflow-y-auto enables vertical scrolling
        - padding is on the inner content wrapper to ensure bottom padding works when scrolled
      */}
      <div
        ref={terminalRef}
        className="flex-1 min-h-0 overflow-y-auto font-mono text-sm"
      >
        <div className="p-4 space-y-1">
          {messages.length === 0 ? (
            <div className="text-gray-500 text-center py-8">
              Waiting for log messages...
            </div>
          ) : (
            messages.map((log, index) => (
              <div key={index} className="flex">
                {log.prefix && (
                  <span
                    className="text-blue-400 mr-2 flex-shrink-0"
                    style={{ color: log.color || "#60A5FA" }}
                  >
                    [{log.prefix}]
                  </span>
                )}
                <span
                  className="flex-1 break-words"
                  style={{ color: log.color || "#FFFFFF" }}
                >
                  {log.message}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
