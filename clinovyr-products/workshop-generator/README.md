# Clinovyr Workshop Generator

Node.js CLI that uses Claude to draft a customized AI workshop outline, then builds a branded PowerPoint deck and Markdown facilitator guide.

## Prerequisites

- Node.js 18+
- [Anthropic API key](https://console.anthropic.com/) with access to Claude Sonnet

## Setup

```bash
cd clinovyr-products/workshop-generator
npm install
```

Copy `.env.local.example` to `.env.local` and set your key, or export it:

```bash
export ANTHROPIC_API_KEY=sk-ant-...
```

The CLI also loads `ANTHROPIC_API_KEY` from `.env.local` in this folder or the repo root (`../../.env.local` when run from here).

## Usage

```bash
npm run generate -- \
  --industry "Medical" \
  --company "Granite Bay Dental" \
  --audience "office managers and dentists" \
  --duration 90
```

Or directly:

```bash
npx ts-node generate-workshop.ts \
  --industry "Medical" \
  --company "Granite Bay Dental" \
  --audience "office managers and dentists" \
  --duration 90
```

| Flag | Required | Default | Description |
|------|----------|---------|-------------|
| `--industry` | Yes | — | Target industry (e.g. Medical, Legal) |
| `--company` | Yes | — | Host company name (used in examples) |
| `--audience` | Yes | — | Who is in the room |
| `--duration` | No | `90` | Total workshop minutes |

## Output

Files are written to `output/`:

- `{company-slug}-{YYYY-MM-DD}-workshop.pptx` — branded deck
- `{company-slug}-{YYYY-MM-DD}-guide.md` — full speaker notes per slide

## Dry-run (no API key)

If `ANTHROPIC_API_KEY` is not set, the tool logs a warning and uses a built-in fallback outline so you can verify PPTX and guide generation without calling Claude.

## Verify compile

```bash
npx tsc --noEmit
npx ts-node --transpile-only generate-workshop.ts --help
```

(Use valid `--industry`, `--company`, and `--audience` to generate; omitting them prints usage and exits.)

## Project layout

```
workshop-generator/
├── generate-workshop.ts   # CLI entry
├── lib/
│   ├── types.ts
│   ├── claude-outline.ts  # Claude API + JSON parse/retries
│   ├── build-pptx.ts      # pptxgenjs deck builder
│   └── build-guide.ts     # Markdown facilitator guide
├── output/                # Generated artifacts (gitignored)
├── tsconfig.json
└── package.json
```
