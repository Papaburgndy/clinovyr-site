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
  RETAIL_SOCIAL_SYSTEM,
  DEFAULT_STORY_TEMPLATES,
  type RetailSocialPost,
  type RetailStoryTemplate,
  buildDefaultSocialPosts,
  buildRetailContextBlock,
  getRetailSubType,
  getRetailTypeLabel,
} from "@/lib/deliverables/generators/industries/retail-shared";
import type { AssessmentFormData } from "@/types/assessment";

type SocialPackContent = {
  intro: string;
  postingSchedule: string;
  subType: string;
  posts: RetailSocialPost[];
  storyTemplates: RetailStoryTemplate[];
};

function buildSocialPackFallback(
  company: Company,
  formData: AssessmentFormData | null,
): SocialPackContent {
  const sub = getRetailSubType(company, formData);
  const label = getRetailTypeLabel(company, formData);
  const contentFocus =
    sub === "restaurant"
      ? "food photos, kitchen BTS, team spotlights, and weekly specials"
      : sub === "boutique"
        ? "product features, styling ideas, customer spotlights, and sale events"
        : "product highlights, local community ties, and in-store events";

  return {
    intro: `This 30-day Social Content Pack gives ${company.name} (${label}) 28 ready-to-post captions with hashtags, posting times, and image concepts — tailored for ${contentFocus}. Includes 5 Instagram story templates. Schedule via Later or Buffer; add your photos from the image concepts.`,
    postingSchedule:
      "Post 6–7 days per week. Best times for Placer and Sacramento County retail: 10am (product/special), 1pm (engagement), 7pm (restaurant/dining). Batch photography Sunday; schedule Monday AM.",
    subType: sub,
    posts: buildDefaultSocialPosts(company, formData),
    storyTemplates: DEFAULT_STORY_TEMPLATES,
  };
}

function PostCard({ post }: { post: RetailSocialPost }) {
  return (
    <View wrap={false} style={[pdfStyles.card, { marginBottom: 10 }]}>
      <Text style={pdfStyles.cardTitle}>
        Day {post.day} · Week {post.week} · {post.type}
      </Text>
      <Text style={[pdfStyles.muted, { fontSize: 8 }]}>Post time: {post.postingTime}</Text>
      <Text style={[pdfStyles.body, { fontSize: 9, lineHeight: 1.45, marginTop: 4 }]}>
        {post.caption}
      </Text>
      <Text style={[pdfStyles.subsectionTitle, { fontSize: 9, marginTop: 6 }]}>
        Image concept
      </Text>
      <Text style={[pdfStyles.body, { fontSize: 9 }]}>{post.imageConcept}</Text>
      <Text style={[pdfStyles.muted, { fontSize: 8, marginTop: 6 }]}>
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
    <Document title={`${company.name} — Social Content Pack`}>
      <BrandedPage dark footerLabel="">
        <Text style={pdfStyles.coverKicker}>Clinovyr Content Pack</Text>
        <Text style={pdfStyles.coverTitle}>30-Day Social Content Pack</Text>
        <Text style={pdfStyles.coverSubtitle}>{company.name}</Text>
        <Text style={pdfStyles.coverMeta}>{dateStr}</Text>
        <Text style={[pdfStyles.coverMeta, { marginTop: 24 }]}>
          28 captions · 5 story templates · {content.subType}
        </Text>
      </BrandedPage>

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>How to Use</Text>
        <Text style={pdfStyles.body}>{content.intro}</Text>
        <Text style={pdfStyles.subsectionTitle}>Posting schedule</Text>
        <Text style={pdfStyles.body}>{content.postingSchedule}</Text>
        <PdfFooter label="clinovyr.com · retail social" />
      </BrandedPage>

      {weeks.map((week) => (
        <BrandedPage key={week}>
          <Text style={pdfStyles.sectionTitle}>Week {week}</Text>
          {content.posts
            .filter((p) => p.week === week)
            .map((post) => (
              <PostCard key={post.day} post={post} />
            ))}
        </BrandedPage>
      ))}

      <BrandedPage>
        <Text style={pdfStyles.sectionTitle}>Instagram Story Templates (5)</Text>
        {content.storyTemplates.map((story) => (
          <View key={story.name} style={pdfStyles.card}>
            <Text style={pdfStyles.cardTitle}>{story.name}</Text>
            {story.frames.map((frame) => (
              <Text key={frame} style={pdfStyles.body}>
                • {frame}
              </Text>
            ))}
            <Text style={pdfStyles.muted}>CTA: {story.cta}</Text>
          </View>
        ))}
        <View style={pdfStyles.ctaBox}>
          <Text style={pdfStyles.ctaText}>
            Monthly content batches and brand-voice tuning available in Clinovyr Workflow
            Automation Sprints. clinovyr@gmail.com
          </Text>
        </View>
        <PdfFooter />
      </BrandedPage>
    </Document>
  );
}

export async function renderRetailSocialContentPackPdf(
  company: Company,
  survey: Survey,
  formData: AssessmentFormData | null,
): Promise<Buffer> {
  const fallback = buildSocialPackFallback(company, formData);
  const context = buildRetailContextBlock(company, survey, formData);
  const sub = getRetailSubType(company, formData);

  const { data: content } = await callClaudeJson<SocialPackContent>({
    system: RETAIL_SOCIAL_SYSTEM,
    prompt: `${context}

Detected sub-type: ${sub}. Restaurant = food/BTS/team/specials. Boutique = product/styling/spotlight/sale. Specialty retail = product/community/events.

Output ONLY valid JSON:
{
  "intro": "1 paragraph",
  "postingSchedule": "1 paragraph with times",
  "subType": "${sub}",
  "posts": [{"day":1,"week":1,"type":"...","caption":"under 125 words","hashtags":["15 hashtags"],"postingTime":"...","imageConcept":"..."}],
  "storyTemplates": [{"name":"...","frames":["...","...","..."],"cta":"..."}]
}

Exactly 28 posts across 4 weeks. Exactly 5 story templates.`,
    maxTokens: 8000,
    fallback,
    validate: (v) => Array.isArray(v.posts) && v.posts.length >= 24,
  });

  const dateStr = new Date().toLocaleDateString("en-US", { dateStyle: "long" });
  return renderPdfDocument(
    <SocialPackDocument company={company} content={content} dateStr={dateStr} />,
  );
}
