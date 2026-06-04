import type { Company, Survey } from "@prisma/client";
import type { AssessmentFormData } from "@/types/assessment";
import type { DeliverableFileType } from "@/lib/deliverables/types";

export type GeneratorContext = {
  company: Company;
  survey: Survey;
  formData: AssessmentFormData | null;
};

export type GeneratorOutput = {
  buffer: Buffer;
  filename: string;
  mimeType: string;
  displayName: string;
  type: DeliverableFileType;
};

export type DeliverableGenerator = (
  ctx: GeneratorContext,
) => GeneratorOutput | null | Promise<GeneratorOutput | null>;
