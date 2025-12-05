// src/lib/hooks/usePing.ts - Purpose: ping/pong latency measurement for Pi systems
import { useState, useCallback, useRef, useMemo, useEffect } from "react";
import { Address, AutobahnClient } from "autobahn-client";
import { Ping, Pong } from "@/generated/status/PiStatus";
import { useSettings } from "@/lib/settings";

export interface PingResult {
  piName: string;
  latency: number; // in milliseconds
  timestamp: Date;
}

export function usePing() {
  const { settings } = useSettings();
  const client = useMemo(
    () => new AutobahnClient(new Address(settings.host, settings.port)),
    [settings.host, settings.port]
  );
  const [pingResults, setPingResults] = useState<Map<string, PingResult>>(
    new Map()
  );
  const [isConnected, setIsConnected] = useState(false);
  const pendingPingsRef = useRef<Map<string, number>>(new Map()); // piName -> sentTimestamp
  const pongSubscriptionRef = useRef<string | null>(null);

  // Initialize connection
  useEffect(() => {
    let cancelled = false;

    const checkConnection = () => {
      if (cancelled) return;
      try {
        const connected = client.isConnected();
        setIsConnected(connected);
        return connected;
      } catch (error) {
        setIsConnected(false);
        return false;
      }
    };

    try {
      client.begin();
    } catch (error) {
      console.error("[Ping] Error starting connection:", error);
      setIsConnected(false);
    }

    checkConnection();

    const intervalId = setInterval(() => {
      checkConnection();
    }, 500);

    return () => {
      cancelled = true;
      clearInterval(intervalId);
    };
  }, [client]);

  // Subscribe to pong topic
  useEffect(() => {
    if (!isConnected) {
      return;
    }

    const pongTopic = "pi-pong";

    const handlePong = async (payload: Uint8Array) => {
      try {
        const pong = Pong.decode(payload);
        const piName = pong.piName;
        const originalTimestamp = BigInt(pong.timestampMsOriginal);
        const receivedTimestamp = BigInt(pong.timestampMsReceived);

        // Find the corresponding ping
        const sentTimestamp = pendingPingsRef.current.get(piName);
        if (!sentTimestamp) {
          console.warn("[Ping] Received pong for unknown ping from:", piName);
          return;
        }

        // Calculate round trip latency
        // We use the difference between when we sent and now, but also consider server processing
        const now = Date.now();
        const roundTripLatency = now - sentTimestamp;

        // Remove from pending
        pendingPingsRef.current.delete(piName);

        setPingResults((prev) => {
          const updated = new Map(prev);
          updated.set(piName, {
            piName,
            latency: roundTripLatency,
            timestamp: new Date(),
          });
          return updated;
        });
      } catch (error) {
        console.error("[Ping] Failed to decode pong:", error);
      }
    };

    try {
      console.log("[Ping] Subscribing to pong topic:", pongTopic);
      client.subscribe(pongTopic, handlePong);
      pongSubscriptionRef.current = pongTopic;
      console.log("[Ping] ✓ Subscribed to pong topic");
    } catch (error) {
      console.error("[Ping] Failed to subscribe to pong topic:", error);
    }

    return () => {
      if (pongSubscriptionRef.current) {
        try {
          client.unsubscribe(pongSubscriptionRef.current);
        } catch (e) {
          // Ignore unsubscribe errors
        }
        pongSubscriptionRef.current = null;
      }
    };
  }, [client, isConnected]);

  const sendPing = useCallback(
    (piName: string) => {
      if (!isConnected || !client.isConnected()) {
        console.warn("[Ping] Cannot send ping - not connected");
        return;
      }

      try {
        const timestamp = Date.now();
        const ping = Ping.create({
          timestamp: BigInt(timestamp).toString(),
        });

        const pingTopic = "pi-ping";
        const pingBytes = Ping.encode(ping).finish();

        // Store the sent timestamp for this specific pi
        // We'll match it when we receive the pong with matching pi_name
        pendingPingsRef.current.set(piName, timestamp);

        // Publish ping (all backends will respond)
        client.publish(pingTopic, pingBytes);
        console.log("[Ping] Sent ping, expecting response from:", piName);
      } catch (error) {
        console.error("[Ping] Failed to send ping:", error);
        pendingPingsRef.current.delete(piName);
      }
    },
    [client, isConnected]
  );

  const pingAll = useCallback(
    (piNames: string[]) => {
      piNames.forEach((piName) => {
        sendPing(piName);
      });
    },
    [sendPing]
  );

  return {
    pingResults,
    sendPing,
    pingAll,
    isConnected,
  };
}

