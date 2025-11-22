// src/app/video/page.tsx - Purpose: view live image frames from a specified pub topic
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { Address, AutobahnClient } from "autobahn-client";
import { useSettings } from "@/lib/settings";
import { ConnectionBadge } from "@/components/ConnectionBadge";
import { ImageData, ImageCompression } from "@/generated/sensor/camera_sensor";
import { GeneralSensorData } from "@/generated/sensor/general_sensor_data";

export default function VideoFeedPage() {
  const { settings } = useSettings();
  const client = useMemo(
    () => new AutobahnClient(new Address(settings.host, settings.port)),
    [settings.host, settings.port]
  );
  useEffect(() => {
    client.begin();
  }, [client]);

  const [topic, setTopic] = useState<string>("");
  const [frameWidth, setFrameWidth] = useState<number | null>(null);
  const [frameHeight, setFrameHeight] = useState<number | null>(null);
  const [subscribed, setSubscribed] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const frameQueueRef = useRef<ImageData | null>(null);
  const rafIdRef = useRef<number | null>(null);

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
        console.log("Canvas ref not available, continuing loop");
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
          console.warn("Unsupported compression type:", imageData.compression);
          rafIdRef.current = requestAnimationFrame(renderFrame);
          return;
        }

        const mimeType =
          imageData.compression === ImageCompression.JPEG
            ? "image/jpeg"
            : "image/png";

        console.log("Creating blob with mimeType:", mimeType);
        // Ensure we have a proper ArrayBufferView for Blob constructor
        const imageBytes = new Uint8Array(imageData.image);
        const blob = new Blob([imageBytes], {
          type: mimeType,
        });
        const url = URL.createObjectURL(blob);
        console.log("Created object URL:", url.substring(0, 50) + "...");

        const img = new Image();
        img.onload = () => {
          console.log("Image loaded successfully, drawing to canvas");
          if (canvasRef.current) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext("2d");
            if (ctx) {
              // Set canvas size to match image
              canvas.width = imageData.width;
              canvas.height = imageData.height;
              ctx.drawImage(img, 0, 0);
              console.log(
                "Image drawn to canvas:",
                canvas.width,
                "x",
                canvas.height
              );
            } else {
              console.error("Failed to get 2d context");
            }
          }
          URL.revokeObjectURL(url);
        };
        img.onerror = (error) => {
          console.error("Image load error:", error);
          URL.revokeObjectURL(url);
        };
        img.src = url;
      }

      // Continue animation loop (effect cleanup will stop it when subscribed changes)
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

  async function onFrame(payload: Uint8Array) {
    try {
      const generalSensorData = GeneralSensorData.decode(payload);
      if (!generalSensorData.image) {
        console.error("No image data in generalSensorData");
        return;
      }

      const imageData = generalSensorData.image;
      console.log("Decoded imageData:", {
        width: imageData.width,
        height: imageData.height,
        compression: imageData.compression,
        imageLength: imageData.image?.length,
      });

      setFrameWidth(imageData.width ?? null);
      setFrameHeight(imageData.height ?? null);

      // Queue the latest frame (drop older frames if queue is full)
      // This ensures we always show the most recent frame
      frameQueueRef.current = imageData;
      console.log("Queued frame for rendering");
    } catch (e) {
      // swallow rendering errors to keep stream alive
      console.error("Failed to decode frame:", e);
    }
  }

  function startSubscription() {
    setSubscribed(true);
    console.log("Subscribing to " + topic);
    client.subscribe(topic, onFrame);
  }

  function stopSubscription() {
    setSubscribed(false);
    console.log("unsubbing to " + topic);
    client.unsubscribe(topic);
    // Clear frame queue when stopping
    frameQueueRef.current = null;
  }

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
            <h1 className="text-2xl font-bold">Live Video Feed</h1>
          </div>
          <ConnectionBadge />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-800 rounded-lg p-4 space-y-3">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!subscribed && topic.trim().length > 0) {
                  startSubscription();
                }
              }}
            >
              <div className="flex flex-col">
                <label
                  htmlFor="topic-input"
                  className="text-sm text-gray-300 mb-1"
                >
                  Topic
                </label>
                <input
                  id="topic-input"
                  name="topic"
                  type="text"
                  className="bg-gray-900 border border-gray-700 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                  placeholder="e.g. camera/front/frame"
                  value={topic}
                  onChange={(e) => {
                    setTopic(e.target.value);
                    console.log(e.target.value);
                  }}
                />
              </div>
            </form>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={startSubscription}
                disabled={subscribed || topic.trim().length === 0}
                className={`cursor-pointer px-3 py-2 rounded ${
                  subscribed || topic.trim().length === 0
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white"
                }`}
              >
                Start
              </button>
              <button
                type="button"
                onClick={stopSubscription}
                disabled={!subscribed}
                className={`cursor-pointer px-3 py-2 rounded ${
                  !subscribed
                    ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                    : "bg-red-600 hover:bg-red-500 text-white"
                }`}
              >
                Stop
              </button>
              {subscribed ? (
                <span className="text-xs text-emerald-400">Active</span>
              ) : (
                <span className="text-xs text-gray-400">Idle</span>
              )}
            </div>

            <div className="flex flex-col">
              <label
                htmlFor="mime-select"
                className="text-sm text-gray-300 mb-1"
              >
                MIME Type (fallback)
              </label>
            </div>

            <div className="text-xs text-gray-400">
              Connected to {settings.host}:{settings.port}
            </div>
            {frameWidth && frameHeight ? (
              <div className="text-xs text-gray-400">
                Resolution: {frameWidth}×{frameHeight}
              </div>
            ) : null}
          </div>

          <div className="md:col-span-2 bg-black border border-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
            {subscribed ? (
              <canvas
                ref={canvasRef}
                className="max-h-[70vh] max-w-full w-auto h-auto object-contain select-none"
                style={{ imageRendering: "auto" }}
              />
            ) : (
              <div className="text-gray-400 p-8 text-center">
                Provide a topic to start viewing frames.
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
