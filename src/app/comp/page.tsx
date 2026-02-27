"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Address, AutobahnClient } from "autobahn-client";
import {
  ArrowLeft,
  Clapperboard,
  Expand,
  Minimize,
  Play,
  RefreshCw,
  Route,
  Send,
  Square,
  Wifi,
  WifiOff,
} from "lucide-react";

import { useSettings } from "@/lib/settings";
import { KNOWN_PATHS } from "@/lib/paths";
import { ImageData, ImageCompression } from "@/generated/sensor/camera_sensor";
import { GeneralSensorData } from "@/generated/sensor/general_sensor_data";
import { SelectedPath } from "@/generated/util/other";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const VIDEO_TOPIC_HISTORY_KEY = "blitz.video.topicHistory";
const VIDEO_HISTORY_MAX = 10;

const SELECTED_PATH_STORAGE_KEY = "blitz.paths.selected";
const PATH_TOPIC_STORAGE_KEY = "blitz.paths.topic";
const DEFAULT_PATH_TOPIC = "path/selected";

type FullscreenDocument = Document & {
  webkitExitFullscreen?: () => Promise<void> | void;
  webkitFullscreenElement?: Element | null;
  msExitFullscreen?: () => Promise<void> | void;
  msFullscreenElement?: Element | null;
};

type FullscreenElement = HTMLElement & {
  webkitRequestFullscreen?: () => Promise<void> | void;
  msRequestFullscreen?: () => Promise<void> | void;
};

