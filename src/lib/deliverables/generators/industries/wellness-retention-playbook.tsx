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
  WELLNESS_RETENTION_INSIGHT,
  WELLNESS_RETENTION_SYSTEM,
  buildWellnessContextBlock,
  getWellnessTypeLabel,
} from "@/lib/deliverables/generators/industries/wellness-shared";
import type { AssessmentFormData } from "@/types/assessment";

export type LifecycleStage = {
  stage: string;
  description: string;
  duration: string;
  goals: string[];
  automatedTouchpoints: Array<{ channel: string; timing: string; message: string }>;
};

export type WinBackEmail = {
  name: string;
  subject: string;
  body: string;
  sendTrigger: string;
};

export type RetentionPlaybookContent = {
  introduction: string;
  retentionPhilosophy: string;
  lifecycleStages: LifecycleStage[];
  vipProgramTemplate: {
    name: string;
    tiers: Array<{ tier: string; criteria: string; benefits: string[] }>;
    enrollmentProcess: string;
  };
  winBackEmails: WinBackEmail[];
  staffTraining: {
    overview: string;
    frontDeskGuidance: string;
    providerGuidance: string;
    escalationRules: string[];
    trainingExercises: string[];
  };
  metrics: {
    retentionRate: string;
    visitFrequency: string;
    ltv: string;
    benchmarks: string[];
    dashboardFields: string[];
  };
  implementationTimeline: string;
};

