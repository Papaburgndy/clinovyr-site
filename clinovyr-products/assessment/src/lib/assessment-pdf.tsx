import {
  Document,
  Font,
  Page,
  renderToBuffer,
  StyleSheet,
  Text,
  View,
} from "@react-pdf/renderer";
import type { AssessmentFormData } from "@/lib/assessment-types";
import type { AssessmentReport } from "@/lib/report-generator";
import type { AIReadinessScore } from "@/lib/scoring";

Font.register({
  family: "Helvetica",
  fonts: [
    { src: "Helvetica", fontStyle: "normal", fontWeight: 400 },
    { src: "Helvetica-Bold", fontStyle: "normal", fontWeight: 700 },
  ],
});

function safeText(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  return String(value);
}

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontFamily: "Helvetica",
    fontSize: 10,
    color: "#0d0f12",
    lineHeight: 1.45,
  },
  header: {
    backgroundColor: "#0d0f12",
    padding: 20,
    marginBottom: 24,
    borderRadius: 4,
  },
  logoPlaceholder: {
    width: 48,
    height: 48,
    backgroundColor: "#1a6b5a",
    marginBottom: 12,
    borderRadius: 2,
  },
  brand: {
    fontSize: 22,
    color: "#f5f2ed",
    marginBottom: 4,
    fontFamily: "Helvetica",
  },
  tagline: {
    fontSize: 9,
    color: "#2d9e88",
    letterSpacing: 1.2,
    textTransform: "uppercase",
    fontFamily: "Helvetica",
  },
  title: {
    fontSize: 18,
    marginBottom: 8,
    color: "#0d0f12",
    fontFamily: "Helvetica",
  },
  meta: {
    fontSize: 9,
    color: "#7a7468",
    marginBottom: 4,
    fontFamily: "Helvetica",
  },
  sectionTitle: {
    fontSize: 12,
    marginTop: 18,
    marginBottom: 8,
    color: "#1a6b5a",
    textTransform: "uppercase",
    letterSpacing: 0.8,
    fontFamily: "Helvetica-Bold",
  },
  paragraph: {
    marginBottom: 8,
    color: "#0d0f12",
    fontFamily: "Helvetica",
  },
  gaugeTrack: {
    height: 12,
    backgroundColor: "#ede9e2",
    borderRadius: 6,
    marginTop: 6,
    marginBottom: 4,
  },
  gaugeFill: {
    height: 12,
    backgroundColor: "#1a6b5a",
    borderRadius: 6,
  },
  scoreLarge: {
    fontSize: 28,
    color: "#1a6b5a",
    marginTop: 4,
    fontFamily: "Helvetica-Bold",
  },
  table: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: "#d8d3ca",
  },
  tableRow: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#d8d3ca",
  },
  tableHeader: {
    backgroundColor: "#ede9e2",
    fontFamily: "Helvetica-Bold",
  },
  tableCellLabel: {
    width: "55%",
    padding: 8,
    fontSize: 9,
    fontFamily: "Helvetica",
  },
  tableCellValue: {
    width: "45%",
    padding: 8,
    fontSize: 9,
    textAlign: "right",
    color: "#1a6b5a",
    fontFamily: "Helvetica",
  },
  opportunityBlock: {
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: "#d8d3ca",
  },
  opportunityTitle: {
    fontSize: 11,
    marginBottom: 4,
    fontFamily: "Helvetica-Bold",
  },
  opportunityMeta: {
    fontSize: 8,
    color: "#7a7468",
    marginTop: 4,
    fontFamily: "Helvetica",
  },
  ctaBox: {
    marginTop: 20,
    padding: 16,
    backgroundColor: "#ede9e2",
    borderRadius: 4,
  },
  ctaTitle: {
    fontSize: 11,
    marginBottom: 6,
    color: "#0d0f12",
    fontFamily: "Helvetica-Bold",
  },
});

const CATEGORY_LABELS: Record<keyof AIReadinessScore["categoryScores"], string> = {
  techStack: "Tech Stack",
  processMaturity: "Process Maturity",
  dataReadiness: "Data Readiness",
  adoptionReadiness: "Adoption Readiness",
  roi_potential: "ROI Potential",
};

export type AssessmentPdfProps = {
  formData: AssessmentFormData;
  score: AIReadinessScore;
  report: AssessmentReport;
  assessmentId: string;
  generatedAt: string;
};

