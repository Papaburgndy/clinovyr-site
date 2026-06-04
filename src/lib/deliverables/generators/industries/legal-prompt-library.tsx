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
  DEFAULT_LEGAL_PROMPTS,
  LEGAL_PROMPT_SYSTEM,
  buildLegalContextBlock,
  type LegalPrompt,
} from "@/lib/deliverables/generators/industries/legal-shared";
import type { AssessmentFormData } from "@/types/assessment";

type PromptLibraryContent = {
  intro: string;
  prompts: LegalPrompt[];
};

function buildPromptLibraryFallback(): PromptLibraryContent {
  return {
    intro:
      "Twenty attorney-tested prompts for California law firms and RIAs. Copy into Claude Enterprise or your firm-approved AI tool. Replace every [bracket] with matter-specific details. Every prompt includes an ethics note — read it before use. Attorney review is required for all client-facing or court-facing output.",
    prompts: DEFAULT_LEGAL_PROMPTS,
  };
}

function PromptCard({ prompt, index }: { prompt: LegalPrompt; index: number }) {
  return (
    <View wrap={false} style={[pdfStyles.card, { marginBottom: 10 }]}>
      <Text style={pdfStyles.cardTitle}>
        {index + 1}. {prompt.title}
      </Text>
      <Text style={[pdfStyles.muted, { marginBottom: 4 }]}>
        {prompt.category} · Saves {prompt.timeSaved}
      </Text>
      <Text style={[pdfStyles.body, { fontSize: 8, color: "#1a6b5a", marginBottom: 6 }]}>
        {prompt.ethicsNote}
      </Text>
      <Text style={[pdfStyles.subsectionTitle, { fontSize: 9, marginTop: 2 }]}>
        Prompt (copy below)
      </Text>
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
        {prompt.prompt}
      </Text>
      <Text style={[pdfStyles.subsectionTitle, { fontSize: 9, marginTop: 4 }]}>
        Usage notes
      </Text>
      <Text style={[pdfStyles.body, { fontSize: 8 }]}>{prompt.usageNotes}</Text>
    </View>
  );
}

function TableOfContents({ prompts }: { prompts: LegalPrompt[] }) {
  return (
    <View>
      {prompts.map((p, i) => (
        <View key={p.title} style={{ flexDirection: "row", marginBottom: 3 }}>
          <Text style={[pdfStyles.body, { width: 24, fontSize: 9 }]}>{i + 1}.</Text>
          <Text style={[pdfStyles.body, { flex: 1, fontSize: 9 }]}>{p.title}</Text>
          <Text style={[pdfStyles.muted, { fontSize: 8 }]}>{p.category}</Text>
        </View>
      ))}
    </View>
  );
}

function PromptLibraryDocument({
  company,
  content,
  dateStr,
}: {
  company: Company;
  content: PromptLibraryContent;
  dateStr: string;
}) {
  const chunkSize = 4;
  const chunks: LegalPrompt[][] = [];
  for (let i = 0; i < content.prompts.length; i += chunkSize) {
    chunks.push(content.prompts.slice(i, i + chunkSize));
  }

  return (
    <Document title={`${company.name} — Legal AI Prompt Library`}>
      <BrandedPage dark footerLabel="">
        <Text style={pdfStyles.coverKicker}>Clinovyr Prompt Library</Text>
        <Text style={pdfStyles.coverTitle}>Legal AI Prompts</Text>
        <Text style={pdfStyles.coverSubtitle}>{company.name}</Text>
        <Text style={pdfStyles.coverMeta}>{dateStr}</Text>
        <Text style={[pdfStyles.coverMeta, { marginTop: 24 }]}>
          20 attorney-tested prompts · Ethics notes included
        </Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>How to Use This Library</Text>
        <Text style={pdfStyles.body}>{content.intro}</Text>
        <Text style={pdfStyles.subsectionTitle}>Before you start</Text>
        <Text style={pdfStyles.body}>
          • Use only firm-approved AI tools with confidentiality agreements{"\n"}
          • Never paste client names or privileged content into consumer AI without approval{"\n"}
          • Attorney must review all output before client delivery or filing{"\n"}
          • Log AI use in matter notes where your ethics policy requires it
        </Text>
        <PdfFooter label="clinovyr.com · California legal AI" />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Table of Contents</Text>
        <TableOfContents prompts={content.prompts} />
        <PdfFooter />
      </BrandedPage>

      {chunks.map((chunk, chunkIdx) => (
        <BrandedPage key={`chunk-${chunkIdx}`}>
          <Text style={pdfStyles.sectionTitle}>
            Prompts {chunkIdx * chunkSize + 1}–{chunkIdx * chunkSize + chunk.length}
          </Text>
          {chunk.map((p, i) => (
            <PromptCard key={p.title} prompt={p} index={chunkIdx * chunkSize + i} />
          ))}
          {chunkIdx === chunks.length - 1 && (
            <View style={pdfStyles.ctaBox}>
              <Text style={pdfStyles.ctaText}>
                Need custom prompts for your practice areas? Clinovyr builds firm-specific prompt
                libraries during Workflow Automation Sprints. clinovyr@gmail.com
              </Text>
            </View>
          )}
          <PdfFooter />
        </BrandedPage>
      ))}
    </Document>
  );
}

export async function renderLegalPromptLibraryPdf(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Promise<Buffer> {
  const fallback = buildPromptLibraryFallback();
  const context = buildLegalContextBlock(company, survey, formData);

  const { data: content } = await callClaudeJson<PromptLibraryContent>({
    system: LEGAL_PROMPT_SYSTEM,
    prompt: `${context}

Output ONLY valid JSON:
{
  "intro": "1 paragraph on ethical use",
  "prompts": [
    {"title":"...","category":"...","prompt":"with [brackets]","ethicsNote":"⚖️ ETHICS NOTE: ...","usageNotes":"...","timeSaved":"..."}
  ]
}
Provide exactly 20 prompts covering: intake, document drafting, billing/time entry, client communications, research, litigation, estate planning, RIA compliance. Every prompt MUST include ethicsNote starting with ⚖️ ETHICS NOTE:`,
    maxTokens: 6000,
    fallback,
    validate: (v) => Array.isArray(v.prompts) && v.prompts.length >= 15,
  });

  const prompts =
    content.prompts.length >= 20
      ? content.prompts.slice(0, 20)
      : [...content.prompts, ...DEFAULT_LEGAL_PROMPTS].slice(0, 20);

  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return renderPdfDocument(
    <PromptLibraryDocument
      company={company}
      content={{ ...content, prompts }}
      dateStr={dateStr}
    />,
  );
}
