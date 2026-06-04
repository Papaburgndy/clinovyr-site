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
  RETAIL_REVIEW_SYSTEM,
  REVIEW_RESPONSE_CLAUDE_PROMPT,
  buildRetailContextBlock,
  getRetailTypeLabel,
} from "@/lib/deliverables/generators/industries/retail-shared";
import {
  buildRetailReviewMonitoringBlueprint,
  getRetailReviewBlueprintReadme,
} from "@/lib/deliverables/generators/industries/retail-blueprints";
import type { AssessmentFormData } from "@/types/assessment";

export type ReviewResponseTemplate = {
  stars: string;
  variant: string;
  response: string;
  notes?: string;
};

export type ReviewAutomationStep = {
  step: number;
  title: string;
  tool: string;
  instructions: string;
};

export type RetailReviewKitContent = {
  introduction: string;
  automationSteps: ReviewAutomationStep[];
  klaviyoFlowNote: string;
  smsFlowNote: string;
  responseTemplates: ReviewResponseTemplate[];
  makeBlueprintSummary: string;
  claudePrompt: string;
  lowStarEscalation: string[];
  ownerDailyRoutine: string;
};

function buildDefaultReviewTemplates(company: Company): ReviewResponseTemplate[] {
  const biz = company.name;
  return [
    { stars: "5", variant: "Enthusiastic thank-you", response: `Thank you so much, [NAME]! We're thrilled you enjoyed [SPECIFIC DETAIL FROM REVIEW]. Our team works hard to make every visit to ${biz} memorable — hope to see you again soon! — [OWNER], ${biz}` },
    { stars: "5", variant: "Product-specific praise", response: `[NAME], thank you for the kind words about [PRODUCT/DISH]! We source [LOCAL ANGLE] whenever we can. See you at ${biz} again soon!` },
    { stars: "5", variant: "Team shout-out", response: `We'll share your compliment with [STAFF NAME] — thank you, [NAME]! Reviews like yours help our small Placer County business thrive. — ${biz}` },
    { stars: "4", variant: "Warm thank-you + invite feedback", response: `Thank you, [NAME]! We're glad you had a great experience at ${biz}. If there's anything we can do to earn that fifth star next time, reply here or ask for a manager on your next visit.` },
    { stars: "4", variant: "Constructive 4-star", response: `[NAME], we appreciate your honest feedback. Glad [POSITIVE] stood out — we're always improving [AREA MENTIONED]. Hope to welcome you back soon at ${biz}.` },
    { stars: "3", variant: "Acknowledge + offline resolution", response: `[NAME], thank you for sharing your experience. We're sorry we didn't fully meet expectations. We'd like to make this right — please call [PHONE] or email [EMAIL] and ask for [MANAGER]. — ${biz}` },
    { stars: "3", variant: "Service recovery", response: `We hear you, [NAME], and we take feedback seriously. Please contact [MANAGER] at [PHONE] so we can understand what happened and improve. Thank you for giving us a chance. — ${biz}` },
    { stars: "3", variant: "Follow-up after offline contact", response: `[NAME], thank you for speaking with our team. We value your business and hope the resolution met your expectations. We're here if you need anything else. — ${biz}`, notes: "Post-resolution only" },
    { stars: "1-2", variant: "Sincere apology", response: `[NAME], we sincerely apologize for your experience at ${biz}. This isn't the standard we hold ourselves to. Please contact [OWNER] directly at [PHONE] — we want to understand and make it right privately.` },
    { stars: "1-2", variant: "Never visited / mistaken identity", response: `We're sorry for the confusion, [NAME]. We can't locate a visit matching your description — please call [PHONE] so we can verify and address any concern. Thank you. — ${biz}` },
    { stars: "1-2", variant: "Serious issue escalation", response: `[NAME], we're very sorry. [OWNER NAME] would like to speak with you personally. Please email [EMAIL] or call [PHONE] today. We take this seriously and will respond within 24 hours. — ${biz}` },
    { stars: "5", variant: "Short & friendly", response: `Thanks, [NAME]! 🙏 — The ${biz} team` },
    { stars: "5", variant: "Holiday/seasonal", response: `[NAME], thank you for celebrating the season with ${biz}! Wishing you a wonderful [HOLIDAY] — see you soon.` },
    { stars: "4", variant: "First-time visitor", response: `Welcome to the ${biz} family, [NAME]! Thanks for your first visit — we hope it won't be your last.` },
    { stars: "3", variant: "Wait time complaint", response: `[NAME], we're sorry about the wait — that's not the experience we want. We've shared this with our team. Please reach out to [MANAGER] at [PHONE] so we can thank you properly for your patience.` },
    { stars: "1-2", variant: "Refund offered offline", response: `[NAME], please accept our apology. We've asked [MANAGER] to contact you regarding a resolution. We value your feedback. — ${biz}` },
    { stars: "5", variant: "Catering/large order", response: `Thank you, [NAME]! We're honored you trusted ${biz} for [EVENT]. We'd love to serve you again — [BOOKING LINK].` },
    { stars: "4", variant: "Online order", response: `Thanks for ordering from ${biz}, [NAME]! Glad [ITEM] arrived well. Tip: use code REPEAT10 on your next online order.` },
    { stars: "3", variant: "Pricing concern", response: `[NAME], we appreciate your honesty. We work hard to balance quality and value — we'd welcome a conversation at [PHONE] to hear more about your experience.` },
    { stars: "1-2", variant: "Policy explanation (neutral tone)", response: `[NAME], we're sorry you were disappointed. Our [POLICY] is in place for [REASON] — we'd still like to hear more. Please contact [EMAIL]. — ${biz}` },
  ];
}

