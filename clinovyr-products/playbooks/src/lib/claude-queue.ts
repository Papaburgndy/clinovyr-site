/**
 * Simple in-process queue for Anthropic API calls with concurrency and backoff.
 */

export type QueueTask<T> = () => Promise<T>;

export type ClaudeQueueOptions = {
  concurrency?: number;
  maxRetries?: number;
  baseDelayMs?: number;
  isRateLimitError?: (error: unknown) => boolean;
};

const DEFAULT_OPTIONS: Required<ClaudeQueueOptions> = {
  concurrency: 2,
  maxRetries: 4,
  baseDelayMs: 2000,
  isRateLimitError: (error: unknown) => {
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null && "status" in error
          ? String((error as { status?: number }).status)
          : String(error);
    return /429|rate.?limit|overloaded/i.test(message);
  },
};

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export class ClaudeQueue {
  private readonly options: Required<ClaudeQueueOptions>;
  private active = 0;
  private readonly pending: Array<{
    task: QueueTask<unknown>;
    resolve: (value: unknown) => void;
    reject: (reason: unknown) => void;
  }> = [];

  constructor(options: ClaudeQueueOptions = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
  }

  enqueue<T>(task: QueueTask<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.pending.push({
        task: task as QueueTask<unknown>,
        resolve: resolve as (value: unknown) => void,
        reject,
      });
      this.pump();
    });
  }

  private pump(): void {
    while (
      this.active < this.options.concurrency &&
      this.pending.length > 0
    ) {
      const item = this.pending.shift();
      if (!item) break;
      this.active += 1;
      void this.runWithRetry(item.task)
        .then(item.resolve)
        .catch(item.reject)
        .finally(() => {
          this.active -= 1;
          this.pump();
        });
    }
  }

  private async runWithRetry<T>(task: QueueTask<T>): Promise<T> {
    let lastError: unknown;

    for (let attempt = 0; attempt <= this.options.maxRetries; attempt++) {
      try {
        return await task();
      } catch (error) {
        lastError = error;
        const canRetry =
          attempt < this.options.maxRetries &&
          this.options.isRateLimitError(error);

        if (!canRetry) {
          throw error;
        }

        const delay = this.options.baseDelayMs * Math.pow(2, attempt);
        await sleep(delay);
      }
    }

    throw lastError;
  }
}

export async function runQueuedTasks<T>(
  tasks: Array<QueueTask<T>>,
  options?: ClaudeQueueOptions,
): Promise<Array<{ ok: true; value: T } | { ok: false; error: string }>> {
  const queue = new ClaudeQueue(options);
  return Promise.all(
    tasks.map(async (task) => {
      try {
        const value = await queue.enqueue(task);
        return { ok: true as const, value };
      } catch (error) {
        return {
          ok: false as const,
          error: error instanceof Error ? error.message : String(error),
        };
      }
    }),
  );
}
