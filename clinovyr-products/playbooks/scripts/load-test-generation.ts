#!/usr/bin/env npx ts-node --project tsconfig.cli.json
import fs from "fs";
import path from "path";
import { renderToBuffer } from "@react-pdf/renderer";
import { loadEnvFromLocalFiles, getOutputPdfDir } from "../src/lib/env";
import { INDUSTRIES } from "../src/lib/industries";
import { ClaudeQueue, runQueuedTasks } from "../src/lib/claude-queue";
import { PlaybookDocument } from "../src/lib/playbook-pdf";
import { loadPlaybook } from "../src/lib/playbook-data";

const PARALLEL = 10;

async function loadTestPdfBuilds(): Promise<void> {
  const tasks = INDUSTRIES.slice(0, PARALLEL).map((config) => async () => {
    const playbook = loadPlaybook(config.slug, 1);
    if (!playbook) {
      throw new Error(`Missing playbook JSON for ${config.slug}`);
    }
    const buffer = await renderToBuffer(PlaybookDocument({ playbook }));
    const outDir = path.join(getOutputPdfDir(), "load-test");
    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }
    const outPath = path.join(outDir, `${config.slug}-load.pdf`);
    fs.writeFileSync(outPath, buffer);
    return { slug: config.slug, bytes: buffer.length };
  });

  console.log(`\nPDF load test: ${PARALLEL} parallel renderToBuffer calls\n`);
  const started = Date.now();
  const results = await runQueuedTasks(tasks, { concurrency: 4 });
  const elapsed = Date.now() - started;

  const ok = results.filter((r) => r.ok).length;
  const fail = results.length - ok;

  for (const [index, result] of results.entries()) {
    const slug = INDUSTRIES[index]?.slug ?? `task-${index}`;
    if (result.ok) {
      console.log(`  OK  ${slug} (${result.value.bytes} bytes)`);
    } else {
      console.log(`  FAIL ${slug}: ${result.error}`);
    }
  }

  console.log(`\nPDF load test: ${ok} succeeded, ${fail} failed (${elapsed}ms)\n`);
  process.exit(fail > 0 ? 1 : 0);
}

async function loadTestClaudeQueue(): Promise<void> {
  console.log(`\nClaude queue simulation: ${PARALLEL} tasks (mock, no API)\n`);
  const queue = new ClaudeQueue({ concurrency: 2, baseDelayMs: 100 });

  const tasks = Array.from({ length: PARALLEL }, (_, i) => async () => {
    await new Promise((r) => setTimeout(r, 50 + i * 10));
    if (i === 7) {
      const err = new Error("429 rate limit");
      throw err;
    }
    return { chapter: i + 1 };
  });

  const started = Date.now();
  const settled = await Promise.all(
    tasks.map((task, i) =>
      queue.enqueue(task).then(
        (value) => ({ ok: true as const, i, value }),
        (error) => ({
          ok: false as const,
          i,
          error: error instanceof Error ? error.message : String(error),
        }),
      ),
    ),
  );
  const elapsed = Date.now() - started;

  const ok = settled.filter((r) => r.ok).length;
  const fail = settled.length - ok;

  for (const row of settled) {
    if (row.ok) {
      console.log(`  OK  task ${row.i}`);
    } else {
      console.log(`  FAIL task ${row.i}: ${row.error}`);
    }
  }

  console.log(
    `\nQueue simulation: ${ok} succeeded, ${fail} failed (${elapsed}ms)\n`,
  );
}

async function main(): Promise<void> {
  loadEnvFromLocalFiles();
  const mode = process.argv[2] ?? "pdf";

  if (mode === "queue") {
    await loadTestClaudeQueue();
    return;
  }

  await loadTestPdfBuilds();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