function buildReviewFallback(
  company: Company,
  formData: AssessmentFormData | null,
): RetailReviewKitContent {
  const bizType = getRetailTypeLabel(company, formData);
  const blueprintJson = JSON.stringify(
    buildRetailReviewMonitoringBlueprint(company),
    null,
    2,
  ).slice(0, 800);

  return {
    introduction: `The ${company.name} Review Management Kit helps ${bizType.toLowerCase()} businesses automate post-purchase review requests and respond consistently across Google, Yelp, and Facebook. Faster responses and higher review velocity improve Placer County local search visibility — especially near Fountains at Roseville and Galleria traffic corridors.`,
    automationSteps: [
      {
        step: 1,
        title: "Trigger on completed purchase",
        tool: "Shopify/Square webhook or Klaviyo Placed Order",
        instructions:
          "Fire event when order status = paid/fulfilled. Capture customer email, phone, top line item, order total.",
      },
      {
        step: 2,
        title: "48-hour delay",
        tool: "Klaviyo flow delay or Make.com Sleep",
        instructions:
          "Wait 48h post-purchase — enough time to experience product/meal, not so long they forget.",
      },
      {
        step: 3,
        title: "Claude review request",
        tool: "Claude API via Make.com",
        instructions:
          "Generate personalized SMS (<160 chars) + email with Google Review deep link. No review incentives (policy compliance).",
      },
      {
        step: 4,
        title: "Send SMS + email",
        tool: "Twilio + Klaviyo",
        instructions:
          "SMS to opted-in mobile; email to all purchasers. Log sends in Google Sheets.",
      },
      {
        step: 5,
        title: "Low-star alert",
        tool: "Make.com + Slack",
        instructions:
          "New review ≤3 stars → Slack #reviews + email owner within 1 hour. Claude drafts response for approval.",
      },
    ],
    klaviyoFlowNote:
      "Klaviyo Flow: Metric Placed Order → Delay 48h → Email 'How did we do?' with review link → Conditional split: clicked but no review → SMS reminder Day 5.",
    smsFlowNote:
      "SMS only with TCPA consent captured at checkout. Include STOP. Max 2 review-request SMS per purchase.",
    responseTemplates: buildDefaultReviewTemplates(company),
    makeBlueprintSummary: `Import review-request-retail.blueprint.json into Make.com. Blueprint overview:\n${getRetailReviewBlueprintReadme(company)}\n\nEmbedded blueprint excerpt (first modules):\n${blueprintJson}...`,
    claudePrompt: REVIEW_RESPONSE_CLAUDE_PROMPT.replace("[BUSINESS NAME]", company.name).replace(
      "[RESTAURANT/RETAIL]",
      bizType,
    ),
    lowStarEscalation: [
      "≤3 stars: owner/manager notified within 1 hour",
      "Draft response via Claude — never auto-post 1–3 star replies",
      "Take conversation offline — no public arguments",
      "Log resolution in spreadsheet for pattern tracking",
    ],
    ownerDailyRoutine:
      "Morning (10 min): Check Google Business Profile notifications, approve Claude-drafted responses, flag recurring themes for staff huddle. Weekly: review count and average rating trend.",
  };
}