function buildPlaybookFallback(
  company: Company,
  formData: AssessmentFormData | null,
): RetentionPlaybookContent {
  const biz = formData?.industry
    ? `${company.name} (${formData.industry})`
    : company.name;
  return {
    introduction: `The Wellness Business Client Retention Playbook is ${biz}'s operational guide to turning first-time visitors into lifelong clients. In med spa and wellness economics, retention — not acquisition — drives margin. This playbook maps five lifecycle stages, automated touchpoints, a VIP program template, win-back campaigns, staff training, and the metrics that prove ROI.`,
    retentionPhilosophy:
      "Retention is a system, not a personality trait. Your best providers already create memorable experiences; this playbook ensures the between-visit experience matches that standard. Every automated touchpoint should feel personal, never robotic — and always FTC-compliant.",
    lifecycleStages: [
      {
        stage: "1. First Visit / New Client",
        description: "From booking confirmation through first treatment completion",
        duration: "Day 0–7",
        goals: ["Reduce no-shows", "Set expectations", "Book second visit before leaving"],
        automatedTouchpoints: [
          {
            channel: "SMS",
            timing: "24h before appointment",
            message: `${biz}: We're excited for your visit tomorrow! Reply C to confirm or call us to reschedule.`,
          },
          {
            channel: "Email",
            timing: "Day 0 post-visit",
            message: "Thank you for visiting — here's what to expect in the next 48 hours and your personalized aftercare tips.",
          },
          {
            channel: "SMS",
            timing: "Day 3 post-visit",
            message: "Claude-personalized rebooking prompt referencing treatment received — include booking link.",
          },
        ],
      },
      {
        stage: "2. Active Client",
        description: "Regular rebookers on maintenance schedule",
        duration: "Ongoing",
        goals: ["Maintain visit cadence", "Introduce complementary services", "Build VIP status"],
        automatedTouchpoints: [
          {
            channel: "Email",
            timing: "7 days before typical rebook window",
            message: "Time for your maintenance visit — priority booking link for existing clients.",
          },
          {
            channel: "SMS",
            timing: "Birthday month",
            message: "Birthday offer: complimentary add-on with any booked service this month.",
          },
        ],
      },
      {
        stage: "3. VIP / Loyal",
        description: "Top 20% by spend and visit frequency",
        duration: "Ongoing",
        goals: ["Protect LTV", "Generate referrals", "Early access to new services"],
        automatedTouchpoints: [
          {
            channel: "Email",
            timing: "Quarterly",
            message: "VIP early access — new treatment or seasonal package preview before public launch.",
          },
          {
            channel: "SMS",
            timing: "Referral prompt after 5th visit",
            message: "Share the glow — refer a friend and both receive [INCENTIVE]. Personal referral link.",
          },
        ],
      },
      {
        stage: "4. At-Risk",
        description: "No booking in 45–90 days",
        duration: "Day 45–90 idle",
        goals: ["Re-engage before competitor wins", "Understand lapse reason", "Offer win-back incentive"],
        automatedTouchpoints: [
          {
            channel: "SMS",
            timing: "Day 45",
            message: "We miss you! Claude-personalized win-back with WINBACK15 VIP discount code.",
          },
          {
            channel: "Email",
            timing: "Day 60",
            message: "Full win-back email #2 — what's new at the spa + limited-time offer.",
          },
        ],
      },
      {
        stage: "5. Lapsed / Win-Back",
        description: "90+ days without visit",
        duration: "Day 90+",
        goals: ["Final recovery attempt", "Survey for feedback", "Archive gracefully if unresponsive"],
        automatedTouchpoints: [
          {
            channel: "Email",
            timing: "Day 90",
            message: "We'd love to welcome you back — exclusive return offer + quick 2-question survey.",
          },
          {
            channel: "SMS",
            timing: "Day 120",
            message: "Final check-in — no pressure, just letting you know we're here when you're ready.",
          },
        ],
      },
    ],
    vipProgramTemplate: {
      name: `${biz} Glow Circle`,
      tiers: [
        {
          tier: "Silver",
          criteria: "3+ visits or $750+ annual spend",
          benefits: ["Priority booking", "10% retail discount", "Birthday add-on"],
        },
        {
          tier: "Gold",
          criteria: "6+ visits or $1,500+ annual spend",
          benefits: ["Silver benefits + complimentary upgrade quarterly", "Early access to new treatments"],
        },
        {
          tier: "Platinum",
          criteria: "12+ visits or $3,000+ annual spend",
          benefits: ["Gold benefits + dedicated provider preference", "Annual VIP event invite"],
        },
      ],
      enrollmentProcess:
        "Auto-enroll when criteria met via booking system tags. Welcome email within 24h. Front desk confirms tier at check-in. Review tier thresholds quarterly.",
    },
    winBackEmails: [
      {
        name: "45-Day Soft Touch",
        subject: "We miss you at {{COMPANY}} — here's 15% off your return visit",
        sendTrigger: "45 days since last booking",
        body: `Hi {{FIRST_NAME}},\n\nIt's been a little while since we've seen you at ${biz}, and we wanted to check in. Your last visit was for {{LAST_SERVICE}} — we'd love to help you maintain those results.\n\nAs a thank-you for being part of our community, use code WINBACK15 for 15% off your next appointment. Book here: [BOOKING_LINK]\n\nWarmly,\nThe ${biz} Team`,
      },
      {
        name: "60-Day What's New",
        subject: "Something new at {{COMPANY}} — plus a welcome-back offer",
        sendTrigger: "60 days since last booking",
        body: `Hi {{FIRST_NAME}},\n\nWe've added {{NEW_SERVICE}} since your last visit — clients are loving the results for {{BENEFIT_AREA}}.\n\nYour WINBACK15 code is still active: 15% off any service this month. [BOOKING_LINK]\n\nQuestions? Reply to this email — a real person reads every message.\n\n${biz}`,
      },
      {
        name: "90-Day Survey + Offer",
        subject: "Quick question — and a special return offer",
        sendTrigger: "90 days since last booking",
        body: `Hi {{FIRST_NAME}},\n\nWe noticed it's been about three months since your last visit. We'd genuinely appreciate 30 seconds of feedback: [SURVEY_LINK]\n\nWhether you're ready to rebook or just staying in touch, here's 20% off your return visit with code COMEBACK20 (expires in 14 days).\n\n[BOOKING_LINK]\n\nThank you,\n${biz}`,
      },
      {
        name: "120-Day Final Invitation",
        subject: "Still thinking about us? One last welcome-back gift",
        sendTrigger: "120 days since last booking",
        body: `Hi {{FIRST_NAME}},\n\nThis is our last note for now — we don't want to clutter your inbox. If you've been meaning to come back, we'd love to see you. Complimentary {{ADD_ON}} with any booked service this month.\n\n[BOOKING_LINK] | No code needed — mention this email at checkout.\n\nTake care,\n${biz}`,
      },
      {
        name: "Seasonal Reactivation",
        subject: "Your seasonal skin reset starts here",
        sendTrigger: "Quarterly campaign to lapsed segment",
        body: `Hi {{FIRST_NAME}},\n\nSeasons change — and so do your skin's needs. Our {{SEASONAL_TREATMENT}} is designed for {{SEASON}} prep: {{BRIEF_BENEFIT}}.\n\nLapsed clients receive priority scheduling this week. Book before {{DEADLINE}}: [BOOKING_LINK]\n\nSee you soon,\n${biz}`,
      },
    ],
    staffTraining: {
      overview: `Every team member at ${biz} is a retention ambassador. Automated touchpoints handle scale; humans handle trust. This section defines who does what when AI sends a message or flags an at-risk client.`,
      frontDeskGuidance:
        "Confirm rebooking at checkout before client leaves — highest conversion window. When at-risk alert fires in Slack, call (don't only text) VIP clients within 24h. Never contradict automated offers.",
      providerGuidance:
        "Document treatment notes thoroughly — Claude personalization depends on service history. Mention next recommended visit interval during treatment. Hand off to front desk for rebooking before client reaches parking lot.",
      escalationRules: [
        "Negative reply to any automated message → front desk calls within 2 business hours",
        "4-star or below review alert → spa director responds within 1 hour",
        "Client requests human-only contact → tag 'no-automation' in booking system",
        "Any clinical question in SMS reply → route to licensed provider, never AI auto-response",
      ],
      trainingExercises: [
        "Role-play: client says 'I'm not ready to rebook' — practice soft follow-up without pressure",
        "Review 3 Claude-generated SMS drafts and identify one FTC compliance fix each",
        "Walk through VIP tier benefits — every staff member quotes them accurately",
        "Shadow at-risk alert workflow: Slack ping → CRM lookup → personal outreach → log outcome",
      ],
    },
    metrics: {
      retentionRate:
        "Clients with 2+ visits within 12 months ÷ total unique clients in period. Target: 55–65% for med spas.",
      visitFrequency:
        "Total visits ÷ active clients per year. Target: 3.5–4.5 for aesthetic-heavy menus.",
      ltv:
        "Average annual spend per client × average client lifespan (years). Benchmark: $1,200–$3,500 LTV.",
      benchmarks: [
        "Rebooking rate within 90 days: 40–50% (top quartile: 55%+)",
        "No-show rate: under 8% with automated reminders",
        "At-risk recovery rate: 12–20% with win-back sequence",
        "Google review velocity: 8–15 new reviews/month",
      ],
      dashboardFields: [
        "Active clients (12-month)",
        "Rebooking rate (90-day)",
        "Average treatment value",
        "Visit frequency",
        "At-risk count (45+ days)",
        "VIP tier distribution",
        "Win-back conversion rate",
        "Automated message opt-out rate",
      ],
    },
    implementationTimeline:
      "Week 1: Baseline metrics + connect booking webhooks. Week 2: Launch post-visit SMS + review request. Week 3: VIP tier tags + staff training session. Week 4: At-risk daily scan + win-back email sequence. Week 5–8: Optimize Claude prompts, A/B test offers, monthly retention review.",
  };
}

