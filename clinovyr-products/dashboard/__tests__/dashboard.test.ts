import fs from "fs/promises";
import path from "path";
import { spawn } from "child_process";
import { GET as getKpis } from "@/app/api/dashboard/kpis/route";
import { getAuthRedirectPath } from "@/lib/auth-middleware";
import {
  aggregateKpisFromRuns,
  computeHoursSaved,
} from "@/lib/kpi-aggregation";
import {
  KPI_TEST_CLIENT_ID,
  removeKpiTestClient,
  seedKpiTestClient,
} from "./helpers/seed-kpi-test-client";

const mockAuth = jest.fn();

jest.mock("@/lib/auth", () => ({
  auth: () => mockAuth(),
}));

describe("KPI aggregation", () => {
  beforeAll(async () => {
    await seedKpiTestClient();
  });

  afterAll(async () => {
    await removeKpiTestClient();
  });

  it("aggregates 500 tasks from 50 runs with correct hoursSaved", async () => {
    const runsDir = path.join(
      process.cwd(),
      "data",
      "clients",
      KPI_TEST_CLIENT_ID,
      "runs"
    );
    const files = await fs.readdir(runsDir);
    const runs = await Promise.all(
      files
        .filter((f) => f.endsWith(".json"))
        .map(async (f) => {
          const raw = await fs.readFile(path.join(runsDir, f), "utf-8");
          return JSON.parse(raw) as {
            tasksProcessed: number;
            status: string;
          };
        })
    );

    expect(runs).toHaveLength(50);
    const totalTasks = runs.reduce((s, r) => s + r.tasksProcessed, 0);
    expect(totalTasks).toBe(500);

    const automationsRaw = await fs.readFile(
      path.join(
        process.cwd(),
        "data",
        "clients",
        KPI_TEST_CLIENT_ID,
        "automations.json"
      ),
      "utf-8"
    );
    const automations = JSON.parse(automationsRaw) as Parameters<
      typeof aggregateKpisFromRuns
    >[1];

    const kpis = aggregateKpisFromRuns(
      runs as Parameters<typeof aggregateKpisFromRuns>[0],
      automations
    );
    expect(kpis.tasksAutomated).toBe(500);
    expect(kpis.hoursSaved).toBe(computeHoursSaved(500));
    expect(kpis.hoursSaved).toBe(72);
  });

  it("GET /api/dashboard/kpis returns seeded KPIs for test client", async () => {
    mockAuth.mockResolvedValue({
      user: { email: "kpi-test@clinovyr.test" },
    });

    const response = await getKpis(
      new Request("http://localhost/api/dashboard/kpis")
    );
    const body = await response.json();

    expect(response.status).toBe(200);
    expect(body.tasksAutomated).toBe(500);
    expect(body.hoursSaved).toBe(computeHoursSaved(500));
  });
});

describe("Report PDF size (integration)", () => {
  it(
    "renders real PDF larger than 50KB via ts-node",
    async () => {
      await new Promise<void>((resolve, reject) => {
        const child = spawn("npx", ["ts-node", "scripts/verify-report-pdf-size.ts"], {
          cwd: process.cwd(),
          stdio: ["ignore", "pipe", "pipe"],
        });
        let output = "";
        child.stdout?.on("data", (c) => {
          output += c.toString();
        });
        child.stderr?.on("data", (c) => {
          output += c.toString();
        });
        child.on("close", (code) => {
          if (code !== 0) {
            reject(new Error(output));
          } else {
            expect(output).toContain("PDF ok");
            resolve();
          }
        });
      });
    },
    60_000
  );
});

describe("Auth protection", () => {
  it("redirects unauthenticated /dashboard to /login", () => {
    expect(getAuthRedirectPath("/dashboard", false, false)).toBe("/login");
    expect(getAuthRedirectPath("/dashboard/automations", false, false)).toBe(
      "/login"
    );
  });

  it("redirects non-admin /admin to /dashboard", () => {
    expect(getAuthRedirectPath("/admin", true, false)).toBe("/dashboard");
  });

  it("allows admin access to /admin", () => {
    expect(getAuthRedirectPath("/admin", true, true)).toBeNull();
  });
});

describe("Cron dry-run", () => {
  const seededClients = [
    "granite-bay-dental",
    "roseville-realty",
    "sierra-construction",
  ];

  it(
    "runs monthly-reports --dry-run for all seeded clients without error",
    async () => {
      const hasSeeded = await Promise.all(
        seededClients.map(async (id) => {
          try {
            await fs.access(
              path.join(process.cwd(), "data", "clients", id, "config.json")
            );
            return true;
          } catch {
            return false;
          }
        })
      );

      if (!hasSeeded.every(Boolean)) {
        console.warn(
          "Skipping cron dry-run: run `npm run seed` first to create test clients."
        );
        return;
      }

      await new Promise<void>((resolve, reject) => {
        const child = spawn(
          "npx",
          ["ts-node", "src/cron/monthly-reports.ts", "--dry-run"],
          {
            cwd: process.cwd(),
            env: { ...process.env, ANTHROPIC_API_KEY: "" },
            stdio: ["ignore", "pipe", "pipe"],
          }
        );

        let output = "";
        child.stdout?.on("data", (chunk) => {
          output += chunk.toString();
        });
        child.stderr?.on("data", (chunk) => {
          output += chunk.toString();
        });

        child.on("close", (code) => {
          if (code !== 0) {
            reject(new Error(`cron dry-run exited ${code}: ${output}`));
            return;
          }
          for (const id of seededClients) {
            expect(output).toContain(id);
          }
          resolve();
        });
      });
    },
    60_000
  );
});
