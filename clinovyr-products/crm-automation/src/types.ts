export interface ClientConfig {
  clientId: string;
  companyName: string;
  industry: string;
  hubspotApiKey: string;
  anthropicApiKey?: string;
}

export interface CliOptions {
  clientConfigPath: string;
  dryRun: boolean;
}

export interface ApiCallRecord {
  step: string;
  method: string;
  endpoint: string;
  status: "success" | "skipped" | "error" | "mock";
  message?: string;
}

export interface AuditData {
  contactProperties: unknown;
  workflows: unknown;
  emailTemplates: unknown;
  pipelines: unknown;
  fetchedAt: string;
  errors: string[];
}

export interface PropertyResult {
  name: string;
  status: "created" | "exists" | "skipped" | "error";
  message?: string;
}

export interface LeadScoreResult {
  score: number;
  reason: string;
}

export interface LeadData {
  firstName?: string;
  lastName?: string;
  email?: string;
  company?: string;
  industry?: string;
  leadSource?: string;
  notes?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface WorkflowStub {
  name: string;
  trigger: string;
  actions: string[];
  manualSteps: string[];
}

export interface EmailTemplateDraft {
  day: number;
  name: string;
  subject: string;
  body: string;
  hubspotId?: string;
  status: "created" | "exported" | "skipped" | "error";
  message?: string;
}

export interface DashboardWidget {
  title: string;
  type: string;
  status: "documented" | "skipped";
  setupInstructions: string;
}

export interface SetupContext {
  config: ClientConfig;
  dryRun: boolean;
  apiCalls: ApiCallRecord[];
  audit?: AuditData;
  properties: PropertyResult[];
  leadScoring?: {
    sampleScore?: LeadScoreResult;
    workflowStub: WorkflowStub;
  };
  emailSequences: EmailTemplateDraft[];
  dashboard: {
    name: string;
    widgets: DashboardWidget[];
  };
  startedAt: string;
  completedAt?: string;
}
