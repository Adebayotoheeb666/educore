/**
 * Client-side rate limiting and request throttling utility.
 * Works in tandem with server-side rate limiting on Edge Functions.
 * 
 * Prevents:
 * - Accidental API quota exhaustion
 * - DOS-like behavior from users
 * - Excessive costs from Gemini API calls
 */

interface RateLimitConfig {
  maxRequests: number;
  windowMs: number; // Time window in milliseconds
}

interface RequestRecord {
  timestamp: number;
}

/**
 * Sliding window rate limiter
 * Tracks requests per action and enforces limits
 */
class RateLimiter {
  private requests: Map<string, RequestRecord[]> = new Map();

  // Default limits per action (can be customized)
  private limits: Record<string, RateLimitConfig> = {
    // Expensive operations (AI generation)
    generateLessonNote: { maxRequests: 5, windowMs: 60000 }, // 5 per minute
    generateQuestions: { maxRequests: 10, windowMs: 60000 }, // 10 per minute
    gradeScript: { maxRequests: 20, windowMs: 60000 }, // 20 per minute
    generateStudentPerformanceInsight: { maxRequests: 10, windowMs: 60000 }, // 10 per minute
    chatWithStudyAssistant: { maxRequests: 30, windowMs: 60000 }, // 30 per minute
    predictAttendanceIssues: { maxRequests: 5, windowMs: 60000 }, // 5 per minute

    // Moderate operations (read/write data)
    createStudent: { maxRequests: 50, windowMs: 60000 }, // 50 per minute
    bulkImport: { maxRequests: 3, windowMs: 300000 }, // 3 per 5 minutes
    createGrade: { maxRequests: 100, windowMs: 60000 }, // 100 per minute
    recordAttendance: { maxRequests: 200, windowMs: 60000 }, // 200 per minute

    // General rate limit per user
    anyRequest: { maxRequests: 500, windowMs: 60000 }, // 500 requests per minute max
  };

  /**
   * Check if a request is allowed under rate limits
   * Returns { allowed: boolean, retryAfter?: number }
   */
  public checkLimit(action: string, identifier: string = "general"): { allowed: boolean; retryAfter?: number } {
    const key = `${action}:${identifier}`;
    const now = Date.now();

    // Get limit config for this action
    const config = this.limits[action] || this.limits.anyRequest;

    // Get request history
    let records = this.requests.get(key) || [];

    // Clean old records (outside the time window)
    records = records.filter((r) => now - r.timestamp < config.windowMs);

    // Check if limit exceeded
    if (records.length >= config.maxRequests) {
      const oldestRecord = records[0];
      const retryAfter = Math.ceil((oldestRecord.timestamp + config.windowMs - now) / 1000);
      return { allowed: false, retryAfter };
    }

    // Add new request
    records.push({ timestamp: now });
    this.requests.set(key, records);

    return { allowed: true };
  }

  /**
   * Get current request count for monitoring
   */
  public getRequestCount(action: string, identifier: string = "general"): number {
    const key = `${action}:${identifier}`;
    const records = this.requests.get(key) || [];
    const config = this.limits[action] || this.limits.anyRequest;
    const now = Date.now();

    // Return count of non-expired requests
    return records.filter((r) => now - r.timestamp < config.windowMs).length;
  }

  /**
   * Get remaining requests for an action
   */
  public getRemainingRequests(action: string, identifier: string = "general"): number {
    const config = this.limits[action] || this.limits.anyRequest;
    const current = this.getRequestCount(action, identifier);
    return Math.max(0, config.maxRequests - current);
  }

  /**
   * Reset all rate limit records (useful for testing or user actions)
   */
  public reset(action?: string): void {
    if (action) {
      this.requests.delete(action);
    } else {
      this.requests.clear();
    }
  }

  /**
   * Customize rate limit for an action
   */
  public setLimit(action: string, maxRequests: number, windowMs: number): void {
    this.limits[action] = { maxRequests, windowMs };
  }

