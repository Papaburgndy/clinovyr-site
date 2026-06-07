import type { Company, Survey } from "@prisma/client";
import { enrichTopOpportunities } from "@/lib/opportunities";
import { calculateAIReadinessScore, type AIReadinessScore } from "@/lib/scoring";
import type { AssessmentFormData } from "@/types/assessment";

export type DeliverableKeyMeta = {
  displayName: string;
  filename: string;
  fileType: "html" | "json" | "markdown";
  deliverableType: "pdf" | "json" | "markdown" | "html";
};

export const DELIVERABLE_KEY_META: Record<string, DeliverableKeyMeta> = {
  "assessment-report-pdf": {
    displayName: "AI Readiness Assessment Report",
    filename: "assessment-report.pdf",
    fileType: "html",
    deliverableType: "pdf",
  },
  "opportunity-roadmap": {
    displayName: "Opportunity Roadmap",
    filename: "opportunity-roadmap.pdf",
    fileType: "html",
    deliverableType: "pdf",
  },
  "tool-stack-guide": {
    displayName: "AI Tool Stack Guide",
    filename: "ai-tool-stack-guide.pdf",
    fileType: "html",
    deliverableType: "pdf",
  },
  "implementation-checklist": {
    displayName: "Implementation Checklist",
    filename: "implementation-checklist.pdf",
    fileType: "html",
    deliverableType: "pdf",
  },
  "executive-presentation": {
    displayName: "Executive Briefing",
    filename: "executive-briefing.pdf",
    fileType: "html",
    deliverableType: "pdf",
  },
  "opportunity-brief": {
    displayName: "Opportunity Brief",
    filename: "opportunity-brief.pdf",
    fileType: "html",
    deliverableType: "pdf",
  },
  "tool-recommendations": {
    displayName: "Tool Recommendations",
    filename: "tool-recommendations.pdf",
    fileType: "html",
    deliverableType: "pdf",
  },
  "automation-blueprints": {
    displayName: "Automation Blueprints",
    filename: "automation-blueprints.json",
    fileType: "json",
    deliverableType: "json",
  },
  "medical-hipaa-guide": {
    displayName: "HIPAA-Safe AI Implementation Guide",
    filename: "hipaa-safe-ai-guide.pdf",
    fileType: "html",
    deliverableType: "pdf",
  },
  "crm-setup-guide": {
    displayName: "CRM Setup Guide",
    filename: "crm-setup-guide.pdf",
    fileType: "html",
    deliverableType: "pdf",
  },
  "staff-training-guide": {
    displayName: "Staff Training Guide",
    filename: "staff-training-guide.pdf",
    fileType: "html",
    deliverableType: "pdf",
  },
  "roi-calculator": {
    displayName: "ROI Calculator Worksheet",
    filename: "roi-calculator.xlsx",
    fileType: "html",
    deliverableType: "html",
  },
};

export function parseSurveyFormData(
  survey: Survey | null,
): AssessmentFormData | null {
  if (!survey?.responses || typeof survey.responses !== "object") {
    return null;
  }
  const responses = survey.responses as {
    formData?: AssessmentFormData;
  };
  return responses.formData ?? null;
}

export function resolveScore(
  formData: AssessmentFormData | null,
  survey: Survey,
): AIReadinessScore | null {
  if (formData) {
    return calculateAIReadinessScore(formData);
  }
  if (survey.score == null || !survey.tier) return null;
  return {
    overallScore: survey.score,
    tier: survey.tier as AIReadinessScore["tier"],
    categoryScores: {
      techStack: 0,
      processMaturity: 0,
      dataReadiness: 0,
      adoptionReadiness: 0,
      roi_potential: 0,
    },
    topOpportunities: Array.isArray(survey.topOpportunities)
      ? (survey.topOpportunities as string[])
      : [],
    quickWins: [],
    estimatedAnnualROI: survey.estimatedROI ?? "Contact Clinovyr for estimate",
    recommendedPackage:
      (survey.recommendedPkg as AIReadinessScore["recommendedPackage"]) ??
      "AI Readiness Assessment ($5,000)",
  };
}

