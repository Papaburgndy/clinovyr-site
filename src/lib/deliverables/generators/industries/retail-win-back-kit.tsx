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
  RETAIL_WINBACK_SYSTEM,
  buildRetailContextBlock,
  getRetailTypeLabel,
  recommendEmailPlatform,
} from "@/lib/deliverables/generators/industries/retail-shared";
import type { AssessmentFormData } from "@/types/assessment";

export type WinBackEmailTemplate = {
  day: number;
  name: string;
  subject: string;
  body: string;
  sendTrigger: string;
};

export type WinBackSmsTemplate = {
  name: string;
  timing: string;
  body: string;
};

export type KlaviyoSetupStep = {
  step: number;
  title: string;
  duration: string;
  instructions: string;
};

export type RetailWinBackKitContent = {
  introduction: string;
  segmentCriteria: string;
  emails: WinBackEmailTemplate[];
  smsTemplates: WinBackSmsTemplate[];
  klaviyoGuide: {
      overview: string;
      totalMinutes: number;
      steps: KlaviyoSetupStep[];
      testingChecklist: string[];
    };
  complianceNotes: string[];
};

function buildWinBackFallback(
  company: Company,
  formData: AssessmentFormData | null,
): RetailWinBackKitContent {
  const biz = company.name;
  const platform = recommendEmailPlatform(formData);

  return {
    introduction: `The ${biz} Customer Win-Back Campaign Kit reactivates lapsed buyers who haven't purchased in 60+ days. This kit includes five timed emails (Day 0, 3, 7, 14, 21), three SMS touchpoints, and a ${platform} setup guide you can implement in approximately 45 minutes. Personalize bracketed fields before launch.`,
    segmentCriteria:
      "Segment: Last purchase date > 60 days ago AND total orders ≥ 1 AND not unsubscribed. Exclude employees and wholesale accounts. Split VIP (LTV top 20%) for softer tone and higher offer value.",
    emails: [
      {
        day: 0,
        name: "We miss you",
        subject: `Something special for you at ${biz}`,
        sendTrigger: "Enters win-back segment",
        body: `Hi {{ first_name }},\n\nIt's been a while since we've seen you at ${biz} — and we wanted to reach out personally.\n\nYour last visit included {{ last_product_name }} — we've added new [CATEGORY] since then that customers like you love.\n\nHere's 15% off your next purchase: code WELCOME-BACK-15\n\nShop in-store or online: [LINK]\n\nWarmly,\nThe ${biz} Team`,
      },
      {
        day: 3,
        name: "What's new",
        subject: `What's new at ${biz} since your last visit`,
        sendTrigger: "Day 3 if no purchase",
        body: `Hi {{ first_name }},\n\nQuick update from ${biz}: [NEW ARRIVAL / SEASONAL ITEM] just dropped — and your WELCOME-BACK-15 code is still active through [DATE].\n\n[1-sentence product story tied to Placer County/local angle]\n\nSee it here: [LINK]\n\nReply to this email if you'd like us to hold an item.`,
      },
      {
        day: 7,
        name: "Social proof",
        subject: `Why customers are coming back to ${biz}`,
        sendTrigger: "Day 7 if no purchase",
        body: `Hi {{ first_name }},\n\nWe've had great feedback lately on [PRODUCT/SERVICE] — here's what one customer shared:\n\n"[SHORT REVIEW QUOTE]"\n\nYour 15% code WELCOME-BACK-15 expires in 7 days. We'd love to welcome you back.\n\n[LINK] · [STORE HOURS]`,
      },
      {
        day: 14,
        name: "Last chance soft",
        subject: `Your ${biz} offer expires soon`,
        sendTrigger: "Day 14 if no purchase",
        body: `Hi {{ first_name }},\n\nFriendly reminder — your WELCOME-BACK-15 code at ${biz} expires in 48 hours.\n\nIf you've been waiting for the right item, our team recommends [STAFF PICK] — available [IN-STOCK NOTE].\n\nQuestions? Call [PHONE] or reply here.\n\n[LINK]`,
      },
      {
        day: 21,
        name: "Final check-in",
        subject: `One last note from ${biz}`,
        sendTrigger: "Day 21 if no purchase — then exit flow",
        body: `Hi {{ first_name }},\n\nThis is our last note about WELCOME-BACK-15 — no pressure, we just didn't want you to miss it if you were planning a visit.\n\nAfter today, the code expires. Whenever you're ready, we're here at [ADDRESS].\n\nThank you for being part of our Placer County community.\n\n— ${biz}`,
      },
    ],
    smsTemplates: [
      {
        name: "Day 0 SMS",
        timing: "Same day as email 1 (4h later if mobile on file)",
        body: `${biz}: We miss you! 15% off your next visit with WELCOME-BACK-15. Expires in 21 days. [SHORT LINK] Reply STOP to opt out.`,
      },
      {
        name: "Day 7 SMS",
        timing: "Day 7 — social proof nudge",
        body: `{{ first_name }}, customers are loving [ITEM] at ${biz}. Your 15% code still works: WELCOME-BACK-15 → [SHORT LINK]`,
      },
      {
        name: "Day 14 SMS",
        timing: "Day 14 — expiry warning",
        body: `${biz}: Your welcome-back offer expires in 48h. Shop: [SHORT LINK] Questions? Call [PHONE]. STOP to opt out.`,
      },
    ],
    klaviyoGuide: {
      overview: `Deploy this win-back flow in ${platform} using purchase data from your POS. Total setup time: ~45 minutes for a standard Shopify/Square integration.`,
      totalMinutes: 45,
      steps: [
        {
          step: 1,
          title: "Create lapsed customer segment",
          duration: "8 min",
          instructions:
            "Lists & Segments → Create segment → Profile Properties: Last order date is at least 60 days ago AND Placed order at least once → Exclude suppressed profiles.",
        },
        {
          step: 2,
          title: "Build 5-email flow",
          duration: "15 min",
          instructions:
            "Flows → Create flow → Metric: Added to Segment [Win-Back 60d] → Add 5 emails with delays Day 0, +3, +4, +7, +7 days → Paste templates from this kit → Set smart sending off for win-back.",
        },
        {
          step: 3,
          title: "Add SMS (optional)",
          duration: "10 min",
          instructions:
            "Enable SMS in Klaviyo → Add SMS steps parallel to emails 1, 3, 4 → Include STOP language → Test send to your phone.",
        },
        {
          step: 4,
          title: "Coupon & tracking",
          duration: "7 min",
          instructions:
            "Create WELCOME-BACK-15 in Shopify/Square → UTM parameters on links: utm_campaign=winback2026 → Flow analytics: track placed order within 7 days of send.",
        },
        {
          step: 5,
          title: "Test & launch",
          duration: "5 min",
          instructions:
            "Add yourself to segment → Receive full sequence in test mode → Verify merge tags → Set live → Monitor first 48h for bounces/unsubs.",
        },
      ],
      testingChecklist: [
        "Merge tags render (first_name, last_product_name)",
        "Unsubscribe link works",
        "SMS STOP compliance verified",
        "Offer code applies at checkout",
        "Flow exits on placed order",
      ],
    },
    complianceNotes: [
      "TCPA: SMS only to numbers with prior express consent",
      "CAN-SPAM: physical address in email footer",
      "No false urgency — honor stated expiry dates",
      "California: honor opt-out within 10 business days",
    ],
  };
}

