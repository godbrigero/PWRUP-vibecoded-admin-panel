// src/components/robot-controls/RobotControlsPage.tsx - Purpose: configure publish topics and tune PID/FF live
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Address, AutobahnClient } from "autobahn-client";
import { useSettings } from "@/lib/settings";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { Card, CardHeader } from "@/components/ui/Card";
import { PIDFFUpdateMessage } from "@/generated/status/Frontend";

type PidGains = {
  p: number;
  i: number;
  d: number;
  ff: number;
};

function clampNumber(value: number, min: number, max: number) {
  if (!Number.isFinite(value)) return min;
  return Math.min(max, Math.max(min, value));
}

function toNumberOr(value: string, fallback: number) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export function RobotControlsPage() {
  const { settings } = useSettings();
  const client = useMemo(
    () => new AutobahnClient(new Address(settings.host, settings.port)),
    [settings.host, settings.port]
  );

  const [isConnected, setIsConnected] = useState(false);

  // “Publishing topic questions”
  const [pidPublishTopic, setPidPublishTopic] = useState<string>("");

  const [gains, setGains] = useState<PidGains>({
    p: 0,
    i: 0,
    d: 0,
    ff: 0,
  });

  const [publishMode, setPublishMode] = useState<"apply" | "live">("apply");
  const [lastPublish, setLastPublish] = useState<{
    atMs: number;
    topic: string;
    bytes: number;
    ok: boolean;
    message?: string;
  } | null>(null);

  // Best-effort connect + connection-state polling (kept simple on purpose).
  useEffect(() => {
    let cancelled = false;

    try {
      client.begin();
    } catch {
      // ignore begin failures (server may be down)
    }

    const pollId = window.setInterval(() => {
      if (cancelled) return;
      try {
        setIsConnected(client.isConnected());
      } catch {
        setIsConnected(false);
      }
    }, 750);

    return () => {
      cancelled = true;
      window.clearInterval(pollId);
    };
  }, [client]);

  const canPublish =
    isConnected && client.isConnected() && pidPublishTopic.trim().length > 0;

  const publishPid = useCallback(async () => {
    const topic = pidPublishTopic.trim();
    if (!topic) {
      setLastPublish({
        atMs: Date.now(),
        topic,
        bytes: 0,
        ok: false,
        message: "Missing publish topic.",
      });
      return;
    }

    if (!client.isConnected()) {
      setLastPublish({
        atMs: Date.now(),
        topic,
        bytes: 0,
        ok: false,
        message: "Not connected.",
      });
      return;
    }

    try {
      const bytes = PIDFFUpdateMessage.encode({
        p: gains.p,
        i: gains.i,
        d: gains.d,
        ff: gains.ff,
      }).finish();
      client.publish(topic, bytes);
      setLastPublish({
        atMs: Date.now(),
        topic,
        bytes: bytes.length,
        ok: true,
      });
    } catch (e) {
      setLastPublish({
        atMs: Date.now(),
        topic,
        bytes: 0,
        ok: false,
        message: (e as Error).message,
      });
    }
  }, [client, gains, pidPublishTopic]);

  // Live publish mode (small debounce to avoid spamming).
  useEffect(() => {
    if (publishMode !== "live") return;
    if (!canPublish) return;

    const id = window.setTimeout(() => {
      void publishPid();
    }, 200);

    return () => window.clearTimeout(id);
  }, [canPublish, gains, publishMode, publishPid]);

  return (
    <main className="min-h-screen text-white">
      <div className="max-w-6xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-gray-300 hover:text-white underline cursor-pointer"
            >
              Back
            </Link>
            <h1 className="text-2xl font-bold">Robot Controlls</h1>
          </div>
          <ConnectionBadge />
        </div>

        <Card>
          <CardHeader>Publishing setup</CardHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col">
              <label className="text-sm text-gray-300 mb-1">
                PID publish topic (required)
              </label>
              <input
                type="text"
                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                placeholder='e.g. "robot/control/pid/set"'
                value={pidPublishTopic}
                onChange={(e) => setPidPublishTopic(e.target.value)}
              />
              <div className="text-xs text-gray-400 mt-2">
                Payload is protobuf bytes:{" "}
                <span className="font-mono text-gray-300">
                  PIDFFUpdateMessage {"{ p, i, d, ff }"}
                </span>
              </div>
            </div>

            <div className="flex flex-col">
              <label className="text-sm text-gray-300 mb-1">Publish mode</label>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setPublishMode("apply")}
                  className={`cursor-pointer px-3 py-2 rounded border ${
                    publishMode === "apply"
                      ? "border-emerald-500 bg-emerald-600 text-white"
                      : "border-gray-700 bg-gray-900 text-gray-200 hover:bg-gray-800"
                  }`}
                >
                  Apply button
                </button>
                <button
                  type="button"
                  onClick={() => setPublishMode("live")}
                  className={`cursor-pointer px-3 py-2 rounded border ${
                    publishMode === "live"
                      ? "border-emerald-500 bg-emerald-600 text-white"
                      : "border-gray-700 bg-gray-900 text-gray-200 hover:bg-gray-800"
                  }`}
                >
                  Live publish
                </button>
              </div>
              <div className="text-xs text-gray-400 mt-2">
                Connected to {settings.host}:{settings.port} •{" "}
                {isConnected ? (
                  <span className="text-emerald-400">connected</span>
                ) : (
                  <span className="text-gray-400">disconnected</span>
                )}
              </div>
            </div>
          </div>
        </Card>

        <div className="space-y-4">
          <details
            className="bg-gray-800 rounded-lg border border-gray-700"
            open
          >
            <summary className="cursor-pointer select-none px-6 py-4 font-semibold">
              PID tuning (P / I / D / FF)
            </summary>
            <div className="px-6 pb-6 space-y-4">
              <div className="text-sm text-gray-300">
                Adjust gains independently, then{" "}
                {publishMode === "apply" ? (
                  <span className="text-gray-200">click Apply</span>
                ) : (
                  <span className="text-gray-200">they auto-publish</span>
                )}
                .
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {(
                  [
                    ["p", "P gain"],
                    ["i", "I gain"],
                    ["d", "D gain"],
                    ["ff", "FF factor"],
                  ] as const
                ).map(([key, label]) => (
                  <div key={key} className="bg-gray-900/40 rounded p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-200 font-medium">
                        {label}
                      </div>
                      <input
                        type="number"
                        inputMode="decimal"
                        className="w-28 bg-gray-900 border border-gray-700 rounded px-2 py-1 outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-sm"
                        value={String(gains[key])}
                        step={0.001}
                        onChange={(e) => {
                          const n = toNumberOr(e.target.value, gains[key]);
                          setGains((prev) => ({ ...prev, [key]: n }));
                        }}
                      />
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={10}
                      step={0.001}
                      value={String(clampNumber(gains[key], 0, 10))}
                      onChange={(e) => {
                        const n = toNumberOr(e.target.value, gains[key]);
                        setGains((prev) => ({ ...prev, [key]: n }));
                      }}
                      className="mt-3 w-full"
                    />
                    <div className="mt-2 text-xs text-gray-400 font-mono">
                      {key.toUpperCase()}={gains[key]}
                    </div>
                  </div>
                ))}
              </div>

              {publishMode === "apply" ? (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => void publishPid()}
                    disabled={!canPublish}
                    className={`cursor-pointer px-4 py-2 rounded ${
                      !canPublish
                        ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                        : "bg-emerald-600 hover:bg-emerald-500 text-white"
                    }`}
                  >
                    Apply
                  </button>
                  {!pidPublishTopic.trim() ? (
                    <span className="text-xs text-gray-400">
                      Provide a publish topic to enable Apply.
                    </span>
                  ) : null}
                </div>
              ) : null}

              {lastPublish ? (
                <div
                  className={`text-xs rounded border px-3 py-2 font-mono ${
                    lastPublish.ok
                      ? "border-emerald-700 bg-emerald-900/20 text-emerald-300"
                      : "border-red-700 bg-red-900/20 text-red-300"
                  }`}
                >
                  {lastPublish.ok ? "Published" : "Publish failed"} • topic=
                  <span className="text-gray-100">{lastPublish.topic}</span> •
                  bytes={lastPublish.bytes}
                  {lastPublish.message ? ` • ${lastPublish.message}` : ""}
                </div>
              ) : null}
            </div>
          </details>
        </div>
      </div>
    </main>
  );
}