export function buildAssessmentReportHtml(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): string {
  const opportunities = enrichTopOpportunities(
    survey.topOpportunities,
    company.industry,
    survey.estimatedROI,
  );
  const score = survey.score ?? "—";
  const tier = survey.tier ?? "—";
  const summary =
    survey.executiveSummary ??
    "Your personalized assessment summary will be refined by your Clinovyr consultant.";
  const topDrain = formData?.timeDrainsRanked?.[0] ?? "operational workflows";

  const oppHtml = opportunities
    .map(
      (opp, i) => `
      <section style="margin-bottom:24px;padding:20px;border:1px solid #d8d3ca;border-radius:4px;">
        <h3 style="margin:0 0 8px;font-family:Georgia,serif;font-size:20px;color:#0d0f12;">${i + 1}. ${escapeHtml(opp.name)}</h3>
        <p style="margin:0 0 12px;font-family:system-ui,sans-serif;font-size:14px;color:#0d0f12;line-height:1.6;">${escapeHtml(opp.description)}</p>
        <p style="margin:0;font-family:monospace;font-size:11px;color:#7a7468;">Timeline: ${escapeHtml(opp.timeToImplement)} · ROI: ${escapeHtml(opp.roiRange)}</p>
      </section>`,
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(company.name)} — AI Readiness Assessment</title>
  <style>
    @media print { body { margin: 0; } }
    body { margin: 0; padding: 40px; background: #f5f2ed; color: #0d0f12; }
  </style>
</head>
<body>
  <header style="border-bottom:2px solid #1a6b5a;padding-bottom:24px;margin-bottom:32px;">
    <p style="margin:0;font-family:monospace;font-size:11px;letter-spacing:0.12em;text-transform:uppercase;color:#1a6b5a;">Clinovyr · Intelligence, Applied.</p>
    <h1 style="margin:12px 0 0;font-family:Georgia,serif;font-size:36px;font-weight:300;">AI Readiness Assessment</h1>
    <p style="margin:8px 0 0;font-family:system-ui,sans-serif;font-size:16px;color:#7a7468;">${escapeHtml(company.name)} · ${escapeHtml(company.industry)}</p>
  </header>
  <section style="margin-bottom:32px;">
    <p style="margin:0 0 8px;font-family:monospace;font-size:11px;text-transform:uppercase;color:#7a7468;">Readiness score</p>
    <p style="margin:0;font-family:Georgia,serif;font-size:48px;color:#1a6b5a;">${score}<span style="font-size:24px;color:#7a7468;">/100</span></p>
    <p style="margin:8px 0 0;font-family:system-ui,sans-serif;font-size:15px;">Tier: <strong>${escapeHtml(String(tier))}</strong>${survey.estimatedROI ? ` · Est. annual ROI: ${escapeHtml(survey.estimatedROI)}` : ""}</p>
  </section>
  <section style="margin-bottom:32px;">
    <h2 style="font-family:Georgia,serif;font-size:24px;font-weight:400;margin:0 0 16px;">Executive summary</h2>
    <p style="margin:0;font-family:system-ui,sans-serif;font-size:15px;line-height:1.7;white-space:pre-wrap;">${escapeHtml(summary)}</p>
  </section>
  ${survey.biggestOpportunity ? `<section style="margin-bottom:32px;"><h2 style="font-family:Georgia,serif;font-size:20px;margin:0 0 8px;">Biggest opportunity</h2><p style="margin:0;font-size:15px;line-height:1.6;">${escapeHtml(survey.biggestOpportunity)}</p></section>` : ""}
  <section style="margin-bottom:32px;">
    <h2 style="font-family:Georgia,serif;font-size:24px;font-weight:400;margin:0 0 16px;">Prioritized opportunities</h2>
    <p style="margin:0 0 20px;font-size:14px;color:#7a7468;">Focused on ${escapeHtml(topDrain)} and your current stack.</p>
    ${oppHtml}
  </section>
  ${survey.nextStep ? `<section><h2 style="font-family:Georgia,serif;font-size:20px;margin:0 0 8px;">Recommended next step</h2><p style="margin:0;font-size:15px;line-height:1.6;">${escapeHtml(survey.nextStep)}</p></section>` : ""}
  <footer style="margin-top:48px;padding-top:24px;border-top:1px solid #d8d3ca;font-size:12px;color:#7a7468;">
    <p>Clinovyr · Granite Bay, California · clinovyr@gmail.com · clinovyr.com</p>
    <p>Print this page to PDF (File → Print → Save as PDF) for an offline copy.</p>
  </footer>
</body>
</html>`;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function buildOpportunityRoadmapJson(
  company: Company,
  survey: Survey,
): object {
  const opportunities = enrichTopOpportunities(
    survey.topOpportunities,
    company.industry,
    survey.estimatedROI,
  );
  return {
    company: company.name,
    industry: company.industry,
    generatedAt: new Date().toISOString(),
    score: survey.score,
    tier: survey.tier,
    phases: [
      {
        phase: "Quick wins (0–30 days)",
        items: opportunities.slice(0, 1).map((o) => ({
          title: o.name,
          description: o.description,
          timeline: o.timeToImplement,
        })),
      },
      {
        phase: "Core automation (30–90 days)",
        items: opportunities.slice(1, 3).map((o) => ({
          title: o.name,
          description: o.description,
          timeline: o.timeToImplement,
        })),
      },
      {
        phase: "Scale & optimize (90+ days)",
        items: [
          {
            title: "AI Operations Retainer",
            description:
              "Ongoing optimization, new workflow deployment, and team coaching.",
            timeline: "Ongoing",
          },
        ],
      },
    ],
    recommendedPackage: survey.recommendedPkg,
  };
}

export function buildToolStackGuideJson(
  company: Company,
  formData: AssessmentFormData | null,
): object {
  const stack = formData
    ? {
        crm: formData.crm,
        email: formData.emailTools,
        scheduling: formData.scheduling,
        projectManagement: formData.pm,
        accounting: formData.accounting,
        aiTools: formData.aiTools,
        comfortLevel: formData.comfortLevel,
      }
    : { note: "Complete assessment responses inform detailed stack mapping." };

  return {
    company: company.name,
    industry: company.industry,
    generatedAt: new Date().toISOString(),
    currentStack: stack,
    recommendations: [
      {
        category: "Automation layer",
        tools: ["Zapier or Make", "Native CRM automations"],
        rationale: "Connect existing tools before adding new platforms.",
      },
      {
        category: "AI assistants",
        tools: ["Claude / ChatGPT with company playbooks", "Industry-specific agents"],
        rationale: "Ground AI in your FAQs, SOPs, and client workflows.",
      },
      {
        category: "Documentation",
        tools: ["Notion or Google Drive knowledge base"],
        rationale: "Single source of truth improves AI accuracy and staff adoption.",
      },
    ],
  };
}

export function buildImplementationChecklistMd(
  company: Company,
  survey: Survey,
): string {
  const pkg = survey.recommendedPkg ?? "your Clinovyr engagement";
  return `# Implementation Checklist — ${company.name}

Generated ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}

## Week 1 — Discovery & alignment
- [ ] Confirm top 3 time drains with department leads
- [ ] Map current tools (${company.industry} workflow audit)
- [ ] Assign internal AI champion
- [ ] Schedule Clinovyr kickoff for **${pkg}**

## Weeks 2–3 — Design & pilot
- [ ] Document baseline hours spent on priority workflow
- [ ] Select pilot automation (highest ROI / lowest risk)
- [ ] Draft staff communication and training outline
- [ ] Configure test environment (sandbox CRM / email)

## Weeks 4–6 — Deploy & measure
- [ ] Launch pilot with 2–3 users
- [ ] Track hours saved and error rate weekly
- [ ] Gather staff feedback; iterate prompts and rules
- [ ] Plan rollout to full team

## Ongoing
- [ ] Monthly ROI review with Clinovyr
- [ ] Refresh playbooks as processes change

---
*Clinovyr · clinovyr@gmail.com · clinovyr.com*
`;
}

export function buildGenericJsonArtifact(
  key: string,
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): object {
  const meta = DELIVERABLE_KEY_META[key];
  return {
    deliverable: meta?.displayName ?? key,
    company: company.name,
    industry: company.industry,
    productContext: survey.recommendedPkg,
    score: survey.score,
    tier: survey.tier,
    executiveSummary: survey.executiveSummary,
    biggestOpportunity: survey.biggestOpportunity,
    topOpportunities: survey.topOpportunities,
    goals: formData?.goals ?? [],
    generatedAt: new Date().toISOString(),
    note: "Structured artifact — your Clinovyr consultant may enrich this deliverable.",
  };
}

export function buildArtifactContent(
  key: string,
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): { content: string; meta: DeliverableKeyMeta } | null {
  const meta = DELIVERABLE_KEY_META[key] ?? {
    displayName: key.replace(/-/g, " "),
    filename: `${key}.json`,
    fileType: "json" as const,
    deliverableType: "json" as const,
  };

  switch (key) {
    case "assessment-report-pdf":
      if (survey.status !== "complete") return null;
      return {
        content: buildAssessmentReportHtml(company, survey, formData),
        meta: DELIVERABLE_KEY_META[key],
      };
    case "opportunity-roadmap":
      return {
        content: JSON.stringify(
          buildOpportunityRoadmapJson(company, survey),
          null,
          2,
        ),
        meta,
      };
    case "tool-stack-guide":
      return {
        content: JSON.stringify(
          buildToolStackGuideJson(company, formData),
          null,
          2,
        ),
        meta,
      };
    case "implementation-checklist":
      return {
        content: buildImplementationChecklistMd(company, survey),
        meta,
      };
    case "crm-setup-guide":
    case "staff-training-guide":
      return {
        content: buildStaffOrCrmMarkdown(key, company, survey, formData),
        meta,
      };
    case "automation-blueprints":
      return {
        content: JSON.stringify(
          buildAutomationBlueprintsJson(company, survey, formData),
          null,
          2,
        ),
        meta,
      };
    case "roi-calculator":
      return {
        content: buildRoiCalculatorHtml(company, survey, formData),
        meta: { ...meta, filename: "roi-calculator.html", deliverableType: "html" },
      };
    case "executive-presentation":
      return {
        content: buildExecutivePresentationMd(company, survey, formData),
        meta: { ...meta, filename: "executive-presentation.md", fileType: "markdown", deliverableType: "markdown" },
      };
    case "opportunity-brief":
      return {
        content: buildOpportunityBriefMd(company, survey, formData),
        meta: { ...meta, filename: "opportunity-brief.md", fileType: "markdown", deliverableType: "markdown" },
      };
    case "tool-recommendations":
      return {
        content: buildToolRecommendationsMd(company, survey, formData),
        meta: { ...meta, filename: "tool-recommendations.md", fileType: "markdown", deliverableType: "markdown" },
      };
    default:
      return {
        content: JSON.stringify(
          buildGenericJsonArtifact(key, company, survey, formData),
          null,
          2,
        ),
        meta,
      };
  }
}

export function buildAutomationBlueprintsJson(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): object {
  const opportunities = enrichTopOpportunities(
    survey.topOpportunities,
    company.industry,
    survey.estimatedROI,
  );
  const topDrain = formData?.timeDrainsRanked?.[0] ?? "operational workflows";
  const crm = formData?.crm?.join(", ") ?? "CRM";

  return {
    company: company.name,
    industry: company.industry,
    size: company.size,
    generatedAt: new Date().toISOString(),
    score: survey.score,
    tier: survey.tier,
    blueprints: opportunities.slice(0, 3).map((opp, index) => ({
      id: `blueprint-${index + 1}`,
      name: opp.name,
      trigger: `New ${topDrain.toLowerCase()} event in ${crm}`,
      steps: [
        "Capture input (form, email, CRM status change)",
        "AI classification and routing rules",
        "Draft response or task assignment",
        "Human approval gate for high-risk actions",
        "Log outcome to CRM and weekly ROI tracker",
      ],
      estimatedTimeline: opp.timeToImplement,
      estimatedROI: opp.roiRange,
      owner: index === 0 ? "Operations lead" : "Department champion",
    })),
    integrationNotes: {
      currentStack: {
        crm: formData?.crm ?? [],
        email: formData?.emailTools ?? [],
        scheduling: formData?.scheduling ?? [],
      },
      recommendation:
        "Connect existing tools via Zapier/Make before adding new platforms.",
    },
  };
}

export function buildRoiCalculatorHtml(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): string {
  const topDrain = formData?.timeDrainsRanked?.[0] ?? "Priority workflow";
  const hoursPerWeek = 8;
  const hourlyRate = 45;
  const automationSavingsPct = survey.score && survey.score >= 60 ? 35 : 25;
  const weeklySavings = Math.round(hoursPerWeek * (automationSavingsPct / 100));
  const annualSavings = weeklySavings * hourlyRate * 52;

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <title>${escapeHtml(company.name)} — ROI Calculator</title>
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 32px; background: #f5f2ed; color: #0d0f12; }
    table { width: 100%; border-collapse: collapse; background: #fff; margin: 16px 0; }
    th, td { border: 1px solid #d8d3ca; padding: 12px; text-align: left; }
    th { background: #ede9e2; font-family: monospace; font-size: 11px; text-transform: uppercase; color: #7a7468; }
    h1 { font-family: Georgia, serif; font-weight: 400; }
    .highlight { color: #1a6b5a; font-size: 28px; font-weight: 600; }
  </style>
</head>
<body>
  <h1>ROI Calculator — ${escapeHtml(company.name)}</h1>
  <p>Based on your assessment: <strong>${escapeHtml(topDrain)}</strong> · Tier <strong>${escapeHtml(String(survey.tier ?? "TBD"))}</strong></p>
  <table>
    <tr><th>Input</th><th>Value</th><th>Notes</th></tr>
    <tr><td>Hours/week on priority drains</td><td>${hoursPerWeek}</td><td>From assessment responses</td></tr>
    <tr><td>Blended hourly cost</td><td>$${hourlyRate}/hr</td><td>Adjust for your team mix</td></tr>
    <tr><td>Estimated automation capture</td><td>${automationSavingsPct}%</td><td>Conservative for tier ${escapeHtml(String(survey.tier ?? "—"))}</td></tr>
    <tr><td>Hours saved/week</td><td>${weeklySavings}</td><td>${hoursPerWeek} × ${automationSavingsPct}%</td></tr>
    <tr><td>Annual labor savings</td><td class="highlight">$${annualSavings.toLocaleString()}</td><td>${weeklySavings} hrs × $${hourlyRate} × 52 weeks</td></tr>
  </table>
  <p>Clinovyr estimate from assessment: <strong>${escapeHtml(survey.estimatedROI ?? "Contact Clinovyr for a custom model")}</strong></p>
  <p style="font-size: 13px; color: #7a7468;">Use this worksheet in leadership reviews. Update inputs as pilot data arrives.</p>
</body>
</html>`;
}

