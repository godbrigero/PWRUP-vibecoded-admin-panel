// src/app/paths/page.tsx - Purpose: select a path from known paths and publish SelectedPath to a topic.
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Address, AutobahnClient } from "autobahn-client";
import { useSettings } from "@/lib/settings";
import { AppLayout } from "@/components/layout";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { KNOWN_PATHS } from "@/lib/paths";
import { SelectedPath } from "@/generated/util/other";

const SELECTED_PATH_STORAGE_KEY = "blitz.paths.selected";
const PATH_TOPIC_STORAGE_KEY = "blitz.paths.topic";
const DEFAULT_TOPIC = "path/selected";

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

function getStoredTopic(): string {
  if (typeof window === "undefined") return DEFAULT_TOPIC;
  try {
    return localStorage.getItem(PATH_TOPIC_STORAGE_KEY) ?? DEFAULT_TOPIC;
  } catch {
    return DEFAULT_TOPIC;
  }
}

function setStoredTopic(topic: string): void {
  try {
    localStorage.setItem(PATH_TOPIC_STORAGE_KEY, topic);
  } catch {
    // Ignore storage errors.
  }
}

export default function PathsPage() {
  const { settings } = useSettings();
  const client = useMemo(
    () => new AutobahnClient(new Address(settings.host, settings.port)),
    [settings.host, settings.port],
  );

  const [selectedPathName, setSelectedPathName] = useState(getStoredPath);
  const [topic, setTopic] = useState(getStoredTopic);
  const [isConnected, setIsConnected] = useState(false);
  const [lastPublish, setLastPublish] = useState<{
    atMs: number;
    topic: string;
    pathName: string;
    ok: boolean;
    message?: string;
  } | null>(null);

  useEffect(() => {
    try {
      client.begin();
    } catch {
      // Ignore begin failures.
    }
    const pollId = window.setInterval(() => {
      try {
        setIsConnected(client.isConnected());
      } catch {
        setIsConnected(false);
      }
    }, 750);
    return () => window.clearInterval(pollId);
  }, [client]);

  const publishPath = useCallback(
    (pathName: string) => {
      const t = topic.trim();
      if (!t) {
        setLastPublish({
          atMs: Date.now(),
          topic: t,
          pathName,
          ok: false,
          message: "Topic is empty.",
        });
        return;
      }
      if (!client.isConnected()) {
        setLastPublish({
          atMs: Date.now(),
          topic: t,
          pathName,
          ok: false,
          message: "Not connected to Autobahn.",
        });
        return;
      }
      try {
        const bytes = SelectedPath.encode({ pathName }).finish();
        client.publish(t, bytes);
        setLastPublish({ atMs: Date.now(), topic: t, pathName, ok: true });
      } catch (e) {
        setLastPublish({
          atMs: Date.now(),
          topic: t,
          pathName,
          ok: false,
          message: (e as Error).message,
        });
      }
    },
    [client, topic],
  );

  function handleSelect(pathName: string) {
    setSelectedPathName(pathName);
    setStoredPath(pathName);
    publishPath(pathName);
  }

  function handleTopicChange(value: string) {
    setTopic(value);
    setStoredTopic(value);
  }

  const selectedPath: SelectedPath = { pathName: selectedPathName };

  return (
    <AppLayout title="Path Selection">
      <div className="max-w-xl space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Select Path</CardTitle>
            <CardDescription>
              Choose a path from the list. Selection is published to the configured topic as SelectedPath proto.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="path-topic">Publish topic</Label>
              <Input
                id="path-topic"
                value={topic}
                onChange={(e) => handleTopicChange(e.target.value)}
                placeholder={DEFAULT_TOPIC}
              />
              <div className="text-muted-foreground flex items-center gap-2 text-xs">
                <span>{isConnected ? "Connected" : "Disconnected"}</span>
                {lastPublish && (
                  <span>
                    {lastPublish.ok ? "Published" : "Publish failed"} to {lastPublish.topic}
                    {lastPublish.message && `: ${lastPublish.message}`}
                  </span>
                )}
              </div>
            </div>
            <Label>Known paths</Label>
            <div className="space-y-2">
              {KNOWN_PATHS.map((pathName) => (
                <label
                  key={pathName}
                  className="flex cursor-pointer items-center gap-3 rounded-md border p-3 transition hover:bg-accent/50 has-[:checked]:border-primary has-[:checked]:bg-accent"
                >
                  <input
                    type="radio"
                    name="path"
                    value={pathName}
                    checked={selectedPathName === pathName}
                    onChange={() => handleSelect(pathName)}
                    className="h-4 w-4"
                  />
                  <span className="font-medium">{pathName}</span>
                </label>
              ))}
            </div>
            {selectedPathName && (
              <div className="space-y-2">
                <Button
                  onClick={() => publishPath(selectedPathName)}
                  disabled={!topic.trim() || !isConnected}
                >
                  Send to robot
                </Button>
                <div className="rounded border bg-muted/50 p-3 text-sm">
                  <div className="text-muted-foreground text-xs">SelectedPath (proto)</div>
                  <pre className="mt-1 font-mono text-xs">
                    {JSON.stringify(SelectedPath.toJSON(selectedPath), null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
