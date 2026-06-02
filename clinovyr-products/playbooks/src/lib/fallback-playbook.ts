import type { IndustryConfig } from "./types";
import {
  buildPlaybookTitle,
  chapterTitleForIndustry,
} from "./industries";
import { todayIsoDate } from "./env";
import type { Playbook, PlaybookChapter } from "./types";
import { CHAPTER_TITLES } from "./types";

const USE_CASES: Record<string, string[]> = {
  medical: [
    "Patient intake summarization",
    "Insurance verification drafts",
    "Appointment reminder personalization",
    "Clinical note templating",
    "Referral letter drafting",
    "Recall campaign copy",
    "After-hours FAQ triage",
  ],
  "real-estate": [
    "Listing description generation",
    "Buyer/seller email sequences",
    "Transaction timeline summaries",
    "Market report drafts",
    "Showing follow-up scripts",
    "Offer comparison summaries",
    "CRM activity logging",
  ],
  legal: [
    "Initial client intake summaries",
    "Discovery document indexing",
    "Engagement letter drafts",
    "Deposition prep outlines",
    "Case status client updates",
    "Billing narrative assistance",
    "Conflict check research memos",
  ],
  construction: [
    "RFI response drafting",
    "Daily log summarization",
    "Subcontractor bid comparisons",
    "Safety briefing scripts",
    "Change order documentation",
    "Client progress updates",
    "Punch list organization",
  ],
  wellness: [
    "Consultation note templates",
    "Treatment plan summaries",
    "Membership renewal campaigns",
    "Review response drafts",
    "Retail upsell scripts",
    "Appointment gap-fill outreach",
    "Staff training SOP drafts",
  ],
};

