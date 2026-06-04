import { buildExecutivePresentationMd } from "@/lib/deliverables/artifacts";
import { textOutput } from "@/lib/deliverables/generators/shared";
import type { DeliverableGenerator } from "@/lib/deliverables/generators/types";

export const generateExecutivePresentation: DeliverableGenerator = ({
  company,
  survey,
  formData,
}) =>
  textOutput(
    "executive-presentation",
    buildExecutivePresentationMd(company, survey, formData),
    { type: "markdown" },
  );
