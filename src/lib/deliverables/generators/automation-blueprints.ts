import { buildAutomationBlueprintsJson } from "@/lib/deliverables/artifacts";
import { jsonOutput } from "@/lib/deliverables/generators/shared";
import type { DeliverableGenerator } from "@/lib/deliverables/generators/types";

export const generateAutomationBlueprints: DeliverableGenerator = ({
  company,
  survey,
  formData,
}) =>
  jsonOutput(
    "automation-blueprints",
    buildAutomationBlueprintsJson(company, survey, formData),
  );
