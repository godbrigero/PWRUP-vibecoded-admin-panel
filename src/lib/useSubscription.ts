// lib/useSubscription.ts
"use client";

import { useEffect, useRef } from "react";
import { AutobahnClient } from "@/lib/AutobahnClient";

/**
 * Subscribe to a pub/sub topic and invoke `callback` on each message.
 *
 * @param topic    The topic string to subscribe to.
 * @param callback Called with the raw payload bytes whenever a message arrives.
 * @param client   The AutobahnClient instance (should be created outside and reused).
 */
export function useSubscription(
  topic: string,
  callback: (payload: Uint8Array) => Promise<void>,
  client: AutobahnClient
) {
  const callbackRef = useRef(callback);

  // Update callback ref when it changes
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    client.subscribe(topic, async (payload) => {
      await callbackRef.current(payload);
    });

    return () => {
      // TODO: Implement unsubscribe when needed
    };
  }, [topic, client]);
}
