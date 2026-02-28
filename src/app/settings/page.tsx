"use client";

import { useEffect, useState } from "react";
import { frcTeamToRobotIp, useSettings } from "@/lib/settings";
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
  const [teamNumber, setTeamNumber] = useState<number>(settings.networkTables.teamNumber);
  const [ntPort, setNtPort] = useState<number>(settings.networkTables.port);
  const [robotIpLastOctet, setRobotIpLastOctet] = useState<number>(settings.networkTables.robotIpLastOctet);
  const [currentPathTopic, setCurrentPathTopic] = useState<string>(settings.networkTables.currentPathTopic);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setHost(settings.host);
    setPort(settings.port);
    setTeamNumber(settings.networkTables.teamNumber);
    setNtPort(settings.networkTables.port);
    setRobotIpLastOctet(settings.networkTables.robotIpLastOctet);
    setCurrentPathTopic(settings.networkTables.currentPathTopic);
  }, [
    settings.host,
    settings.networkTables.currentPathTopic,
    settings.networkTables.port,
    settings.networkTables.robotIpLastOctet,
    settings.networkTables.teamNumber,
    settings.port,
  ]);

  function onSave() {
    const nextPort = Number(port);
    const nextTeamNumber = Number(teamNumber);
    const nextNtPort = Number(ntPort);
    const nextIpLastOctet = Number(robotIpLastOctet);
    const nextPathTopic = currentPathTopic.trim();

    if (
      !host.trim() ||
      !Number.isFinite(nextPort) ||
      nextPort <= 0 ||
      nextPort > 65535 ||
      !Number.isFinite(nextTeamNumber) ||
      nextTeamNumber <= 0 ||
      nextTeamNumber > 99999 ||
      !Number.isFinite(nextNtPort) ||
      nextNtPort <= 0 ||
      nextNtPort > 65535 ||
      !Number.isFinite(nextIpLastOctet) ||
      nextIpLastOctet < 1 ||
      nextIpLastOctet > 254 ||
      !nextPathTopic
    ) {
      setSaved(false);
      return;
    }
    setSettings({
      host: host.trim(),
      port: nextPort,
      networkTables: {
        teamNumber: Math.round(nextTeamNumber),
        port: Math.round(nextNtPort),
        robotIpLastOctet: Math.round(nextIpLastOctet),
        currentPathTopic: nextPathTopic,
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
            Path sync uses WPILib NT4 and connects to a team-derived robot IP.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="frc-team-number">FRC Team Number</Label>
            <Input
              id="frc-team-number"
              type="text"
              inputMode="numeric"
              placeholder="4765"
              value={String(teamNumber)}
              onChange={(e) => {
                const v = e.target.value.replace(/\D+/g, "");
                setTeamNumber(v === "" ? 0 : Number(v));
              }}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="frc-ip-last-octet">Robot IP Last Octet</Label>
            <Input
              id="frc-ip-last-octet"
              type="text"
              inputMode="numeric"
              placeholder="2"
              value={String(robotIpLastOctet)}
              onChange={(e) => {
                const v = e.target.value.replace(/\D+/g, "");
                setRobotIpLastOctet(v === "" ? 0 : Number(v));
              }}
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
            <Label htmlFor="nt-path-topic">Current Path Topic</Label>
            <Input
              id="nt-path-topic"
              type="text"
              placeholder="/SmartDashboard/currentPath"
              value={currentPathTopic}
              onChange={(e) => setCurrentPathTopic(e.target.value)}
            />
          </div>
          <div className="rounded-md border border-white/10 bg-zinc-950 px-3 py-2 text-xs text-zinc-300">
            Robot IP from team number:{" "}
            <span className="font-mono text-zinc-100">
              {frcTeamToRobotIp(teamNumber, robotIpLastOctet)}
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