function buildChapter(
  industry: IndustryConfig,
  chapterNumber: number,
): PlaybookChapter {
  const baseTitle = CHAPTER_TITLES[chapterNumber - 1];
  const title = chapterTitleForIndustry(baseTitle, industry);
  const useCases = USE_CASES[industry.slug] ?? USE_CASES.medical;

  switch (chapterNumber) {
    case 1:
      return {
        number: 1,
        title,
        sections: [
          {
            title: "The operational pressure is real",
            content: `${industry.label} businesses in Placer County face the same squeeze as firms nationwide: rising labor costs, tighter margins, and clients who expect faster response times. AI is not a replacement strategy — it is a leverage strategy for ${industry.audience} who need to reclaim hours lost to repeatable administrative work.\n\nEarly adopters in the Sacramento region report 5–12 hours per week saved on documentation, follow-ups, and internal coordination. The goal is not to automate judgment — it is to automate the scaffolding around it.`,
            callouts: [
              "Start with workflows that do not touch protected or privileged data until your policies are defined.",
              "Pilot one use case for 30 days before expanding — velocity without governance creates rework.",
            ],
          },
          {
            title: "What changed in 2024–2026",
            content: `Tool quality crossed a threshold for ${industry.label}: models now handle structured business writing, summarization, and multi-step instructions reliably enough for production pilots. Integration layers (Zapier, Make, native CRM connectors) reduced implementation time from months to weeks.\n\nClinovyr clients typically begin with a 2–3 week readiness assessment, then implement 2–3 automations in a 90-day window.`,
            callouts: [
              "Free tiers (ChatGPT, Claude.ai, Gemini) are sufficient for structured pilots.",
              "Budget $200–$800/month for production tooling once a workflow proves ROI.",
            ],
          },
        ],
      };
    case 2:
      return {
        number: 2,
        title,
        sections: useCases.map((useCase, index) => ({
          title: `${index + 1}. ${useCase}`,
          content: `Implement ${useCase.toLowerCase()} by mapping the current manual steps, defining inputs/outputs, and assigning a workflow owner. For ${industry.label} teams, this typically saves 30–90 minutes per day once templated.\n\nDocument a before/after time study in week one. Track error rates and rework — ROI is as much about quality as speed.`,
          callouts: [
            `Assign a single owner for ${useCase.toLowerCase()} during the pilot.`,
            "Review outputs weekly for the first month — patterns beat one-off fixes.",
          ],
        })),
      };
    case 3:
      return {
        number: 3,
        title,
        sections: [
          {
            title: "Foundation: ChatGPT & Claude for drafting",
            content: `Use ChatGPT (chat.openai.com) or Claude (claude.ai) for first-pass drafts: emails, summaries, SOPs, and client communications. Create shared prompt templates in a team doc.\n\nFor ${industry.label}, standardize tone guidelines and prohibited topics before rolling out to staff.`,
            callouts: [
              "Never paste full SSNs, account numbers, or complete PHI into public models.",
              "Use organization accounts with data controls when available.",
            ],
          },
          {
            title: "Automation: Make.com & native integrations",
            content: `Connect your CRM, scheduling, or PM tool to AI steps via Make.com or native automations. Typical pattern: trigger → fetch context → AI step → human review → send/store.\n\nStart with one inbound channel (web form, email label, CRM stage change).`,
            callouts: [
              "Include a human approval step for anything client-facing.",
              "Log automation runs for troubleshooting and compliance audits.",
            ],
          },
        ],
      };
    case 4:
      return {
        number: 4,
        title,
        sections: [
          {
            title: "Days 1–30: Assess & pilot",
            content: `Week 1–2: Workflow audit with ${industry.audience}. Identify top 3 time sinks. Week 3–4: Launch one pilot (usually intake or follow-up automation). Establish baseline metrics.\n\nDeliverable: one working automation, written SOP, and ROI worksheet.`,
            callouts: [
              "Block 2 hours weekly for pilot review meetings.",
              "Name an executive sponsor — pilots stall without air cover.",
            ],
          },
          {
            title: "Days 31–60: Expand & train",
            content: `Roll pilot learnings into SOPs. Add second workflow. Train staff in 45-minute sessions with live examples from your business — not generic demos.\n\nDeliverable: staff competency checklist signed off by department leads.`,
            callouts: [
              "Pair skeptics with early adopters for paired sessions.",
              "Update employee handbook or policy addendum if needed.",
            ],
          },
          {
            title: "Days 61–90: Measure & optimize",
            content: `Review KPI dashboard monthly. Retire low-ROI experiments. Promote one workflow to production with monitoring. Plan Q2 expansion or Clinovyr retainer scope.\n\nDeliverable: 90-day ROI report for leadership.`,
            callouts: [
              "Compare actual vs. projected hours saved — adjust assumptions honestly.",
              "Document failures; they inform the next sprint.",
            ],
          },
        ],
      };
    case 5:
      return {
        number: 5,
        title,
        sections: [
          {
            title: "Core KPIs",
            content: `Track: hours saved per role, response time, error/rework rate, client satisfaction (NPS or reviews), and revenue per employee. For ${industry.label}, add industry-specific metrics (e.g., showings booked, cases opened, jobs completed on schedule).\n\nBaseline everything in week one of the pilot.`,
            callouts: [
              "Use a simple spreadsheet before investing in dashboards.",
              "Review KPIs in the same meeting as financials — AI ROI must tie to P&L.",
            ],
          },
        ],
      };
    case 6:
      return {
        number: 6,
        title,
        sections: [
          {
            title: "Training plan",
            content: `Run three training tiers: (1) All staff — safe use & policy, 30 min; (2) Power users — prompt engineering & QA, 90 min; (3) Managers — ROI review & escalation, 60 min.\n\nRefresh quarterly as tools update.`,
            callouts: [
              "Collect signed acknowledgments for acceptable use policies.",
              "Celebrate wins in team meetings — adoption is cultural.",
            ],
          },
        ],
      };
    default:
      return {
        number: 7,
        title,
        sections: [
          {
            title: "Next steps with Clinovyr",
            content: `This playbook is your implementation map. For hands-on support — workflow design, integration build, staff training, and ongoing optimization — contact Clinovyr.\n\nclinovyr@gmail.com | clinovyr.com | Granite Bay, California\n\nRecommended path: AI Readiness Assessment → Workflow Automation Sprint → AI Operations Retainer.`,
            callouts: [
              "Schedule a 30-minute discovery call to prioritize your top 3 workflows.",
              "Ask about industry-specific automation templates for Placer County businesses.",
            ],
          },
        ],
      };
  }
}