export function buildExecutivePresentationMd(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): string {
  const opportunities = enrichTopOpportunities(
    survey.topOpportunities,
    company.industry,
    survey.estimatedROI,
  );
  const summary =
    survey.executiveSummary ??
    "AI readiness findings and recommended next steps for leadership alignment.";

  const slides = [
    `# Executive Presentation — ${company.name}`,
    "",
    "## Slide 1 — Title",
    `- ${company.name} · ${company.industry}`,
    `- AI Readiness Score: **${survey.score ?? "TBD"}/100** (${survey.tier ?? "pending tier"})`,
    "",
    "## Slide 2 — Why now",
    `- Team size: ${company.size} · Revenue band: ${company.revenue}`,
    `- Top time drain: ${formData?.timeDrainsRanked?.[0] ?? "operational workflows"}`,
    `- Primary concern: ${formData?.biggestConcern ?? "implementation clarity"}`,
    "",
    "## Slide 3 — Executive summary",
    summary,
    "",
    "## Slide 4 — Top opportunities",
    ...opportunities.slice(0, 3).flatMap((opp, i) => [
      `${i + 1}. **${opp.name}** — ${opp.description}`,
      `   - Timeline: ${opp.timeToImplement} · ROI: ${opp.roiRange}`,
    ]),
    "",
    "## Slide 5 — Recommended package",
    `- ${survey.recommendedPkg ?? "AI Readiness Assessment"}`,
    `- Estimated annual ROI: ${survey.estimatedROI ?? "TBD"}`,
    "",
    "## Slide 6 — Next step",
    survey.nextStep ??
      "Schedule a Clinovyr working session to confirm pilot scope and owners.",
    "",
    "---",
    "*Clinovyr · Intelligence, Applied.*",
  ];

  return slides.join("\n");
}

