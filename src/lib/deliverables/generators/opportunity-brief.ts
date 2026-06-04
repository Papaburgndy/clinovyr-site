import { buildOpportunityBriefMd } from "@/lib/deliverables/artifacts";
import { textOutput } from "@/lib/deliverables/generators/shared";
import type { DeliverableGenerator } from "@/lib/deliverables/generators/types";

export const generateOpportunityBrief: DeliverableGenerator = ({
  company,
  survey,
  formData,
}) =>
  textOutput(
    "opportunity-brief",
    buildOpportunityBriefMd(company, survey, formData),
    { type: "markdown" },
  );
