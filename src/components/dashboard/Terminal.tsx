import { useRef, useEffect } from "react";
import { LogMessage } from "@/generated/status/PiStatus";

interface TerminalProps {
  messages: LogMessage[];
  onClear: () => void;
}

export function Terminal({ messages, onClear }: TerminalProps) {
  const terminalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="bg-black rounded-lg p-4 h-fit lg:h-[800px] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-green-400">Terminal</h2>
        <button
          onClick={onClear}
          className="text-xs text-gray-400 hover:text-white px-2 py-1 border border-gray-600 rounded transition-colors"
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