export function buildOpportunityBriefMd(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): string {
  const opportunities = enrichTopOpportunities(
    survey.topOpportunities,
    company.industry,
    survey.estimatedROI,
  );
  const primary = opportunities[0];
  const topDrain = formData?.timeDrainsRanked?.[0] ?? "daily operations";

  return `# Opportunity Brief — ${company.name}

**Industry:** ${company.industry} · **Team size:** ${company.size}  
**Readiness score:** ${survey.score ?? "—"}/100 (${survey.tier ?? "TBD"})

## Primary opportunity

**${primary?.name ?? survey.biggestOpportunity ?? "Workflow automation"}**

${primary?.description ?? survey.executiveSummary ?? "High-impact automation aligned to your assessment."}

- **Timeline:** ${primary?.timeToImplement ?? "4–8 weeks"}
- **ROI range:** ${primary?.roiRange ?? survey.estimatedROI ?? "Contact Clinovyr"}
- **Focus area:** ${topDrain}

## Why this first

Your assessment indicates ${survey.readinessStatement ?? "strong potential to capture quick wins without disrupting core operations"}. Starting here minimizes risk while proving ROI for broader rollout.

## Success criteria

1. Measurable hours saved on ${topDrain.toLowerCase()} within 30 days
2. Documented SOP and staff training completion
3. Leadership review with updated ROI worksheet

## Recommended engagement

${survey.recommendedPkg ?? "AI Opportunity Audit ($1,500)"}

---
*Prepared by Clinovyr · clinovyr@gmail.com · clinovyr.com*
`;
}

