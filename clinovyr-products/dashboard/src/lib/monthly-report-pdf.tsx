/**
 * Server-side only — do not import from client components.
 */
import {
  Document,
  Font,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type {
  AutomationPerformanceRow,
  MonthlyReportMetrics,
  MonthlyReportNarrative,
  RunRecord,
} from "./types";

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica", fontStyle: "normal", fontWeight: 400 },
    { src: "Helvetica-Bold", fontStyle: "normal", fontWeight: 700 },
  ],
});

const colors = {
  ink: "#0d0f12",
  paper: "#f5f2ed",
  cream: "#ede9e2",
  accent: "#1a6b5a",
  accentLight: "#2d9e88",
  muted: "#7a7468",
  rule: "#d8d3ca",
};

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: colors.ink,
    lineHeight: 1.45,
    backgroundColor: colors.paper,
  },
  header: {
    backgroundColor: colors.ink,
    padding: 20,
    marginBottom: 20,
    borderRadius: 4,
  },
  brand: {
    fontSize: 22,
    color: colors.paper,
    marginBottom: 4,
  },
  tagline: {
    fontSize: 9,
    color: colors.accentLight,
    letterSpacing: 1.2,
    textTransform: "uppercase",
  },
  title: {
    fontSize: 16,
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  subtitle: {
    fontSize: 11,
    color: colors.muted,
    marginBottom: 16,
  },
  kpiRow: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 18,
  },
  kpiBox: {
    flex: 1,
    backgroundColor: colors.cream,
    padding: 10,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  kpiLabel: {
    fontSize: 8,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  kpiValue: {
    fontSize: 16,
    color: colors.accent,
    fontFamily: "Helvetica-Bold",
  },
  sectionTitle: {
    fontSize: 11,
    marginTop: 14,
    marginBottom: 6,
    color: colors.accent,
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Helvetica-Bold",
  },
  paragraph: {
    marginBottom: 6,
  },
  bullet: {
    marginBottom: 4,
    paddingLeft: 8,
  },
  table: {
    marginTop: 6,
    borderWidth: 1,
    borderColor: colors.rule,
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: colors.rule,
  },
  tableHeader: {
    backgroundColor: colors.cream,
    fontFamily: "Helvetica-Bold",
  },
  cellName: { width: "34%", padding: 6, fontSize: 8 },
  cellNum: { width: "16%", padding: 6, fontSize: 8, textAlign: "right" },
  nextSteps: {
    marginTop: 8,
    padding: 12,
    backgroundColor: colors.cream,
    borderRadius: 4,
  },
  footer: {
    position: "absolute",
    bottom: 28,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: colors.rule,
    paddingTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 8,
    color: colors.muted,
  },
});

function safeText(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

export type MonthlyReportPdfProps = {
  clientName: string;
  metrics: MonthlyReportMetrics;
  narrative: MonthlyReportNarrative;
  monthRuns?: RunRecord[];
};

function PerformanceTable({ rows }: { rows: AutomationPerformanceRow[] }) {
  return (
    <View style={styles.table}>
      <View style={[styles.tableRow, styles.tableHeader]}>
        <Text style={styles.cellName}>Automation</Text>
        <Text style={styles.cellNum}>Runs</Text>
        <Text style={styles.cellNum}>Tasks</Text>
        <Text style={styles.cellNum}>Success</Text>
        <Text style={styles.cellNum}>Errors</Text>
      </View>
      {rows.map((row) => (
        <View key={row.automationId} style={styles.tableRow}>
          <Text style={styles.cellName}>{safeText(row.name)}</Text>
          <Text style={styles.cellNum}>{row.runs}</Text>
          <Text style={styles.cellNum}>{row.tasksAutomated}</Text>
          <Text style={styles.cellNum}>{row.successRate.toFixed(1)}%</Text>
          <Text style={styles.cellNum}>{row.errors}</Text>
        </View>
      ))}
    </View>
  );
}

const METHODOLOGY_TEXT = `This report summarizes automation activity captured by Clinovyr-managed workflows.
Success rate reflects completed runs without unhandled errors. Tasks automated counts discrete
actions your team would otherwise perform manually — form entries, messages sent, records updated,
and similar operational steps. Estimated downtime aggregates error-run duration as a conservative
proxy for interrupted service. ROI estimates use a blended staff hourly rate applied to modeled
time savings; your finance team may prefer different assumptions for board reporting.

Clinovyr recommends reviewing automations with elevated error rates first, then optimizing the
highest-volume workflows for additional throughput. Contact your Clinovyr partner to schedule a
monthly optimization session or to enable additional playbooks aligned with your industry.`;

function MethodologyPage() {
  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Methodology & Definitions</Text>
      <Text style={styles.paragraph}>{METHODOLOGY_TEXT}</Text>
      <Text style={styles.paragraph}>{METHODOLOGY_TEXT}</Text>
      <Text style={styles.paragraph}>
        Report generated by Clinovyr Dashboard. Confidential — intended for{" "}
        {new Date().getUTCFullYear()} operational review.
      </Text>
      <Text style={styles.paragraph}>{METHODOLOGY_TEXT}</Text>
      <Text style={styles.sectionTitle}>Glossary</Text>
      <Text style={styles.paragraph}>
        Automation run: A single scheduled or triggered execution of a workflow.
        Task: A discrete unit of work completed within a run (e.g., one message, one
        record sync). Success rate: Successful runs divided by total runs. Error run:
        A run that ended in a recoverable or actionable failure state. Downtime estimate:
        Summed error-run duration converted to minutes. These definitions align with
        Clinovyr dashboard KPIs and may be exported for compliance documentation.
      </Text>
      <View style={styles.footer} fixed>
        <Text>Clinovyr — Methodology</Text>
        <Text>clinovyr.com</Text>
      </View>
    </Page>
  );
}