export function buildFallbackPlaybook(
  industry: IndustryConfig,
  version: number,
): Playbook {
  const chapters = Array.from({ length: 7 }, (_, i) =>
    buildChapter(industry, i + 1),
  );

  return {
    title: buildPlaybookTitle(industry),
    industry: industry.label,
    slug: industry.slug,
    version: `${version}.0`,
    publishDate: todayIsoDate(),
    chapters,
    toolDirectory: [
      {
        name: "ChatGPT",
        useCase: "Drafting emails, SOPs, and summaries",
        priceRange: "Free–$25/user/mo",
        url: "https://chat.openai.com",
        difficulty: "Beginner",
      },
      {
        name: "Claude",
        useCase: "Long-document analysis and structured writing",
        priceRange: "Free–$25/user/mo",
        url: "https://claude.ai",
        difficulty: "Beginner",
      },
      {
        name: "Make.com",
        useCase: "Multi-step automations with AI modules",
        priceRange: "Free–$29/mo",
        url: "https://www.make.com",
        difficulty: "Intermediate",
      },
      {
        name: "Zapier",
        useCase: "CRM and app integrations with AI steps",
        priceRange: "$20–$50/mo",
        url: "https://zapier.com",
        difficulty: "Intermediate",
      },
      {
        name: "Notion AI",
        useCase: "Internal knowledge base and SOP management",
        priceRange: "$10/user/mo",
        url: "https://notion.so",
        difficulty: "Beginner",
      },
    ],
    promptLibrary: [
      {
        title: "Client follow-up email",
        prompt: `Draft a professional follow-up email for [CLIENT NAME] regarding [TOPIC]. Tone: warm, concise, ${industry.label}-appropriate. Include clear next step and deadline.`,
        useCase: "Post-meeting or post-visit follow-ups",
      },
      {
        title: "Meeting summary",
        prompt: `Summarize the following meeting notes into: (1) decisions made, (2) action items with owners, (3) open questions. Notes: [PASTE NOTES]`,
        useCase: "Internal coordination",
      },
      {
        title: "SOP draft",
        prompt: `Create a step-by-step SOP for [PROCESS NAME] at a ${industry.label} business. Include trigger, steps, quality checks, and escalation path.`,
        useCase: "Operations documentation",
      },
    ],
    roiCalculator: {
      inputs: [
        "Number of staff affected",
        "Average hourly cost (loaded)",
        "Hours saved per person per week",
        "Tool costs per month",
        "Implementation hours (one-time)",
      ],
      formula:
        "Annual ROI = (hours saved × hourly rate × 52) − (monthly tool cost × 12) − (implementation cost). Payback period = implementation cost ÷ monthly net savings.",
      exampleOutput:
        "Example: 4 staff × 3 hrs/week × $45/hr = $540/week saved. Tools $400/mo. Net ~$1,760/mo after tools. 90-day implementation (~$8k) pays back in ~5 months.",
    },
    checklistPages: [
      {
        title: "Pre-Implementation Readiness",
        items: [
          "Executive sponsor identified",
          "Top 3 workflows documented",
          "Data privacy policy reviewed",
          "Tool budget approved",
          "Baseline KPIs captured",
          "Pilot owner assigned",
          "Staff communication drafted",
          "Acceptable use policy updated",
        ],
      },
      {
        title: "90-Day Implementation Milestones",
        items: [
          "Week 1: Workflow audit complete",
          "Week 2: Pilot workflow selected",
          "Week 4: First automation live",
          "Week 6: Staff training session 1",
          "Week 8: Second workflow live",
          "Week 10: KPI review #1",
          "Week 12: 90-day ROI report",
        ],
      },
      {
        title: "Ongoing Optimization",
        items: [
          "Monthly KPI review scheduled",
          "Prompt library maintained",
          "Tool access audited quarterly",
          "New hire AI onboarding added",
          "Failed automation log reviewed",
          "Vendor contracts re-evaluated annually",
        ],
      },
    ],
  };
}