  /**
   * Get all limit configurations
   */
  public getLimits(): Record<string, RateLimitConfig> {
    return { ...this.limits };
  }
}

// Export singleton instance
export const rateLimiter = new RateLimiter();

/**
 * Debounce utility - prevents rapid successive calls
 * Useful for search inputs, auto-save, etc.
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return function (...args: Parameters<T>) {
    if (timeoutId) clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delayMs);
  };
}

/**
 * Throttle utility - limit function calls to once per interval
 * Useful for resize listeners, scroll events, etc.
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  delayMs: number
): (...args: Parameters<T>) => void {
  let lastCallTime = 0;

  return function (...args: Parameters<T>) {
    const now = Date.now();
    if (now - lastCallTime >= delayMs) {
      lastCallTime = now;
      func(...args);
    }
  };
}

/**
 * Exponential backoff retry utility
 * Retries failed requests with increasing delays
 */
export async function retryWithBackoff<T>(
  fn: () => Promise<T>,
  options: {
    maxAttempts?: number;
    initialDelayMs?: number;
    maxDelayMs?: number;
    backoffMultiplier?: number;
  } = {}
): Promise<T> {
  const {
    maxAttempts = 3,
    initialDelayMs = 1000,
    maxDelayMs = 30000,
    backoffMultiplier = 2,
  } = options;

  let lastError: Error | null = null;

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error as Error;

      if (attempt < maxAttempts - 1) {
        // Calculate delay with exponential backoff
        const delay = Math.min(
          initialDelayMs * Math.pow(backoffMultiplier, attempt),
          maxDelayMs
        );

        // Add jitter to prevent thundering herd
        const jitter = Math.random() * delay * 0.1;
        await new Promise((resolve) => setTimeout(resolve, delay + jitter));
      }
    }
  }

  throw new Error(`Failed after ${maxAttempts} attempts: ${lastError?.message}`);
}

/**
 * Queue for batching requests
 * Useful for bulk operations (attendance, grades)
 */
export class RequestQueue {
  private queue: Array<{ fn: () => Promise<any>; resolve: (value: any) => void; reject: (error: any) => void }> =
    [];
  private processing = false;
  private concurrency: number;

  constructor(concurrency: number = 1) {
    this.concurrency = concurrency;
  }

  /**
   * Add request to queue
   */
  public enqueue<T>(fn: () => Promise<T>): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({ fn, resolve, reject });
      this.process();
    });
  }

  /**
   * Process queue items concurrently
   */
  private async process(): Promise<void> {
    if (this.processing) return;
    this.processing = true;

    const workers = Array(this.concurrency).fill(null).map(() => this.worker());
    await Promise.all(workers);

    this.processing = false;
  }

  /**
   * Worker to process queue items
   */
  private async worker(): Promise<void> {
    while (this.queue.length > 0) {
      const item = this.queue.shift();
      if (!item) break;

      try {
        const result = await item.fn();
        item.resolve(result);
      } catch (error) {
        item.reject(error);
      }
    }
  }

  /**
   * Get queue size
   */
  public size(): number {
    return this.queue.length;
  }

  /**
   * Clear queue
   */
  public clear(): void {
    this.queue = [];
  }
}

/**
 * Monitor rate limit status and show warnings
 * Useful for UI feedback
 */
export function createRateLimitMonitor(action: string, userId: string) {
  return {
    isApproachingLimit(): boolean {
      const remaining = rateLimiter.getRemainingRequests(action, userId);
      const config = rateLimiter.getLimits()[action];
      return remaining <= Math.ceil(config.maxRequests * 0.2); // 20% remaining
    },

    getRemainingRequests(): number {
      return rateLimiter.getRemainingRequests(action, userId);
    },

    getWarningMessage(): string | null {
      const remaining = this.getRemainingRequests();
      if (remaining === 0) return `Rate limit reached for ${action}. Please try again later.`;
      if (remaining <= 2) return `Only ${remaining} ${action} requests remaining.`;
      return null;
    },
  };
}
