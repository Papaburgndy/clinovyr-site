import React from "react";
import type { Company, Survey } from "@prisma/client";
import { pdfOutput } from "@/lib/deliverables/generators/shared";
import type { DeliverableGenerator } from "@/lib/deliverables/generators/types";
import {
  BrandedPage,
  Document,
  PdfFooter,
  Text,
  View,
  pdfStyles,
  renderPdfDocument,
} from "@/lib/deliverables/generators/pdf-brand";
import { enrichTopOpportunities } from "@/lib/opportunities";
import type { AssessmentFormData } from "@/types/assessment";

function ExecutiveBriefingDocument({
  company,
  survey,
  formData,
}: {
  company: Company;
  survey: Survey;
  formData: AssessmentFormData | null;
}) {
  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  const opportunities = enrichTopOpportunities(
    survey.topOpportunities,
    company.industry,
    survey.estimatedROI,
  );
  const summary =
    survey.executiveSummary ??
    "AI readiness findings and recommended next steps for leadership alignment.";
  const topDrain = formData?.timeDrainsRanked?.[0] ?? "operational workflows";
  const concern = formData?.biggestConcern ?? "implementation clarity";

  return (
    <Document title={`${company.name} — Executive Briefing`}>
      {/* Cover */}
      <BrandedPage dark>
        <Text style={pdfStyles.coverKicker}>Clinovyr · Executive Briefing</Text>
        <Text style={pdfStyles.coverTitle}>{company.name}</Text>
        <Text style={pdfStyles.coverSubtitle}>
          AI Readiness — leadership summary
        </Text>
        <Text style={pdfStyles.coverSubtitle}>
          Score {survey.score ?? "—"}/100 · {survey.tier ?? "pending tier"}
        </Text>
        <Text style={pdfStyles.coverMeta}>
          {company.industry} · {company.size} · Prepared {dateStr}
        </Text>
      </BrandedPage>

      {/* Body */}
      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Why now</Text>
        <Text style={pdfStyles.body}>
          {company.name} operates in {company.industry.toLowerCase()} with a team
          of {company.size} and a revenue band of {company.revenue}. The
          assessment identifies <Text style={{ fontFamily: "Helvetica-Bold" }}>{topDrain}</Text> as
          the leading operational drain, with the primary concern being {concern}.
          Acting now captures quick wins while competitors are still evaluating.
        </Text>

        <Text style={pdfStyles.sectionTitle}>Executive summary</Text>
        <Text style={pdfStyles.body}>{summary}</Text>

        <Text style={pdfStyles.sectionTitle}>Top opportunities</Text>
        {opportunities.slice(0, 3).map((opp, i) => (
          <View key={opp.name} style={pdfStyles.card}>
            <Text style={pdfStyles.cardTitle}>
              {i + 1}. {opp.name}
            </Text>
            <Text style={pdfStyles.body}>{opp.description}</Text>
            <Text style={pdfStyles.muted}>
              Timeline: {opp.timeToImplement} · ROI: {opp.roiRange}
            </Text>
          </View>
        ))}

        <Text style={pdfStyles.sectionTitle}>Recommended package</Text>
        <Text style={pdfStyles.body}>
          {survey.recommendedPkg ?? "AI Readiness Assessment"} · Estimated annual
          ROI: {survey.estimatedROI ?? "TBD"}.
        </Text>

        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Next step:{" "}
            {survey.nextStep ??
              "Schedule a Clinovyr working session to confirm pilot scope and owners."}
          </Text>
        </View>

        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export const generateExecutivePresentation: DeliverableGenerator = async ({
  company,
  survey,
  formData,
}) => {
  const buffer = await renderPdfDocument(
    <ExecutiveBriefingDocument
      company={company}
      survey={survey}
      formData={formData}
    />,
  );
  return pdfOutput("executive-presentation", buffer, {
    filename: "executive-briefing.pdf",
    displayName: "Executive Briefing",
  });
};
