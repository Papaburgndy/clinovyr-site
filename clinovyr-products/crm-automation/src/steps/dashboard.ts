import { recordApiCall } from "../hubspot-client.js";
import { writeJsonFile } from "../utils/output.js";
import type { DashboardWidget, SetupContext } from "../types.js";

function buildDashboardWidgets(companyName: string): DashboardWidget[] {
  return [
    {
      title: "New Leads This Week",
      type: "Single object report — Contacts",
      status: "documented",
      setupInstructions:
        "Reports → Create report → Single object → Contacts. Filter: Create date is this week AND lifecycle stage is Lead. Visualization: Summary count.",
    },
    {
      title: "Avg Time to First Response",
      type: "Custom report — Time between create date and first outreach",
      status: "documented",
      setupInstructions:
        "Reports → Create report → Contacts. Add calculated field or use time between contact create date and first logged call/email. Aggregation: Average. Date range: Last 30 days.",
    },
    {
      title: "Email Sequence Conversion Rate",
      type: "Funnel report — Sequence enrollment to meeting booked",
      status: "documented",
      setupInstructions:
        "Reports → Funnel report. Stage 1: Contacts enrolled in nurture workflow. Stage 2: Contacts with meeting booked or lifecycle stage SQL. Filter by email sequence workflow name.",
    },
    {
      title: "Leads by Source",
      type: "Bar chart — Contacts by original source",
      status: "documented",
      setupInstructions:
        "Reports → Create report → Contacts. Breakdown: Original source / lead_source_detail. Filter: Lifecycle stage is Lead. Visualization: Vertical bar chart.",
    },
  ];
}

export async function runDashboardStep(context: SetupContext): Promise<void> {
  console.log("\n=== STEP 5 — Dashboard ===");

  const dashboardName = `${context.config.companyName} — AI CRM Dashboard`;
  const widgets = buildDashboardWidgets(context.config.companyName);

  if (context.dryRun) {
    recordApiCall(context.apiCalls, {
      step: "dashboard",
      method: "POST",
      endpoint: "/reports/v2/dashboards",
      status: "mock",
      message: "Dry run — dashboard instructions only",
    });
    console.log("  ○ Dashboard creation skipped (dry run — HubSpot dashboard API is limited)");
  } else {
    recordApiCall(context.apiCalls, {
      step: "dashboard",
      method: "POST",
      endpoint: "/reports/v2/dashboards",
      status: "skipped",
      message: "Custom dashboards must be created manually in HubSpot UI",
    });
    console.log(
      "  ○ HubSpot custom dashboard API is not publicly available — generating setup instructions",
    );
  }

  for (const widget of widgets) {
    console.log(`    • ${widget.title}`);
  }

  const instructionsPath = writeJsonFile(
    `output/dashboard-setup-${context.config.clientId}.json`,
    {
      dashboardName,
      widgets,
      manualSteps: [
        `HubSpot → Reports → Dashboards → Create dashboard → Name: "${dashboardName}"`,
        "Add each widget report using the instructions in the widgets array",
        "Share dashboard with sales and marketing teams",
        "Pin dashboard to the CRM home screen for daily review",
      ],
    },
  );

  context.dashboard = { name: dashboardName, widgets };
  console.log(`  Dashboard instructions exported: ${instructionsPath}`);
}
