import { Page } from '@playwright/test';
import * as fs from 'fs';
import * as path from 'path';
import { NetworkLogger } from './network-logger';
import { ConsoleCapture } from './console-capture';
import { PerformanceTracker } from './performance-tracker';

export interface DiagnosticsConfig {
    enableNetworkLogging?: boolean;
    enableConsoleCapture?: boolean;
    enablePerformanceTracking?: boolean;
    enableVideoOnRetry?: boolean;
    enableTraceOnFailure?: boolean;
    slowRequestThresholdMs?: number;
    outputDir?: string;
}

export interface DiagnosticReport {
    scenarioName: string;
    status: 'passed' | 'failed';
    timestamp: string;
    duration?: number;
    error?: {
        message: string;
        stack?: string;
    };
    networkSummary: string;
    consoleSummary: string;
    performanceSummary: string;
    failureAnalysis?: string;
}

/**
 * Diagnostics Service - Central coordinator for all diagnostic capabilities
 * Provides comprehensive failure analysis and debugging information
 */
export class DiagnosticsService {
    private networkLogger: NetworkLogger;
    private consoleCapture: ConsoleCapture;
    private performanceTracker: PerformanceTracker;
    private config: DiagnosticsConfig;
    private currentScenarioName: string = '';
    private isRecording: boolean = false;
    private page?: Page;

    constructor(config: DiagnosticsConfig = {}) {
        this.config = {
            enableNetworkLogging: true,
            enableConsoleCapture: true,
            enablePerformanceTracking: true,
            enableVideoOnRetry: true,
            enableTraceOnFailure: true,
            slowRequestThresholdMs: 2000,
            outputDir: 'diagnostics',
            ...config,
        };

        this.networkLogger = new NetworkLogger(this.config.slowRequestThresholdMs);
        this.consoleCapture = new ConsoleCapture();
        this.performanceTracker = new PerformanceTracker();
    }

    /**
     * Start recording diagnostics for a scenario
     */
    async startScenario(scenarioName: string, page: Page): Promise<void> {
        this.currentScenarioName = scenarioName;
        this.page = page;
        this.isRecording = true;

        // Clear previous data
        this.networkLogger.clear();
        this.consoleCapture.clear();
        this.performanceTracker.clear();

        // Start all recorders
        if (this.config.enableNetworkLogging) {
            await this.networkLogger.startRecording(page);
        }

        if (this.config.enableConsoleCapture) {
            await this.consoleCapture.startCapture(page);
        }

        if (this.config.enablePerformanceTracking) {
            this.performanceTracker.startScenario();
        }

        console.log(`📊 Diagnostics started for: ${scenarioName}`);
    }

    /**
     * Record step start for timing
     */
    startStep(stepName: string): void {
        if (this.config.enablePerformanceTracking) {
            this.performanceTracker.startStep(stepName);
        }
    }

    /**
     * Record step end for timing
     */
    endStep(status: 'passed' | 'failed', error?: string): void {
        if (this.config.enablePerformanceTracking) {
            this.performanceTracker.endStep(status, error);
        }
    }

    /**
     * Record page metrics after navigation
     */
    async recordPageMetrics(): Promise<void> {
        if (this.page && this.config.enablePerformanceTracking) {
            await this.performanceTracker.recordPageMetrics(this.page);
        }
    }

    /**
     * Stop recording and generate report
     */
    async endScenario(status: 'passed' | 'failed', error?: Error): Promise<DiagnosticReport> {
        this.isRecording = false;

        // Stop all recorders
        this.networkLogger.stopRecording();
        this.consoleCapture.stopCapture();

        // Generate summaries
        const networkSummary = this.networkLogger.getSummary();
        const consoleSummary = this.consoleCapture.getSummary();
        const performanceSummary = this.performanceTracker.getSummary();

        // Analyze failure if present
        let failureAnalysis: string | undefined;
        if (status === 'failed') {
            failureAnalysis = this.analyzeFailure(error);
        }

        const report: DiagnosticReport = {
            scenarioName: this.currentScenarioName,
            status,
            timestamp: new Date().toISOString(),
            duration: this.performanceTracker.getScenarioDuration(),
            error: error ? {
                message: error.message,
                stack: error.stack,
            } : undefined,
            networkSummary,
            consoleSummary,
            performanceSummary,
            failureAnalysis,
        };

        // Log summary on failure
        if (status === 'failed') {
            console.log('\n' + '='.repeat(60));
            console.log('🔍 FAILURE DIAGNOSTICS');
            console.log('='.repeat(60));
            console.log(`Scenario: ${this.currentScenarioName}`);
            console.log(`Error: ${error?.message}`);
            if (failureAnalysis) {
                console.log(`\n📋 Failure Analysis:\n${failureAnalysis}`);
            }
            console.log(networkSummary);
            console.log(consoleSummary);
            console.log(performanceSummary);
            console.log('='.repeat(60) + '\n');
        }

        return report;
    }

