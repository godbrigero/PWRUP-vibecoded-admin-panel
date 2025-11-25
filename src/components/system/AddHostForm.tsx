// src/components/system/AddHostForm.tsx - Purpose: form to add new watchdog host
"use client";

import React from "react";
import { Card, CardHeader } from "@/components/ui/Card";

interface AddHostFormProps {
  onAdd: (url: string) => void;
  defaultPort?: number;
}

export function AddHostForm({ onAdd, defaultPort = 5000 }: AddHostFormProps) {
  const [hostInput, setHostInput] = React.useState("");
  const [portInput, setPortInput] = React.useState(defaultPort.toString());

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const host = hostInput.trim();
    const port = parseInt(portInput.trim(), 10);
    if (host && !isNaN(port) && port > 0 && port < 65536) {
      const url = `http://${host}:${port}`;
      onAdd(url);
      setHostInput("");
      setPortInput(defaultPort.toString());
    }
  }

  return (
    <Card>
      <CardHeader>Add Host</CardHeader>
      <form onSubmit={handleSubmit} className="flex items-end gap-3">
        <div className="flex-1">
          <label className="text-sm text-gray-300 mb-1 block">Host</label>
          <input
            type="text"
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="10.47.65.7"
            value={hostInput}
            onChange={(e) => setHostInput(e.target.value)}
          />
        </div>
        <div className="w-24">
          <label className="text-sm text-gray-300 mb-1 block">Port</label>
          <input
            type="number"
            className="w-full bg-gray-900 border border-gray-700 rounded px-3 py-2 outline-none focus:ring-2 focus:ring-emerald-500"
            placeholder="5000"
            value={portInput}
            onChange={(e) => setPortInput(e.target.value)}
            min="1"
            max="65535"
          />
        </div>
        <button
          type="submit"
          disabled={!hostInput.trim()}
          className="cursor-pointer bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white px-4 py-2 rounded"
        >
          Add
        </button>
      </form>
    </Card>
  );
}

