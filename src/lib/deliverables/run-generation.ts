import {
  CLINOVYR_PRODUCTS,
  getProduct,
  type ClinovyrProductKey,
} from "@/lib/products";
import { escapeHtml, sendAuthEmail } from "@/lib/email";
import { getContactEmail } from "@/lib/assessment-email";
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
  const failures: Array<{ key: string; reason: string }> = [];

  resetClaudeTelemetry();

  for (const key of deliverableKeys) {
    const generator = industryGenerators?.[key] ?? GENERATORS[key];

    if (!generator) {
      console.warn("[deliverables/run-generation] unknown deliverable key:", key);
      failures.push({ key, reason: "unknown deliverable key" });
      continue;
    }

    try {
      const fallbacksBefore = claudeTelemetry.fallbacks;
      const output = await generator(ctx);

      if (!output) {
        console.warn(
          `[deliverables/run-generation] generator returned nothing for ${key}`,
        );
        failures.push({ key, reason: "generator returned no output" });
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
        failures.push({ key, reason: `upload failed: ${upload.error}` });
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
      failures.push({
        key,
        reason: error instanceof Error ? error.message : "generator threw",
      });
    }
  }

  if (records.length === 0) {
    console.error(
      "[deliverables/run-generation] no deliverables produced:",
      orderId,
    );
    await sendPartialDeliveryAlert({
      orderId,
      companyName: company.name,
      product,
      delivered: 0,
      expected: deliverableKeys.length,
      failures,
    }).catch((error) => {
      console.error(
        "[deliverables/run-generation] failure alert failed:",
        error,
      );
    });
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

  if (failures.length > 0) {
    console.error(
      `[deliverables/run-generation] PARTIAL delivery for order ${orderId}: ${failures
        .map((f) => f.key)
        .join(", ")} failed`,
    );
    await sendPartialDeliveryAlert({
      orderId,
      companyName: company.name,
      product,
      delivered: records.length,
      expected: deliverableKeys.length,
      failures,
    }).catch((error) => {
      console.error(
        "[deliverables/run-generation] partial-delivery alert failed:",
        error,
      );
    });
  }

  console.info(
    `[deliverables/run-generation] delivered ${records.length} files for order ${orderId}`,
  );
}

/**
 * Internal-only alert: some deliverables failed but the order still shipped
 * with the rest. Gives the admin what they need to redeliver from the panel.
 */
async function sendPartialDeliveryAlert(params: {
  orderId: string;
  companyName: string;
  product: string;
  delivered: number;
  expected: number;
  failures: Array<{ key: string; reason: string }>;
}): Promise<void> {
  const { orderId, companyName, product, delivered, expected, failures } =
    params;

  const statusLine =
    delivered === 0
      ? `produced <strong>no files</strong>. The order remains in "paid" status and the customer has NOT received deliverables.`
      : `delivered <strong>${delivered} of ${expected}</strong> files. The customer received the rest and the order is marked delivered.`;

  const rows = failures
    .map(
      (f) =>
        `<tr><td style="padding:6px 12px 6px 0;font-family:monospace;font-size:13px;color:#0d0f12;">${escapeHtml(f.key)}</td><td style="padding:6px 0;font-size:13px;color:#7a7468;">${escapeHtml(f.reason)}</td></tr>`,
    )
    .join("");

  const html = `<!DOCTYPE html>
<html lang="en"><head><meta charset="utf-8"></head>
<body style="margin:0;padding:24px;background:#f5f2ed;font-family:Arial,sans-serif;">
  <h2 style="margin:0 0 12px;color:#0d0f12;">Partial delivery — ${escapeHtml(companyName)}</h2>
  <p style="margin:0 0 16px;font-size:14px;color:#0d0f12;">Order <code>${escapeHtml(orderId)}</code> (${escapeHtml(product)}) ${statusLine}</p>
  <table role="presentation" style="border-collapse:collapse;">${rows}</table>
  <p style="margin:16px 0 0;font-size:13px;color:#7a7468;">Use the admin panel's Redeliver action after fixing the cause.</p>
</body></html>`;

  await sendAuthEmail({
    to: getContactEmail(),
    subject: `[Clinovyr] ${delivered === 0 ? "FAILED" : "PARTIAL"} delivery — ${companyName} (${delivered}/${expected})`,
    html,
  });
}