function ReviewKitDocument({
  company,
  content,
  dateStr,
}: {
  company: Company;
  content: RetailReviewKitContent;
  dateStr: string;
}) {
  return (
    <Document title={`${company.name} — Review Management Kit`}>
      <BrandedPage dark footerLabel="">
        <Text style={pdfStyles.coverKicker}>Clinovyr Operations Kit</Text>
        <Text style={pdfStyles.coverTitle}>Review Management Kit</Text>
        <Text style={pdfStyles.coverSubtitle}>{company.name}</Text>
        <Text style={pdfStyles.coverMeta}>{dateStr}</Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>1. Automation Setup</Text>
        <Text style={pdfStyles.body}>{content.introduction}</Text>
        {content.automationSteps.map((step) => (
          <View key={step.step} style={pdfStyles.card}>
            <Text style={pdfStyles.cardTitle}>
              {step.step}. {step.title} ({step.tool})
            </Text>
            <Text style={pdfStyles.body}>{step.instructions}</Text>
          </View>
        ))}
        <Text style={pdfStyles.subsectionTitle}>Klaviyo flow</Text>
        <Text style={pdfStyles.body}>{content.klaviyoFlowNote}</Text>
        <Text style={pdfStyles.subsectionTitle}>SMS</Text>
        <Text style={pdfStyles.body}>{content.smsFlowNote}</Text>
        <PdfFooter label="clinovyr.com · review management" />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>2. Response Library (20 Templates)</Text>
        {content.responseTemplates.slice(0, 20).map((t) => (
          <View key={`${t.stars}-${t.variant}`} wrap={false} style={[pdfStyles.card, { marginBottom: 8 }]}>
            <Text style={pdfStyles.cardTitle}>
              {t.stars}★ — {t.variant}
            </Text>
            {t.notes ? <Text style={pdfStyles.muted}>{t.notes}</Text> : null}
            <Text style={[pdfStyles.body, { fontSize: 9, lineHeight: 1.4 }]}>{t.response}</Text>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>3. Make.com Blueprint</Text>
        <Text style={[pdfStyles.body, { fontSize: 9, lineHeight: 1.35 }]}>
          {content.makeBlueprintSummary}
        </Text>
        <Text style={pdfStyles.subsectionTitle}>Low-star escalation</Text>
        {content.lowStarEscalation.map((item) => (
          <Text key={item} style={pdfStyles.body}>
            • {item}
          </Text>
        ))}
        <Text style={pdfStyles.subsectionTitle}>Owner daily routine</Text>
        <Text style={pdfStyles.body}>{content.ownerDailyRoutine}</Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>4. Claude Prompt — Review Responses</Text>
        <Text style={[pdfStyles.body, { fontSize: 9, lineHeight: 1.35 }]}>
          {content.claudePrompt}
        </Text>
        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Clinovyr imports Make.com blueprints and trains your team on review workflows during
            Sprints. clinovyr@gmail.com
          </Text>
        </View>
        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export async function renderRetailReviewManagementKitPdf(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Promise<Buffer> {
  const fallback = buildReviewFallback(company, formData);
  const context = buildRetailContextBlock(company, survey, formData);

  const { data: content } = await callClaudeJson<RetailReviewKitContent>({
    system: RETAIL_REVIEW_SYSTEM,
    prompt: `${context}

Output ONLY valid JSON:
{
  "introduction": "1 paragraph",
  "automationSteps": [{"step":1,"title":"...","tool":"...","instructions":"..."}, ...5 steps],
  "klaviyoFlowNote": "paragraph",
  "smsFlowNote": "paragraph",
  "responseTemplates": [{"stars":"5|4|3|1-2","variant":"...","response":"...","notes":"optional"}, ...exactly 20: 5-star×3, 4-star×2, 3-star×2 plus one follow-up, 1-2 star×3, plus extras to reach 20],
  "makeBlueprintSummary": "describe Make.com flow modules",
  "claudePrompt": "full copy-paste prompt with placeholders",
  "lowStarEscalation": ["4 bullets"],
  "ownerDailyRoutine": "paragraph"
}`,
    maxTokens: 7000,
    fallback,
    validate: (v) => v.responseTemplates?.length >= 15,
  });

  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return renderPdfDocument(
    <ReviewKitDocument company={company} content={content} dateStr={dateStr} />,
  );
}