function Paragraphs({ text }: { text: string }) {
  return (
    <>
      {text.split(/\n\n|\n/).map((para) => (
        <Text key={para.slice(0, 40)} style={pdfStyles.body}>
          {para.trim()}
        </Text>
      ))}
    </>
  );
}

function RetentionPlaybookDocument({
  company,
  content,
  bizType,
  dateStr,
}: {
  company: Company;
  content: RetentionPlaybookContent;
  bizType: string;
  dateStr: string;
}) {
  return (
    <Document title={`${company.name} — Client Retention Playbook`}>
      <BrandedPage dark footerLabel="">
        <Text style={pdfStyles.coverKicker}>Clinovyr Retention Playbook</Text>
        <Text style={pdfStyles.coverTitle}>The Wellness Business</Text>
        <Text style={pdfStyles.coverTitle}>Client Retention Playbook</Text>
        <Text style={pdfStyles.coverSubtitle}>{company.name}</Text>
        <Text style={pdfStyles.coverSubtitle}>{bizType}</Text>
        <Text style={pdfStyles.coverMeta}>Prepared {dateStr}</Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Introduction</Text>
        <Paragraphs text={content.introduction} />
        <Text style={pdfStyles.sectionTitle}>Retention Philosophy</Text>
        <Paragraphs text={content.retentionPhilosophy} />
        <Text style={[pdfStyles.muted, { marginTop: 8 }]}>{WELLNESS_RETENTION_INSIGHT}</Text>
        <PdfFooter />
      </BrandedPage>

      {content.lifecycleStages.map((stage) => (
        <BrandedPage key={stage.stage}>
          <Text style={pdfStyles.sectionTitle}>{stage.stage}</Text>
          <Text style={pdfStyles.muted}>
            {stage.duration} · {stage.description}
          </Text>
          <Text style={pdfStyles.subsectionTitle}>Goals</Text>
          {stage.goals.map((g) => (
            <View key={g} style={pdfStyles.checkboxRow}>
              <View style={[pdfStyles.checkbox, { backgroundColor: BRAND.accent }]} />
              <Text style={pdfStyles.body}>{g}</Text>
            </View>
          ))}
          <Text style={pdfStyles.subsectionTitle}>Automated touchpoints</Text>
          {stage.automatedTouchpoints.map((tp) => (
            <View key={`${tp.channel}-${tp.timing}`} style={pdfStyles.card}>
              <Text style={pdfStyles.cardTitle}>
                {tp.channel} · {tp.timing}
              </Text>
              <Text style={pdfStyles.body}>{tp.message}</Text>
            </View>
          ))}
        </BrandedPage>
      ))}

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>VIP Program Template</Text>
        <Text style={pdfStyles.cardTitle}>{content.vipProgramTemplate.name}</Text>
        {content.vipProgramTemplate.tiers.map((tier) => (
          <View key={tier.tier} style={pdfStyles.card}>
            <Text style={pdfStyles.cardTitle}>{tier.tier}</Text>
            <Text style={pdfStyles.body}>Criteria: {tier.criteria}</Text>
            <Text style={pdfStyles.muted}>Benefits: {tier.benefits.join(" · ")}</Text>
          </View>
        ))}
        <Text style={pdfStyles.subsectionTitle}>Enrollment process</Text>
        <Paragraphs text={content.vipProgramTemplate.enrollmentProcess} />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Win-Back Email Templates</Text>
        <Text style={[pdfStyles.muted, { marginBottom: 10 }]}>
          Full text — customize merge tags before sending
        </Text>
        {content.winBackEmails.map((email) => (
          <View key={email.name} wrap={false} style={[pdfStyles.card, { marginBottom: 12 }]}>
            <Text style={pdfStyles.cardTitle}>{email.name}</Text>
            <Text style={pdfStyles.muted}>
              Trigger: {email.sendTrigger} · Subject: {email.subject}
            </Text>
            <Text
              style={[
                pdfStyles.body,
                { fontSize: 9, lineHeight: 1.45, marginTop: 6, fontFamily: "Courier" },
              ]}
            >
              {email.body}
            </Text>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Staff Training</Text>
        <Paragraphs text={content.staffTraining.overview} />
        <Text style={pdfStyles.subsectionTitle}>Front desk</Text>
        <Paragraphs text={content.staffTraining.frontDeskGuidance} />
        <Text style={pdfStyles.subsectionTitle}>Providers</Text>
        <Paragraphs text={content.staffTraining.providerGuidance} />
        <Text style={pdfStyles.subsectionTitle}>Escalation rules</Text>
        {content.staffTraining.escalationRules.map((rule) => (
          <View key={rule} style={pdfStyles.checkboxRow}>
            <View style={pdfStyles.checkbox} />
            <Text style={pdfStyles.body}>{rule}</Text>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Training Exercises</Text>
        {content.staffTraining.trainingExercises.map((ex) => (
          <View key={ex} style={pdfStyles.checkboxRow}>
            <Text style={pdfStyles.body}>• {ex}</Text>
          </View>
        ))}
        <Text style={pdfStyles.sectionTitle}>Retention Metrics</Text>
        <View style={pdfStyles.card}>
          <Text style={pdfStyles.cardTitle}>Retention rate</Text>
          <Text style={pdfStyles.body}>{content.metrics.retentionRate}</Text>
        </View>
        <View style={pdfStyles.card}>
          <Text style={pdfStyles.cardTitle}>Visit frequency</Text>
          <Text style={pdfStyles.body}>{content.metrics.visitFrequency}</Text>
        </View>
        <View style={pdfStyles.card}>
          <Text style={pdfStyles.cardTitle}>Lifetime value (LTV)</Text>
          <Text style={pdfStyles.body}>{content.metrics.ltv}</Text>
        </View>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Benchmarks & Dashboard</Text>
        {content.metrics.benchmarks.map((b) => (
          <View key={b} style={pdfStyles.checkboxRow}>
            <View style={[pdfStyles.checkbox, { backgroundColor: BRAND.gold }]} />
            <Text style={pdfStyles.body}>{b}</Text>
          </View>
        ))}
        <Text style={pdfStyles.subsectionTitle}>Track weekly in dashboard</Text>
        {content.metrics.dashboardFields.map((f) => (
          <Text key={f} style={pdfStyles.body}>
            • {f}
          </Text>
        ))}
        <Text style={pdfStyles.sectionTitle}>Implementation Timeline</Text>
        <Paragraphs text={content.implementationTimeline} />
        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Clinovyr builds retention automation for wellness businesses in Placer County.
            clinovyr@gmail.com · clinovyr.com
          </Text>
        </View>
        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export async function renderWellnessRetentionPlaybookPdf(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Promise<Buffer> {
  const fallback = buildPlaybookFallback(company, formData);
  const context = buildWellnessContextBlock(company, survey, formData);

  const { data: content } = await callClaudeJson<RetentionPlaybookContent>({
    system: WELLNESS_RETENTION_SYSTEM,
    prompt: `${context}

Output ONLY valid JSON:
{
  "introduction": "2 paragraphs",
  "retentionPhilosophy": "1 paragraph",
  "lifecycleStages": [{"stage":"1. ...","description":"...","duration":"...","goals":["..."],"automatedTouchpoints":[{"channel":"SMS|Email","timing":"...","message":"..."}]}],
  "vipProgramTemplate": {"name":"...","tiers":[{"tier":"Silver|Gold|Platinum","criteria":"...","benefits":["..."]}],"enrollmentProcess":"..."},
  "winBackEmails": [{"name":"...","subject":"...","body":"full email text with merge tags","sendTrigger":"..."}],
  "staffTraining": {"overview":"...","frontDeskGuidance":"...","providerGuidance":"...","escalationRules":["4+ rules"],"trainingExercises":["4+ exercises"]},
  "metrics": {"retentionRate":"definition + target","visitFrequency":"...","ltv":"...","benchmarks":["4+"],"dashboardFields":["8 fields"]},
  "implementationTimeline": "week-by-week over 8 weeks"
}

Provide exactly 5 lifecycle stages and 5 full win-back email templates. Personalize to business services.`,
    maxTokens: 6000,
    fallback,
    validate: (v) =>
      Boolean(
        v.lifecycleStages?.length >= 5 &&
          v.winBackEmails?.length >= 5 &&
          v.staffTraining?.escalationRules?.length >= 3,
      ),
  });

  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return renderPdfDocument(
    <RetentionPlaybookDocument
      company={company}
      content={content}
      bizType={getWellnessTypeLabel(company, formData)}
      dateStr={dateStr}
    />,
  );
}
