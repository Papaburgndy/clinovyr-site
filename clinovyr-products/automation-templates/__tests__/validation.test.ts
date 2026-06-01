import * as path from "path";
import { validateAllMakeBlueprints, validateMakeBlueprint } from "../src/validators/make-validator";
import { validateAllN8nWorkflows, validateN8nWorkflow } from "../src/validators/n8n-validator";

const ROOT = path.join(__dirname, "..");
const N8N_DIR = path.join(ROOT, "n8n");
const MAKE_DIR = path.join(ROOT, "make", "templates");

describe("n8n workflow validation", () => {
  const results = validateAllN8nWorkflows(N8N_DIR);

  it("finds 6 n8n workflow files", () => {
    expect(results).toHaveLength(6);
  });

  it.each(results.map((r) => [r.filename, r] as const))(
    "%s passes structural validation",
    (_filename, result) => {
      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
    }
  );

  it("validateN8nWorkflow rejects invalid payload", () => {
    const result = validateN8nWorkflow({ nodes: [] }, "bad.json");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("Make blueprint validation", () => {
  const results = validateAllMakeBlueprints(MAKE_DIR);

  it("finds 8 Make blueprint files", () => {
    expect(results).toHaveLength(8);
  });

  it.each(results.map((r) => [r.filename, r] as const))(
    "%s passes structural validation",
    (_filename, result) => {
      expect(result.errors).toEqual([]);
      expect(result.valid).toBe(true);
    }
  );

  it("validateMakeBlueprint rejects invalid payload", () => {
    const result = validateMakeBlueprint({ name: "x", flow: [] }, "bad.json");
    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

describe("master validation summary", () => {
  it("reports all templates valid", () => {
    const n8n = validateAllN8nWorkflows(N8N_DIR);
    const make = validateAllMakeBlueprints(MAKE_DIR);

    const n8nPassed = n8n.filter((r) => r.valid).length;
    const makePassed = make.filter((r) => r.valid).length;

    expect(n8nPassed).toBe(6);
    expect(makePassed).toBe(8);

    const failures = [
      ...n8n.filter((r) => !r.valid).map((r) => `n8n:${r.filename}`),
      ...make.filter((r) => !r.valid).map((r) => `make:${r.filename}`),
    ];

    expect(failures).toEqual([]);
  });
});