export function buildToolRecommendationsMd(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): string {
  const stack = formData
    ? {
        crm: formData.crm.join(", ") || "None listed",
        email: formData.emailTools.join(", ") || "Email only",
        scheduling: formData.scheduling.join(", ") || "Manual",
        pm: formData.pm.join(", ") || "Spreadsheets",
        accounting: formData.accounting.join(", ") || "Not specified",
        aiTools: formData.aiTools,
      }
    : null;

  return `# Tool Recommendations — ${company.name}

Generated ${new Date().toLocaleDateString("en-US", { dateStyle: "long" })}  
**Industry:** ${company.industry} · **Tier:** ${survey.tier ?? "TBD"}

## Current stack snapshot

${
  stack
    ? `- **CRM:** ${stack.crm}
- **Email/marketing:** ${stack.email}
- **Scheduling:** ${stack.scheduling}
- **Project management:** ${stack.pm}
- **Accounting:** ${stack.accounting}
- **AI tool usage:** ${stack.aiTools}`
    : "Complete your assessment for a detailed stack map."
}

## Recommended additions (prioritized)

### 1. Automation connector
**Zapier or Make** — Bridge ${stack?.crm ?? "your CRM"} with email and scheduling before buying new software.

### 2. AI assistant layer
**Claude or ChatGPT with company playbooks** — Ground responses in your FAQs, intake forms, and SOPs for ${company.industry.toLowerCase()} workflows.

### 3. Knowledge base
**Notion or Google Drive (structured)** — Single source of truth improves AI accuracy and onboarding.

### 4. Quality monitoring
**Simple automation log (Airtable/Sheets)** — Track triggers, failures, and hours saved weekly.

## What to defer

- Full platform replacements until pilot ROI is proven
- Custom AI model training before workflow documentation exists
- Tools that duplicate features already in ${stack?.crm ?? "your CRM"}

## Next step

${survey.nextStep ?? "Book a Clinovyr stack review to validate integrations and security requirements."}

---
*Clinovyr · Granite Bay, California*
`;
}