function TemplateBlock({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <View wrap={false} style={[pdfStyles.card, { marginBottom: 10 }]}>
      <Text style={pdfStyles.cardTitle}>{title}</Text>
      {children}
    </View>
  );
}

function WinBackKitDocument({
  company,
  content,
  dateStr,
  bizType,
}: {
  company: Company;
  content: RetailWinBackKitContent;
  dateStr: string;
  bizType: string;
}) {
  return (
    <Document title={`${company.name} — Customer Win-Back Kit`}>
      <BrandedPage dark footerLabel="">
        <Text style={pdfStyles.coverKicker}>Clinovyr Campaign Kit</Text>
        <Text style={pdfStyles.coverTitle}>Customer Win-Back Kit</Text>
        <Text style={pdfStyles.coverSubtitle}>{company.name}</Text>
        <Text style={pdfStyles.coverMeta}>{bizType} · {dateStr}</Text>
        <Text style={[pdfStyles.coverMeta, { marginTop: 24 }]}>
          5 emails · 3 SMS · ~45 min setup
        </Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Overview</Text>
        <Text style={pdfStyles.body}>{content.introduction}</Text>
        <Text style={pdfStyles.subsectionTitle}>Segment criteria</Text>
        <Text style={pdfStyles.body}>{content.segmentCriteria}</Text>
        <PdfFooter label="clinovyr.com · retail win-back" />
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Email Templates</Text>
        {content.emails.map((email) => (
          <TemplateBlock key={email.day} title={`Day ${email.day} — ${email.name}`}>
            <Text style={pdfStyles.muted}>Trigger: {email.sendTrigger}</Text>
            <Text style={[pdfStyles.subsectionTitle, { fontSize: 9 }]}>Subject</Text>
            <Text style={[pdfStyles.body, { fontSize: 9 }]}>{email.subject}</Text>
            <Text style={[pdfStyles.subsectionTitle, { fontSize: 9, marginTop: 6 }]}>Body</Text>
            <Text style={[pdfStyles.body, { fontSize: 9, lineHeight: 1.45 }]}>{email.body}</Text>
          </TemplateBlock>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>SMS Templates</Text>
        {content.smsTemplates.map((sms) => (
          <TemplateBlock key={sms.name} title={`${sms.name} (${sms.timing})`}>
            <Text style={[pdfStyles.body, { fontSize: 9 }]}>{sms.body}</Text>
          </TemplateBlock>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>
          Klaviyo Setup Guide (~{content.klaviyoGuide.totalMinutes} min)
        </Text>
        <Text style={pdfStyles.body}>{content.klaviyoGuide.overview}</Text>
        {content.klaviyoGuide.steps.map((step) => (
          <View key={step.step} style={pdfStyles.card}>
            <Text style={pdfStyles.cardTitle}>
              Step {step.step}: {step.title} ({step.duration})
            </Text>
            <Text style={pdfStyles.body}>{step.instructions}</Text>
          </View>
        ))}
        <Text style={pdfStyles.subsectionTitle}>Testing checklist</Text>
        {content.klaviyoGuide.testingChecklist.map((item) => (
          <View key={item} style={pdfStyles.checkboxRow}>
            <View style={pdfStyles.checkbox} />
            <Text style={pdfStyles.body}>{item}</Text>
          </View>
        ))}
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Compliance</Text>
        {content.complianceNotes.map((note) => (
          <Text key={note} style={pdfStyles.body}>
            • {note}
          </Text>
        ))}
        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Need win-back flows wired to your POS? Clinovyr deploys during Workflow Automation
            Sprints. clinovyr@gmail.com
          </Text>
        </View>
        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export async function renderRetailWinBackKitPdf(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Promise<Buffer> {
  const fallback = buildWinBackFallback(company, formData);
  const context = buildRetailContextBlock(company, survey, formData);

  const { data: content } = await callClaudeJson<RetailWinBackKitContent>({
    system: RETAIL_WINBACK_SYSTEM,
    prompt: `${context}

Output ONLY valid JSON:
{
  "introduction": "1 paragraph",
  "segmentCriteria": "segment rules",
  "emails": [{"day":0,"name":"...","subject":"...","body":"...","sendTrigger":"..."}, ...days 0,3,7,14,21],
  "smsTemplates": [{"name":"...","timing":"...","body":"under 160 chars"}], ...exactly 3,
  "klaviyoGuide": {"overview":"...","totalMinutes":45,"steps":[{"step":1,"title":"...","duration":"...","instructions":"..."}, ...5 steps],"testingChecklist":["..."]},
  "complianceNotes": ["4 items"]
}
Personalize to business name, products, and retail sub-type (restaurant vs boutique).`,
    maxTokens: 6000,
    fallback,
    validate: (v) => v.emails?.length >= 4 && v.smsTemplates?.length >= 2,
  });

  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return renderPdfDocument(
    <WinBackKitDocument
      company={company}
      content={content}
      dateStr={dateStr}
      bizType={getRetailTypeLabel(company, formData)}
    />,
  );
}
