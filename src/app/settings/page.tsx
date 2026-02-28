"use client";

import { useEffect, useState } from "react";
import {
  ntPathFromTableAndEntry,
  useSettings,
} from "@/lib/settings";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AppLayout } from "@/components/layout";

function SettingsContent() {
  const { settings, setSettings, resetDefaults } = useSettings();
  const [host, setHost] = useState(settings.host);
  const [port, setPort] = useState<number>(settings.port);
  const [ntHost, setNtHost] = useState<string>(settings.networkTables.host);
  const [ntPort, setNtPort] = useState<number>(settings.networkTables.port);
  const [sharedTable, setSharedTable] = useState<string>(settings.networkTables.sharedTable);
  const [autonomousSelectedEntry, setAutonomousSelectedEntry] = useState<string>(settings.networkTables.autonomousSelectedEntry);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setHost(settings.host);
    setPort(settings.port);
    setNtHost(settings.networkTables.host);
    setNtPort(settings.networkTables.port);
    setSharedTable(settings.networkTables.sharedTable);
    setAutonomousSelectedEntry(settings.networkTables.autonomousSelectedEntry);
  }, [
    settings.host,
    settings.networkTables.autonomousSelectedEntry,
    settings.networkTables.host,
    settings.networkTables.port,
    settings.networkTables.sharedTable,
    settings.port,
  ]);

  function onSave() {
    const nextPort = Number(port);
    const nextNtHost = ntHost.trim();
    const nextNtPort = Number(ntPort);
    const nextSharedTable = sharedTable.trim();
    const nextAutonomousSelectedEntry = autonomousSelectedEntry.trim();

    if (
      !host.trim() ||
      !Number.isFinite(nextPort) ||
      nextPort <= 0 ||
      nextPort > 65535 ||
      !nextNtHost ||
      !Number.isFinite(nextNtPort) ||
      nextNtPort <= 0 ||
      nextNtPort > 65535 ||
      !nextSharedTable ||
      !nextAutonomousSelectedEntry
    ) {
      setSaved(false);
      return;
    }
    setSettings({
      host: host.trim(),
      port: nextPort,
      networkTables: {
        host: nextNtHost,
        port: Math.round(nextNtPort),
        sharedTable: nextSharedTable,
        autonomousSelectedEntry: nextAutonomousSelectedEntry,
      },
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  }

  function onReset() {
    resetDefaults();
    setSaved(false);
  }

  return (
    <div className="max-w-2xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Autobahn Connection</CardTitle>
          <CardDescription>
            Configure the host and port for the Autobahn WebSocket connection.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="host">Host</Label>
            <Input
              id="host"
              type="text"
              placeholder="e.g. 10.47.65.7"
              value={host}
              onChange={(e) => setHost(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="port">Port</Label>
            <Input
              id="port"
              type="text"
              inputMode="numeric"
              placeholder="8080"
              value={String(port)}
              onChange={(e) => {
                const v = e.target.value.replace(/\D+/g, "");
                setPort(v === "" ? 0 : Number(v));
              }}
            />
          </div>
          <div className="flex items-center gap-3 pt-2">
            <Button onClick={onSave}>Save</Button>
            <Button variant="outline" onClick={onReset}>
              Reset defaults
            </Button>
            {saved && (
              <span className="text-sm text-emerald-400">Saved</span>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>NetworkTables (Paths)</CardTitle>
          <CardDescription>
            Path sync uses WPILib NT4 and connects to your configured robot host/IP.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="nt-host">Robot NT Host / IP</Label>
            <Input
              id="nt-host"
              type="text"
              placeholder="10.47.65.2 or roborio-4765-frc.local"
              value={ntHost}
              onChange={(e) => setNtHost(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nt-port">NT Port</Label>
            <Input
              id="nt-port"
              type="text"
              inputMode="numeric"
              placeholder="5810"
              value={String(ntPort)}
              onChange={(e) => {
                const v = e.target.value.replace(/\D+/g, "");
                setNtPort(v === "" ? 0 : Number(v));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nt-shared-table">Shared Table</Label>
            <Input
              id="nt-shared-table"
              type="text"
              placeholder="PathPlanner"
              value={sharedTable}
              onChange={(e) => setSharedTable(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="nt-selected-entry">Autonomous Selected Entry</Label>
            <Input
              id="nt-selected-entry"
              type="text"
              placeholder="AutonomousSelected"
              value={autonomousSelectedEntry}
              onChange={(e) => setAutonomousSelectedEntry(e.target.value)}
            />
          </div>
          <div className="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-zinc-300">
            NetworkTables target host:{" "}
            <span className="font-mono text-zinc-100">
              {ntHost || "(not set)"}
            </span>
            <br />
            Full NT topic for selected auto:{" "}
            <span className="font-mono text-zinc-100">
              {ntPathFromTableAndEntry(sharedTable, autonomousSelectedEntry)}
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function SettingsPage() {
  return (
    <AppLayout title="Settings">
      <SettingsContent />
    </AppLayout>
  );
}
