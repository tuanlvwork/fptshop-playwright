import * as fs from 'fs';
import * as path from 'path';

/**
 * Metrics for file locking operations
 */
export interface LockMetrics {
    timestamp: string;
    pid: number;
    role: string;
    operation: 'acquire' | 'release' | 'wait';
    durationMs: number;
    success: boolean;
    error?: string;
}

/**
 * Lock metrics collector and reporter
 */
export class LockMetricsCollector {
    private static metricsFile = path.join(process.cwd(), 'diagnostics', 'lock-metrics.json');
    private static metrics: LockMetrics[] = [];

    /**
     * Record a lock operation metric
     */
    static record(metric: LockMetrics): void {
        this.metrics.push(metric);
    }

    /**
     * Save metrics to file
     */
    static async save(): Promise<void> {
        if (this.metrics.length === 0) return;

        const dir = path.dirname(this.metricsFile);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }

        // Append to existing metrics if file exists
        let existingMetrics: LockMetrics[] = [];
        if (fs.existsSync(this.metricsFile)) {
            try {
                const content = fs.readFileSync(this.metricsFile, 'utf-8');
                existingMetrics = JSON.parse(content);
            } catch {
                existingMetrics = [];
            }
        }

        const allMetrics = [...existingMetrics, ...this.metrics];
        fs.writeFileSync(this.metricsFile, JSON.stringify(allMetrics, null, 2));

        console.log(`📊 Lock metrics saved: ${this.metrics.length} operations recorded`);
        this.metrics = []; // Clear after save
    }

    /**
     * Generate summary statistics
     */
    static getSummary(): {
        totalOperations: number;
        byRole: Record<string, { acquires: number; avgWaitMs: number; maxWaitMs: number }>;
        totalWaitTimeMs: number;
        avgWaitTimeMs: number;
    } {
        const byRole: Record<string, { acquires: number; totalWaitMs: number; maxWaitMs: number }> = {};
        let totalWaitMs = 0;
        let totalAcquires = 0;

        this.metrics.forEach(metric => {
            if (metric.operation === 'acquire') {
                if (!byRole[metric.role]) {
                    byRole[metric.role] = { acquires: 0, totalWaitMs: 0, maxWaitMs: 0 };
                }
                byRole[metric.role].acquires++;
                byRole[metric.role].totalWaitMs += metric.durationMs;
                byRole[metric.role].maxWaitMs = Math.max(byRole[metric.role].maxWaitMs, metric.durationMs);
                totalWaitMs += metric.durationMs;
                totalAcquires++;
            }
        });

        const result: any = {
            totalOperations: this.metrics.length,
            byRole: {},
            totalWaitTimeMs: totalWaitMs,
            avgWaitTimeMs: totalAcquires > 0 ? totalWaitMs / totalAcquires : 0
        };

        Object.entries(byRole).forEach(([role, stats]) => {
            result.byRole[role] = {
                acquires: stats.acquires,
                avgWaitMs: stats.totalWaitMs / stats.acquires,
                maxWaitMs: stats.maxWaitMs
            };
        });

        return result;
    }

    /**
     * Print summary to console
     */
    static printSummary(): void {
        const summary = this.getSummary();

        console.log('\n╔═══════════════════════════════════════════════════════════╗');
        console.log('║           LOCK METRICS SUMMARY                            ║');
        console.log('╚═══════════════════════════════════════════════════════════╝\n');

        console.log(`📊 Total Operations: ${summary.totalOperations}`);
        console.log(`⏱️  Total Wait Time: ${summary.totalWaitTimeMs.toFixed(0)}ms`);
        console.log(`⌛ Average Wait: ${summary.avgWaitTimeMs.toFixed(1)}ms\n`);

        console.log('📈 By Role:');
        Object.entries(summary.byRole).forEach(([role, stats]: [string, any]) => {
            console.log(`  ${role}:`);
            console.log(`    Acquisitions: ${stats.acquires}`);
            console.log(`    Avg Wait: ${stats.avgWaitMs.toFixed(1)}ms`);
            console.log(`    Max Wait: ${stats.maxWaitMs.toFixed(0)}ms`);
        });
        console.log('');
    }

    /**
     * Analyze metrics and provide recommendations
     */
    static analyze(): string[] {
        const summary = this.getSummary();
        const recommendations: string[] = [];

        // Check average wait time
        if (summary.avgWaitTimeMs > 500) {
            recommendations.push(`⚠️  High average wait time (${summary.avgWaitTimeMs.toFixed(0)}ms). Consider reducing parallel workers.`);
        } else if (summary.avgWaitTimeMs < 10) {
            recommendations.push(`✅ Low contention (${summary.avgWaitTimeMs.toFixed(0)}ms avg). File locking overhead is minimal.`);
        }

        // Check individual roles
        Object.entries(summary.byRole).forEach(([role, stats]: [string, any]) => {
            if (stats.maxWaitMs > 2000) {
                recommendations.push(`⚠️  Role "${role}" had max wait of ${stats.maxWaitMs}ms. High contention detected.`);
            }
            if (stats.acquires > 10) {
                recommendations.push(`ℹ️  Role "${role}" was heavily used (${stats.acquires} times). Consider caching strategy.`);
            }
        });

        if (recommendations.length === 0) {
            recommendations.push('✅ All metrics look healthy. No issues detected.');
        }

        return recommendations;
    }
}
