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
  WELLNESS_SOCIAL_SYSTEM,
  type WellnessSocialPost,
  buildDefaultSocialPosts,
  buildWellnessContextBlock,
} from "@/lib/deliverables/generators/industries/wellness-shared";
import type { AssessmentFormData } from "@/types/assessment";

type SocialPackContent = {
  intro: string;
  postingSchedule: string;
  posts: WellnessSocialPost[];
};

function buildSocialPackFallback(
  company: Company,
  formData: AssessmentFormData | null,
): SocialPackContent {
  return {
    intro: `This 30-day Social Content Starter Pack gives ${company.name} 28 ready-to-post captions with image concepts and hashtags. Each week includes 3 educational, 2 promotional, 1 staff/brand, and 1 engagement post — optimized for Instagram and Facebook. Replace bracketed placeholders, add your photos, and schedule via Later or Buffer. All promotional claims must pass your FTC compliance review before publishing.`,
    postingSchedule:
      "Post Monday–Sunday with 1 rest day (suggested: Wednesday or Sunday). Best times for med spa audiences: 10am, 1pm, 7pm local. Batch-create images on Sundays; schedule the week ahead.",
    posts: buildDefaultSocialPosts(company, formData),
  };
}

const TYPE_LABELS: Record<WellnessSocialPost["type"], string> = {
  educational: "Educational",
  promotional: "Promotional",
  "staff-brand": "Staff / Brand",
  engagement: "Engagement",
};

function PostCard({ post }: { post: WellnessSocialPost }) {
  return (
    <View wrap={false} style={[pdfStyles.card, { marginBottom: 10 }]}>
      <Text style={pdfStyles.cardTitle}>
        Day {post.day} · Week {post.week} · {TYPE_LABELS[post.type]}
      </Text>
      <Text style={[pdfStyles.subsectionTitle, { fontSize: 9, marginTop: 4 }]}>
        Caption ({post.caption.split(/\s+/).length} words)
      </Text>
      <Text style={[pdfStyles.body, { fontSize: 9, lineHeight: 1.45 }]}>
        {post.caption}
      </Text>
      <Text style={[pdfStyles.subsectionTitle, { fontSize: 9, marginTop: 6 }]}>
        Image concept
      </Text>
      <Text style={[pdfStyles.body, { fontSize: 9 }]}>{post.imageConcept}</Text>
      <Text style={[pdfStyles.subsectionTitle, { fontSize: 9, marginTop: 6 }]}>
        Hashtags ({post.hashtags.length})
      </Text>
      <Text style={[pdfStyles.muted, { fontSize: 8, lineHeight: 1.35 }]}>
        {post.hashtags.join(" ")}
      </Text>
    </View>
  );
}

function SocialPackDocument({
  company,
  content,
  dateStr,
}: {
  company: Company;
  content: SocialPackContent;
  dateStr: string;
}) {
  const weeks = [1, 2, 3, 4] as const;

  return (
    <Document title={`${company.name} — Social Content Starter Pack`}>
      <BrandedPage dark footerLabel="">
        <Text style={pdfStyles.coverKicker}>Clinovyr Content Pack</Text>
        <Text style={pdfStyles.coverTitle}>Social Content Starter Pack</Text>
        <Text style={pdfStyles.coverSubtitle}>{company.name}</Text>
        <Text style={pdfStyles.coverMeta}>{dateStr}</Text>
        <Text style={[pdfStyles.coverMeta, { marginTop: 24 }]}>
          30 days · 28 posts · VA-ready format
        </Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>How to Use This Pack</Text>
        <Text style={pdfStyles.body}>{content.intro}</Text>
        <Text style={pdfStyles.subsectionTitle}>Posting schedule</Text>
        <Text style={pdfStyles.body}>{content.postingSchedule}</Text>
        <Text style={pdfStyles.subsectionTitle}>Weekly mix (each week)</Text>
        <Text style={pdfStyles.body}>
          • 3 Educational — build trust, demonstrate expertise{"\n"}
          • 2 Promotional — offers, booking CTAs, series packages{"\n"}
          • 1 Staff / Brand — humanize your team, share values{"\n"}
          • 1 Engagement — polls, questions, community building
        </Text>
        <Text style={[pdfStyles.muted, { marginTop: 10 }]}>
          FTC reminder: Review all health/beauty claims before publishing. No guaranteed results
          language.
        </Text>
        <PdfFooter label="clinovyr.com · wellness social content" />
      </BrandedPage>

      {weeks.map((week) => {
        const weekPosts = content.posts.filter((p) => p.week === week);
        return (
          <BrandedPage key={week}>
            <Text style={pdfStyles.sectionTitle}>Week {week}</Text>
            <Text style={[pdfStyles.muted, { marginBottom: 10 }]}>
              Days {(week - 1) * 7 + 1}–{week * 7} · 7 posts
            </Text>
            {weekPosts.map((post) => (
              <PostCard key={post.day} post={post} />
            ))}
            {week === 4 ? (
              <View style={pdfStyles.ctaBox}>
                <Text style={pdfStyles.ctaText}>
                  Need monthly content batches or brand-voice tuning? Clinovyr builds social
                  automation during Workflow Automation Sprints. clinovyr@gmail.com
                </Text>
              </View>
            ) : null}
            {week === 4 ? <PdfFooter /> : null}
          </BrandedPage>
        );
      })}
    </Document>
  );
}

export async function renderWellnessSocialContentPackPdf(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Promise<Buffer> {
  const fallback = buildSocialPackFallback(company, formData);
  const context = buildWellnessContextBlock(company, survey, formData);

  const { data: content } = await callClaudeJson<SocialPackContent>({
    system: WELLNESS_SOCIAL_SYSTEM,
    prompt: `${context}

Output ONLY valid JSON:
{
  "intro": "1 paragraph on how to use this pack",
  "postingSchedule": "1 paragraph with timing tips",
  "posts": [
    {"day":1,"week":1,"type":"educational|promotional|staff-brand|engagement","caption":"under 125 words","hashtags":["exactly 15 hashtags"],"imageConcept":"..."}
  ]
}

Provide exactly 28 posts across 4 weeks. Each week: 3 educational, 2 promotional, 1 staff-brand, 1 engagement. Personalize captions to services and location from context. No unsubstantiated health claims.`,
    maxTokens: 8000,
    fallback,
    validate: (v) => Array.isArray(v.posts) && v.posts.length >= 24,
  });

  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return renderPdfDocument(
    <SocialPackDocument company={company} content={content} dateStr={dateStr} />,
  );
}
