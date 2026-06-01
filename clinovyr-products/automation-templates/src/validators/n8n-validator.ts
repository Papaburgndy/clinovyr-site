import * as fs from "fs";
import * as path from "path";

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

export interface WorkflowFileResult extends ValidationResult {
  filename: string;
}

interface N8nNode {
  id?: string;
  name?: string;
  type?: string;
  parameters?: Record<string, unknown>;
}

const PLACEHOLDER_IN_PARAM = /^\s*$/;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isTriggerNode(node: N8nNode): boolean {
  const type = (node.type ?? "").toLowerCase();
  return type.includes("trigger") || type.includes("webhook");
}

function collectIncomingNodeNames(connections: Record<string, unknown>): Set<string> {
  const incoming = new Set<string>();

  for (const outputs of Object.values(connections)) {
    if (!isRecord(outputs) || !Array.isArray(outputs.main)) {
      continue;
    }

    for (const branch of outputs.main) {
      if (!Array.isArray(branch)) {
        continue;
      }
      for (const link of branch) {
        if (isRecord(link) && typeof link.node === "string") {
          incoming.add(link.node);
        }
      }
    }
  }

  return incoming;
}

function validateNodeBasics(nodes: N8nNode[], errors: string[]): void {
  nodes.forEach((node, index) => {
    const label = node.name ?? `nodes[${index}]`;

    if (typeof node.name !== "string" || node.name.trim().length === 0) {
      errors.push(`Node at index ${index} is missing a non-empty "name"`);
    }

    if (typeof node.type !== "string" || node.type.trim().length === 0) {
      errors.push(`${label}: missing "type"`);
    }

    if (typeof node.id !== "string" || node.id.trim().length === 0) {
      errors.push(`${label}: missing "id"`);
    }

    validateCriticalNodeParams(node, errors);
  });
}

function validateCriticalNodeParams(node: N8nNode, errors: string[]): void {
  const label = node.name ?? "unnamed node";
  const type = (node.type ?? "").toLowerCase();
  const params = node.parameters ?? {};

  const requireParam = (key: string, humanLabel: string): void => {
    const value = params[key];
    if (
      value === undefined ||
      value === null ||
      (typeof value === "string" && PLACEHOLDER_IN_PARAM.test(value))
    ) {
      errors.push(`${label}: critical parameter "${humanLabel}" is empty or missing`);
    }
  };

  if (type.includes("webhook")) {
    requireParam("path", "path");
  }

  if (type.includes("emailsend")) {
    requireParam("fromEmail", "fromEmail");
    requireParam("toEmail", "toEmail");
  }

  if (type.includes("httprequest")) {
    requireParam("url", "url");
  }

  if (type.includes("twilio")) {
    requireParam("from", "from");
    requireParam("to", "to");
  }
}

export function validateN8nWorkflow(json: unknown, filename?: string): ValidationResult {
  const errors: string[] = [];
  const prefix = filename ? `${filename}: ` : "";

  if (!isRecord(json)) {
    return { valid: false, errors: [`${prefix}Workflow must be a JSON object`] };
  }

  if (!Array.isArray(json.nodes) || json.nodes.length === 0) {
    errors.push(`${prefix}Workflow must include a non-empty "nodes" array`);
    return { valid: false, errors };
  }

  const nodes = json.nodes as N8nNode[];
  const triggers = nodes.filter(isTriggerNode);

  if (triggers.length === 0) {
    errors.push(
      `${prefix}Workflow must include at least one trigger node (type contains "trigger" or "webhook")`
    );
  }

  if (!isRecord(json.connections)) {
    errors.push(`${prefix}Workflow must include a "connections" object`);
  } else {
    const connections = json.connections;
    const incoming = collectIncomingNodeNames(connections);
    const nodeNames = new Set(
      nodes.map((n) => n.name).filter((name): name is string => typeof name === "string")
    );

    for (const node of nodes) {
      if (!node.name || isTriggerNode(node)) {
        continue;
      }
      if (!incoming.has(node.name)) {
        errors.push(`${prefix}Orphaned node "${node.name}" has no incoming connection`);
      }
    }

    for (const sourceName of Object.keys(connections)) {
      if (!nodeNames.has(sourceName)) {
        errors.push(`${prefix}Connection source "${sourceName}" does not match any node name`);
      }
    }
  }

  validateNodeBasics(nodes, errors);

  return { valid: errors.length === 0, errors };
}

export function validateAllN8nWorkflows(dir: string): WorkflowFileResult[] {
  const resolved = path.resolve(dir);
  const files = fs
    .readdirSync(resolved)
    .filter((name) => name.endsWith(".workflow.json"))
    .sort();

  return files.map((filename) => {
    const filePath = path.join(resolved, filename);
    const raw = JSON.parse(fs.readFileSync(filePath, "utf-8")) as unknown;
    const result = validateN8nWorkflow(raw, filename);
    return { filename, ...result };
  });
}