export function AssessmentPdfDocument({
  formData,
  score,
  report,
  assessmentId,
  generatedAt,
}: AssessmentPdfProps) {
  const parsedDate = generatedAt ? new Date(generatedAt) : new Date();
  const formattedDate = Number.isNaN(parsedDate.getTime())
    ? safeText(generatedAt)
    : parsedDate.toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      });

  const overallScore = Number.isFinite(score?.overallScore) ? score.overallScore : 0;
  const gaugeWidth = `${Math.min(100, Math.max(0, overallScore))}%`;
  const topOpportunities = report?.topOpportunities ?? [];
  const quickWins = report?.quickWins ?? [];
  const categoryScores = score?.categoryScores ?? {
    techStack: 0,
    processMaturity: 0,
    dataReadiness: 0,
    adoptionReadiness: 0,
    roi_potential: 0,
  };

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <View style={styles.header}>
          <View style={styles.logoPlaceholder} />
          <Text style={styles.brand}>Clinovyr</Text>
          <Text style={styles.tagline}>Intelligence, Applied.</Text>
        </View>

        <Text style={styles.title}>AI Readiness Report</Text>
        <Text style={styles.meta}>Company: {safeText(formData?.companyName)}</Text>
        <Text style={styles.meta}>Date: {formattedDate}</Text>
        <Text style={styles.meta}>Assessment ID: {safeText(assessmentId)}</Text>

        <Text style={styles.sectionTitle}>Overall Readiness</Text>
        <Text style={styles.scoreLarge}>
          {overallScore}/100 — {safeText(score?.tier)}
        </Text>
        <View style={styles.gaugeTrack}>
          <View style={[styles.gaugeFill, { width: gaugeWidth }]} />
        </View>
        <Text style={styles.meta}>
          Estimated annual ROI: {safeText(score?.estimatedAnnualROI)} · Recommended:{" "}
          {safeText(score?.recommendedPackage)}
        </Text>

        <Text style={styles.sectionTitle}>Category Breakdown</Text>
        <View style={styles.table}>
          <View style={[styles.tableRow, styles.tableHeader]}>
            <Text style={styles.tableCellLabel}>Category</Text>
            <Text style={styles.tableCellValue}>Score</Text>
          </View>
          {(
            Object.entries(categoryScores) as [
              keyof AIReadinessScore["categoryScores"],
              number,
            ][]
          ).map(([key, value]) => (
            <View key={key} style={styles.tableRow}>
              <Text style={styles.tableCellLabel}>{CATEGORY_LABELS[key]}</Text>
              <Text style={styles.tableCellValue}>
                {Number.isFinite(value) ? value : 0}/100
              </Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>Executive Summary</Text>
        <Text style={styles.paragraph}>{safeText(report?.executiveSummary)}</Text>

        <Text style={styles.sectionTitle}>Current State Analysis</Text>
        <Text style={styles.paragraph}>{safeText(report?.currentStateAnalysis)}</Text>

        <Text style={styles.sectionTitle}>Top Opportunities</Text>
        {topOpportunities.map((item, index) => (
          <View key={`opp-${index}`} style={styles.opportunityBlock}>
            <Text style={styles.opportunityTitle}>{safeText(item?.title)}</Text>
            <Text style={styles.paragraph}>{safeText(item?.description)}</Text>
            <Text style={styles.opportunityMeta}>
              ROI: {safeText(item?.estimatedROI)} · Timeline:{" "}
              {safeText(item?.timeToImplement)} · Difficulty: {safeText(item?.difficulty)}
            </Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Quick Wins</Text>
        {quickWins.map((item, index) => (
          <View key={`qw-${index}`} style={styles.opportunityBlock}>
            <Text style={styles.opportunityTitle}>{safeText(item?.title)}</Text>
            <Text style={styles.paragraph}>{safeText(item?.howTo)}</Text>
            <Text style={styles.opportunityMeta}>
              Tools: {safeText((item?.toolsNeeded ?? []).join(", "))}
            </Text>
          </View>
        ))}

        <Text style={styles.sectionTitle}>Recommended Next Step</Text>
        <Text style={styles.paragraph}>{safeText(report?.recommendedNextStep)}</Text>

        <View style={styles.ctaBox}>
          <Text style={styles.ctaTitle}>Work with Clinovyr</Text>
          <Text style={styles.paragraph}>
            Ready to turn these insights into measurable results? Clinovyr helps
            Placer County businesses implement AI with clarity and confidence.
          </Text>
          <Text style={styles.paragraph}>hello@clinovyr.com</Text>
        </View>

        <Text style={styles.sectionTitle}>Closing</Text>
        <Text style={styles.paragraph}>{safeText(report?.closingMessage)}</Text>
      </Page>
    </Document>
  );
}

export async function renderAssessmentPdfToBuffer(
  props: AssessmentPdfProps,
): Promise<Buffer> {
  const result = await renderToBuffer(<AssessmentPdfDocument {...props} />);
  return Buffer.isBuffer(result) ? result : Buffer.from(result);
}