    /**
     * Analyze failure and provide insights
     */
    private analyzeFailure(error?: Error): string {
        const insights: string[] = [];
        const networkFailed = this.networkLogger.getFailedRequests();
        const networkSlow = this.networkLogger.getSlowRequests();
        const consoleErrors = this.consoleCapture.getErrors();
        const failedSteps = this.performanceTracker.getFailedSteps();

        // Check for network issues
        if (networkFailed.length > 0) {
            const apiFailures = networkFailed.filter(r =>
                r.url.includes('/api/') || r.status === 500 || r.status === 502 || r.status === 503
            );
            if (apiFailures.length > 0) {
                insights.push(`🌐 API Failures Detected: ${apiFailures.length} API call(s) failed`);
                apiFailures.slice(0, 3).forEach(f => {
                    insights.push(`   - ${f.method} ${f.url.substring(0, 80)}... (${f.status || f.error})`);
                });
            }
        }

        // Check for slow requests
        if (networkSlow.length > 0) {
            const verySlow = networkSlow.filter(r => r.duration > 5000);
            if (verySlow.length > 0) {
                insights.push(`🐢 Very Slow Requests: ${verySlow.length} request(s) took >5s`);
                insights.push(`   Possible network latency or server performance issue`);
            }
        }

        // Check for JavaScript errors
        if (consoleErrors.length > 0) {
            insights.push(`💥 JavaScript Errors: ${consoleErrors.length} error(s) in console`);
            consoleErrors.slice(0, 2).forEach(e => {
                insights.push(`   - ${e.message.substring(0, 100)}`);
            });
        }

        // Analyze error message
        if (error?.message) {
            const msg = error.message.toLowerCase();

            if (msg.includes('timeout')) {
                insights.push(`⏱️ Timeout Error: Element or action took too long`);
                if (networkSlow.length > 0) {
                    insights.push(`   Likely cause: Slow network requests (${networkSlow.length} slow requests detected)`);
                }
            }

            if (msg.includes('not visible') || msg.includes('hidden')) {
                insights.push(`👁️ Visibility Issue: Element exists but is not visible`);
                insights.push(`   Check: CSS display/visibility, z-index, viewport position`);
            }

            if (msg.includes('not found') || msg.includes('no element')) {
                insights.push(`🔍 Element Not Found: Selector didn't match any elements`);
                insights.push(`   Check: Page fully loaded? Dynamic content? Selector correct?`);
            }

            if (msg.includes('detached') || msg.includes('stale')) {
                insights.push(`🔄 Stale Element: Element was removed/replaced during interaction`);
                insights.push(`   Check: Page reload? Dynamic content update? Race condition?`);
            }

            if (msg.includes('navigation') || msg.includes('net::')) {
                insights.push(`🚫 Navigation/Network Error: Page failed to load`);
                if (networkFailed.length > 0) {
                    insights.push(`   Network failures detected: ${networkFailed.length}`);
                }
            }
        }

        if (insights.length === 0) {
            insights.push(`🤔 No specific issue pattern detected`);
            insights.push(`   Review the error message and stack trace for details`);
        }

        return insights.join('\n');
    }

    /**
     * Save diagnostic data to files
     */
    async saveDiagnostics(scenarioName: string): Promise<string[]> {
        const sanitizedName = scenarioName.replace(/[^a-zA-Z0-9]/g, '_').substring(0, 50);
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const dir = path.join(this.config.outputDir!, `${sanitizedName}_${timestamp}`);

        // Ensure directory exists
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        const savedFiles: string[] = [];

        // Save network logs
        if (this.config.enableNetworkLogging) {
            const networkFile = path.join(dir, 'network.json');
            fs.writeFileSync(networkFile, this.networkLogger.toJSON());
            savedFiles.push(networkFile);
        }

        // Save console logs
        if (this.config.enableConsoleCapture) {
            const consoleFile = path.join(dir, 'console.json');
            fs.writeFileSync(consoleFile, this.consoleCapture.toJSON());
            savedFiles.push(consoleFile);
        }

        // Save performance data
        if (this.config.enablePerformanceTracking) {
            const perfFile = path.join(dir, 'performance.json');
            fs.writeFileSync(perfFile, this.performanceTracker.toJSON());
            savedFiles.push(perfFile);
        }

        console.log(`📁 Diagnostics saved to: ${dir}`);
        return savedFiles;
    }

    /**
     * Get network logger for direct access
     */
    getNetworkLogger(): NetworkLogger {
        return this.networkLogger;
    }

    /**
     * Get console capture for direct access
     */
    getConsoleCapture(): ConsoleCapture {
        return this.consoleCapture;
    }

    /**
     * Get performance tracker for direct access
     */
    getPerformanceTracker(): PerformanceTracker {
        return this.performanceTracker;
    }
}

// Singleton instance for easy access
let diagnosticsInstance: DiagnosticsService | undefined;

export function getDiagnostics(config?: DiagnosticsConfig): DiagnosticsService {
    if (!diagnosticsInstance) {
        diagnosticsInstance = new DiagnosticsService(config);
    }
    return diagnosticsInstance;
}

export function resetDiagnostics(): void {
    diagnosticsInstance = undefined;
}
