# Clinovyr Client Dashboard

Next.js 15 client dashboard for Clinovyr automation clients. Each client signs in via email magic link and views KPIs, automations, reports, and settings.

## Stack

- Next.js 15 App Router, TypeScript, Tailwind CSS
- Recharts for data visualization
- NextAuth.js v5 (Auth.js) — email magic link (Resend or Nodemailer)
- File-based client data in `data/clients/{clientId}/`

## Quick Start

```bash
cd clinovyr-products/dashboard
cp .env.local.example .env.local
# Edit .env.local — set AUTH_SECRET, ADMIN_EMAIL, email provider

npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### Demo credentials

| Role   | Email                  |
|--------|------------------------|
| Client | `demo@demopractice.com` |
| Admin  | Set via `ADMIN_EMAIL` in `.env.local` |

Without Resend configured, Nodemailer sends to a local SMTP server (e.g. [Mailpit](https://github.com/axllent/mailpit) on port 1025).

Generate `AUTH_SECRET`:

```bash
openssl rand -base64 32
```

## File Structure

```
dashboard/
├── data/clients/
│   └── demo-practice/
│       ├── config.json          # Client profile, hours, FAQ
│       ├── automations.json     # Automation list + run logs
│       ├── kpis.json            # Dashboard KPIs + chart data
│       ├── activity.json        # Recent activity feed
│       ├── reports.json         # Report metadata
│       └── reports/             # PDF files
├── src/
│   ├── app/
│   │   ├── dashboard/           # Client pages (protected)
│   │   ├── admin/               # Admin panel (admin only)
│   │   ├── login/               # Magic link sign-in
│   │   └── api/                 # REST endpoints
│   ├── components/
│   │   ├── admin/
│   │   ├── auth/
│   │   ├── dashboard/
│   │   ├── layout/
│   │   └── ui/
│   ├── lib/
│   │   ├── auth.ts              # NextAuth config
│   │   ├── clients.ts           # Data access layer
│   │   ├── report-generator.ts  # Monthly PDF reports
│   │   └── types.ts
│   └── middleware.ts            # Route protection
├── tailwind.config.ts
├── .env.local.example
└── README.md
```

## Pages

| Route                    | Description                              |
|--------------------------|------------------------------------------|
| `/dashboard`             | Overview — KPIs, chart, automations, activity |
| `/dashboard/automations` | Automation table with expandable run logs |
| `/dashboard/reports`     | Monthly PDF reports + generate button    |
| `/dashboard/settings`    | Notifications, escalation, hours, FAQ    |
| `/admin`                 | All clients, MRR summary, quick actions  |

## API Routes

| Method | Route                              | Description                |
|--------|------------------------------------|----------------------------|
| GET    | `/api/dashboard/kpis`              | KPI data for current client |
| GET    | `/api/dashboard/automations`       | Automation list            |
| GET    | `/api/dashboard/reports`           | Report metadata            |
| POST   | `/api/dashboard/reports`           | Download PDF               |
| POST   | `/api/dashboard/report/generate`   | Generate current month report |
| GET/PUT| `/api/dashboard/settings`          | Read/update client settings |
| GET/POST| `/api/admin`                      | Admin client list + actions |

## Adding a Client

Create `data/clients/{clientId}/` with:

- `config.json` — must include `email` matching the sign-in address
- `automations.json`, `kpis.json`, `activity.json`, `reports.json`
- `reports/` directory for PDF files

## Production

```bash
npm run build
npm start
```

Set `NEXTAUTH_URL` to your production domain and configure `RESEND_API_KEY` for email delivery.
