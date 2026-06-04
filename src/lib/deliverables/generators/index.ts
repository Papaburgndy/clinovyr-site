import { generateAssessmentReportPdf } from "@/lib/deliverables/generators/assessment-report-pdf";
import { generateAutomationBlueprints } from "@/lib/deliverables/generators/automation-blueprints";
import { generateCrmSetupGuide } from "@/lib/deliverables/generators/crm-setup-guide";
import { generateExecutivePresentation } from "@/lib/deliverables/generators/executive-presentation";
import { generateImplementationChecklist } from "@/lib/deliverables/generators/implementation-checklist";
import { generateOpportunityBrief } from "@/lib/deliverables/generators/opportunity-brief";
import { generateOpportunityRoadmap } from "@/lib/deliverables/generators/opportunity-roadmap";
import { generateRoiCalculator } from "@/lib/deliverables/generators/roi-calculator";
import { generateStaffTrainingGuide } from "@/lib/deliverables/generators/staff-training-guide";
import { generateToolRecommendations } from "@/lib/deliverables/generators/tool-recommendations";
import { generateToolStackGuide } from "@/lib/deliverables/generators/tool-stack-guide";
import type { DeliverableGenerator } from "@/lib/deliverables/generators/types";

export const GENERATORS: Record<string, DeliverableGenerator> = {
  "assessment-report-pdf": generateAssessmentReportPdf,
  "opportunity-roadmap": generateOpportunityRoadmap,
  "automation-blueprints": generateAutomationBlueprints,
  "staff-training-guide": generateStaffTrainingGuide,
  "roi-calculator": generateRoiCalculator,
  "implementation-checklist": generateImplementationChecklist,
  "tool-stack-guide": generateToolStackGuide,
  "executive-presentation": generateExecutivePresentation,
  "crm-setup-guide": generateCrmSetupGuide,
  "tool-recommendations": generateToolRecommendations,
  "opportunity-brief": generateOpportunityBrief,
};

export type DeliverableGeneratorKey = keyof typeof GENERATORS;

export {
  generateMedicalAIReport,
  generateMedicalBlueprintPack,
  generateMedicalHIPAAGuide,
  generateMedicalROICalculator,
  generateMedicalRoadmap,
  MEDICAL_DELIVERABLE_GENERATORS,
} from "@/lib/deliverables/generators/industries/medical";
export {
  generateRealEstateAIReport,
  generateRealEstateLeadQualifierPromptPack,
  generateRealEstateAutomationBlueprints,
  generateRealEstateROICalculator,
  generateRealEstateCRMSetupGuide,
  REAL_ESTATE_DELIVERABLE_GENERATORS,
} from "@/lib/deliverables/generators/industries/real-estate";
export {
  generateLegalAIReport,
  generateLegalPromptLibrary,
  generateLegalClientIntakeSystem,
  generateLegalROICalculator,
  generateLegalComplianceChecklist,
  LEGAL_DELIVERABLE_GENERATORS,
} from "@/lib/deliverables/generators/industries/legal";
export {
  generateConstructionAIReport,
  generateConstructionBidAssistantGuide,
  generateConstructionAutomationBlueprints,
  generateConstructionSubcontractorCommunicationKit,
  generateConstructionROICalculator,
  CONSTRUCTION_DELIVERABLE_GENERATORS,
} from "@/lib/deliverables/generators/industries/construction";
export {
  generateWellnessAIReport,
  generateWellnessSocialContentPack,
  generateWellnessAutomationBlueprints,
  generateWellnessRetentionPlaybook,
  generateWellnessROICalculator,
  WELLNESS_DELIVERABLE_GENERATORS,
} from "@/lib/deliverables/generators/industries/wellness";
export {
  generateRetailAIReport,
  generateRetailCustomerWinBackKit,
  generateRetailReviewManagementKit,
  generateRetailSocialContentPack,
  generateRetailROICalculator,
  RETAIL_DELIVERABLE_GENERATORS,
} from "@/lib/deliverables/generators/industries/retail";
export {
  normalizeIndustry,
  resolveDeliverableGenerator,
} from "@/lib/deliverables/generator";
