import * as path from "path";
import {
  ClientConfig,
  TemplateLibrary,
} from "../make/src/template-manager";

const CLINOVYR_PLACEHOLDER = /\{\{[A-Z0-9_]+\}\}/g;

const BASE_TEST_CONFIG: ClientConfig = {
  companyName: "Test Co",
  crmType: "HubSpot",
  emailProvider: "Gmail",
  webhookUrl: "https://hooks.example.com/test",
  apiKeys: { CRM: "test-key" },
};

function buildTestConfig(library: TemplateLibrary): ClientConfig {
  const apiKeys = { ...BASE_TEST_CONFIG.apiKeys };

  for (const template of library.listTemplates()) {
    const blueprint = library.loadBlueprint(template.id) as {
      metadata: { placeholders: string[] };
    };
    for (const placeholder of blueprint.metadata.placeholders) {
      const match = placeholder.match(/^\{\{API_KEY_([A-Z0-9_]+)\}\}$/);
      if (match && !apiKeys[match[1]]) {
        apiKeys[match[1]] = `test-${match[1].toLowerCase()}-key`;
      }
    }
  }

  return { ...BASE_TEST_CONFIG, apiKeys };
}

function buildReplacementValues(config: ClientConfig): Record<string, string> {
  const map: Record<string, string> = {
    "{{COMPANY_NAME}}": config.companyName,
    "{{CRM_TYPE}}": config.crmType,
    "{{EMAIL_PROVIDER}}": config.emailProvider,
    "{{WEBHOOK_URL}}": config.webhookUrl,
  };
  for (const [key, value] of Object.entries(config.apiKeys)) {
    map[`{{API_KEY_${key}}}`] = value;
  }
  return map;
}

function collectStrings(value: unknown, strings: string[] = []): string[] {
  if (typeof value === "string") {
    strings.push(value);
    return strings;
  }
  if (Array.isArray(value)) {
    for (const item of value) {
      collectStrings(item, strings);
    }
    return strings;
  }
  if (value !== null && typeof value === "object") {
    for (const nested of Object.values(value)) {
      collectStrings(nested, strings);
    }
  }
  return strings;
}

function findPlaceholderViolations(blueprint: unknown): string[] {
  const violations: string[] = [];
  for (const str of collectStrings(blueprint)) {
    const matches = str.match(CLINOVYR_PLACEHOLDER);
    if (matches) {
      violations.push(`Unresolved placeholder(s) in "${str}": ${matches.join(", ")}`);
    }
  }
  return violations;
}

function findInsecureUrls(blueprint: unknown): string[] {
  const issues: string[] = [];
  const walk = (value: unknown, currentKey?: string): void => {
    if (Array.isArray(value)) {
      value.forEach((item) => walk(item, currentKey));
      return;
    }
    if (value !== null && typeof value === "object") {
      for (const [key, nested] of Object.entries(value)) {
        walk(nested, key);
      }
      return;
    }
    if (typeof value === "string" && currentKey === "url") {
      if (!value.startsWith("https://")) {
        issues.push(`URL must start with https://: ${value}`);
      }
    }
  };
  walk(blueprint);
  return issues;
}

describe("Make template customization", () => {
  const library = new TemplateLibrary(path.join(__dirname, "../make"));
  const testConfig = buildTestConfig(library);
  const replacementValues = buildReplacementValues(testConfig);
  const templateIds = library.loadCatalog().templates.map((t) => t.id);

  beforeEach(() => {
    jest.spyOn(console, "log").mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it("customizes all 8 manifest templates", () => {
    expect(templateIds).toHaveLength(8);
  });

  it.each(templateIds)("customizeTemplate(%s) resolves Clinovyr placeholders", (templateId) => {
    const { blueprint } = library.customizeTemplate(templateId, testConfig);
    const violations = findPlaceholderViolations(blueprint);
    expect(violations).toEqual([]);
  });

  it.each(templateIds)("customizeTemplate(%s) uses https URLs", (templateId) => {
    const { blueprint } = library.customizeTemplate(templateId, testConfig);
    const urlIssues = findInsecureUrls(blueprint);
    expect(urlIssues).toEqual([]);
  });

  it.each(templateIds)(
    "customizeTemplate(%s) applies config for declared placeholders",
    (templateId) => {
      const raw = library.loadBlueprint(templateId) as {
        metadata: { placeholders: string[] };
      };
      const { blueprint } = library.customizeTemplate(templateId, testConfig);
      const serialized = JSON.stringify(blueprint);

      for (const placeholder of raw.metadata.placeholders) {
        expect(serialized).not.toContain(placeholder);
        const replacement = replacementValues[placeholder];
        if (replacement) {
          expect(serialized).toContain(replacement);
        }
      }

      if (serialized.includes("sendEmail") || serialized.includes(":sendEmail")) {
        expect(serialized).toContain(testConfig.emailProvider);
      }
    }
  );
});
