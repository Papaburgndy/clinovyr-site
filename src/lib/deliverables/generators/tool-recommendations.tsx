import React from "react";
import { callClaudeJson } from "@/lib/deliverables/generators/claude-helper";
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
import type { AssessmentFormData } from "@/types/assessment";

type ToolRecommendation = {
  name: string;
  cost: string;
  learningCurve: string;
  integration: string;
  bestFor: string;
  narrative: string;
};

type ToolGuideContent = {
  intro: string;
  tools: ToolRecommendation[];
  deferList: string[];
};

function buildToolFallback(
  industry: string,
  formData: AssessmentFormData | null,
): ToolGuideContent {
  const crm = formData?.crm?.join(", ") || "your CRM";
  return {
    intro: `Prioritized tool recommendations for ${industry} businesses. Connect existing systems before adding new platforms.`,
    tools: [
      {
        name: "Zapier or Make",
        cost: "$20–50/mo starter",
        learningCurve: "Low — visual builder",
        integration: `Works with ${crm}, email, scheduling`,
        bestFor: "Quick automations without developer time",
        narrative:
          "Start here to bridge your current stack. Most clients see ROI within 2 weeks on intake routing and follow-up sequences.",
      },
      {
        name: "Claude or ChatGPT (Team)",
        cost: "$25–30/user/mo",
        learningCurve: "Medium — prompt design",
        integration: "Browser, API, CRM plugins",
        bestFor: `Drafting, summarization, ${industry} SOP assistance`,
        narrative:
          "Ground AI in your FAQs and intake forms. Use approved templates for client-facing content with human review gates.",
      },
      {
        name: "Notion or structured Drive",
        cost: "Free–$10/user/mo",
        learningCurve: "Low",
        integration: "Export to AI tools, team wiki",
        bestFor: "Knowledge base and SOP documentation",
        narrative:
          "Single source of truth improves AI accuracy and staff onboarding. Document workflows before automating them.",
      },
    ],
    deferList: [
      "Full CRM replacement until pilot ROI is proven",
      "Custom AI model training before SOP documentation exists",
      `Tools that duplicate features in ${crm}`,
    ],
  };
}

function ToolRecommendationsDocument({
  companyName,
  industry,
  tier,
  content,
  stackSummary,
}: {
  companyName: string;
  industry: string;
  tier: string | null;
  content: ToolGuideContent;
  stackSummary: string;
}) {
  return (
    <Document title={`${companyName} — Tool Recommendations`}>
      <BrandedPage>
        <Text style={pdfStyles.coverKicker}>Clinovyr Tool Comparison Guide</Text>
        <Text style={pdfStyles.sectionTitle}>{companyName}</Text>
        <Text style={pdfStyles.body}>{industry} · Tier: {tier ?? "TBD"}</Text>
        <Text style={[pdfStyles.body, { marginTop: 8 }]}>{content.intro}</Text>
        <Text style={[pdfStyles.muted, { marginBottom: 12 }]}>Current stack: {stackSummary}</Text>

        <View style={pdfStyles.tableHeader}>
          <Text style={[pdfStyles.tableCellHeader, { flex: 1.2 }]}>Tool</Text>
          <Text style={pdfStyles.tableCellHeader}>Cost</Text>
          <Text style={pdfStyles.tableCellHeader}>Learning</Text>
          <Text style={pdfStyles.tableCellHeader}>Integration</Text>
          <Text style={[pdfStyles.tableCellHeader, { flex: 1.2 }]}>Best For</Text>
        </View>
        {content.tools.slice(0, 3).map((tool) => (
          <View key={tool.name}>
            <View style={pdfStyles.tableRow}>
              <Text style={[pdfStyles.tableCell, { flex: 1.2, fontFamily: "Helvetica-Bold" }]}>
                {tool.name}
              </Text>
              <Text style={pdfStyles.tableCell}>{tool.cost}</Text>
              <Text style={pdfStyles.tableCell}>{tool.learningCurve}</Text>
              <Text style={pdfStyles.tableCell}>{tool.integration}</Text>
              <Text style={[pdfStyles.tableCell, { flex: 1.2 }]}>{tool.bestFor}</Text>
            </View>
            <Text style={[pdfStyles.body, { marginBottom: 10, paddingHorizontal: 4, fontSize: 9 }]}>
              {tool.narrative}
            </Text>
          </View>
        ))}

        <Text style={pdfStyles.subsectionTitle}>What to Defer</Text>
        {content.deferList.map((item) => (
          <Text key={item} style={pdfStyles.body}>• {item}</Text>
        ))}
        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export const generateToolRecommendations: DeliverableGenerator = async ({
  company,
  survey,
  formData,
}) => {
  const fallback = buildToolFallback(company.industry, formData);
  const stackSummary = formData
    ? [
        formData.crm.length ? `CRM: ${formData.crm.join(", ")}` : null,
        formData.emailTools.length ? `Email: ${formData.emailTools.join(", ")}` : null,
        formData.scheduling.length ? `Scheduling: ${formData.scheduling.join(", ")}` : null,
        formData.pm.length ? `PM: ${formData.pm.join(", ")}` : null,
      ]
        .filter(Boolean)
        .join(" · ") || "Not fully specified"
    : "Complete assessment for detailed stack map";

  const { data: content } = await callClaudeJson<ToolGuideContent>({
    system:
      "You are a Clinovyr tech stack advisor. Output ONLY valid JSON: { intro, tools: [{ name, cost, learningCurve, integration, bestFor, narrative }], deferList: string[] }. Exactly 3 tools with realistic pricing.",
    prompt: `Company: ${company.name}, Industry: ${company.industry}, Size: ${company.size}
Tier: ${survey.tier ?? "TBD"}
Stack: CRM ${formData?.crm?.join(", ") ?? "N/A"}, Email ${formData?.emailTools?.join(", ") ?? "N/A"}, Scheduling ${formData?.scheduling?.join(", ") ?? "N/A"}, PM ${formData?.pm?.join(", ") ?? "N/A"}, Accounting ${formData?.accounting?.join(", ") ?? "N/A"}
AI experience: ${formData?.aiTools ?? "N/A"}, Comfort: ${formData?.comfortLevel ?? "N/A"}/5
Time drains: ${formData?.timeDrainsRanked?.slice(0, 3).join(", ") ?? "N/A"}
Goals: ${formData?.goals?.join(", ") ?? "N/A"}`,
    maxTokens: 1200,
    fallback,
    validate: (v) => Array.isArray(v.tools) && v.tools.length >= 3,
  });

  const buffer = await renderPdfDocument(
    <ToolRecommendationsDocument
      companyName={company.name}
      industry={company.industry}
      tier={survey.tier}
      content={content}
      stackSummary={stackSummary}
    />,
  );

  return pdfOutput("tool-recommendations", buffer);
};
