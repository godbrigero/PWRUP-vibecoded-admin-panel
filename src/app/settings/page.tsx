"use client";

import { useEffect, useState } from "react";
import { useSettings } from "@/lib/settings";
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
