import React from "react";
import type { Company, Survey } from "@prisma/client";
import { callClaudeJson } from "@/lib/deliverables/generators/claude-helper";
import {
  BRAND,
  BrandedPage,
  Document,
  PdfFooter,
  Text,
  View,
  pdfStyles,
  renderPdfDocument,
} from "@/lib/deliverables/generators/pdf-brand";
import {
  REAL_ESTATE_CRM_SYSTEM,
  buildRealEstateContextBlock,
  getBrokerageTypeLabel,
  recommendCrmPlatform,
  type CrmPlatform,
} from "@/lib/deliverables/generators/industries/real-estate-shared";
import type { AssessmentFormData } from "@/types/assessment";

export type CrmSetupDay = {
  day: number;
  title: string;
  tasks: string[];
  ghlScreenshots?: string[];
};

export type CrmGuideContent = {
  platformRationale: string;
  alternativePlatforms: string;
  days: CrmSetupDay[];
  ghlQuickStart: string[];
};

const GHL_SCREENSHOT_BLOCKS = [
  "Settings → Business Profile: Upload brokerage logo, set timezone to America/Los_Angeles, add DRE license in business description.",
  "Settings → Phone Numbers: Click 'Add Number' → choose local Roseville/916 area code → enable call recording disclosure.",
  "Settings → Integrations → Lead Connector: Connect Zillow/Realtor.com lead sources via webhook URL shown on this page.",
  "Opportunities → Pipelines: Create stages: New Lead → Contacted → Appointment Set → Active Buyer/Seller → Under Contract → Closed.",
  "Automation → Workflows → '+ Create Workflow' → trigger 'Customer Replied' → add SMS: 'Thanks for reaching out to [Company]…'",
  "Marketing → Email Templates: Import sphere nurture template; set merge fields for {{contact.first_name}} and {{custom.property_interest}}.",
  "Calendars → Team Calendars: Enable round-robin showing assignments; connect Google Calendar for each agent.",
];

