import {
  CLINOVYR_PRODUCTS,
  getProduct,
  type ClinovyrProductKey,
} from "@/lib/products";
import { prisma } from "@/lib/prisma";
import { parseSurveyFormData } from "@/lib/deliverables/artifacts";
import { sendDeliveryEmail } from "@/lib/emails/delivery-email";
import { GENERATORS } from "@/lib/deliverables/generators/index";
import {
  claudeTelemetry,
  resetClaudeTelemetry,
} from "@/lib/deliverables/generators/claude-helper";
import { getIndustryGeneratorMap } from "@/lib/deliverables/industry-map";
import type { GeneratorContext } from "@/lib/deliverables/generators/types";
import { uploadDeliverable } from "@/lib/deliverables/storage";
import type {
  DeliverableRecord,
  TriggerDeliverableGenerationParams,
} from "@/lib/deliverables/types";

function normalizeDeliverableKeys(
  keys: string[],
  product: string,
): string[] {
  if (keys.length > 0 && typeof keys[0] === "string") {
    return keys;
  }

  if (product in CLINOVYR_PRODUCTS) {
    return [...getProduct(product as ClinovyrProductKey).deliverables];
  }

  return keys;
}

export async function runDeliverableGeneration(
  params: TriggerDeliverableGenerationParams,
): Promise<void> {
  const { companyId, product, orderId } = params;
  const deliverableKeys = normalizeDeliverableKeys(
    params.deliverableKeys,
    product,
  );

  const order = await prisma.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    console.error("[deliverables/run-generation] order not found:", orderId);
    return;
  }

  if (order.status === "delivered") {
    console.info("[deliverables/run-generation] already delivered:", orderId);
    return;
  }

  const company = await prisma.company.findUnique({
    where: { id: companyId },
    include: { survey: true, user: true },
  });

  if (!company) {
    console.error("[deliverables/run-generation] company not found:", companyId);
    return;
  }

  if (!company.survey) {
    console.warn(
      "[deliverables/run-generation] no survey — skipping generation:",
      companyId,
    );
    return;
  }

  const ctx: GeneratorContext = {
    company,
    survey: company.survey,
    formData: parseSurveyFormData(company.survey),
  };

  const industryGenerators = getIndustryGeneratorMap(company.industry);

  const records: DeliverableRecord[] = [];

  resetClaudeTelemetry();

  for (const key of deliverableKeys) {
    const generator = industryGenerators?.[key] ?? GENERATORS[key];

    if (!generator) {
      console.warn("[deliverables/run-generation] unknown deliverable key:", key);
      continue;
    }

    try {
      const fallbacksBefore = claudeTelemetry.fallbacks;
      const output = await generator(ctx);

      if (!output) {
        console.warn(
          `[deliverables/run-generation] generator returned nothing for ${key}`,
        );
        continue;
      }

      const upload = await uploadDeliverable(
        companyId,
        output.filename,
        output.buffer,
        output.mimeType,
      );

      if (!upload.ok) {
        console.error(
          `[deliverables/run-generation] upload failed for ${key}:`,
          upload.error,
        );
        continue;
      }

      // If any Claude call fell back to canned content while producing this
      // deliverable, flag it so the admin panel can surface thin output.
      const usedFallback = claudeTelemetry.fallbacks > fallbacksBefore;

      records.push({
        key,
        name: output.displayName,
        url: upload.url,
        type: output.type,
        size: upload.size,
        usedFallback,
      });

      console.info(
        `[deliverables/run-generation] uploaded ${key} via ${upload.storage} (${upload.size} bytes)${usedFallback ? " [FALLBACK]" : ""}`,
      );
    } catch (error) {
      console.error(
        `[deliverables/run-generation] failed to generate ${key}:`,
        error,
      );
    }
  }

  if (records.length === 0) {
    console.error(
      "[deliverables/run-generation] no deliverables produced:",
      orderId,
    );
    return;
  }

  await prisma.order.update({
    where: { id: orderId },
    data: {
      status: "delivered",
      deliverables: records,
      deliveredAt: new Date(),
    },
  });

  await sendDeliveryEmail({ companyId, product, deliverables: records });

  console.info(
    `[deliverables/run-generation] delivered ${records.length} files for order ${orderId}`,
  );
}
