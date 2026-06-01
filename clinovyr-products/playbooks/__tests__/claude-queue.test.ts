import { ClaudeQueue, runQueuedTasks } from "@/lib/claude-queue";

describe("ClaudeQueue", () => {
  it("limits concurrency", async () => {
    let maxActive = 0;
    let active = 0;
    const queue = new ClaudeQueue({ concurrency: 2 });

    const tasks = Array.from({ length: 5 }, () => () =>
      queue.enqueue(async () => {
        active += 1;
        maxActive = Math.max(maxActive, active);
        await new Promise((r) => setTimeout(r, 30));
        active -= 1;
        return true;
      }),
    );

    await Promise.all(tasks);
    expect(maxActive).toBeLessThanOrEqual(2);
  });

  it("retries rate-limited tasks", async () => {
    let attempts = 0;
    const results = await runQueuedTasks(
      [
        async () => {
          attempts += 1;
          if (attempts < 2) {
            throw new Error("429 rate limit exceeded");
          }
          return "ok";
        },
      ],
      { concurrency: 1, baseDelayMs: 10, maxRetries: 3 },
    );

    expect(results[0]?.ok).toBe(true);
    if (results[0]?.ok) {
      expect(results[0].value).toBe("ok");
    }
  });
});
