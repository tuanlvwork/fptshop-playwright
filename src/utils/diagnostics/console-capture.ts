import { Page } from '@playwright/test';

export interface ConsoleLogEntry {
    timestamp: string;
    type: 'log' | 'info' | 'warn' | 'error' | 'debug' | 'trace';
    text: string;
    location?: string;
}

export interface PageError {
    timestamp: string;
    message: string;
    stack?: string;
}

/**
 * Console Capture - Captures browser console messages and JavaScript errors
 */
export class ConsoleCapture {
    private logs: ConsoleLogEntry[] = [];
    private errors: PageError[] = [];
    private isRecording: boolean = false;

    /**
     * Start capturing console messages and errors for a page
     */
    async startCapture(page: Page): Promise<void> {
        this.isRecording = true;
        this.logs = [];
        this.errors = [];

        // Capture console messages
        page.on('console', (msg) => {
            if (!this.isRecording) return;

            const type = msg.type() as ConsoleLogEntry['type'];
            const entry: ConsoleLogEntry = {
                timestamp: new Date().toISOString(),
                type,
                text: msg.text(),
                location: msg.location()?.url,
            };

            this.logs.push(entry);

            // Also log errors to a separate array for easy access
            if (type === 'error') {
                this.errors.push({
                    timestamp: entry.timestamp,
                    message: entry.text,
                });
            }
        });

        // Capture page errors (uncaught exceptions)
        page.on('pageerror', (error) => {
            if (!this.isRecording) return;

            this.errors.push({
                timestamp: new Date().toISOString(),
                message: error.message,
                stack: error.stack,
            });
        });
    }

    /**
     * Stop capturing
     */
    stopCapture(): void {
        this.isRecording = false;
    }

    /**
     * Get all console logs
     */
    getLogs(): ConsoleLogEntry[] {
        return [...this.logs];
    }

    /**
     * Get errors only (console errors + page errors)
     */
    getErrors(): PageError[] {
        return [...this.errors];
    }

    /**
     * Get warnings only
     */
    getWarnings(): ConsoleLogEntry[] {
        return this.logs.filter(log => log.type === 'warn');
    }

    /**
     * Check if there are any errors
     */
    hasErrors(): boolean {
        return this.errors.length > 0;
    }

    /**
     * Generate summary report
     */
    getSummary(): string {
        const errors = this.getErrors();
        const warnings = this.getWarnings();

        let summary = `\n🖥️ Console Summary:\n`;
        summary += `   Total Messages: ${this.logs.length}\n`;
        summary += `   Errors: ${errors.length}\n`;
        summary += `   Warnings: ${warnings.length}\n`;

        if (errors.length > 0) {
            summary += `\n❌ Console Errors:\n`;
            errors.slice(0, 10).forEach((err, i) => {
                summary += `   ${i + 1}. ${err.message.substring(0, 200)}\n`;
                if (err.stack) {
                    const firstLine = err.stack.split('\n')[1]?.trim();
                    if (firstLine) {
                        summary += `      at ${firstLine}\n`;
                    }
                }
            });
            if (errors.length > 10) {
                summary += `   ... and ${errors.length - 10} more\n`;
            }
        }

        if (warnings.length > 0) {
            summary += `\n⚠️ Console Warnings:\n`;
            warnings.slice(0, 5).forEach((warn, i) => {
                summary += `   ${i + 1}. ${warn.text.substring(0, 150)}\n`;
            });
            if (warnings.length > 5) {
                summary += `   ... and ${warnings.length - 5} more\n`;
            }
        }

        return summary;
    }

    /**
     * Export logs as JSON
     */
    toJSON(): string {
        return JSON.stringify({
            logs: this.logs,
            errors: this.errors,
            summary: {
                totalLogs: this.logs.length,
                errorCount: this.errors.length,
                warningCount: this.getWarnings().length,
            }
        }, null, 2);
    }

    /**
     * Clear all logs
     */
    clear(): void {
        this.logs = [];
        this.errors = [];
    }
}
