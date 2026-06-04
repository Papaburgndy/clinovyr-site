import { buildToolStackGuideJson } from "@/lib/deliverables/artifacts";
import { jsonOutput } from "@/lib/deliverables/generators/shared";
import type { DeliverableGenerator } from "@/lib/deliverables/generators/types";

export const generateToolStackGuide: DeliverableGenerator = ({
  company,
  formData,
}) => jsonOutput("tool-stack-guide", buildToolStackGuideJson(company, formData));
