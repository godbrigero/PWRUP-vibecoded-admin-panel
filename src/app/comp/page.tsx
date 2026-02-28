"use client";

import Link from "next/link";
import NextImage from "next/image";
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
  Square,
  X,
} from "lucide-react";

import { useSettings } from "@/lib/settings";
import { KNOWN_PATHS } from "@/lib/paths";
import { ImageData, ImageCompression } from "@/generated/sensor/camera_sensor";
import { GeneralSensorData } from "@/generated/sensor/general_sensor_data";
import { usePathNetworkTable } from "@/lib/hooks/usePathNetworkTable";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const VIDEO_TOPIC_HISTORY_KEY = "blitz.video.topicHistory";
const VIDEO_HISTORY_MAX = 10;

const SELECTED_PATH_STORAGE_KEY = "blitz.paths.selected";
const PATH_OVERVIEW_DIR = "/path-overview";
const PATH_IMAGE_EXTENSIONS = ["gif", "png", "jpg", "jpeg", "webp", "avif", "svg"] as const;
const DETACHED_QUERY_PARAM = "detached";
const DETACHED_TABS_CHANNEL = "blitz.comp.detached-tabs";
const COMPETITION_TABS = ["video", "paths"] as const;
const TAB_DRAG_DATA_KEY = "application/x-blitz-competition-tab";

type CompetitionTabId = (typeof COMPETITION_TABS)[number];
type DetachedTabsState = Record<CompetitionTabId, boolean>;
type DetachedTabMessage = {
  type: "detached" | "attached";
  tab: CompetitionTabId;
};

const TAB_LABELS: Record<CompetitionTabId, string> = {
  video: "Video Viewer",
  paths: "Paths Selector",
};

const INITIAL_DETACHED_TABS: DetachedTabsState = {
  video: false,
  paths: false,
};

function parseCompetitionTab(value: string | null): CompetitionTabId | null {
  if (value === "video" || value === "paths") return value;
  return null;
}

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

