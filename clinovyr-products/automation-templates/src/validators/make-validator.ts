import * as fs from "fs";
import * as path from "path";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface BlueprintFileResult extends ValidationResult {
  filename: string;
}

interface MakeModule {
  id?: number | string;
  module?: string;
  parameters?: Record<string, unknown>;
}

const CLINOVYR_PLACEHOLDER = /\{\{[A-Z0-9_]+\}\}/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTriggerModule(module: MakeModule): boolean {
  const name = (module.module ?? "").toLowerCase();
  return (
    name.includes(":watch") ||
    name.startsWith("webhook:") ||
    name.startsWith("schedule:") ||
    name.includes(":trigger") ||
    name.includes("builtin:basictrigger")
  );
}

function validateFlowChain(flow: MakeModule[], errors: string[]): void {
  const ids = flow.map((m) => m.id);
  const numericIds = ids.filter((id): id is number => typeof id === "number");

  if (numericIds.length !== flow.length) {
    errors.push("All flow module ids should be numeric for sequential chaining");
  }

  const sorted = [...numericIds].sort((a, b) => a - b);
  for (let i = 0; i < sorted.length; i++) {
    const expected = i + 1;
    if (sorted[i] !== expected) {
      errors.push(
        `Flow module ids must form a chain starting at 1; expected id ${expected}, found ${sorted[i]}`
      );
      break;
    }
  }

}

function validateRequiredModuleFields(flow: MakeModule[], errors: string[]): void {
  flow.forEach((module, index) => {
    if (typeof module.module !== "string" || module.module.trim().length === 0) {
      errors.push(`flow[${index}] must include a non-empty "module"`);
    }

    if (module.id === undefined || module.id === null) {
      errors.push(`flow[${index}] must include an "id"`);
    }

    if (!isRecord(module.parameters)) {
      errors.push(`flow[${index}] must include a "parameters" object`);
      return;
    }

    const params = module.parameters;
    const moduleName = module.module ?? "";

    for (const [key, value] of Object.entries(params)) {
      if (value === "" || value === null || value === undefined) {
        errors.push(`flow[${index}] (${moduleName}): parameter "${key}" is empty`);
      }
    }

    if (moduleName.includes("sendEmail") || moduleName.includes(":sendEmail")) {
      for (const field of ["to", "subject", "body"] as const) {
        const value = params[field];
        if (typeof value !== "string" || value.trim().length === 0) {
          errors.push(`flow[${index}] (${moduleName}): email field "${field}" is required`);
        }
      }
    }

    if (moduleName.toLowerCase().includes("webhook") && typeof params.url === "string") {
      if (!params.url.startsWith("https://") && !params.url.startsWith("{{")) {
        errors.push(`flow[${index}]: webhook url must use https:// or a placeholder`);
      }
    }
  });
}

export function validateMakeBlueprint(json: unknown, filename?: string): ValidationResult {
  const errors: string[] = [];
  const prefix = filename ? `${filename}: ` : "";

  if (!isRecord(json)) {
    return { valid: false, errors: [`${prefix}Blueprint must be a JSON object`] };
  }

  if (typeof json.name !== "string" || json.name.trim().length === 0) {
    errors.push(`${prefix}Blueprint must include a non-empty "name"`);
  }

  if (!Array.isArray(json.flow) || json.flow.length === 0) {
    errors.push(`${prefix}Blueprint must include a non-empty "flow" array`);
    return { valid: false, errors };
  }

  const flow = json.flow as MakeModule[];
  const triggers = flow.filter(isTriggerModule);

  if (triggers.length === 0) {
    errors.push(`${prefix}Blueprint must include at least one trigger module in flow`);
  }

  validateFlowChain(flow, errors);
  validateRequiredModuleFields(flow, errors);

  if (!isRecord(json.metadata)) {
    errors.push(`${prefix}Blueprint must include a "metadata" object`);
  } else {
    if (typeof json.metadata.templateId !== "string") {
      errors.push(`${prefix}metadata.templateId must be a string`);
    }
    if (!Array.isArray(json.metadata.placeholders)) {
      errors.push(`${prefix}metadata.placeholders must be an array`);
    } else {
      json.metadata.placeholders.forEach((placeholder, index) => {
        if (typeof placeholder !== "string" || !CLINOVYR_PLACEHOLDER.test(placeholder)) {
          errors.push(
            `${prefix}metadata.placeholders[${index}] must be a Clinovyr placeholder like {{COMPANY_NAME}}`
          );
        }
      });
    }
  }

  return { valid: errors.length === 0, errors };
}

export function validateAllMakeBlueprints(dir: string): BlueprintFileResult[] {
  const resolved = path.resolve(dir);
  const files = fs
    .readdirSync(resolved)
    .filter((name) => name.endsWith(".blueprint.json"))
    .sort();

  return files.map((filename) => {
    const filePath = path.join(resolved, filename);
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown;
    const result = validateMakeBlueprint(raw, filename);
    return { filename, ...result };
  });
}
