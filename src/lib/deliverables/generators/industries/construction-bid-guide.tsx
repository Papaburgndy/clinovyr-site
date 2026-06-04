import React from "react";
import type { Company, Survey } from "@prisma/client";
import { callClaudeJson } from "@/lib/deliverables/generators/claude-helper";
import {
  BrandedPage,
  Document,
  PdfFooter,
  Text,
  View,
  pdfStyles,
  renderPdfDocument,
} from "@/lib/deliverables/generators/pdf-brand";
import {
  CONSTRUCTION_BID_SYSTEM,
  DEFAULT_BID_GUIDE_STEPS,
  SAMPLE_BID_INPUT,
  SAMPLE_BID_OUTPUT,
  buildConstructionContextBlock,
  getContractorTypeLabel,
  type BidGuideStep,
} from "@/lib/deliverables/generators/industries/construction-shared";
import type { AssessmentFormData } from "@/types/assessment";

export type BidGuideContent = {
  intro: string;
  timeSavings: string;
  steps: BidGuideStep[];
  sampleInput: string;
  sampleOutput: string;
  tips: string[];
};

function buildBidGuideFallback(
  company: Company,
  formData: AssessmentFormData | null,
): BidGuideContent {
  void formData;
  return {
    intro: `${company.name} wins jobs on speed and clarity — not on who spends the most nights writing proposals. This guide shows exactly how to use AI to draft better bids in half the time. You still price every job. AI organizes scope, flags risks, and writes the client-facing narrative so you can review, adjust numbers, and send within 24–48 hours instead of a week.`,
    timeSavings:
      "Typical remodel bid: 6–8 hours manual → 2–3 hours with this workflow. On 2 bids/week, that's 8+ owner hours back — worth $1,200/week at $150/hr effective rate.",
    steps: DEFAULT_BID_GUIDE_STEPS,
    sampleInput: SAMPLE_BID_INPUT,
    sampleOutput: SAMPLE_BID_OUTPUT,
    tips: [
      "Never send AI dollar amounts without your markup, overhead, and profit applied",
      "Run Step 2 before calling subs — you'll ask better questions on walkthroughs",
      "Save each project's scope analysis in Drive — reuse for CO drafts later",
      "For Placer County jobs, always mention permit timeline in proposal (Step 3)",
      "If client budget is below your range, say so in Step 5 review — don't waste a bid",
    ],
  };
}

function StepBlock({ step }: { step: BidGuideStep }) {
  return (
    <View wrap={false} style={[pdfStyles.card, { marginBottom: 12 }]}>
      <Text style={pdfStyles.cardTitle}>
        Step {step.step}: {step.title}
      </Text>
      <Text style={[pdfStyles.body, { marginBottom: 6 }]}>{step.description}</Text>
      <Text style={[pdfStyles.subsectionTitle, { fontSize: 9 }]}>Copy this prompt</Text>
      <Text
        style={[
          pdfStyles.body,
          {
            fontFamily: "Courier",
            fontSize: 7.5,
            backgroundColor: "#f5f2ed",
            padding: 8,
            lineHeight: 1.35,
          },
        ]}
      >
        {step.prompt}
      </Text>
    </View>
  );
}

