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
import { enrichTopOpportunities } from "@/lib/opportunities";
import type { AssessmentFormData } from "@/types/assessment";

type TrainingWeek = { title: string; days: Array<{ day: string; activities: string[] }> };
type TrainingGuideContent = {
  introduction: string;
  whyNow: string;
  toolsOverview: Array<{ name: string; purpose: string; tips: string }>;
  addressingConcerns: string;
  week1: TrainingWeek;
  week2: TrainingWeek;
  roleGuides: Array<{ role: string; guidance: string }>;
  faqs: Array<{ question: string; answer: string }>;
  successMetrics: string[];
};

function buildTrainingFallback(
  companyName: string,
  industry: string,
  formData: AssessmentFormData | null,
  tools: string[],
  concern: string,
): TrainingGuideContent {
  return {
    introduction: `${companyName} is adopting AI-assisted workflows to reduce time on ${formData?.timeDrainsRanked?.[0]?.toLowerCase() ?? "daily operations"} while maintaining quality and compliance standards expected in ${industry}.`,
    whyNow: `Your team has clear automation targets and leadership support. Starting with structured training ensures adoption sticks and ROI is measurable within 30 days.`,
    toolsOverview: tools.slice(0, 3).map((name) => ({
      name,
      purpose: `Supports ${industry} workflows with human-in-the-loop review`,
      tips: "Use approved templates only. Escalate edge cases to your team lead.",
    })),
    addressingConcerns: `We understand your concern about ${concern.toLowerCase()}. Every AI output goes through human review before client-facing use. We start with low-risk internal tasks and expand only after staff confidence is established.`,
    week1: {
      title: "Week 1 — Foundations",
      days: [
        { day: "Day 1–2", activities: ["Kickoff meeting and AI policy overview", "Access setup and password/security review"] },
        { day: "Day 3–4", activities: ["Hands-on demo of primary automation", "Practice with sample scenarios (no live client data)"] },
        { day: "Day 5", activities: ["Q&A session with Clinovyr", "Assign practice homework and feedback channel"] },
      ],
    },
    week2: {
      title: "Week 2 — Live Practice",
      days: [
        { day: "Day 6–7", activities: ["Supervised live use with 2–3 team members", "Daily 15-min standup on what worked / what didn't"] },
        { day: "Day 8–9", activities: ["Expand to full pilot group", "Document edge cases and escalation rules"] },
        { day: "Day 10", activities: ["Week 2 retrospective and ROI baseline", "Plan full rollout timeline"] },
      ],
    },
    roleGuides: [
      { role: "Front desk / intake", guidance: "Use AI for draft responses and scheduling prep. Always verify before sending." },
      { role: "Operations / back office", guidance: "Focus on data entry reduction and report drafting. Log time saved daily." },
      { role: "Leadership", guidance: "Review weekly ROI dashboard. Approve scope expansions based on pilot data." },
    ],
    faqs: [
      { question: "Will AI replace my job?", answer: "No. AI handles repetitive tasks so you can focus on client relationships and judgment calls." },
      { question: "What if the AI makes a mistake?", answer: "All outputs require human review. Escalation rules are documented in your SOP." },
      { question: "How do I get help?", answer: "Contact your AI champion or Clinovyr during office hours in weeks 2–4." },
      { question: "Is client data safe?", answer: "Use only approved tools with business accounts. Never paste sensitive data into personal AI accounts." },
    ],
    successMetrics: [
      "Hours saved per week on priority workflows",
      "Staff confidence score (1–5 survey at day 30)",
      "Error rate vs. manual baseline",
      "Response time to new inquiries",
    ],
  };
}

function BulletList({ items }: { items: string[] }) {
  return (
    <>
      {items.map((item) => (
        <View key={item} style={pdfStyles.checkboxRow}>
          <Text style={pdfStyles.body}>• {item}</Text>
        </View>
      ))}
    </>
  );
}

