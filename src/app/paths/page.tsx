"use client";

import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { KNOWN_PATHS } from "@/lib/paths";
import { usePathNetworkTable } from "@/lib/hooks/usePathNetworkTable";

const SELECTED_PATH_STORAGE_KEY = "blitz.paths.selected";

function getStoredPath(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(SELECTED_PATH_STORAGE_KEY) ?? "";
  } catch {
    return "";
  }
}

function setStoredPath(pathName: string): void {
  try {
    localStorage.setItem(SELECTED_PATH_STORAGE_KEY, pathName);
  } catch {
    // Ignore storage errors.
  }
}

function findMatchingKnownPath(pathName: string | null): string | null {
  if (!pathName) return null;
  const trimmed = pathName.trim();
  if (!trimmed) return null;

  const directMatch = KNOWN_PATHS.find((entry) => entry === trimmed);
  if (directMatch) return directMatch;

  const lowered = trimmed.toLowerCase();
  return KNOWN_PATHS.find((entry) => entry.toLowerCase() === lowered) ?? null;
}

export default function PathsPage() {
  const { robotIp, topic, isConnected, currentPath, lastUpdatedMs } = usePathNetworkTable();
  const [selectedPathName, setSelectedPathName] = useState<string>(() => getStoredPath() || KNOWN_PATHS[0]);

  useEffect(() => {
    const matchedPath = findMatchingKnownPath(currentPath);
    if (!matchedPath) return;
    setSelectedPathName(matchedPath);
    setStoredPath(matchedPath);
  }, [currentPath]);

  const robotMatchedPath = findMatchingKnownPath(currentPath);
  const lastUpdatedText =
    typeof lastUpdatedMs === "number" ? new Date(lastUpdatedMs).toLocaleTimeString() : "No updates yet";

  return (
    <AppLayout title="Path Selection">
      <div className="max-w-3xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>NetworkTables Path Sync</CardTitle>
            <CardDescription>
              Reads the robot&apos;s current path from WPILib NetworkTables (read-only from this app).
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className={isConnected ? "text-emerald-400" : "text-zinc-500"}>
                  {isConnected ? "NT Connected" : "NT Disconnected"}
                </span>
                <span className="text-zinc-400">
                  Team IP: <span className="font-mono text-zinc-200">{robotIp}</span>
                </span>
                <span className="text-zinc-400">
                  Topic: <span className="font-mono text-zinc-200">{topic || "(not set)"}</span>
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1">
                <span className="text-zinc-400">
                  Robot Current Path: <span className="font-medium text-zinc-200">{currentPath ?? "(none)"}</span>
                </span>
                <span className="text-zinc-500">Updated: {lastUpdatedText}</span>
              </div>
            </div>

            <div className="space-y-2">
              {KNOWN_PATHS.map((pathName) => {
                const isSelected = selectedPathName === pathName;
                const isRobotPath = robotMatchedPath === pathName;
                return (
                  <button
                    key={pathName}
                    type="button"
                    onClick={() => {
                      setSelectedPathName(pathName);
                      setStoredPath(pathName);
                    }}
                    className={
                      isSelected
                        ? "flex w-full items-center justify-between rounded-md border border-white/55 bg-zinc-900 px-3 py-2 text-left text-sm font-medium text-white"
                        : "flex w-full items-center justify-between rounded-md border border-white/15 bg-black px-3 py-2 text-left text-sm font-medium text-zinc-300 transition hover:border-white/30 hover:text-zinc-100"
                    }
                  >
                    <span>{pathName}</span>
                    {isRobotPath && (
                      <span className="rounded border border-emerald-500/40 bg-emerald-500/15 px-2 py-0.5 text-[10px] uppercase tracking-[0.08em] text-emerald-300">
                        Robot Active
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
