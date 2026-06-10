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
  const topDrain =
    formData?.timeDrainsRanked?.[0]?.toLowerCase() ?? "daily operations";
  const secondDrain = formData?.timeDrainsRanked?.[1]?.toLowerCase() ?? null;

  return {
    introduction: `${companyName} is adopting AI-assisted workflows to reduce time spent on ${topDrain}${secondDrain ? ` and ${secondDrain}` : ""} while maintaining the quality and compliance standards expected in ${industry}. This guide is the playbook for the first two weeks: what each person practices, in what order, and how you'll know it's working. The goal is not "everyone uses AI for everything" — it's that three or four high-frequency tasks get measurably faster, with a clear human checkpoint on anything a client could see.`,
    whyNow: `Your team has clear automation targets, leadership support, and named tools — the three ingredients that separate AI rollouts that stick from ones that fizzle. Teams that train in a structured two-week window typically see their first measurable time savings inside 30 days; teams that "let people explore on their own" usually stall, because nobody knows what good looks like. Training now also means your team shapes the guardrails, rather than having rules imposed later after a near-miss.`,
    toolsOverview: (tools.length ? tools : ["AI assistant (Claude/ChatGPT Team)", "Make.com automations", "Shared SOP library"]).slice(0, 3).map((name, index) => ({
      name,
      purpose:
        index === 0
          ? `Your primary workhorse for ${industry.toLowerCase()} workflows — drafting client-facing messages, summarizing notes, and turning rough bullet points into polished text. A human reviews and approves anything that leaves the building.`
          : `Used in ${industry} workflows to draft and speed up repetitive work, always with a human approving anything client-facing. Treat its output as a strong first draft from a capable new hire — fast, useful, and in need of a quick check.`,
      tips: `Start from an approved template, then edit. Example prompt to practice: "Draft a friendly follow-up to a client who hasn't responded in 3 days about [topic]; keep it under 80 words and on-brand." Two more to try: "Summarize these notes into 5 bullet points for a handoff" and "Rewrite this paragraph at an 8th-grade reading level, same facts." Escalate anything unusual to your team lead rather than improvising.`,
    })),
    addressingConcerns: `We understand your concern about ${concern.toLowerCase()} — it's the most common worry teams raise, and it's legitimate. Here is how the rollout addresses it directly: every AI output goes through human review before client-facing use, we start with low-risk internal tasks (summaries, drafts, data prep) and expand only after staff confidence is established, and there is a written escalation rule for anything ambiguous. Nobody is graded on "using AI more"; people are recognized for catching bad outputs just as much as for producing fast ones. If a tool makes the work worse, say so in the daily standup — that feedback shapes week 2.`,
    week1: {
      title: "Week 1 — Foundations",
      days: [
        { day: "Day 1–2", activities: ["Kickoff meeting (45 min): walk the AI policy one page at a time — what's approved, what's banned, who to ask", "Access setup: business accounts only, password manager entries created, personal AI accounts explicitly off-limits for work data", "Each person writes down the one task they most want off their plate — these become week 2 candidates"] },
        { day: "Day 3–4", activities: ["Hands-on demo of the primary automation, start to finish, with a real (anonymized) example", "Each person runs 3 practice scenarios with fake data — e.g. draft a reminder, summarize a call note, reply to a common question", "Save the best outputs as reusable team templates in the shared SOP library", "Practice the failure case too: feed the tool a vague request, watch it guess, and practice spotting what's wrong"] },
        { day: "Day 5", activities: ["Q&A session with Clinovyr — bring the awkward questions", "Assign practice homework: 2 drafts per person before Day 6, posted to the feedback channel", "Set the week 2 pilot group and confirm who the AI champion is"] },
      ],
    },
    week2: {
      title: "Week 2 — Live Practice",
      days: [
        { day: "Day 6–7", activities: ["Supervised live use with 2–3 team members on real work, reviewer named in advance", "Daily 15-min standup: one thing that worked, one that didn't, one question", "Start the time log: minutes saved per task, however rough"] },
        { day: "Day 8–9", activities: ["Expand to the full pilot group", "Document edge cases and escalation rules as they actually occur — this becomes your living SOP", "Promote the 3 best prompts/templates of the week into the official library"] },
        { day: "Day 10", activities: ["Week 2 retrospective and ROI baseline: hours saved, error catches, team confidence pulse", "Decide what graduates to unsupervised use vs. what stays reviewed", "Plan the full rollout timeline and the 30-day check-in"] },
      ],
    },
    roleGuides: [
      { role: "Front desk / intake", guidance: "Use AI for draft responses, scheduling prep, and turning voicemail/call notes into clean summaries. Do: start every client-facing draft from an approved template. Don't: send anything unreviewed, or paste client identifiers into unapproved tools." },
      { role: "Operations / back office", guidance: "Focus on data entry reduction, report drafting, and first-pass document prep. Do: log time saved daily, even roughly — it's the rollout's scoreboard. Don't: let the tool invent numbers; every figure in a report gets traced to its source." },
      { role: "Senior staff / practitioners", guidance: "Use AI to prep — summarizing case/client history before a meeting, drafting routine correspondence — not to make judgment calls. Do: flag tasks that feel risky to automate; that judgment is exactly what the pilot needs. Don't: delegate professional decisions or anything regulated to a draft you didn't read." },
      { role: "AI champion", guidance: "You're the first stop for questions and the keeper of the template library. Do: collect every confusing output in a running doc for the retrospective. Don't: fix things silently — broadcast the lesson so the whole team levels up." },
      { role: "Leadership", guidance: "Review the weekly time-saved log and approve scope expansions based on pilot data, not enthusiasm. Do: publicly credit good catches of bad AI output. Don't: measure people on AI usage volume — measure outcomes." },
    ],
    faqs: [
      { question: "Will AI replace my job?", answer: "No. AI handles the repetitive drafting and data-shuffling so you can focus on client relationships and judgment calls. The plan explicitly keeps a human in charge of every decision and every client-facing message." },
      { question: "What if the AI makes a mistake?", answer: "Expect it to — that's why every output gets human review before it counts. Catching a bad output is a win, not a failure; escalation rules are documented in your SOP and refined during week 2." },
      { question: "How do I get help?", answer: "First stop is your AI champion; second is the team feedback channel; third is Clinovyr office hours in weeks 2–4. No question is too basic — the fastest adopters ask the most questions in week 1." },
      { question: "Is client data safe?", answer: "Use only the approved tools under business accounts, which don't train on your data. Never paste sensitive client data into personal AI accounts, and when in doubt, anonymize before you paste." },
      { question: "Do I have to use it?", answer: "During the pilot, everyone tries the core workflows so the team's feedback is complete. After that, the tools that survive the retrospective become the standard way of working — like email did — because they'll have proven they save real time." },
      { question: "What if it's slower than doing it myself?", answer: "Sometimes it will be at first — say so in the standup. Some tasks aren't worth automating, and finding those is a goal of the pilot, not a problem with you." },
    ],
    successMetrics: [
      "Hours saved per week on priority workflows (from the daily time log)",
      "Staff confidence score (1–5 survey at day 30, compared to the day 1 baseline)",
      "Error rate vs. manual baseline — including AI mistakes caught in review",
      "Response time to new inquiries",
      "Template library growth: approved prompts/templates in active use",
      "Share of pilot tasks graduated to unsupervised use by day 30",
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
      "You are a Clinovyr change-management consultant. Output ONLY valid JSON matching TrainingGuideContent shape with introduction, whyNow, toolsOverview (3 items), addressingConcerns, week1/week2 with days and activities, roleGuides (3), faqs (4+), successMetrics (4). " +
      "Make it genuinely teachable: each day's activities must be concrete exercises (what to open, what to practice, an example prompt to try), not vague themes. roleGuides must give each role specific do's/don'ts. FAQs must answer real worries substantively. Tailor everything to the company's industry and named tools.",
    prompt: `Company: ${company.name}, Industry: ${company.industry}, Size: ${company.size}
Top tools/automations: ${toolNames.join("; ") || "workflow automation"}
Biggest concern: ${concern}
Time drains: ${formData?.timeDrainsRanked?.slice(0, 3).join(", ") ?? "N/A"}
AI experience: ${formData?.aiTools ?? "N/A"}, Comfort: ${formData?.comfortLevel ?? "N/A"}/5
Tier: ${survey.tier ?? "TBD"}`,
    maxTokens: 3500,
    fallback,
    validate: (v) =>
      Boolean(v.introduction && v.week1?.days?.length && v.faqs?.length >= 3),
  });

  const buffer = await renderPdfDocument(
    <StaffTrainingDocument companyName={company.name} industry={company.industry} content={content} />,
  );

  return pdfOutput("staff-training-guide", buffer);
};
