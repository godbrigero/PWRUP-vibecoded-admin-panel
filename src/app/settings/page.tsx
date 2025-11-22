// src/app/settings/page.tsx - Purpose: settings UI to configure Autobahn host/port
"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/lib/settings";
import { Card, CardHeader } from "@/components/ui/Card";
import Link from "next/link";
import { ConnectionBadge } from "@/components/ConnectionBadge";

export default function SettingsPage() {
  const { settings, setSettings, resetDefaults } = useSettings();
  const [host, setHost] = useState(settings.host);
  const [port, setPort] = useState<number>(settings.port);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setHost(settings.host);
    setPort(settings.port);
  }, [settings.host, settings.port]);

  function onSave() {
    const nextPort = Number(port);
    if (
      !host.trim() ||
      !Number.isFinite(nextPort) ||
      nextPort <= 0 ||
      nextPort > 65535
    ) {
      setSaved(false);
      return;
    }
    setSettings({ host: host.trim(), port: nextPort });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function onReset() {
    resetDefaults();
    setSaved(false);
  }

  return (
    <main className="min-h-screen text-white">
      <div className="max-w-2xl mx-auto p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="text-sm text-gray-300 hover:text-white underline cursor-pointer"
            >
              Back
            </Link>
            <h1 className="text-2xl font-bold">Settings</h1>
          </div>
          <ConnectionBadge />
        </div>
        <Card>
          <CardHeader>Autobahn Connection</CardHeader>
          <div className="space-y-4">
            <div className="flex flex-col">
              <label className="text-sm text-gray-300 mb-1">Host</label>
              <input
                type="text"
                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="e.g. 10.47.65.7"
                value={host}
                onChange={(e) => setHost(e.target.value)}
              />
            </div>
            <div className="flex flex-col">
              <label className="text-sm text-gray-300 mb-1">Port</label>
              <input
                type="number"
                className="bg-gray-900 border border-gray-700 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
                placeholder="8080"
                inputMode="numeric"
                pattern="[0-9]*"
                value={String(port)}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D+/g, "");
                  setPort(v === "" ? 0 : Number(v));
                }}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={onSave}
                className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 text-white px-4 py-2 rounded"
              >
                Save
              </button>
              <button
                type="button"
                onClick={onReset}
                className="cursor-pointer bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded"
              >
                Reset defaults
              </button>
              {saved && <span className="text-sm text-emerald-400">Saved</span>}
            </div>
          </div>
        </Card>
      </div>
    </main>
  );
}
