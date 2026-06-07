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
  const drain = formData?.timeDrainsRanked?.[0]?.toLowerCase() ?? "customer follow-up";
  return {
    intro: `Prioritized, vendor-neutral tool recommendations for ${industry} businesses. The sequence matters: connect what you already own, add an AI assistant layer, then a knowledge base — buy nothing that duplicates existing features. Pricing is current-market and approximate.`,
    tools: [
      {
        name: "Make.com (or Zapier)",
        cost: "$0–29/mo to start",
        learningCurve: "Low — visual, no code",
        integration: `Connects ${crm}, email, scheduling, forms`,
        bestFor: "Routing leads and automating follow-up",
        narrative:
          `Your automation backbone. Build the "${drain}" flow first: when a new lead or task is created, it sends an instant text/email, creates a call task, and logs the activity in ${crm}. Make.com is usually cheaper at volume; Zapier has more pre-built apps. Most owners see time saved within the first two weeks.`,
      },
      {
        name: "Claude Team (or ChatGPT Team)",
        cost: "$25–30/user/mo",
        learningCurve: "Medium — prompt design",
        integration: "Browser, mobile, API, automation steps",
        bestFor: `Drafting, summarizing, and ${industry.toLowerCase()} Q&A`,
        narrative:
          `Your AI assistant layer for drafting replies, summarizing calls/records, and answering staff questions from your SOPs. Use the Team tier (not personal accounts) so customer data stays in a business workspace, and keep a human-approval step on anything client-facing. Load it with your FAQs and templates for accurate, on-brand output.`,
      },
      {
        name: "Notion (or structured Google Drive)",
        cost: "Free–$10/user/mo",
        learningCurve: "Low",
        integration: "Feeds context to AI tools; team wiki",
        bestFor: "SOPs and a single source of truth",
        narrative:
          "Document your workflows before you automate them — AI is only as accurate as the context you give it. A simple, well-organized SOP library also speeds onboarding and makes every other tool on this list work better.",
      },
      {
        name: `An SMS/review tool (Twilio or a ${industry.toLowerCase()}-specific platform)`,
        cost: "$15–75/mo (usage-based)",
        learningCurve: "Low–Medium",
        integration: `Triggered by Make.com + ${crm}`,
        bestFor: "Reminders, follow-up, and review requests",
        narrative:
          "Text gets read far faster than email. Wire automated reminders and a post-service review request through this so it fires from your automations — this is often the single highest-ROI add for local businesses.",
      },
    ],
    deferList: [
      `A full ${crm} replacement — fix workflow and data first; switching CRMs rarely solves a process problem.`,
      "Custom/fine-tuned AI models — unnecessary until your SOPs and prompts are proven.",
      "Standalone point tools that duplicate features you already pay for.",
      "Enterprise 'AI platforms' with annual contracts before a pilot has shown ROI.",
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
        {content.tools.map((tool) => (
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
      "You are a Clinovyr tech stack advisor. Output ONLY valid JSON: { intro, tools: [{ name, cost, learningCurve, integration, bestFor, narrative }], deferList: string[] }. " +
      "Recommend exactly 4 REAL named products suited to this business's industry and existing stack. For each: realistic current monthly pricing, honest learning curve, how it integrates with their named tools, who/what it's best for, and a 2-3 sentence narrative describing the SPECIFIC workflow it automates for them and the outcome. The deferList (3-4 items) should name things NOT to buy yet and why. No vague filler.",
    prompt: `Company: ${company.name}, Industry: ${company.industry}, Size: ${company.size}
Tier: ${survey.tier ?? "TBD"}
Stack: CRM ${formData?.crm?.join(", ") ?? "N/A"}, Email ${formData?.emailTools?.join(", ") ?? "N/A"}, Scheduling ${formData?.scheduling?.join(", ") ?? "N/A"}, PM ${formData?.pm?.join(", ") ?? "N/A"}, Accounting ${formData?.accounting?.join(", ") ?? "N/A"}
AI experience: ${formData?.aiTools ?? "N/A"}, Comfort: ${formData?.comfortLevel ?? "N/A"}/5
Time drains: ${formData?.timeDrainsRanked?.slice(0, 3).join(", ") ?? "N/A"}
Goals: ${formData?.goals?.join(", ") ?? "N/A"}`,
    maxTokens: 3000,
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
