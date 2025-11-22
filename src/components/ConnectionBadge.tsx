// src/components/ConnectionBadge.tsx - Purpose: client-side connection status badge using settings
"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Address, AutobahnClient } from "autobahn-client";
import { useSettings } from "@/lib/settings";
import { ConnectionStatus } from "@/components/dashboard/ConnectionStatus";

export function ConnectionBadge() {
  const { settings } = useSettings();
  const client = useMemo(
    () => new AutobahnClient(new Address(settings.host, settings.port)),
    [settings.host, settings.port]
  );
  const [connected, setConnected] = useState(false);
  const pollRef = useRef<number | null>(null);

  useEffect(() => {
    let cancelled = false;
    // reflect current state immediately if available
    try {
      setConnected(client.isConnected());
    } catch {
      setConnected(false);
    }
    // attempt to connect and set when resolved/rejected
    Promise.resolve()
      .then(() => client.begin())
      .then(() => {
        if (!cancelled) {
          setConnected(client.isConnected());
        }
      })
      .catch(() => {
        if (!cancelled) {
          setConnected(false);
        }
      });
    // poll isConnected periodically to reflect live state
    pollRef.current = window.setInterval(() => {
      const state = client.isConnected();
      setConnected((prev) => (prev !== state ? state : prev));
    }, 1000);
    return () => {
      cancelled = true;
      if (pollRef.current !== null) {
        window.clearInterval(pollRef.current);
        pollRef.current = null;
      }
    };
  }, [client]);

  return <ConnectionStatus isConnected={connected} />;
}
