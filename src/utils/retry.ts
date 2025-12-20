/**
 * Utility for retrying specific actions/steps that may fail due to 
 * network issues, timing problems, or other transient errors.
 */

export interface RetryOptions {
    /** Maximum number of retry attempts (default: 3) */
    maxAttempts?: number;
    /** Delay between retries in milliseconds (default: 1000) */
    delayMs?: number;
    /** Whether to use exponential backoff (default: true) */
    exponentialBackoff?: boolean;
    /** Custom error message on final failure */
    errorMessage?: string;
    /** Callback for logging retry attempts */
    onRetry?: (attempt: number, error: Error) => void;
}

const defaultOptions: Required<RetryOptions> = {
    maxAttempts: 3,
    delayMs: 1000,
    exponentialBackoff: true,
    errorMessage: 'Action failed after all retry attempts',
    onRetry: () => { },
};

/**
 * Retry a function/action multiple times before failing.
 * 
 * @example
 * // In step definition:
 * await retry(async () => {
 *     await page.goto('https://example.com');
 * }, { maxAttempts: 3, delayMs: 2000 });
 * 
 * @example
 * // With custom error handling:
 * await retry(
 *     async () => await page.click('#button'),
 *     { 
 *         maxAttempts: 5,
 *         onRetry: (attempt, error) => console.log(`Retry ${attempt}: ${error.message}`)
 *     }
 * );
 */
export async function retry<T>(
    action: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const opts = { ...defaultOptions, ...options };
    let lastError: Error = new Error('Unknown error');

    for (let attempt = 1; attempt <= opts.maxAttempts; attempt++) {
        try {
            return await action();
        } catch (error) {
            lastError = error instanceof Error ? error : new Error(String(error));

            if (attempt < opts.maxAttempts) {
                opts.onRetry(attempt, lastError);

                // Calculate delay with optional exponential backoff
                const delay = opts.exponentialBackoff
                    ? opts.delayMs * Math.pow(2, attempt - 1)
                    : opts.delayMs;

                console.log(`⚠️  Attempt ${attempt}/${opts.maxAttempts} failed: ${lastError.message}`);
                console.log(`   Retrying in ${delay}ms...`);

                await sleep(delay);
            }
        }
    }

    // All attempts failed
    throw new Error(`${opts.errorMessage}: ${lastError.message}`);
}

/**
 * Retry specifically for page navigation actions.
 * Pre-configured with optimal settings for network-related failures.
 */
export async function retryNavigation<T>(
    action: () => Promise<T>,
    options: Partial<RetryOptions> = {}
): Promise<T> {
    return retry(action, {
        maxAttempts: 3,
        delayMs: 2000,
        exponentialBackoff: true,
        errorMessage: 'Navigation failed after retries',
        ...options,
    });
}

/**
 * Retry specifically for element interactions (click, type, etc.).
 * Pre-configured with optimal settings for timing-related failures.
 */
export async function retryInteraction<T>(
    action: () => Promise<T>,
    options: Partial<RetryOptions> = {}
): Promise<T> {
    return retry(action, {
        maxAttempts: 3,
        delayMs: 500,
        exponentialBackoff: false,
        errorMessage: 'Element interaction failed after retries',
        ...options,
    });
}

/**
 * Sleep for a specified duration.
 */
function sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
}
