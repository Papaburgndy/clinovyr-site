# Clinovyr Industry AI Playbooks

Generate, build, and sell industry-specific AI implementation playbooks.

## Structure

```
playbooks/
├── src/
│   ├── generate-playbook.ts    # CLI — Claude multi-call generator
│   ├── build-pdf.ts            # CLI — JSON → PDF via @react-pdf/renderer
│   ├── app/                    # Next.js 15 sales pages + API routes
│   ├── components/
│   └── lib/                    # types, Claude, Stripe, Resend, PDF
├── content/playbooks/{slug}/   # Generated JSON (v1.json, etc.)
├── output/pdfs/                # Generated PDFs
└── public/previews/{slug}/     # Sales page sample images
```

## Setup

```bash
cd clinovyr-products/playbooks
cp .env.local.example .env.local
npm install
```

Required env vars: `ANTHROPIC_API_KEY`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `RESEND_API_KEY`, `SITE_URL`.

## Commands

### Generate playbook JSON

```bash
# Single industry (Claude API — 11 calls per playbook)
npm run generate -- --industry "Medical" --version 1

# All 5 industries
npm run generate:all -- --version 1

# Fallback content without API calls
npm run generate -- --industry "Medical" --version 1 --dry-run
npm run generate:all -- --version 1 --dry-run
```

Industries: **Medical**, **Real Estate**, **Legal**, **Construction**, **Wellness**

Output: `content/playbooks/{slug}/v{version}.json`

### Build PDF

```bash
npm run build-pdf -- --industry medical --version 1
npm run build-pdf:all -- --version 1
```

Output: `output/pdfs/{slug}-v{version}.pdf`

### Next.js dev & build

```bash
npm run dev      # http://localhost:3000
npm run build
```

Sales pages: `/playbooks/medical`, `/playbooks/real-estate`, etc.

## Stripe flow

1. Customer clicks **Purchase** on `/playbooks/[industry]`
2. `POST /api/playbook-checkout` creates Stripe Checkout session ($497)
3. On payment: `POST /api/playbook-webhook` sends PDF via Resend
4. Customer downloads via `/api/playbook-download?session_id=...`

## Quality assurance

```bash
npm test                    # Jest: validators, webhook idempotency, Stripe helpers, queue
npm run validate:content    # All 5 playbook JSON files (8k+ words, tools, prompts)
npm run build-pdf:all -- --version 1
npm run verify:pdfs         # Page count, file size, pdf-parse structure
npm run load-test           # 10 parallel PDF renders
npm run load-test:queue     # Claude queue simulation (no API)
```

Stripe webhook replay and test cards: see `docs/STRIPE_WEBHOOK_TESTING.md`.

Playwright E2E (optional, requires `sk_test_` keys):

```bash
SITE_URL=http://localhost:3000 npm run dev
npx playwright test
```

## Playbook JSON schema

Each playbook includes 7 chapters, tool directory, prompt library, ROI calculator, and checklist pages — assembled from separate Claude calls for quality and token limits.

## Clinovyr brand colors (PDF & UI)

- ink `#0d0f12` · paper `#f5f2ed` · accent `#1a6b5a` · gold `#c49a3c`
