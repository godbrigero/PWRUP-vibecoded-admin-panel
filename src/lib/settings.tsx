"use client";
// src/lib/settings.tsx - Purpose: provide global connection settings (host/port) with persistence
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

export interface ConnectionSettings {
  host: string;
  port: number;
}

interface SettingsContextValue {
  settings: ConnectionSettings;
  setSettings: (next: ConnectionSettings) => void;
  resetDefaults: () => void;
}

const DEFAULTS: ConnectionSettings = { host: "10.47.65.7", port: 8080 };
const STORAGE_KEY = "blitz.settings.connection";

const SettingsContext = createContext<SettingsContextValue | undefined>(
  undefined
);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettingsState] = useState<ConnectionSettings>(DEFAULTS);
  const [hydrated, setHydrated] = useState(false);

  const persistSettings = useCallback((next: ConnectionSettings) => {
    try {
      if (typeof window !== "undefined" && typeof window.localStorage?.setItem === "function") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    } catch {
      // storage might be unavailable
    }
  }, []);

  // Load from localStorage once on mount (client-side only)
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && typeof window.localStorage?.getItem === "function") {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw) as Partial<ConnectionSettings>;
          const next: ConnectionSettings = {
            host:
              typeof parsed.host === "string" && parsed.host.length > 0
                ? parsed.host
                : DEFAULTS.host,
            port:
              typeof parsed.port === "number" && Number.isFinite(parsed.port)
                ? parsed.port
                : DEFAULTS.port,
          };
          setSettingsState(next);
        }
      }
    } catch {
      // ignore corrupted storage
    } finally {
      setHydrated(true);
    }
  }, []);

  const setSettings = useCallback((next: ConnectionSettings) => {
    setSettingsState(next);
    persistSettings(next);
  }, [persistSettings]);

  const resetDefaults = useCallback(() => {
    setSettings(DEFAULTS);
  }, [setSettings]);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    let cancelled = false;

    async function autoDiscover() {
      try {
        const response = await fetch("/api/discovery/watchdog?timeoutMs=2500", {
          cache: "no-store",
        });
        if (!response.ok || cancelled) {
          return;
        }

        const payload = (await response.json()) as {
          ok?: boolean;
          found?: boolean;
          host?: string;
          port?: number;
        };

        if (!payload.ok || !payload.found) {
          return;
        }

        const host = typeof payload.host === "string" ? payload.host.trim() : "";
        const port =
          typeof payload.port === "number" && Number.isFinite(payload.port)
            ? Math.round(payload.port)
            : NaN;

        if (!host || !Number.isFinite(port) || port <= 0 || port > 65535) {
          return;
        }

        const next: ConnectionSettings = { host, port };
        if (cancelled) {
          return;
        }

        setSettingsState((prev) => {
          if (prev.host === next.host && prev.port === next.port) {
            return prev;
          }
          return next;
        });
        persistSettings(next);
      } catch {
        // Ignore discovery failures and keep existing settings.
      }
    }

    void autoDiscover();

    return () => {
      cancelled = true;
    };
  }, [hydrated, persistSettings]);

  const value = useMemo<SettingsContextValue>(
    () => ({ settings, setSettings, resetDefaults }),
    [settings, setSettings, resetDefaults]
  );

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings(): SettingsContextValue {
  const ctx = useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings must be used within a SettingsProvider");
  }
  return ctx;
}