function buildCrmGuideFallback(
  company: Company,
  formData: AssessmentFormData | null,
  platform: CrmPlatform,
): CrmGuideContent {
  const brokerage = getBrokerageTypeLabel(company, formData);

  const platformNotes: Record<CrmPlatform, string> = {
    HubSpot:
      "HubSpot Sales Hub Starter gives small teams a clean pipeline, email tracking, and forms — ideal for solo agents and boutique teams building CRM discipline for the first time.",
    "Follow Up Boss":
      "Follow Up Boss is the industry standard for lead aggregation from Zillow, Realtor.com, and Ylopo with agent accountability dashboards — best for established teams with 6–50 agents.",
    GoHighLevel:
      "GoHighLevel combines CRM, SMS, funnels, and automations in one platform — recommended for large Placer and Sacramento County teams needing white-label client portals and advanced nurture.",
  };

  return {
    platformRationale: `For ${company.name} (${brokerage}, ${company.size}), Clinovyr recommends **${platform}** as your primary CRM. ${platformNotes[platform]} Your assessment flagged ${formData?.timeDrainsRanked?.[0] ?? "lead follow-up"} as the top drain — this setup prioritizes speed-to-lead and automated nurture.`,
    alternativePlatforms:
      platform === "HubSpot"
        ? "Graduate to Follow Up Boss when portal lead volume exceeds 100/month. Add GoHighLevel if you need built-in SMS marketing at scale."
        : platform === "Follow Up Boss"
          ? "Pair with Make.com + Claude for AI lead scoring. Consider GoHighLevel only if you need landing pages and funnels without third-party tools."
          : "HubSpot can remain for marketing email if migrating gradually. Follow Up Boss may still be preferred for pure lead routing if GHL feels heavy.",
    days: [
      {
        day: 1,
        title: "Account foundation & lead sources",
        tasks: [
          "Create admin account; invite team leads and top-producing agents first",
          "Connect email (Google Workspace or Outlook) for send/receive tracking",
          "Map all lead sources: Zillow, Realtor.com, website form, open house sign-in",
          "Import existing contacts from spreadsheet (dedupe by phone/email)",
          "Define contact tags: buyer, seller, investor, sphere, past-client",
        ],
        ghlScreenshots:
          platform === "GoHighLevel"
            ? [GHL_SCREENSHOT_BLOCKS[0], GHL_SCREENSHOT_BLOCKS[2]]
            : undefined,
      },
      {
        day: 2,
        title: "Pipeline stages & assignment rules",
        tasks: [
          "Build pipeline matching your transaction process (buyer + seller tracks)",
          "Set lead assignment: round-robin or performance-weighted by ZIP code",
          "Configure SLA alerts: notify team lead if no contact within 15 minutes",
          "Create saved views: 'Hot leads today', 'Stale 7+ days', 'Under contract'",
          platform === "HubSpot"
            ? "HubSpot: Settings → Objects → Deals → customize deal stages"
            : platform === "Follow Up Boss"
              ? "FUB: Settings → Lead Distribution → enable pond + claiming rules"
              : "GHL: configure Opportunities pipeline (see screenshot steps)",
        ],
        ghlScreenshots:
          platform === "GoHighLevel" ? [GHL_SCREENSHOT_BLOCKS[3]] : undefined,
      },
      {
        day: 3,
        title: "Instant lead response automation",
        tasks: [
          "Deploy 60-second SMS auto-reply on new portal leads (TCPA-compliant copy)",
          "Add email auto-reply with calendar link for consultation booking",
          "Connect Make.com webhook for Claude lead scoring (optional Day 1 quick win)",
          "Test with sample Zillow payload — verify CRM contact created + SMS sent",
          "Document on-call agent rotation for hot-lead alerts after 9pm",
        ],
        ghlScreenshots:
          platform === "GoHighLevel"
            ? [GHL_SCREENSHOT_BLOCKS[1], GHL_SCREENSHOT_BLOCKS[4]]
            : undefined,
      },
      {
        day: 4,
        title: "Nurture sequences & templates",
        tasks: [
          "Build 3 core sequences: new buyer nurture (14 days), seller nurture, past-client anniversary",
          "Import Clinovyr prompt library snippets as email/SMS templates",
          "Set behavior triggers: viewed 3+ listings → send market update",
          "Create task templates: 'Call within 5 min', 'Send CMA', 'Schedule showing'",
          "Review all templates for Fair Housing and DRE compliance",
        ],
        ghlScreenshots:
          platform === "GoHighLevel" ? [GHL_SCREENSHOT_BLOCKS[5]] : undefined,
      },
      {
        day: 5,
        title: "Agent adoption & training",
        tasks: [
          "45-minute team training: mobile app, logging calls, claiming leads",
          "Assign each agent a 'CRM buddy' for first-week questions",
          "Require daily dashboard check: unworked leads, tasks due today",
          "Share printed prompt library desk reference at training",
          "Set team KPI baseline: response time, contact rate, appointments set",
        ],
      },
      {
        day: 6,
        title: "Integrations & reporting",
        tasks: [
          "Connect Dotloop/SkySlope or transaction tracker for closed-deal webhook",
          "Link Google Sheets for lead log backup (Make.com blueprint)",
          "Build weekly report: leads by source, conversion by agent, GCI pipeline",
          "Set up Slack or SMS digest for team lead every Monday 8am",
          platform === "GoHighLevel"
            ? "GHL: Reporting → Dashboards → add 'Speed to Lead' widget"
            : "Configure native reporting or export to Google Data Studio",
        ],
        ghlScreenshots:
          platform === "GoHighLevel" ? [GHL_SCREENSHOT_BLOCKS[6]] : undefined,
      },
      {
        day: 7,
        title: "Go-live checklist & optimization",
        tasks: [
          "Run end-to-end test: form submit → auto-reply → agent task → pipeline move",
          "Verify DRE license appears in email footers and SMS signatures",
          "Disable old spreadsheet lead tracking (single source of truth = CRM)",
          "Schedule 30-day review with Clinovyr: tune sequences, fix drop-offs",
          "Celebrate first AI-assisted listing description or qualified lead as a team win",
        ],
      },
    ],
    ghlQuickStart:
      platform === "GoHighLevel"
        ? GHL_SCREENSHOT_BLOCKS
        : [
            "GoHighLevel optional: use these steps if migrating to GHL in Phase 2",
            ...GHL_SCREENSHOT_BLOCKS.slice(0, 3),
          ],
  };
}

function DayBlock({ day }: { day: CrmSetupDay }) {
  return (
    <View wrap={false} style={{ marginBottom: 14 }}>
      <Text style={pdfStyles.subsectionTitle}>
        Day {day.day}: {day.title}
      </Text>
      {day.tasks.map((task) => (
        <View key={task.slice(0, 40)} style={pdfStyles.checkboxRow}>
          <View style={pdfStyles.checkbox} />
          <Text style={pdfStyles.body}>{task}</Text>
        </View>
      ))}
      {day.ghlScreenshots?.map((shot) => (
        <View
          key={shot.slice(0, 30)}
          style={[pdfStyles.card, { backgroundColor: BRAND.cream, marginTop: 6 }]}
        >
          <Text style={[pdfStyles.muted, { fontFamily: "Helvetica-Bold" }]}>
            GoHighLevel — click path:
          </Text>
          <Text style={[pdfStyles.body, { fontSize: 9 }]}>{shot}</Text>
        </View>
      ))}
    </View>
  );
}