function BidGuideDocument({
  company,
  content,
  contractorType,
  dateStr,
}: {
  company: Company;
  content: BidGuideContent;
  contractorType: string;
  dateStr: string;
}) {
  return (
    <Document title={`${company.name} — AI Bid Assistant Guide`}>
      <BrandedPage dark footerLabel="">
        <Text style={pdfStyles.coverKicker}>Clinovyr Field Guide</Text>
        <Text style={pdfStyles.coverTitle}>
          How to Use AI to Draft Better Bids in Half the Time
        </Text>
        <Text style={pdfStyles.coverSubtitle}>{company.name}</Text>
        <Text style={pdfStyles.coverSubtitle}>{contractorType}</Text>
        <Text style={pdfStyles.coverMeta}>{dateStr}</Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Why This Matters</Text>
        <Text style={pdfStyles.body}>{content.intro}</Text>
        <Text style={pdfStyles.subsectionTitle}>Time savings</Text>
        <Text style={pdfStyles.body}>{content.timeSavings}</Text>
        <Text style={pdfStyles.subsectionTitle}>Before you start</Text>
        <Text style={pdfStyles.body}>
          • Use Claude or ChatGPT — whichever you already pay for{"\n"}• Paste prompts exactly,
          replace [BRACKETS] with job details{"\n"}• You price the job — AI never sends numbers to
          clients without your review{"\n"}• Works for residential remodels, ADUs, and light
          commercial in Placer County
        </Text>
        <PdfFooter />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>The 5-Step Bid Workflow</Text>
        {content.steps.slice(0, 2).map((step) => (
          <StepBlock key={step.step} step={step} />
        ))}
      </BrandedPage>

      <BrandedPage>
        {content.steps.slice(2, 4).map((step) => (
          <StepBlock key={step.step} step={step} />
        ))}
      </BrandedPage>

      <BrandedPage>
        {content.steps.slice(4, 5).map((step) => (
          <StepBlock key={step.step} step={step} />
        ))}
        <Text style={pdfStyles.sectionTitle}>Pro Tips</Text>
        {content.tips.map((tip) => (
          <View key={tip} style={pdfStyles.checkboxRow}>
            <View style={pdfStyles.checkbox} />
            <Text style={pdfStyles.body}>{tip}</Text>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Sample: Bid Scope Input</Text>
        <Text
          style={[
            pdfStyles.body,
            {
              fontFamily: "Courier",
              fontSize: 8,
              backgroundColor: "#fff9e6",
              padding: 10,
              lineHeight: 1.4,
            },
          ]}
        >
          {content.sampleInput}
        </Text>
        <Text style={[pdfStyles.sectionTitle, { marginTop: 16 }]}>Sample: AI Output</Text>
        <Text
          style={[
            pdfStyles.body,
            {
              fontFamily: "Courier",
              fontSize: 8,
              backgroundColor: "#e8f5e9",
              padding: 10,
              lineHeight: 1.4,
            },
          ]}
        >
          {content.sampleOutput}
        </Text>
        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Want bid automation wired into n8n + your job tracker? Clinovyr builds it during
            Workflow Automation Sprints. clinovyr@gmail.com
          </Text>
        </View>
        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export async function renderConstructionBidGuidePdf(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Promise<Buffer> {
  const fallback = buildBidGuideFallback(company, formData);
  const context = buildConstructionContextBlock(company, survey, formData);
  const contractorType = getContractorTypeLabel(company, formData);

  const { data: content } = await callClaudeJson<BidGuideContent>({
    system: CONSTRUCTION_BID_SYSTEM,
    prompt: `${context}

Contractor type: ${contractorType}

Output ONLY valid JSON:
{
  "intro": "2 paragraphs for this company",
  "timeSavings": "1 paragraph with hours and dollar math at $150/hr",
  "steps": [{"step":1,"title":"...","description":"...","prompt":"exact copy-paste prompt with [BRACKETS]"}, ...5 steps: gather inputs, scope analysis, proposal narrative, sub RFQ, review & price],
  "sampleInput": "realistic Granite Bay remodel walkthrough notes",
  "sampleOutput": "realistic AI scope analysis + proposal draft excerpt",
  "tips": ["5 practical tips"]
}`,
    maxTokens: 4000,
    fallback,
    validate: (v) => Boolean(v.steps?.length >= 5 && v.sampleInput && v.sampleOutput),
  });

  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return renderPdfDocument(
    <BidGuideDocument
      company={company}
      content={content}
      contractorType={contractorType}
      dateStr={dateStr}
    />,
  );
}
