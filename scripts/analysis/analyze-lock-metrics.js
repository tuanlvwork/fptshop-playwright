#!/usr/bin/env node

/**
 * Lock Metrics Analyzer
 * 
 * Analyzes lock metrics from test runs to identify performance bottlenecks
 * and race condition patterns.
 * 
 * Usage:
 *   node scripts/analyze-lock-metrics.js
 */

const fs = require('fs');
const path = require('path');

const metricsFile = path.join(__dirname, '../../diagnostics/lock-metrics.json');

if (!fs.existsSync(metricsFile)) {
    console.log('❌ No lock metrics found. Run tests first.');
    process.exit(1);
}

const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf-8'));

console.log('\n╔═══════════════════════════════════════════════════════════╗');
console.log('║           DETAILED LOCK METRICS ANALYSIS                 ║');
console.log('╚═══════════════════════════════════════════════════════════╝\n');

// Overall statistics
const totalOps = metrics.length;
const acquires = metrics.filter(m => m.operation === 'acquire');
const releases = metrics.filter(m => m.operation === 'release');
const failures = metrics.filter(m => !m.success);

console.log('📊 Overall Statistics:');
console.log(`  Total Operations: ${totalOps}`);
console.log(`  Acquisitions: ${acquires.length}`);
console.log(`  Releases: ${releases.length}`);
console.log(`  Failures: ${failures.length}\n`);

// Group by role
const byRole = {};
metrics.forEach(m => {
    if (!byRole[m.role]) {
        byRole[m.role] = { acquires: [], releases: [], failures: [] };
    }
    if (m.operation === 'acquire') {
        if (m.success) {
            byRole[m.role].acquires.push(m);
        } else {
            byRole[m.role].failures.push(m);
        }
    } else {
        byRole[m.role].releases.push(m);
    }
});

console.log('📈 By Role:');
Object.entries(byRole).forEach(([role, ops]) => {
    const waitTimes = ops.acquires.map(a => a.durationMs);
    const avgWait = waitTimes.length > 0 ? (waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length) : 0;
    const maxWait = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;
    const minWait = waitTimes.length > 0 ? Math.min(...waitTimes) : 0;

    console.log(`\n  ${role}:`);
    console.log(`    Acquires: ${ops.acquires.length}`);
    console.log(`    Avg Wait: ${avgWait.toFixed(1)}ms`);
    console.log(`    Min Wait: ${minWait.toFixed(0)}ms`);
    console.log(`    Max Wait: ${maxWait.toFixed(0)}ms`);
    console.log(`    Failures: ${ops.failures.length}`);

    // Distribution
    const immediate = waitTimes.filter(t => t < 10).length;
    const fast = waitTimes.filter(t => t >= 10 && t < 100).length;
    const medium = waitTimes.filter(t => t >= 100 && t < 500).length;
    const slow = waitTimes.filter(t => t >= 500).length;

    console.log(`    Distribution:`);
    console.log(`      <10ms (immediate): ${immediate}`);
    console.log(`      10-100ms (fast): ${fast}`);
    console.log(`      100-500ms (medium): ${medium}`);
    console.log(`      >500ms (slow): ${slow}`);
});

// Timeline analysis - detect concurrent acquisitions
console.log('\n\n🕒 Timeline Analysis (Concurrent Lock Attempts):');
const concurrentAttempts = [];
acquires.forEach((a1, i) => {
    acquires.slice(i + 1).forEach(a2 => {
        const t1 = new Date(a1.timestamp).getTime();
        const t2 = new Date(a2.timestamp).getTime();
        const diff = Math.abs(t1 - t2);

        if (diff < 5000 && a1.role === a2.role) {
            concurrentAttempts.push({
                role: a1.role,
                worker1: a1.pid,
                worker2: a2.pid,
                timeDiff: diff,
                wait1: a1.durationMs,
                wait2: a2.durationMs
            });
        }
    });
});

if (concurrentAttempts.length > 0) {
    console.log(`\n⚠️  Found ${concurrentAttempts.length} concurrent lock attempts:\n`);
    concurrentAttempts.slice(0, 10).forEach((attempt, i) => {
        console.log(`  ${i + 1}. Role: ${attempt.role}`);
        console.log(`     Worker ${attempt.worker1}: waited ${attempt.wait1.toFixed(0)}ms`);
        console.log(`     Worker ${attempt.worker2}: waited ${attempt.wait2.toFixed(0)}ms`);
        console.log(`     Time between attempts: ${attempt.timeDiff.toFixed(0)}ms\n`);
    });
} else {
    console.log('  ✅ No concurrent lock attempts detected\n');
}

// Performance insights
console.log('\n💡 Performance Insights:');
const allWaitTimes = acquires.map(a => a.durationMs);
const avgWait = allWaitTimes.reduce((a, b) => a + b, 0) / allWaitTimes.length;
const maxWait = Math.max(...allWaitTimes);

if (avgWait < 10) {
    console.log('  ✅ Excellent: Very low contention, file locking overhead is minimal');
} else if (avgWait < 100) {
    console.log('  ✅ Good: Low contention, acceptable performance');
} else if (avgWait < 500) {
    console.log('  ⚠️  Moderate contention detected. Monitor for degradation.');
} else {
    console.log('  ❌ High contention! Consider optimizing parallel execution.');
}

if (maxWait > 2000) {
    console.log('  ⚠️  Some workers waited over 2 seconds for locks');
}

if (failures.length > 0) {
    console.log(`  ❌ ${failures.length} lock acquisition failures detected`);
}

// Recommendations
console.log('\n📋 Recommendations:');
const recommendations = [];

if (avgWait > 500) {
    recommendations.push('Reduce parallel workers to decrease lock contention');
}
if (maxWait > 3000) {
    recommendations.push('Investigate workers with high wait times (>3s)');
}
if (concurrentAttempts.length > metrics.length * 0.3) {
    recommendations.push('High concurrent access detected - file locking is saving you from race conditions!');
}
if (failures.length > 0) {
    recommendations.push('Review lock acquisition failures - may indicate timeout issues');
}
if (recommendations.length === 0) {
    recommendations.push('✅ No issues detected - system is performing optimally');
}

recommendations.forEach(rec => console.log(`  • ${rec}`));
console.log('');

// Export summary
const summary = {
    timestamp: new Date().toISOString(),
    totalOperations: totalOps,
    avgWaitTimeMs: avgWait,
    maxWaitTimeMs: maxWait,
    failures: failures.length,
    concurrentAttempts: concurrentAttempts.length,
    byRole: Object.fromEntries(
        Object.entries(byRole).map(([role, ops]) => [
            role,
            {
                acquires: ops.acquires.length,
                avgWaitMs: ops.acquires.reduce((sum, a) => sum + a.durationMs, 0) / ops.acquires.length || 0,
                maxWaitMs: Math.max(...ops.acquires.map(a => a.durationMs), 0)
            }
        ])
    )
};

const summaryFile = path.join(__dirname, '../../diagnostics/lock-metrics-summary.json');
fs.writeFileSync(summaryFile, JSON.stringify(summary, null, 2));
console.log(`💾 Summary exported to: ${summaryFile}\n`);
