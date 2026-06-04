import { buildStaffOrCrmMarkdown } from "@/lib/deliverables/artifacts";
import { textOutput } from "@/lib/deliverables/generators/shared";
import type { DeliverableGenerator } from "@/lib/deliverables/generators/types";

export const generateCrmSetupGuide: DeliverableGenerator = (ctx) =>
  textOutput(
    "crm-setup-guide",
    buildStaffOrCrmMarkdown("crm-setup-guide", ctx.company, ctx.survey, ctx.formData),
    { type: "markdown" },
  );