function slugifyPathName(pathName: string): string {
  return pathName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function findMatchingKnownPath(pathName: string | null): string | null {
  if (!pathName) return null;
  const trimmed = pathName.trim();
  if (!trimmed) return null;

  const directMatch = KNOWN_PATHS.find((entry) => entry === trimmed);
  if (directMatch) return directMatch;

  const lowered = trimmed.toLowerCase();
  const caseInsensitiveMatch = KNOWN_PATHS.find((entry) => entry.toLowerCase() === lowered);
  return caseInsensitiveMatch ?? null;
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
  const [fps, setFps] = useState<number | null>(null);
  const [isZoomed, setIsZoomed] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const videoShellRef = useRef<HTMLDivElement | null>(null);
  const frameQueueRef = useRef<ImageData | null>(null);
  const rafIdRef = useRef<number | null>(null);
  const framesSinceTickRef = useRef(0);

  const onFrame = useCallback(async (payload: Uint8Array) => {
    try {
      const generalSensorData = GeneralSensorData.decode(payload);
      if (!generalSensorData.image) return;

      const imageData = generalSensorData.image;
      setFrameWidth(imageData.width ?? null);
      setFrameHeight(imageData.height ?? null);
      framesSinceTickRef.current += 1;
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
    if (!isZoomed) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsZoomed(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isZoomed]);

  useEffect(() => {
    let lastTickMs = performance.now();
    const timerId = window.setInterval(() => {
      const nowMs = performance.now();
      const elapsedMs = nowMs - lastTickMs;
      lastTickMs = nowMs;
      const frames = framesSinceTickRef.current;
      framesSinceTickRef.current = 0;
      if (elapsedMs <= 0 || frames === 0) {
        setFps((prev) => (prev === null ? prev : 0));
        return;
      }
      setFps((frames * 1000) / elapsedMs);
    }, 500);

    return () => window.clearInterval(timerId);
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
    framesSinceTickRef.current = 0;
    setFps(null);
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

  function toggleZoom() {
    setIsZoomed((prev) => !prev);
  }

  const canStart = topic.trim().length > 0;
  const topicChanged = subscribed && topic.trim() !== activeTopic;

  return (
    <section className="flex h-full min-h-0 flex-col gap-3">
      <Card className="border-white/10 bg-black/60 shadow-none">
        <CardContent className="space-y-3 p-3 sm:p-4">
          <div className="flex items-center gap-3">
            <h2 className="text-sm font-medium text-zinc-100">Video Viewer</h2>
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
              {isZoomed ? (
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

      <Card
        className={
          isZoomed
            ? "fixed inset-3 z-50 flex min-h-0 flex-col border-white/10 bg-black/95 shadow-none"
            : "flex-1 min-h-0 border-white/10 bg-black shadow-none"
        }
      >
        <CardContent className="h-full min-h-0 p-2 sm:p-3">
          <div
            ref={videoShellRef}
            className="relative flex h-full min-h-[280px] w-full items-center justify-center overflow-hidden rounded-md bg-zinc-950"
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
              {frameWidth && frameHeight && <div>{`${frameWidth}×${frameHeight}`}</div>}
              <div className="text-[10px] text-zinc-400">{fps !== null ? `${fps.toFixed(1)} fps` : "-- fps"}</div>
            </div>
            {isZoomed && (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={toggleZoom}
                className="absolute right-2 top-2 h-8 border-white/20 bg-black/80"
              >
                <X className="h-3.5 w-3.5" />
                Close
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

function CompetitionPathsSelector() {
  const { robotIp, topic, isConnected, currentPath, lastUpdatedMs } = usePathNetworkTable();
  const [selectedPathName, setSelectedPathName] = useState<string>(() => getStoredPath() || KNOWN_PATHS[0]);
  const [imageCandidateIndex, setImageCandidateIndex] = useState(0);

  function handleSelectPath(pathName: string) {
    setSelectedPathName(pathName);
    setStoredPath(pathName);
  }

  const imageCandidates = useMemo(() => {
    const encodedName = encodeURIComponent(selectedPathName);
    const slugName = slugifyPathName(selectedPathName);
    const byExactName = PATH_IMAGE_EXTENSIONS.map((ext) => `${PATH_OVERVIEW_DIR}/${encodedName}.${ext}`);
    const bySlugName =
      slugName.length > 0 ? PATH_IMAGE_EXTENSIONS.map((ext) => `${PATH_OVERVIEW_DIR}/${slugName}.${ext}`) : [];
    return [...byExactName, ...bySlugName];
  }, [selectedPathName]);

  useEffect(() => {
    setImageCandidateIndex(0);
  }, [selectedPathName]);

  useEffect(() => {
    const matchedPath = findMatchingKnownPath(currentPath);
    if (!matchedPath) return;
    setSelectedPathName(matchedPath);
    setStoredPath(matchedPath);
  }, [currentPath]);

  const previewImageSrc = imageCandidates[imageCandidateIndex] ?? null;
  const robotMatchedPath = findMatchingKnownPath(currentPath);
  const lastUpdatedText =
    typeof lastUpdatedMs === "number" ? new Date(lastUpdatedMs).toLocaleTimeString() : "No updates yet";

  return (
    <section className="flex h-full min-h-0 flex-col gap-3">
      <Card className="flex-1 min-h-0 border-white/10 bg-black/50 shadow-none">
        <CardContent className="flex h-full min-h-0 flex-col p-3">
          <div className="mb-3 rounded-md border border-white/10 bg-black/70 px-3 py-2 text-xs">
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
              {robotMatchedPath && (
                <span className="text-zinc-500">Matched and selected for preview.</span>
              )}
              <span className="text-zinc-500">Updated: {lastUpdatedText}</span>
            </div>
          </div>

          <div className="grid min-h-0 flex-1 gap-3 lg:grid-cols-[340px_minmax(0,1fr)]">
            <div className="min-h-0 rounded-md border border-white/10 bg-black/70 p-3">
              <div className="mb-2">
                <h2 className="text-sm font-medium text-zinc-100">Path Selector</h2>
                <p className="text-xs text-zinc-500">Select a path to preview.</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-1">
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
            </div>

            <div className="min-h-0 rounded-md border border-white/10 bg-black/70 p-3">
              <div className="mb-2">
                <h2 className="text-sm font-medium text-zinc-100">Path Overview</h2>
                <p className="text-xs text-zinc-500">{selectedPathName}</p>
              </div>
              <div className="relative flex h-[60vh] min-h-[280px] w-full items-center justify-center overflow-hidden rounded-md bg-zinc-950">
                {previewImageSrc ? (
                  <NextImage
                    src={previewImageSrc}
                    alt={`${selectedPathName} path preview`}
                    fill
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    unoptimized
                    className="object-contain"
                    onError={() => setImageCandidateIndex((prev) => prev + 1)}
                  />
                ) : (
                  <div className="px-5 text-center text-xs text-zinc-500">
                    Add an image in <span className="font-mono text-zinc-400">{PATH_OVERVIEW_DIR}</span> named{" "}
                    <span className="font-mono text-zinc-400">{selectedPathName}</span> or{" "}
                    <span className="font-mono text-zinc-400">{slugifyPathName(selectedPathName)}</span> with any of:{" "}
                    {PATH_IMAGE_EXTENSIONS.join(", ")}.
                  </div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </section>
  );
}

export default function CompetitionViewPage() {
  const [detachedTab, setDetachedTab] = useState<CompetitionTabId | null>(null);
  const canDetachTabs = typeof window !== "undefined" && "blitzRenderer" in window;
  const effectiveDetachedTab = canDetachTabs ? detachedTab : null;

  const [activeTab, setActiveTab] = useState<CompetitionTabId>("video");
  const [detachedTabs, setDetachedTabs] = useState<DetachedTabsState>(INITIAL_DETACHED_TABS);
  const [draggingTab, setDraggingTab] = useState<CompetitionTabId | null>(null);
  const detachedChannelRef = useRef<BroadcastChannel | null>(null);
  const detachedWindowsRef = useRef<Partial<Record<CompetitionTabId, Window | null>>>({});

  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    setDetachedTab(parseCompetitionTab(params.get(DETACHED_QUERY_PARAM)));
  }, []);

  useEffect(() => {
    if (!canDetachTabs) return;
    if (typeof window === "undefined" || typeof BroadcastChannel === "undefined") return;
    const channel = new BroadcastChannel(DETACHED_TABS_CHANNEL);
    detachedChannelRef.current = channel;

    channel.onmessage = (event: MessageEvent<DetachedTabMessage>) => {
      const message = event.data;
      if (!message || (message.type !== "detached" && message.type !== "attached")) return;

      setDetachedTabs((prev) => ({
        ...prev,
        [message.tab]: message.type === "detached",
      }));

      if (message.type === "attached") {
        setActiveTab(message.tab);
      }
    };

    return () => {
      channel.close();
      detachedChannelRef.current = null;
    };
  }, [canDetachTabs]);

  useEffect(() => {
    if (!canDetachTabs || !effectiveDetachedTab) return;

    detachedChannelRef.current?.postMessage({ type: "detached", tab: effectiveDetachedTab });
    const onBeforeUnload = () => {
      detachedChannelRef.current?.postMessage({ type: "attached", tab: effectiveDetachedTab });
    };
    window.addEventListener("beforeunload", onBeforeUnload);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      detachedChannelRef.current?.postMessage({ type: "attached", tab: effectiveDetachedTab });
    };
  }, [canDetachTabs, effectiveDetachedTab]);

  useEffect(() => {
    if (!detachedTabs[activeTab]) return;
    const fallbackTab = COMPETITION_TABS.find((tab) => !detachedTabs[tab]);
    if (fallbackTab) {
      setActiveTab(fallbackTab);
    }
  }, [activeTab, detachedTabs]);

  const popOutTab = useCallback((tab: CompetitionTabId) => {
    if (!canDetachTabs) return;
    if (typeof window === "undefined") return;

    const existingWindow = detachedWindowsRef.current[tab];
    if (existingWindow && !existingWindow.closed) {
      existingWindow.focus();
      return;
    }

    const popoutUrl = new URL(window.location.href);
    popoutUrl.searchParams.set(DETACHED_QUERY_PARAM, tab);
    const openedWindow = window.open(popoutUrl.toString(), "_blank", "popup=yes,width=1440,height=900");
    if (!openedWindow) return;

    detachedWindowsRef.current[tab] = openedWindow;
    setDetachedTabs((prev) => ({ ...prev, [tab]: true }));
    detachedChannelRef.current?.postMessage({ type: "detached", tab });
  }, [canDetachTabs]);

  const dockTab = useCallback((tab: CompetitionTabId) => {
    if (!canDetachTabs) return;
    const existingWindow = detachedWindowsRef.current[tab];
    if (existingWindow && !existingWindow.closed) {
      existingWindow.close();
    }

    detachedWindowsRef.current[tab] = null;
    setDetachedTabs((prev) => ({ ...prev, [tab]: false }));
    setActiveTab(tab);
    detachedChannelRef.current?.postMessage({ type: "attached", tab });
  }, [canDetachTabs]);

  const beginTabDrag = useCallback(
    (event: React.DragEvent<HTMLElement>, tab: CompetitionTabId) => {
      if (!canDetachTabs) return;
      event.dataTransfer.setData(TAB_DRAG_DATA_KEY, tab);
      event.dataTransfer.effectAllowed = "move";
      setDraggingTab(tab);
    },
    [canDetachTabs],
  );

  const endTabDrag = useCallback(
    (event: React.DragEvent<HTMLElement>, tab: CompetitionTabId) => {
      if (!canDetachTabs) return;
      setDraggingTab(null);
      if (effectiveDetachedTab) return;
      if (detachedTabs[tab]) return;

      const outsideWindowBounds =
        event.screenX < window.screenX ||
        event.screenX > window.screenX + window.outerWidth ||
        event.screenY < window.screenY ||
        event.screenY > window.screenY + window.outerHeight;

      if (outsideWindowBounds) {
        popOutTab(tab);
      }
    },
    [canDetachTabs, detachedTabs, effectiveDetachedTab, popOutTab],
  );

  const allowTabDrop = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      if (!canDetachTabs) return;
      const draggedTab = parseCompetitionTab(event.dataTransfer.getData(TAB_DRAG_DATA_KEY));
      if (!draggedTab) return;
      event.preventDefault();
      event.dataTransfer.dropEffect = "move";
    },
    [canDetachTabs],
  );

  const dropTabOnMainStrip = useCallback(
    (event: React.DragEvent<HTMLElement>) => {
      if (!canDetachTabs) return;
      const draggedTab = parseCompetitionTab(event.dataTransfer.getData(TAB_DRAG_DATA_KEY));
      if (!draggedTab) return;
      event.preventDefault();
      if (detachedTabs[draggedTab]) {
        dockTab(draggedTab);
      } else {
        setActiveTab(draggedTab);
      }
    },
    [canDetachTabs, detachedTabs, dockTab],
  );

  if (effectiveDetachedTab) {
    return (
      <div className="flex h-[100dvh] min-h-screen w-full overflow-hidden bg-black text-zinc-100">
        <div className="mx-auto flex h-full w-full max-w-[1600px] min-w-0 flex-col p-3 sm:p-4">
          <header className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black px-4 py-2">
            <div className="flex items-center gap-3">
              <button
                type="button"
                draggable
                onDragStart={(event) => beginTabDrag(event, effectiveDetachedTab)}
                onDragEnd={(event) => endTabDrag(event, effectiveDetachedTab)}
                className="flex h-8 items-center rounded-md border border-white/30 bg-zinc-900 px-3 text-xs font-medium text-zinc-100"
              >
                {TAB_LABELS[effectiveDetachedTab]}
              </button>
              <p className="text-xs text-zinc-500">Drag this tab onto the main window tab strip to dock it back.</p>
            </div>
          </header>
          <div className="mt-3 flex min-h-0 flex-1">
            {effectiveDetachedTab === "video" ? <CompetitionVideoViewer /> : <CompetitionPathsSelector />}
          </div>
        </div>
      </div>
    );
  }

  const allTabsDetached = canDetachTabs && COMPETITION_TABS.every((tab) => detachedTabs[tab]);

  return (
    <div className="flex h-[100dvh] min-h-screen w-full overflow-hidden bg-black text-zinc-100">
      <div className="mx-auto flex h-full w-full max-w-[1600px] min-w-0 flex-col p-3 sm:p-4">
        <header className="flex items-center justify-between gap-3 rounded-lg border border-white/10 bg-black px-4 py-2">
          <div>
            <h1 className="text-base font-semibold text-zinc-100">Operator Console</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm" className="border-white/20 bg-black">
              <Link href="/">
                <ArrowLeft className="h-4 w-4" />
                Back To Admin
              </Link>
            </Button>
          </div>
        </header>

        <Tabs
          value={activeTab}
          onValueChange={(value) => {
            const nextTab = parseCompetitionTab(value);
            if (!nextTab || (canDetachTabs && detachedTabs[nextTab])) return;
            setActiveTab(nextTab);
          }}
          className="mt-3 flex min-h-0 flex-1 flex-col"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <TabsList
              className="h-10 w-fit border border-white/10 bg-zinc-950"
              onDragOver={allowTabDrop}
              onDrop={dropTabOnMainStrip}
            >
              <TabsTrigger
                value="video"
                disabled={canDetachTabs && detachedTabs.video}
                draggable={canDetachTabs && !detachedTabs.video}
                onDragStart={(event) => beginTabDrag(event, "video")}
                onDragEnd={(event) => endTabDrag(event, "video")}
                className="min-w-[150px] data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
              >
                <Clapperboard className="h-4 w-4" />
                {canDetachTabs && detachedTabs.video ? "Video Viewer (Popped Out)" : "Video Viewer"}
              </TabsTrigger>
              <TabsTrigger
                value="paths"
                disabled={canDetachTabs && detachedTabs.paths}
                draggable={canDetachTabs && !detachedTabs.paths}
                onDragStart={(event) => beginTabDrag(event, "paths")}
                onDragEnd={(event) => endTabDrag(event, "paths")}
                className="min-w-[150px] data-[state=active]:bg-zinc-800 data-[state=active]:text-zinc-100"
              >
                <Route className="h-4 w-4" />
                {canDetachTabs && detachedTabs.paths ? "Paths Selector (Popped Out)" : "Paths Selector"}
              </TabsTrigger>
            </TabsList>
            {canDetachTabs && draggingTab && <p className="text-xs text-zinc-500">Drag tab out to detach, or onto this strip to dock.</p>}
          </div>

          {!detachedTabs.video && (
            <TabsContent value="video" className="mt-3 min-h-0 flex-1">
              <CompetitionVideoViewer />
            </TabsContent>
          )}
          {!detachedTabs.paths && (
            <TabsContent value="paths" className="mt-3 min-h-0 flex-1">
              <CompetitionPathsSelector />
            </TabsContent>
          )}

          {allTabsDetached && (
            <div className="mt-3 flex min-h-[180px] items-center justify-center rounded-md border border-white/10 bg-black/60 text-sm text-zinc-400">
              Both tabs are popped out. Use the buttons above to put one back.
            </div>
          )}
        </Tabs>
      </div>
    </div>
  );
}
