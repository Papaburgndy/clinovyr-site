"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClientConfig } from "@/lib/types";

interface SettingsFormProps {
  config: ClientConfig;
  clientId: string;
}

export function SettingsForm({ config: initialConfig, clientId }: SettingsFormProps) {
  const [config, setConfig] = useState(initialConfig);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleSave() {
    setSaving(true);
    setMessage(null);
    try {
      const res = await fetch("/api/dashboard/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clientId,
          escalationEmail: config.escalationEmail,
          businessHours: config.businessHours,
          faq: config.faq,
          notificationPreferences: config.notificationPreferences,
        }),
      });
      if (res.ok) {
        const updated = await res.json();
        setConfig(updated);
        setMessage("Settings saved.");
      } else {
        setMessage("Failed to save settings.");
      }
    } catch {
      setMessage("Failed to save settings.");
    } finally {
      setSaving(false);
    }
  }

  function updateFaq(index: number, field: "question" | "answer", value: string) {
    const faq = [...config.faq];
    faq[index] = { ...faq[index], [field]: value };
    setConfig({ ...config, faq });
  }

  const prefs = config.notificationPreferences ?? {
    emailReports: true,
    emailErrors: true,
    emailWeeklySummary: false,
  };

  return (
    <div className="space-y-8">
      {message && (
        <p className="rounded-md bg-cream px-4 py-2 text-sm text-ink">{message}</p>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Notification Preferences</CardTitle>
        </CardHeader>
        <div className="space-y-3">
          {(
            [
              ["emailReports", "Email monthly reports"],
              ["emailErrors", "Email automation errors"],
              ["emailWeeklySummary", "Email weekly summary"],
            ] as const
          ).map(([key, label]) => (
            <label key={key} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={prefs[key]}
                onChange={(e) =>
                  setConfig({
                    ...config,
                    notificationPreferences: {
                      ...prefs,
                      [key]: e.target.checked,
                    },
                  })
                }
                className="h-4 w-4 rounded border-rule accent-accent"
              />
              {label}
            </label>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Escalation Email</CardTitle>
        </CardHeader>
        <p className="mb-3 text-sm text-muted">
          When the AI agent cannot resolve an inquiry, notifications go here.
        </p>
        <input
          type="email"
          value={config.escalationEmail}
          onChange={(e) =>
            setConfig({ ...config, escalationEmail: e.target.value })
          }
          className="w-full max-w-md rounded-md border border-rule bg-paper px-3 py-2 text-sm focus:border-accent focus:outline-none focus:ring-1 focus:ring-accent"
        />
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Business Hours</CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {Object.entries(config.businessHours).map(([day, hours]) => (
            <div key={day} className="flex items-center gap-4 text-sm">
              <span className="w-28 capitalize text-muted">{day}</span>
              {hours ? (
                <>
                  <input
                    type="time"
                    value={hours.open}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        businessHours: {
                          ...config.businessHours,
                          [day]: { ...hours, open: e.target.value },
                        },
                      })
                    }
                    className="rounded border border-rule px-2 py-1"
                  />
                  <span className="text-muted">to</span>
                  <input
                    type="time"
                    value={hours.close}
                    onChange={(e) =>
                      setConfig({
                        ...config,
                        businessHours: {
                          ...config.businessHours,
                          [day]: { ...hours, close: e.target.value },
                        },
                      })
                    }
                    className="rounded border border-rule px-2 py-1"
                  />
                </>
              ) : (
                <span className="text-muted">Closed</span>
              )}
            </div>
          ))}
        </div>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>FAQ for Chatbot</CardTitle>
        </CardHeader>
        <div className="space-y-4">
          {config.faq.map((item, i) => (
            <div key={i} className="space-y-2 rounded border border-rule p-4">
              <input
                type="text"
                value={item.question}
                onChange={(e) => updateFaq(i, "question", e.target.value)}
                placeholder="Question"
                className="w-full rounded border border-rule px-3 py-2 text-sm font-medium"
              />
              <textarea
                value={item.answer}
                onChange={(e) => updateFaq(i, "answer", e.target.value)}
                placeholder="Answer"
                rows={2}
                className="w-full rounded border border-rule px-3 py-2 text-sm"
              />
            </div>
          ))}
        </div>
      </Card>

      <Button onClick={handleSave} disabled={saving}>
        {saving ? "Saving…" : "Save Settings"}
      </Button>
    </div>
  );
}
