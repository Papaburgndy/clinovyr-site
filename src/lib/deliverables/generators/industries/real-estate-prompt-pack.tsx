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
  DEFAULT_REAL_ESTATE_PROMPTS,
  REAL_ESTATE_PROMPT_SYSTEM,
  buildRealEstateContextBlock,
  type RealEstatePrompt,
} from "@/lib/deliverables/generators/industries/real-estate-shared";
import type { AssessmentFormData } from "@/types/assessment";

type PromptPackContent = {
  intro: string;
  prompts: RealEstatePrompt[];
};

function buildPromptPackFallback(): PromptPackContent {
  return {
    intro:
      "Copy-paste these prompts into Claude, ChatGPT, or your CRM's AI assistant. Replace every [bracket] with client-specific details. Always review output for Fair Housing compliance and DRE advertising rules before sending to clients.",
    prompts: DEFAULT_REAL_ESTATE_PROMPTS,
  };
}

function PromptCard({ prompt, index }: { prompt: RealEstatePrompt; index: number }) {
  return (
    <View wrap={false} style={[pdfStyles.card, { marginBottom: 12 }]}>
      <Text style={pdfStyles.cardTitle}>
        {index + 1}. {prompt.title}
      </Text>
      <Text style={[pdfStyles.muted, { marginBottom: 6 }]}>
        {prompt.category} · Saves {prompt.timeSaved}
      </Text>
      <Text style={[pdfStyles.subsectionTitle, { fontSize: 9, marginTop: 4 }]}>
        Prompt (copy below)
      </Text>
      <Text
        style={[
          pdfStyles.body,
          {
            fontFamily: "Courier",
            fontSize: 8,
            backgroundColor: "#f5f2ed",
            padding: 8,
            lineHeight: 1.4,
          },
        ]}
      >
        {prompt.prompt}
      </Text>
      <Text style={[pdfStyles.subsectionTitle, { fontSize: 9, marginTop: 6 }]}>
        Usage notes
      </Text>
      <Text style={[pdfStyles.body, { fontSize: 9 }]}>{prompt.usageNotes}</Text>
    </View>
  );
}

function PromptPackDocument({
  company,
  content,
  dateStr,
}: {
  company: Company;
  content: PromptPackContent;
  dateStr: string;
}) {
  const mid = Math.ceil(content.prompts.length / 2);
  const firstHalf = content.prompts.slice(0, mid);
  const secondHalf = content.prompts.slice(mid);

  return (
    <Document title={`${company.name} — Agent Prompt Library`}>
      <BrandedPage dark footerLabel="">
        <Text style={pdfStyles.coverKicker}>Clinovyr Prompt Library</Text>
        <Text style={pdfStyles.coverTitle}>Real Estate AI Prompts</Text>
        <Text style={pdfStyles.coverSubtitle}>{company.name}</Text>
        <Text style={pdfStyles.coverMeta}>{dateStr}</Text>
        <Text style={[pdfStyles.coverMeta, { marginTop: 24 }]}>
          15 copy-paste prompts · Desk reference format
        </Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>How to Use This Library</Text>
        <Text style={pdfStyles.body}>{content.intro}</Text>
        <Text style={pdfStyles.subsectionTitle}>Tips for agents</Text>
        <Text style={pdfStyles.body}>
          • Keep a snippet folder in your phone notes for your most-used prompts{"\n"}
          • Save [bracket] fields as CRM merge tags where possible{"\n"}
          • Run Fair Housing check on any client-facing listing or marketing copy{"\n"}
          • Log time saved weekly — most agents recover 5+ hours with consistent use
        </Text>
        <PdfFooter label="clinovyr.com · Placer County real estate AI" />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Prompts 1–{mid}</Text>
        {firstHalf.map((p, i) => (
          <PromptCard key={p.title} prompt={p} index={i} />
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Prompts {mid + 1}–{content.prompts.length}</Text>
        {secondHalf.map((p, i) => (
          <PromptCard key={p.title} prompt={p} index={mid + i} />
        ))}
        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Need custom prompts for your farm area or brand voice? Clinovyr builds agent prompt
            libraries during Workflow Automation Sprints. clinovyr@gmail.com
          </Text>
        </View>
        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export async function renderRealEstatePromptPackPdf(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Promise<Buffer> {
  const fallback = buildPromptPackFallback();
  const context = buildRealEstateContextBlock(company, survey, formData);

  const { data: content } = await callClaudeJson<PromptPackContent>({
    system: REAL_ESTATE_PROMPT_SYSTEM,
    prompt: `${context}

Output ONLY valid JSON:
{
  "intro": "1 paragraph on how to use prompts",
  "prompts": [
    {"title":"...","category":"...","prompt":"with [brackets]","usageNotes":"...","timeSaved":"..."}
  ]
}
Provide exactly 15 prompts covering: lead response, MLS descriptions, objections, CMA, nurture, expired listings, transaction timelines, market updates, investor analysis, reviews, open house follow-up, showing feedback, sphere touch, listing prep.`,
    maxTokens: 5000,
    fallback,
    validate: (v) => Array.isArray(v.prompts) && v.prompts.length >= 10,
  });

  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return renderPdfDocument(
    <PromptPackDocument company={company} content={content} dateStr={dateStr} />,
  );
}
