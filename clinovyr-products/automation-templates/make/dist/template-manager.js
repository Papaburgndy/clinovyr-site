"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.TemplateLibrary = void 0;
exports.slugifyCompanyName = slugifyCompanyName;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const PLACEHOLDER_PATTERN = /\{\{([A-Z0-9_]+)\}\}/g;
function isRecord(value) {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function deepClone(value) {
    return JSON.parse(JSON.stringify(value));
}
function walkAndSubstitute(value, replacements, currentPath, substitutions) {
    if (typeof value === "string") {
        let result = value;
        const seen = new Set();
        for (const match of value.matchAll(PLACEHOLDER_PATTERN)) {
            const placeholder = match[0];
            const key = match[1];
            if (seen.has(placeholder)) {
                continue;
            }
            seen.add(placeholder);
            const replacement = replacements.get(placeholder);
            if (replacement !== undefined) {
                substitutions.push({
                    from: placeholder,
                    to: replacement,
                    path: currentPath,
                });
            }
        }
        for (const [placeholder, replacement] of replacements.entries()) {
            result = result.split(placeholder).join(replacement);
        }
        return result;
    }
    if (Array.isArray(value)) {
        return value.map((item, index) => walkAndSubstitute(item, replacements, `${currentPath}[${index}]`, substitutions));
    }
    if (isRecord(value)) {
        const output = {};
        for (const [key, nested] of Object.entries(value)) {
            const nextPath = currentPath ? `${currentPath}.${key}` : key;
            output[key] = walkAndSubstitute(nested, replacements, nextPath, substitutions);
        }
        return output;
    }
    return value;
}
class TemplateLibrary {
    constructor(rootDir = path.resolve(__dirname, "..")) {
        this.manifest = null;
        this.rootDir = rootDir;
    }
    loadCatalog() {
        const manifestPath = path.join(this.rootDir, "templates", "manifest.json");
        if (!fs.existsSync(manifestPath)) {
            throw new Error(`Manifest not found at ${manifestPath}`);
        }
        const raw = JSON.parse(fs.readFileSync(manifestPath, "utf-8"));
        const errors = this.validateManifestStructure(raw);
        if (errors.length > 0) {
            throw new Error(`Invalid manifest structure:\n- ${errors.join("\n- ")}`);
        }
        this.manifest = raw;
        return this.manifest;
    }
    getTemplate(id) {
        const manifest = this.ensureManifest();
        const template = manifest.templates.find((entry) => entry.id === id);
        if (!template) {
            throw new Error(`Template not found: ${id}`);
        }
        return template;
    }
    listTemplates() {
        return [...this.ensureManifest().templates];
    }
    listByVertical(vertical) {
        const normalized = vertical.trim().toLowerCase();
        return this.listTemplates().filter((template) => template.vertical.some((entry) => entry.toLowerCase() === "all") ||
            template.vertical.some((entry) => entry.toLowerCase() === normalized));
    }
    loadBlueprint(templateId) {
        const template = this.getTemplate(templateId);
        const blueprintPath = path.join(this.rootDir, "templates", template.file);
        if (!fs.existsSync(blueprintPath)) {
            throw new Error(`Blueprint file not found: ${blueprintPath}`);
        }
        return JSON.parse(fs.readFileSync(blueprintPath, "utf-8"));
    }
    validateBlueprint(json) {
        const errors = [];
        if (!isRecord(json)) {
            return { valid: false, errors: ["Blueprint must be a JSON object"] };
        }
        if (typeof json.name !== "string" || json.name.trim().length === 0) {
            errors.push('Blueprint must include a non-empty string "name"');
        }
        if (!Array.isArray(json.flow)) {
            errors.push('Blueprint must include a "flow" array');
        }
        else if (json.flow.length === 0) {
            errors.push('"flow" array must contain at least one module entry');
        }
        else {
            json.flow.forEach((module, index) => {
                if (!isRecord(module)) {
                    errors.push(`flow[${index}] must be an object`);
                    return;
                }
                if (typeof module.id !== "number" && typeof module.id !== "string") {
                    errors.push(`flow[${index}] must include an "id"`);
                }
                if (typeof module.module !== "string" || module.module.trim().length === 0) {
                    errors.push(`flow[${index}] must include a "module" string`);
                }
            });
        }
        if (!isRecord(json.metadata)) {
            errors.push('Blueprint must include a "metadata" object');
        }
        else {
            if (typeof json.metadata.templateId !== "string") {
                errors.push('metadata.templateId must be a string');
            }
            if (!Array.isArray(json.metadata.placeholders)) {
                errors.push("metadata.placeholders must be an array");
            }
            else {
                json.metadata.placeholders.forEach((placeholder, index) => {
                    if (typeof placeholder !== "string") {
                        errors.push(`metadata.placeholders[${index}] must be a string`);
                    }
                });
            }
        }
        return { valid: errors.length === 0, errors };
    }
    customizeTemplate(templateId, clientConfig) {
        const blueprint = this.loadBlueprint(templateId);
        const validation = this.validateBlueprint(blueprint);
        if (!validation.valid) {
            throw new Error(`Blueprint validation failed for ${templateId}:\n- ${validation.errors.join("\n- ")}`);
        }
        const replacements = this.buildReplacementMap(clientConfig);
        const substitutions = [];
        const customized = walkAndSubstitute(deepClone(blueprint), replacements, "", substitutions);
        console.log(`\nSubstitutions applied for template "${templateId}":`);
        if (substitutions.length === 0) {
            console.log("  (none)");
        }
        else {
            for (const entry of substitutions) {
                console.log(`  ${entry.path}: ${entry.from} -> ${entry.to}`);
            }
        }
        return {
            blueprint: customized,
            substitutions,
        };
    }
    ensureManifest() {
        if (!this.manifest) {
            return this.loadCatalog();
        }
        return this.manifest;
    }
    validateManifestStructure(raw) {
        const errors = [];
        if (!isRecord(raw)) {
            return ["Manifest root must be an object"];
        }
        if (typeof raw.version !== "string" || raw.version.trim().length === 0) {
            errors.push('"version" must be a non-empty string');
        }
        if (!Array.isArray(raw.templates)) {
            errors.push('"templates" must be an array');
            return errors;
        }
        if (raw.templates.length === 0) {
            errors.push('"templates" must contain at least one entry');
        }
        const ids = new Set();
        raw.templates.forEach((entry, index) => {
            const prefix = `templates[${index}]`;
            if (!isRecord(entry)) {
                errors.push(`${prefix} must be an object`);
                return;
            }
            const requiredStringFields = [
                "id",
                "name",
                "description",
                "estimatedROI",
                "file",
                "customizationGuide",
            ];
            for (const field of requiredStringFields) {
                if (typeof entry[field] !== "string" || String(entry[field]).trim().length === 0) {
                    errors.push(`${prefix}.${field} must be a non-empty string`);
                }
            }
            if (typeof entry.id === "string") {
                if (ids.has(entry.id)) {
                    errors.push(`Duplicate template id: ${entry.id}`);
                }
                ids.add(entry.id);
            }
            if (!Array.isArray(entry.vertical) || entry.vertical.length === 0) {
                errors.push(`${prefix}.vertical must be a non-empty string array`);
            }
            if (!Array.isArray(entry.tools) || entry.tools.length === 0) {
                errors.push(`${prefix}.tools must be a non-empty string array`);
            }
            if (typeof entry.setupTimeMinutes !== "number" ||
                !Number.isFinite(entry.setupTimeMinutes) ||
                entry.setupTimeMinutes <= 0) {
                errors.push(`${prefix}.setupTimeMinutes must be a positive number`);
            }
        });
        return errors;
    }
    buildReplacementMap(clientConfig) {
        const replacements = new Map([
            ["{{COMPANY_NAME}}", clientConfig.companyName],
            ["{{CRM_TYPE}}", clientConfig.crmType],
            ["{{EMAIL_PROVIDER}}", clientConfig.emailProvider],
            ["{{WEBHOOK_URL}}", clientConfig.webhookUrl],
        ]);
        for (const [key, value] of Object.entries(clientConfig.apiKeys)) {
            const normalizedKey = key.startsWith("API_KEY_") ? key : `API_KEY_${key}`;
            replacements.set(`{{${normalizedKey}}}`, value);
        }
        return replacements;
    }
}
exports.TemplateLibrary = TemplateLibrary;
function slugifyCompanyName(name) {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");
}
