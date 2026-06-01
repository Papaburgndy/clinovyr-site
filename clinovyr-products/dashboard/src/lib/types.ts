export type AutomationStatus = "running" | "paused" | "error";

export type ClientPlan = "starter" | "growth" | "enterprise";

export interface BusinessHours {
  [day: string]: { open: string; close: string } | null;
}

export interface FaqItem {
  question: string;
  answer: string;
}

export interface NotificationPreferences {
  emailReports: boolean;
  emailErrors: boolean;
  emailWeeklySummary: boolean;
}

export interface ClientConfig {
  clientName: string;
  email: string;
  plan: ClientPlan;
  mrr: number;
  businessHours: BusinessHours;
  faq: FaqItem[];
  escalationEmail: string;
  notificationPreferences?: NotificationPreferences;
  active?: boolean;
}

export interface RunRecord {
  id: string;
  automationId: string;
  automationName: string;
  timestamp: string;
  status: "success" | "error";
  tasksProcessed: number;
  durationMs: number;
  message?: string;
}

export interface AutomationPerformanceRow {
  automationId: string;
  name: string;
  runs: number;
  tasksAutomated: number;
  successRate: number;
  errors: number;
}

export interface MonthlyReportMetrics {
  month: number;
  year: number;
  monthName: string;
  totalRuns: number;
  totalTasksAutomated: number;
  successRate: number;
  mostActiveAutomation: string;
  errorRuns: number;
  downtimeMinutes: number;
  automationPerformance: AutomationPerformanceRow[];
}

export interface MonthlyReportNarrative {
  executiveSummary: string;
  winsThisMonth: string[];
  lookingAhead: string;
}

export interface AutomationRun {
  id: string;
  timestamp: string;
  status: "success" | "error";
  tasksProcessed: number;
  durationMs: number;
  message?: string;
}

export interface Automation {
  id: string;
  name: string;
  description: string;
  status: AutomationStatus;
  runCount: number;
  successRate: number;
  lastRun: string | null;
  lastError: string | null;
  tasksThisMonth: number;
  recentRuns: AutomationRun[];
}

export interface ActivityEvent {
  id: string;
  timestamp: string;
  type: "automation_run" | "report_generated" | "settings_updated" | "error";
  message: string;
  automationId?: string;
}

export interface MonthlyTasks {
  month: string;
  tasks: number;
}

export interface DashboardKpis {
  tasksAutomated: number;
  hoursSaved: number;
  automationsRunning: number;
  roiEstimate: number;
  tasksByMonth: MonthlyTasks[];
}

export interface ReportMeta {
  id: string;
  month: string;
  year: number;
  filename: string;
  generatedAt: string;
  sizeKb: number;
}

export interface ClientSummary {
  clientId: string;
  clientName: string;
  email: string;
  plan: ClientPlan;
  mrr: number;
  automationsCount: number;
  lastActive: string | null;
}