function RunAppendix({ runs }: { runs: RunRecord[] }) {
  if (runs.length === 0) return null;

  return (
    <Page size="A4" style={styles.page}>
      <Text style={styles.title}>Run Activity Appendix</Text>
      <Text style={styles.subtitle}>
        Detailed log for {runs.length} runs this period
      </Text>
      {runs.map((run) => (
        <View key={run.id} style={{ marginBottom: 8 }}>
          <Text style={{ fontSize: 8, fontFamily: "Helvetica-Bold" }}>
            {run.automationName} — {run.status.toUpperCase()}
          </Text>
          <Text style={{ fontSize: 8, color: colors.muted }}>
            Run ID: {run.id} · {run.timestamp}
          </Text>
          <Text style={{ fontSize: 8, color: colors.muted }}>
            Tasks processed: {run.tasksProcessed} · Duration:{" "}
            {Math.round(run.durationMs / 1000)}s
            {run.message ? ` · Note: ${run.message}` : ""}
          </Text>
        </View>
      ))}
      <View style={styles.footer} fixed>
        <Text>Clinovyr — Run Appendix</Text>
        <Text>clinovyr.com</Text>
      </View>
    </Page>
  );
}

export function MonthlyReportPdfDocument({
  clientName,
  metrics,
  narrative,
  monthRuns = [],
}: MonthlyReportPdfProps) {
  const summaryParagraphs = narrative.executiveSummary
    .split(/\n\n+/)
    .filter(Boolean);

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <Text style={styles.brand}>Clinovyr</Text>
          <Text style={styles.tagline}>Intelligence, Applied.</Text>
        </View>

        <Text style={styles.title}>{safeText(clientName)}</Text>
        <Text style={styles.subtitle}>
          Monthly AI Performance Report — {metrics.monthName} {metrics.year}
        </Text>

        <View style={styles.kpiRow}>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Automations Run</Text>
            <Text style={styles.kpiValue}>{metrics.totalRuns}</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Tasks Automated</Text>
            <Text style={styles.kpiValue}>
              {metrics.totalTasksAutomated.toLocaleString()}
            </Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Success Rate</Text>
            <Text style={styles.kpiValue}>{metrics.successRate.toFixed(1)}%</Text>
          </View>
          <View style={styles.kpiBox}>
            <Text style={styles.kpiLabel}>Error Runs</Text>
            <Text style={styles.kpiValue}>{metrics.errorRuns}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Automation Performance</Text>
        <Text style={[styles.paragraph, { color: colors.muted, fontSize: 9 }]}>
          Most active: {safeText(metrics.mostActiveAutomation)} · Estimated
          downtime: {metrics.downtimeMinutes} min
        </Text>
        <PerformanceTable rows={metrics.automationPerformance} />

        <Text style={styles.sectionTitle}>Executive Summary</Text>
        {summaryParagraphs.map((paragraph, index) => (
          <Text key={`exec-${index}`} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}

        <Text style={styles.sectionTitle}>Wins This Month</Text>
        {narrative.winsThisMonth.map((win, index) => (
          <Text key={`win-${index}`} style={styles.bullet}>
            • {win}
          </Text>
        ))}

        <Text style={styles.sectionTitle}>Looking Ahead</Text>
        <Text style={styles.paragraph}>{narrative.lookingAhead}</Text>

        <View style={styles.nextSteps}>
          <Text style={[styles.sectionTitle, { marginTop: 0 }]}>Next Steps</Text>
          <Text style={styles.paragraph}>
            Review any automations with errors, confirm credential renewals, and
            schedule a brief check-in with your Clinovyr team to prioritize
            improvements for {metrics.monthName}.
          </Text>
        </View>

        <View style={styles.footer} fixed>
          <Text>Prepared by Clinovyr</Text>
          <Text>clinovyr.com</Text>
          <Text>hello@clinovyr.com</Text>
        </View>
      </Page>
      <MethodologyPage />
      <RunAppendix runs={monthRuns} />
    </Document>
  );
}

export async function renderMonthlyReportPdfToBuffer(
  props: MonthlyReportPdfProps
): Promise<Buffer> {
  const result = await renderToBuffer(<MonthlyReportPdfDocument {...props} />);
  return Buffer.isBuffer(result) ? result : Buffer.from(result);
}
