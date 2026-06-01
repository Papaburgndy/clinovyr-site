import {
  PropertyCreateFieldTypeEnum,
  PropertyCreateTypeEnum,
} from "@hubspot/api-client/lib/codegen/crm/properties/models/PropertyCreate";
import { recordApiCall } from "../hubspot-client.js";
import { formatHubSpotError, getHubSpotClientForSetup } from "./audit.js";
import type { PropertyResult, SetupContext } from "../types.js";

interface ContactPropertyDefinition {
  name: string;
  label: string;
  type: PropertyCreateTypeEnum;
  fieldType: PropertyCreateFieldTypeEnum;
  description: string;
}

const CUSTOM_PROPERTIES: ContactPropertyDefinition[] = [
  {
    name: "ai_lead_score",
    label: "AI Lead Score",
    type: PropertyCreateTypeEnum.Number,
    fieldType: PropertyCreateFieldTypeEnum.Number,
    description: "AI-generated lead score from 1 to 100.",
  },
  {
    name: "lead_source_detail",
    label: "Lead Source Detail",
    type: PropertyCreateTypeEnum.String,
    fieldType: PropertyCreateFieldTypeEnum.Text,
    description: "Granular lead source detail captured by AI or forms.",
  },
  {
    name: "last_contacted_by_ai",
    label: "Last Contacted By AI",
    type: PropertyCreateTypeEnum.Date,
    fieldType: PropertyCreateFieldTypeEnum.Date,
    description: "Date the lead was last contacted by an AI agent.",
  },
  {
    name: "escalate_to_human",
    label: "Escalate To Human",
    type: PropertyCreateTypeEnum.Bool,
    fieldType: PropertyCreateFieldTypeEnum.Booleancheckbox,
    description: "Whether this lead should be escalated to a human rep.",
  },
];

export async function runPropertiesStep(context: SetupContext): Promise<void> {
  console.log("\n=== STEP 2 — Custom Properties ===");

  const client = getHubSpotClientForSetup(context);
  const results: PropertyResult[] = [];

  for (const property of CUSTOM_PROPERTIES) {
    if (context.dryRun) {
      results.push({
        name: property.name,
        status: "skipped",
        message: "Dry run — property not created",
      });
      recordApiCall(context.apiCalls, {
        step: "properties",
        method: "POST",
        endpoint: `/crm/v3/properties/contacts/${property.name}`,
        status: "mock",
        message: "Dry run",
      });
      console.log(`  ○ ${property.name} (dry run — would create)`);
      continue;
    }

    try {
      await client.crm.properties.coreApi.getByName("contacts", property.name);
      results.push({ name: property.name, status: "exists" });
      recordApiCall(context.apiCalls, {
        step: "properties",
        method: "GET",
        endpoint: `/crm/v3/properties/contacts/${property.name}`,
        status: "success",
        message: "Already exists",
      });
      console.log(`  ✓ ${property.name} (already exists)`);
    } catch {
      try {
        await client.crm.properties.coreApi.create("contacts", {
          name: property.name,
          label: property.label,
          type: property.type,
          fieldType: property.fieldType,
          groupName: "contactinformation",
          description: property.description,
        });

        results.push({ name: property.name, status: "created" });
        recordApiCall(context.apiCalls, {
          step: "properties",
          method: "POST",
          endpoint: `/crm/v3/properties/contacts/${property.name}`,
          status: "success",
        });
        console.log(`  ✓ ${property.name} (created)`);
      } catch (error) {
        const message = formatHubSpotError(error);
        results.push({ name: property.name, status: "error", message });
        recordApiCall(context.apiCalls, {
          step: "properties",
          method: "POST",
          endpoint: `/crm/v3/properties/contacts/${property.name}`,
          status: "error",
          message,
        });
        console.log(`  ✗ ${property.name}: ${message}`);
      }
    }
  }

  context.properties = results;
  console.log(
    `\n  Properties complete: ${results.filter((item) => item.status === "created").length} created, ${results.filter((item) => item.status === "exists").length} existing`,
  );
}
