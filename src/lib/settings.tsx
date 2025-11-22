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

  // Load from localStorage once on mount (client-side only)
  useEffect(() => {
    try {
      if (typeof window !== "undefined") {
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
    }
  }, []);

  const setSettings = useCallback((next: ConnectionSettings) => {
    setSettingsState(next);
    try {
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
    } catch {
      // storage might be unavailable
    }
  }, []);

  const resetDefaults = useCallback(() => {
    setSettings(DEFAULTS);
  }, [setSettings]);

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