function getVideoTopicHistory(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(VIDEO_TOPIC_HISTORY_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch {
    return [];
  }
}

function addToVideoTopicHistory(topic: string): string[] {
  const history = getVideoTopicHistory().filter((entry) => entry !== topic);
  const updated = [topic, ...history].slice(0, VIDEO_HISTORY_MAX);
  localStorage.setItem(VIDEO_TOPIC_HISTORY_KEY, JSON.stringify(updated));
  return updated;
}

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

function getStoredPathTopic(): string {
  if (typeof window === "undefined") return DEFAULT_PATH_TOPIC;
  try {
    return localStorage.getItem(PATH_TOPIC_STORAGE_KEY) ?? DEFAULT_PATH_TOPIC;
  } catch {
    return DEFAULT_PATH_TOPIC;
  }
}

function setStoredPathTopic(topic: string): void {
  try {
    localStorage.setItem(PATH_TOPIC_STORAGE_KEY, topic);
  } catch {
    // Ignore storage errors.
  }
}

function getFullscreenElement(doc: FullscreenDocument): Element | null {
  return doc.fullscreenElement ?? doc.webkitFullscreenElement ?? doc.msFullscreenElement ?? null;
}

async function requestFullscreenCompat(el: FullscreenElement): Promise<void> {
  if (el.requestFullscreen) {
    await el.requestFullscreen();
    return;
  }
  if (el.webkitRequestFullscreen) {
    await el.webkitRequestFullscreen();
    return;
  }
  if (el.msRequestFullscreen) {
    await el.msRequestFullscreen();
  }
}

async function exitFullscreenCompat(doc: FullscreenDocument): Promise<void> {
  if (doc.exitFullscreen) {
    await doc.exitFullscreen();
    return;
  }
  if (doc.webkitExitFullscreen) {
    await doc.webkitExitFullscreen();
    return;
  }
  if (doc.msExitFullscreen) {
    await doc.msExitFullscreen();
  }
}

function ConnectionBadge({ isConnected }: { isConnected: boolean }) {
  return (
    <Badge
      variant="outline"
      className={
        isConnected
          ? "border-white/25 bg-black text-zinc-100"
          : "border-white/15 bg-black text-zinc-400"
      }
    >
      {isConnected ? <Wifi className="mr-1 h-3.5 w-3.5" /> : <WifiOff className="mr-1 h-3.5 w-3.5" />}
      {isConnected ? "Connected" : "Disconnected"}
    </Badge>
  );
}

function CompetitionVideoViewer() {
  const { settings } = useSettings();
  const client = useMemo(
    () => new AutobahnClient(new Address(settings.host, settings.port)),
    [settings.host, settings.port],
  );

  const [topic, setTopic] = useState<string>("");
  const [topicHistory, setTopicHistory] = useState<string[]>([]);
  const [activeTopic, setActiveTopic] = useState<string | null>(null);
  const [subscribed, setSubscribed] = useState(false);
  const [frameWidth, setFrameWidth] = useState<number | null>(null);
  const [frameHeight, setFrameHeight] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoShellRef = useRef<HTMLDivElement | null>(null);
  const frameQueueRef = useRef<ImageData | null>(null);
  const rafIdRef = useRef<number | null>(null);

  const onFrame = useCallback(async (payload: Uint8Array) => {
    try {
      const generalSensorData = GeneralSensorData.decode(payload);
      if (!generalSensorData.image) return;

      const imageData = generalSensorData.image;
      setFrameWidth(imageData.width ?? null);
      setFrameHeight(imageData.height ?? null);
      frameQueueRef.current = imageData;
    } catch (error) {
      console.error("Failed to decode frame", error);
    }
  }, []);

  useEffect(() => {
    setTopicHistory(getVideoTopicHistory());
  }, []);

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

  useEffect(() => {
    if (!subscribed) {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
      return;
    }

    const renderFrame = () => {
      if (!canvasRef.current) {
        rafIdRef.current = requestAnimationFrame(renderFrame);
        return;
      }

      if (frameQueueRef.current) {
        const imageData = frameQueueRef.current;
        frameQueueRef.current = null;

        if (
          imageData.compression !== ImageCompression.JPEG &&
          imageData.compression !== ImageCompression.PNG
        ) {
          rafIdRef.current = requestAnimationFrame(renderFrame);
          return;
        }

        const mimeType = imageData.compression === ImageCompression.JPEG ? "image/jpeg" : "image/png";
        const imageBytes = new Uint8Array(imageData.image);
        const blob = new Blob([imageBytes], { type: mimeType });
        const url = URL.createObjectURL(blob);

        const img = new Image();
        img.onload = () => {
          if (canvasRef.current) {
            const canvas = canvasRef.current;
            const context = canvas.getContext("2d");
            if (context) {
              canvas.width = imageData.width;
              canvas.height = imageData.height;
              context.drawImage(img, 0, 0);
            }
          }
          URL.revokeObjectURL(url);
        };
        img.onerror = () => {
          URL.revokeObjectURL(url);
        };
        img.src = url;
      }

      rafIdRef.current = requestAnimationFrame(renderFrame);
    };

    rafIdRef.current = requestAnimationFrame(renderFrame);

    return () => {
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
        rafIdRef.current = null;
      }
    };
  }, [subscribed]);

  useEffect(() => {
    return () => {
      if (activeTopic) {
        client.unsubscribe(activeTopic);
      }
    };
  }, [client, activeTopic]);

  useEffect(() => {
    const doc = document as FullscreenDocument;
    const updateFullscreen = () => {
      setIsFullscreen(Boolean(getFullscreenElement(doc)));
    };

    document.addEventListener("fullscreenchange", updateFullscreen);
    document.addEventListener("webkitfullscreenchange", updateFullscreen);

    return () => {
      document.removeEventListener("fullscreenchange", updateFullscreen);
      document.removeEventListener("webkitfullscreenchange", updateFullscreen);
    };
  }, []);

  function startSubscription() {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic) return;

    setSubscribed(true);
    setActiveTopic(trimmedTopic);
    setTopic(trimmedTopic);

    const updatedHistory = addToVideoTopicHistory(trimmedTopic);
    setTopicHistory(updatedHistory);
    client.subscribe(trimmedTopic, onFrame);
  }

  function stopSubscription() {
    if (activeTopic) {
      client.unsubscribe(activeTopic);
    }
    setSubscribed(false);
    setActiveTopic(null);
    frameQueueRef.current = null;
  }

  function updateTopic() {
    const trimmedTopic = topic.trim();
    if (!trimmedTopic || trimmedTopic === activeTopic) return;

    if (activeTopic) {
      client.unsubscribe(activeTopic);
    }

    setActiveTopic(trimmedTopic);
    setTopic(trimmedTopic);

    const updatedHistory = addToVideoTopicHistory(trimmedTopic);
    setTopicHistory(updatedHistory);
    client.subscribe(trimmedTopic, onFrame);
  }

  async function toggleZoom() {
    const container = videoShellRef.current as FullscreenElement | null;
    const doc = document as FullscreenDocument;
    if (!container) return;

    try {
      if (getFullscreenElement(doc)) {
        await exitFullscreenCompat(doc);
      } else {
        await requestFullscreenCompat(container);
      }
    } catch {
      // Ignore fullscreen API failures.
    }
  }

  const canStart = topic.trim().length > 0;
  const topicChanged = subscribed && topic.trim() !== activeTopic;

  return (
    <section className="flex h-full min-h-0 flex-col gap-3">
      <Card className="border-white/10 bg-black/60 shadow-none">
        <CardContent className="space-y-3 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-zinc-100">Video Viewer</h2>
            <ConnectionBadge isConnected={isConnected} />
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[220px] flex-1 space-y-1">
              <Label htmlFor="comp-video-topic" className="text-xs text-zinc-300">
                Topic
              </Label>
              <Input
                id="comp-video-topic"
                type="text"
                placeholder="camera/front/frame"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                className="h-9 border-white/15 bg-black text-zinc-100 placeholder:text-zinc-500"
              />
            </div>

            {!subscribed ? (
              <Button type="button" onClick={startSubscription} disabled={!canStart} className="h-9">
                <Play className="mr-1 h-4 w-4" />
                Start
              </Button>
            ) : (
              <Button type="button" variant="destructive" onClick={stopSubscription} className="h-9">
                <Square className="mr-1 h-4 w-4" />
                Stop
              </Button>
            )}

            {topicChanged && (
              <Button type="button" variant="outline" onClick={updateTopic} className="h-9 border-white/20 bg-black">
                <RefreshCw className="mr-1 h-4 w-4" />
                Update
              </Button>
            )}

            <Button type="button" variant="outline" onClick={toggleZoom} className="h-9 border-white/20 bg-black">
              {isFullscreen ? (
                <>
                  <Minimize className="mr-1 h-4 w-4" />
                  Exit Zoom
                </>
              ) : (
                <>
                  <Expand className="mr-1 h-4 w-4" />
                  Zoom
                </>
              )}
            </Button>
          </div>

          {topicHistory.length > 0 && (
            <div className="flex flex-wrap gap-2">
              {topicHistory.slice(0, 6).map((entry) => (
                <Button
                  key={entry}
                  type="button"
                  variant="outline"
                  className="h-7 border-white/15 bg-black px-2 text-xs"
                  onClick={() => setTopic(entry)}
                >
                  {entry}
                </Button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="flex-1 min-h-0 border-white/10 bg-black shadow-none">
        <CardContent className="h-full min-h-0 p-2 sm:p-3">
          <div
            ref={videoShellRef}
            className="relative flex h-full min-h-[280px] w-full items-center justify-center overflow-hidden rounded-md border border-white/10 bg-zinc-950"
          >
            {subscribed ? (
              <canvas
                ref={canvasRef}
                className="h-auto max-h-full w-auto max-w-full object-contain"
                style={{ imageRendering: "auto" }}
              />
            ) : (
              <div className="px-6 text-center text-sm text-zinc-500">Enter a topic and start the feed.</div>
            )}

            <div className="absolute bottom-2 right-2 rounded border border-white/10 bg-black/80 px-2 py-1 text-xs text-zinc-300">
              {frameWidth && frameHeight ? `${frameWidth}×${frameHeight}` : "No frame"}
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function CompetitionPathsSelector() {
  const { settings } = useSettings();
  const client = useMemo(
    () => new AutobahnClient(new Address(settings.host, settings.port)),
    [settings.host, settings.port],
  );

  const [selectedPathName, setSelectedPathName] = useState(getStoredPath);
  const [topic, setTopic] = useState(getStoredPathTopic);
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
      const trimmedTopic = topic.trim();
      if (!trimmedTopic) {
        setLastPublish({
          atMs: Date.now(),
          topic: trimmedTopic,
          pathName,
          ok: false,
          message: "Topic is empty.",
        });
        return;
      }

      if (!client.isConnected()) {
        setLastPublish({
          atMs: Date.now(),
          topic: trimmedTopic,
          pathName,
          ok: false,
          message: "Not connected to Autobahn.",
        });
        return;
      }

      try {
        const bytes = SelectedPath.encode({ pathName }).finish();
        client.publish(trimmedTopic, bytes);
        setLastPublish({
          atMs: Date.now(),
          topic: trimmedTopic,
          pathName,
          ok: true,
        });
      } catch (error) {
        setLastPublish({
          atMs: Date.now(),
          topic: trimmedTopic,
          pathName,
          ok: false,
          message: (error as Error).message,
        });
      }
    },
    [client, topic],
  );

  function handleSelectPath(pathName: string) {
    setSelectedPathName(pathName);
    setStoredPath(pathName);
    publishPath(pathName);
  }

  function handleTopicChange(value: string) {
    setTopic(value);
    setStoredPathTopic(value);
  }

  return (
    <section className="flex h-full min-h-0 flex-col gap-3">
      <Card className="border-white/10 bg-black/60 shadow-none">
        <CardContent className="space-y-3 p-3 sm:p-4">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-medium text-zinc-100">Paths Selector</h2>
            <ConnectionBadge isConnected={isConnected} />
          </div>

          <div className="flex flex-wrap items-end gap-2">
            <div className="min-w-[220px] flex-1 space-y-1">
              <Label htmlFor="comp-path-topic" className="text-xs text-zinc-300">
                Publish Topic
              </Label>
              <Input
                id="comp-path-topic"
                value={topic}
                onChange={(event) => handleTopicChange(event.target.value)}
                placeholder={DEFAULT_PATH_TOPIC}
                className="h-9 border-white/15 bg-black text-zinc-100 placeholder:text-zinc-500"
              />
            </div>

            <Button
              type="button"
              onClick={() => selectedPathName && publishPath(selectedPathName)}
              disabled={!selectedPathName || !topic.trim() || !isConnected}
              className="h-9"
            >
              <Send className="mr-1 h-4 w-4" />
              Send
            </Button>
          </div>

          {lastPublish && (
            <p className="text-xs text-zinc-400">
              {lastPublish.ok ? "Published" : "Publish failed"} {lastPublish.pathName} to {lastPublish.topic}
              {lastPublish.message ? `: ${lastPublish.message}` : ""}
            </p>
          )}
        </CardContent>
      </Card>

      <Card className="flex-1 min-h-0 border-white/10 bg-black/50 shadow-none">
        <CardContent className="h-full min-h-0 p-3">
          <div className="grid gap-2 sm:grid-cols-2">
            {KNOWN_PATHS.map((pathName) => {
              const isSelected = selectedPathName === pathName;
              return (
                <button
                  key={pathName}
                  type="button"
                  onClick={() => handleSelectPath(pathName)}
                  className={
                    isSelected
                      ? "flex h-11 items-center rounded-md border border-white/55 bg-zinc-900 px-3 text-left text-sm font-medium text-white"
                      : "flex h-11 items-center rounded-md border border-white/15 bg-black px-3 text-left text-sm font-medium text-zinc-300 transition hover:border-white/30 hover:text-zinc-100"
                  }
                >
                  <span
                    className={
                      isSelected
                        ? "mr-2 h-2 w-2 rounded-full bg-white"
                        : "mr-2 h-2 w-2 rounded-full bg-transparent"
                    }
                  />
                  {pathName}
                </button>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default function CompetitionViewPage() {
  const { settings } = useSettings();

  return (
    <div className="flex h-[100dvh] min-h-screen w-full overflow-hidden bg-black text-zinc-100">
      <div className="mx-auto flex h-full w-full max-w-[1600px] min-w-0 flex-col p-3 sm:p-4">
        <header className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black px-4 py-2">
          <div>
            <p className="text-[10px] uppercase tracking-[0.2em] text-zinc-500">Competition Mode</p>
            <h1 className="text-base font-semibold text-zinc-100">Operator Console</h1>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-zinc-400">
              {settings.host}:{settings.port}
            </span>
            <Button asChild variant="outline" size="sm" className="border-white/20 bg-black">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back To Admin
              </Link>
            </Button>
          </div>
        </header>

        <Tabs defaultValue="video" className="mt-3 flex min-h-0 flex-1 flex-col">
          <TabsList className="h-10 w-fit border border-white/10 bg-zinc-950">
            <TabsTrigger value="video" className="min-w-[150px] data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100">
              <Clapperboard className="h-4 w-4" />
              Video Viewer
            </TabsTrigger>
            <TabsTrigger value="paths" className="min-w-[150px] data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100">
              <Route className="h-4 w-4" />
              Paths Selector
            </TabsTrigger>
          </TabsList>

          <TabsContent value="video" className="mt-3 min-h-0 flex-1">
            <CompetitionVideoViewer />
          </TabsContent>
          <TabsContent value="paths" className="mt-3 min-h-0 flex-1">
            <CompetitionPathsSelector />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