export function buildStaffOrCrmMarkdown(
  key: string,
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): string {
  const title =
    key === "crm-setup-guide"
      ? "CRM Setup Guide"
      : "Staff Training Guide";
  const crm = formData?.crm?.join(", ") ?? "your CRM";
  return `# ${title} — ${company.name}

## Overview
Prepared for **${company.industry}** · Readiness tier: **${survey.tier ?? "TBD"}**

## ${key === "crm-setup-guide" ? "CRM configuration" : "Training plan"}

### Phase 1 — Foundations
1. Audit current fields, pipelines, and automations in ${crm}
2. Define naming conventions for contacts, deals, and tasks
3. Document 3–5 SOPs your team uses daily

### Phase 2 — AI-ready workflows
1. Add standardized note templates for AI-assisted summaries
2. Create trigger-based follow-up sequences for top time drains
3. Enable logging for automation QA (weekly review)

### Phase 3 — Team adoption
1. 30-minute live workshop: safe AI use and escalation rules
2. Role-based cheat sheets (front desk vs. ops vs. leadership)
3. Office hours with Clinovyr in weeks 2–4 post-launch

## Success metrics
- Hours saved per week on ${formData?.timeDrainsRanked?.[0] ?? "priority workflows"}
- Response time to new leads/inquiries
- Staff confidence score (1–5 survey at day 30)

---
*Clinovyr · clinovyr@gmail.com*
`;
}
