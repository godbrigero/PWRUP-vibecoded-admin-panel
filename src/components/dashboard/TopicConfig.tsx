// src/components/dashboard/TopicConfig.tsx - Purpose: topic subscription configuration
"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";

interface TopicConfigProps {
  topic: string;
  onTopicChange: (topic: string) => void;
}

export function TopicConfig({ topic, onTopicChange }: TopicConfigProps) {
  const [topicInput, setTopicInput] = useState(topic);
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    setTopicInput(topic);
  }, [topic]);

  const handleSave = () => {
    if (topicInput.trim() && topicInput.trim() !== topic) {
      onTopicChange(topicInput.trim());
    }
    setIsEditing(false);
  };

  const handleCancel = () => {
    setTopicInput(topic);
    setIsEditing(false);
  };

  return (
    <Card className="bg-gradient-to-r from-gray-800 to-gray-750 border border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="text-xs text-gray-400 mb-1">Subscription Topics</div>
          {isEditing ? (
            <input
              type="text"
              value={topicInput}
              onChange={(e) => setTopicInput(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === "Enter") handleSave();
                if (e.key === "Escape") handleCancel();
              }}
              className="w-full px-3 py-2 bg-gray-900 text-white rounded border border-emerald-500 focus:border-emerald-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono text-sm"
              autoFocus
            />
          ) : (
            <div className="space-y-1">
              <div
                onClick={() => setIsEditing(true)}
                className="cursor-pointer px-3 py-2 bg-gray-900/50 rounded border border-gray-700 hover:border-emerald-500/50 transition-colors font-mono text-sm text-emerald-400"
              >
                {topic}
              </div>
              <div className="text-xs text-gray-500 px-3">
                Logs: <span className="font-mono text-gray-400">{topic}</span> • Stats: <span className="font-mono text-gray-400">{topic}/stats</span>
              </div>
            </div>
          )}
        </div>
        {isEditing && (
          <div className="flex gap-2 ml-3">
            <button
              onClick={handleSave}
              disabled={!topicInput.trim() || topicInput.trim() === topic}
              className="cursor-pointer px-3 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:bg-gray-700 disabled:cursor-not-allowed text-white rounded text-sm transition-colors"
            >
              Save
            </button>
            <button
              onClick={handleCancel}
              className="cursor-pointer px-3 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded text-sm transition-colors"
            >
              Cancel
            </button>
          </div>
        )}
      </div>
    </Card>
  );
}

