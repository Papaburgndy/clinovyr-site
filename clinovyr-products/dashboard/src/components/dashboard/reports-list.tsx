"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import type { ReportMeta } from "@/lib/types";

interface ReportsListProps {
  reports: ReportMeta[];
  clientId: string;
}

export function ReportsList({ reports: initialReports, clientId }: ReportsListProps) {
  const [reports, setReports] = useState(initialReports);
  const [generating, setGenerating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleGenerate() {
    setGenerating(true);
    setMessage(null);
    try {
      const res = await fetch("/api/dashboard/report/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId }),
      });
      const data = await res.json();
      if (res.ok) {
        setReports((prev) => [data.report, ...prev]);
        setMessage("Report generated successfully.");
      } else {
        setMessage(data.error ?? "Failed to generate report.");
      }
    } catch {
      setMessage("Failed to generate report.");
    } finally {
      setGenerating(false);
    }
  }

  async function handleDownload(filename: string) {
    const res = await fetch("/api/dashboard/reports", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, filename }),
    });
    if (!res.ok) return;

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-2xl font-semibold text-ink">
            Monthly Reports
          </h2>
          <p className="mt-1 text-sm text-muted">
            Download PDF summaries of your automation performance.
          </p>
        </div>
        <Button onClick={handleGenerate} disabled={generating}>
          {generating ? "Generating…" : "Generate Current Month"}
        </Button>
      </div>

      {message && (
        <p className="rounded-md bg-cream px-4 py-2 text-sm text-ink">
          {message}
        </p>
      )}

      <div className="grid gap-4">
        {reports.map((report) => (
          <Card key={report.id} className="flex items-center justify-between">
            <div>
              <CardHeader className="mb-0">
                <CardTitle>
                  {report.month} {report.year}
                </CardTitle>
              </CardHeader>
              <p className="text-sm text-muted">
                Generated{" "}
                {new Date(report.generatedAt).toLocaleDateString("en-US", {
                  month: "long",
                  day: "numeric",
                  year: "numeric",
                })}{" "}
                · {report.sizeKb} KB
              </p>
            </div>
            <Button
              variant="secondary"
              onClick={() => handleDownload(report.filename)}
            >
              Download PDF
            </Button>
          </Card>
        ))}
        {reports.length === 0 && (
          <p className="text-muted">No reports yet. Generate your first report above.</p>
        )}
      </div>
    </div>
  );
}
