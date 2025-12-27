import { Page, Request, Response } from '@playwright/test';

export interface NetworkLogEntry {
    timestamp: string;
    method: string;
    url: string;
    resourceType: string;
    status?: number;
    statusText?: string;
    duration?: number;
    size?: number;
    error?: string;
    requestHeaders?: Record<string, string>;
    responseHeaders?: Record<string, string>;
}

export interface SlowRequest {
    url: string;
    duration: number;
    method: string;
}

export interface FailedRequest {
    url: string;
    method: string;
    status?: number;
    error?: string;
}

/**
 * Network Logger - Tracks all HTTP requests/responses
 * Identifies slow requests, failed requests, and generates HAR-like logs
 */
export class NetworkLogger {
    private logs: NetworkLogEntry[] = [];
    private requestStartTimes: Map<string, number> = new Map();
    private slowThresholdMs: number = 2000; // 2 seconds
    private isRecording: boolean = false;
    private page?: Page;

    constructor(slowThresholdMs: number = 2000) {
        this.slowThresholdMs = slowThresholdMs;
    }

    /**
     * Start recording network activity for a page
     */
    async startRecording(page: Page): Promise<void> {
        this.page = page;
        this.isRecording = true;
        this.logs = [];
        this.requestStartTimes.clear();

        // Track request start
        page.on('request', (request: Request) => {
            if (!this.isRecording) return;

            const requestId = `${request.method()}-${request.url()}-${Date.now()}`;
            this.requestStartTimes.set(request.url(), Date.now());

            const entry: NetworkLogEntry = {
                timestamp: new Date().toISOString(),
                method: request.method(),
                url: request.url(),
                resourceType: request.resourceType(),
                requestHeaders: request.headers(),
            };

            this.logs.push(entry);
        });

        // Track request completion
        page.on('response', async (response: Response) => {
            if (!this.isRecording) return;

            const request = response.request();
            const startTime = this.requestStartTimes.get(request.url());
            const duration = startTime ? Date.now() - startTime : undefined;

            // Find and update the corresponding log entry
            const entry = this.logs.find(
                l => l.url === request.url() && l.method === request.method() && !l.status
            );

            if (entry) {
                entry.status = response.status();
                entry.statusText = response.statusText();
                entry.duration = duration;
                entry.responseHeaders = response.headers();

                try {
                    const body = await response.body();
                    entry.size = body.length;
                } catch {
                    // Response body may not be available
                }
            }
        });

        // Track request failures
        page.on('requestfailed', (request: Request) => {
            if (!this.isRecording) return;

            const entry = this.logs.find(
                l => l.url === request.url() && l.method === request.method() && !l.status && !l.error
            );

            if (entry) {
                entry.error = request.failure()?.errorText || 'Unknown error';
            }
        });
    }

    /**
     * Stop recording and return summary
     */
    stopRecording(): void {
        this.isRecording = false;
    }

    /**
     * Get all network logs
     */
    getLogs(): NetworkLogEntry[] {
        return [...this.logs];
    }

    /**
     * Get slow requests (above threshold)
     */
    getSlowRequests(): SlowRequest[] {
        return this.logs
            .filter(log => log.duration && log.duration > this.slowThresholdMs)
            .map(log => ({
                url: log.url,
                duration: log.duration!,
                method: log.method,
            }))
            .sort((a, b) => b.duration - a.duration);
    }

    /**
     * Get failed requests (4xx, 5xx, or network errors)
     */
    getFailedRequests(): FailedRequest[] {
        return this.logs
            .filter(log => log.error || (log.status && log.status >= 400))
            .map(log => ({
                url: log.url,
                method: log.method,
                status: log.status,
                error: log.error,
            }));
    }

    /**
     * Get API calls only (fetch, xhr)
     */
    getApiCalls(): NetworkLogEntry[] {
        return this.logs.filter(
            log => log.resourceType === 'fetch' || log.resourceType === 'xhr'
        );
    }

    /**
     * Generate summary report for failures
     */
    getSummary(): string {
        const totalRequests = this.logs.length;
        const failedRequests = this.getFailedRequests();
        const slowRequests = this.getSlowRequests();
        const apiCalls = this.getApiCalls();

        let summary = `\n📡 Network Summary:\n`;
        summary += `   Total Requests: ${totalRequests}\n`;
        summary += `   API Calls: ${apiCalls.length}\n`;
        summary += `   Failed Requests: ${failedRequests.length}\n`;
        summary += `   Slow Requests (>${this.slowThresholdMs}ms): ${slowRequests.length}\n`;

        if (failedRequests.length > 0) {
            summary += `\n❌ Failed Requests:\n`;
            failedRequests.forEach(req => {
                summary += `   ${req.method} ${req.url}\n`;
                summary += `     Status: ${req.status || 'N/A'}, Error: ${req.error || 'N/A'}\n`;
            });
        }

        if (slowRequests.length > 0) {
            summary += `\n🐢 Slow Requests:\n`;
            slowRequests.slice(0, 5).forEach(req => {
                summary += `   ${req.method} ${req.url} (${req.duration}ms)\n`;
            });
        }

        return summary;
    }

    /**
     * Export logs as JSON (HAR-like format)
     */
    toJSON(): string {
        return JSON.stringify({
            version: '1.0',
            creator: 'playwright-diagnostics',
            entries: this.logs,
            summary: {
                totalRequests: this.logs.length,
                failedRequests: this.getFailedRequests().length,
                slowRequests: this.getSlowRequests().length,
            }
        }, null, 2);
    }

    /**
     * Clear all logs
     */
    clear(): void {
        this.logs = [];
        this.requestStartTimes.clear();
    }
}
