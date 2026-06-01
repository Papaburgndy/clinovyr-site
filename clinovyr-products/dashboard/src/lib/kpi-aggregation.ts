import type { Automation, DashboardKpis, RunRecord } from "./types";

/** Minutes of staff time saved per automated task (Clinovyr benchmark). */
export const MINUTES_SAVED_PER_TASK = 8.67;

/** Blended hourly value used for ROI estimates (USD). */
export const STAFF_HOURLY_RATE_USD = 45;

export function computeHoursSaved(tasksAutomated: number): number {
  return Math.round((tasksAutomated * MINUTES_SAVED_PER_TASK) / 60);
}

export function computeRoiEstimate(hoursSaved: number): number {
  return Math.round(hoursSaved * STAFF_HOURLY_RATE_USD);
}

export function aggregateKpisFromRuns(
  runs: RunRecord[],
  automations: Automation[]
): Pick<
  DashboardKpis,
  "tasksAutomated" | "hoursSaved" | "automationsRunning" | "roiEstimate"
> {
  const tasksAutomated = runs.reduce(
    (sum, run) => sum + run.tasksProcessed,
    0
  );
  const hoursSaved = computeHoursSaved(tasksAutomated);
  const automationsRunning = automations.filter(
    (a) => a.status === "running"
  ).length;
  const roiEstimate = computeRoiEstimate(hoursSaved);

  return {
    tasksAutomated,
    hoursSaved,
    automationsRunning,
    roiEstimate,
  };
}