function StaffTrainingDocument({
  companyName,
  industry,
  content,
}: {
  companyName: string;
  industry: string;
  content: TrainingGuideContent;
}) {
  return (
    <Document title={`${companyName} — Staff Training Guide`}>
      <BrandedPage dark footerLabel="">
        <Text style={pdfStyles.coverKicker}>Clinovyr Staff Adoption Guide</Text>
        <Text style={pdfStyles.coverTitle}>{companyName}</Text>
        <Text style={pdfStyles.coverSubtitle}>{industry} · Sprint Package Deliverable</Text>
        <Text style={pdfStyles.coverMeta}>
          Generated {new Date().toLocaleDateString("en-US", { dateStyle: "long" })}
        </Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Introduction</Text>
        <Text style={pdfStyles.body}>{content.introduction}</Text>
        <Text style={pdfStyles.sectionTitle}>Why Now</Text>
        <Text style={pdfStyles.body}>{content.whyNow}</Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Tools Overview</Text>
        {content.toolsOverview.map((tool) => (
          <View key={tool.name} style={pdfStyles.card}>
            <Text style={pdfStyles.cardTitle}>{tool.name}</Text>
            <Text style={pdfStyles.body}>{tool.purpose}</Text>
            <Text style={pdfStyles.muted}>Tip: {tool.tips}</Text>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Addressing Team Concerns</Text>
        <Text style={pdfStyles.body}>{content.addressingConcerns}</Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>{content.week1.title}</Text>
        {content.week1.days.map((block) => (
          <View key={block.day} style={{ marginBottom: 10 }}>
            <Text style={pdfStyles.subsectionTitle}>{block.day}</Text>
            <BulletList items={block.activities} />
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>{content.week2.title}</Text>
        {content.week2.days.map((block) => (
          <View key={block.day} style={{ marginBottom: 10 }}>
            <Text style={pdfStyles.subsectionTitle}>{block.day}</Text>
            <BulletList items={block.activities} />
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Role-Based Guidance</Text>
        {content.roleGuides.map((guide) => (
          <View key={guide.role} style={{ marginBottom: 8 }}>
            <Text style={pdfStyles.subsectionTitle}>{guide.role}</Text>
            <Text style={pdfStyles.body}>{guide.guidance}</Text>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Frequently Asked Questions</Text>
        {content.faqs.map((faq) => (
          <View key={faq.question} style={{ marginBottom: 10 }}>
            <Text style={pdfStyles.subsectionTitle}>Q: {faq.question}</Text>
            <Text style={pdfStyles.body}>A: {faq.answer}</Text>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Success Metrics</Text>
        <BulletList items={content.successMetrics} />
        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Questions during rollout? Contact Clinovyr at clinovyr@gmail.com. Office hours are
            available in weeks 2–4 post-launch.
          </Text>
        </View>
        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export const generateStaffTrainingGuide: DeliverableGenerator = async ({
  company,
  survey,
  formData,
}) => {
  const opportunities = enrichTopOpportunities(
    survey.topOpportunities,
    company.industry,
    survey.estimatedROI,
  );
  const toolNames = opportunities.slice(0, 3).map((o) => o.name);
  const concern = formData?.biggestConcern ?? "team adoption";
  const fallback = buildTrainingFallback(
    company.name,
    company.industry,
    formData,
    toolNames.length ? toolNames : ["Primary automation", "AI assistant", "Knowledge base"],
    concern,
  );

  const { data: content } = await callClaudeJson<TrainingGuideContent>({
    system:
      "You are a Clinovyr change-management consultant. Output ONLY valid JSON matching TrainingGuideContent shape with introduction, whyNow, toolsOverview (3 items), addressingConcerns, week1/week2 with days and activities, roleGuides (3), faqs (4+), successMetrics (4). Be specific to industry.",
    prompt: `Company: ${company.name}, Industry: ${company.industry}, Size: ${company.size}
Top tools/automations: ${toolNames.join("; ") || "workflow automation"}
Biggest concern: ${concern}
Time drains: ${formData?.timeDrainsRanked?.slice(0, 3).join(", ") ?? "N/A"}
AI experience: ${formData?.aiTools ?? "N/A"}, Comfort: ${formData?.comfortLevel ?? "N/A"}/5
Tier: ${survey.tier ?? "TBD"}`,
    maxTokens: 2000,
    fallback,
    validate: (v) =>
      Boolean(v.introduction && v.week1?.days?.length && v.faqs?.length >= 3),
  });

  const buffer = await renderPdfDocument(
    <StaffTrainingDocument companyName={company.name} industry={company.industry} content={content} />,
  );

  return pdfOutput("staff-training-guide", buffer);
};