function CrmGuideDocument({
  company,
  content,
  platform,
  dateStr,
}: {
  company: Company;
  content: CrmGuideContent;
  platform: CrmPlatform;
  dateStr: string;
}) {
  const firstDays = content.days.slice(0, 4);
  const lastDays = content.days.slice(4);

  return (
    <Document title={`${company.name} — CRM Setup Guide`}>
      <BrandedPage dark footerLabel="">
        <Text style={pdfStyles.coverKicker}>Clinovyr Implementation Guide</Text>
        <Text style={pdfStyles.coverTitle}>CRM Setup Guide</Text>
        <Text style={pdfStyles.coverSubtitle}>{company.name}</Text>
        <Text style={pdfStyles.coverSubtitle}>Recommended: {platform}</Text>
        <Text style={pdfStyles.coverMeta}>{dateStr} · Days 1–7</Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Platform Selection</Text>
        <Text style={pdfStyles.body}>{content.platformRationale.replace(/\*\*/g, "")}</Text>
        <Text style={pdfStyles.subsectionTitle}>Alternatives considered</Text>
        <Text style={pdfStyles.body}>{content.alternativePlatforms}</Text>
        <View style={pdfStyles.tableHeader}>
          <Text style={pdfStyles.tableCellHeader}>Team size</Text>
          <Text style={pdfStyles.tableCellHeader}>Recommended CRM</Text>
        </View>
        <View style={pdfStyles.tableRow}>
          <Text style={pdfStyles.tableCell}>1–20 agents</Text>
          <Text style={pdfStyles.tableCell}>HubSpot</Text>
        </View>
        <View style={pdfStyles.tableRow}>
          <Text style={pdfStyles.tableCell}>6–50 agents (established)</Text>
          <Text style={pdfStyles.tableCell}>Follow Up Boss</Text>
        </View>
        <View style={pdfStyles.tableRow}>
          <Text style={pdfStyles.tableCell}>21+ agents / multi-office</Text>
          <Text style={pdfStyles.tableCell}>GoHighLevel</Text>
        </View>
        <PdfFooter />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Days 1–4</Text>
        {firstDays.map((d) => (
          <DayBlock key={d.day} day={d} />
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Days 5–7</Text>
        {lastDays.map((d) => (
          <DayBlock key={d.day} day={d} />
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>GoHighLevel Reference (Screenshot Descriptions)</Text>
        <Text style={[pdfStyles.muted, { marginBottom: 10 }]}>
          Use these click-path descriptions when configuring GoHighLevel — substitute your
          brokerage name and DRE license number.
        </Text>
        {content.ghlQuickStart.map((step, i) => (
          <View key={step.slice(0, 30)} style={pdfStyles.card}>
            <Text style={[pdfStyles.cardTitle, { fontSize: 10 }]}>
              Step {i + 1}
            </Text>
            <Text style={[pdfStyles.body, { fontSize: 9 }]}>{step}</Text>
          </View>
        ))}
        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Clinovyr configures CRM + AI automations for Roseville and Granite Bay real estate
            teams. Need hands-on setup? clinovyr@gmail.com · clinovyr.com
          </Text>
        </View>
        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export async function renderRealEstateCrmGuidePdf(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Promise<Buffer> {
  const platform = recommendCrmPlatform(company, formData);
  const fallback = buildCrmGuideFallback(company, formData, platform);
  const context = buildRealEstateContextBlock(company, survey, formData);

  const { data: content } = await callClaudeJson<CrmGuideContent>({
    system: REAL_ESTATE_CRM_SYSTEM,
    prompt: `${context}

Recommended platform: ${platform}
Output ONLY valid JSON:
{
  "platformRationale": "why this CRM for this team",
  "alternativePlatforms": "when to consider others",
  "days": [{"day":1,"title":"...","tasks":["..."],"ghlScreenshots":["click path descriptions for GHL steps"]}, ...7 days],
  "ghlQuickStart": ["7 GHL screenshot description strings"]
}`,
    maxTokens: 4000,
    fallback,
    validate: (v) => Array.isArray(v.days) && v.days.length >= 5,
  });

  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return renderPdfDocument(
    <CrmGuideDocument
      company={company}
      content={content}
      platform={platform}
      dateStr={dateStr}
    />,
  );
}
