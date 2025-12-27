export interface StepTiming {
    stepName: string;
    startTime: number;
    endTime?: number;
    duration?: number;
    status: 'running' | 'passed' | 'failed';
    error?: string;
}

export interface PageMetrics {
    url: string;
    timestamp: string;
    loadTime?: number;
    domContentLoaded?: number;
    firstPaint?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
}

/**
 * Performance Tracker - Tracks step timing and page performance metrics
 */
export class PerformanceTracker {
    private stepTimings: StepTiming[] = [];
    private pageMetrics: PageMetrics[] = [];
    private currentStep?: StepTiming;
    private scenarioStartTime?: number;

    /**
     * Start tracking a new scenario
     */
    startScenario(): void {
        this.stepTimings = [];
        this.pageMetrics = [];
        this.scenarioStartTime = Date.now();
    }

    /**
     * Start timing a step
     */
    startStep(stepName: string): void {
        this.currentStep = {
            stepName,
            startTime: Date.now(),
            status: 'running',
        };
    }

    /**
     * End timing the current step
     */
    endStep(status: 'passed' | 'failed', error?: string): void {
        if (this.currentStep) {
            this.currentStep.endTime = Date.now();
            this.currentStep.duration = this.currentStep.endTime - this.currentStep.startTime;
            this.currentStep.status = status;
            if (error) {
                this.currentStep.error = error;
            }
            this.stepTimings.push(this.currentStep);
            this.currentStep = undefined;
        }
    }

    /**
     * Record page performance metrics
     */
    async recordPageMetrics(page: any): Promise<PageMetrics | undefined> {
        try {
            const metrics = await page.evaluate(() => {
                const timing = performance.timing;
                const paintEntries = performance.getEntriesByType('paint');
                const lcpEntries = performance.getEntriesByType('largest-contentful-paint');

                return {
                    loadTime: timing.loadEventEnd - timing.navigationStart,
                    domContentLoaded: timing.domContentLoadedEventEnd - timing.navigationStart,
                    firstPaint: paintEntries.find((e: any) => e.name === 'first-paint')?.startTime,
                    firstContentfulPaint: paintEntries.find((e: any) => e.name === 'first-contentful-paint')?.startTime,
                    largestContentfulPaint: lcpEntries.length > 0 ? (lcpEntries[lcpEntries.length - 1] as any).startTime : undefined,
                };
            });

            const pageMetric: PageMetrics = {
                url: page.url(),
                timestamp: new Date().toISOString(),
                ...metrics,
            };

            this.pageMetrics.push(pageMetric);
            return pageMetric;
        } catch {
            // Page might not support performance API
            return undefined;
        }
    }

    /**
     * Get all step timings
     */
    getStepTimings(): StepTiming[] {
        return [...this.stepTimings];
    }

    /**
     * Get slow steps (above threshold)
     */
    getSlowSteps(thresholdMs: number = 5000): StepTiming[] {
        return this.stepTimings
            .filter(step => step.duration && step.duration > thresholdMs)
            .sort((a, b) => (b.duration || 0) - (a.duration || 0));
    }

    /**
     * Get failed steps
     */
    getFailedSteps(): StepTiming[] {
        return this.stepTimings.filter(step => step.status === 'failed');
    }

    /**
     * Get total scenario duration
     */
    getScenarioDuration(): number | undefined {
        if (!this.scenarioStartTime) return undefined;
        return Date.now() - this.scenarioStartTime;
    }

    /**
     * Get page metrics
     */
    getPageMetrics(): PageMetrics[] {
        return [...this.pageMetrics];
    }

    /**
     * Generate summary report
     */
    getSummary(): string {
        const totalSteps = this.stepTimings.length;
        const failedSteps = this.getFailedSteps();
        const slowSteps = this.getSlowSteps();
        const scenarioDuration = this.getScenarioDuration();

        let summary = `\n⏱️ Performance Summary:\n`;
        summary += `   Total Steps: ${totalSteps}\n`;
        summary += `   Failed Steps: ${failedSteps.length}\n`;
        summary += `   Slow Steps (>5s): ${slowSteps.length}\n`;
        if (scenarioDuration) {
            summary += `   Scenario Duration: ${(scenarioDuration / 1000).toFixed(2)}s\n`;
        }

        if (slowSteps.length > 0) {
            summary += `\n🐢 Slow Steps:\n`;
            slowSteps.slice(0, 5).forEach(step => {
                summary += `   ${step.stepName} (${(step.duration! / 1000).toFixed(2)}s)\n`;
            });
        }

        if (this.pageMetrics.length > 0) {
            summary += `\n📊 Page Load Metrics:\n`;
            this.pageMetrics.forEach(metric => {
                summary += `   ${metric.url.substring(0, 50)}...\n`;
                if (metric.loadTime) {
                    summary += `     Load Time: ${metric.loadTime}ms\n`;
                }
                if (metric.firstContentfulPaint) {
                    summary += `     FCP: ${metric.firstContentfulPaint.toFixed(0)}ms\n`;
                }
            });
        }

        return summary;
    }

    /**
     * Export as JSON
     */
    toJSON(): string {
        return JSON.stringify({
            scenarioDuration: this.getScenarioDuration(),
            stepTimings: this.stepTimings,
            pageMetrics: this.pageMetrics,
            summary: {
                totalSteps: this.stepTimings.length,
                failedSteps: this.getFailedSteps().length,
                slowSteps: this.getSlowSteps().length,
            }
        }, null, 2);
    }

    /**
     * Clear all data
     */
    clear(): void {
        this.stepTimings = [];
        this.pageMetrics = [];
        this.currentStep = undefined;
        this.scenarioStartTime = undefined;
    }
}
