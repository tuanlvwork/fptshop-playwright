#!/usr/bin/env node

/**
 * Lock Metrics HTML Report Generator
 * 
 * Generates a beautiful, interactive HTML dashboard from lock metrics
 */

const fs = require('fs');
const path = require('path');

const metricsFile = path.join(__dirname, '../../diagnostics/lock-metrics.json');
const outputFile = path.join(__dirname, '../../diagnostics/lock-metrics-report.html');

if (!fs.existsSync(metricsFile)) {
    console.log('❌ No lock metrics found. Run tests first.');
    process.exit(1);
}

const metrics = JSON.parse(fs.readFileSync(metricsFile, 'utf-8'));

// Calculate statistics
const acquires = metrics.filter(m => m.operation === 'acquire');
const releases = metrics.filter(m => m.operation === 'release');
const failures = metrics.filter(m => !m.success);

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

// Detect concurrent attempts
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
                wait2: a2.durationMs,
                timestamp: new Date(Math.min(t1, t2)).toISOString()
            });
        }
    });
});

// Calculate overall stats
const allWaitTimes = acquires.map(a => a.durationMs);
const avgWait = allWaitTimes.length > 0 ? allWaitTimes.reduce((a, b) => a + b, 0) / allWaitTimes.length : 0;
const maxWait = allWaitTimes.length > 0 ? Math.max(...allWaitTimes) : 0;
const minWait = allWaitTimes.length > 0 ? Math.min(...allWaitTimes) : 0;

// Build role stats
const roleStats = Object.entries(byRole).map(([role, ops]) => {
    const waitTimes = ops.acquires.map(a => a.durationMs);
    const roleAvg = waitTimes.length > 0 ? waitTimes.reduce((a, b) => a + b, 0) / waitTimes.length : 0;
    const roleMax = waitTimes.length > 0 ? Math.max(...waitTimes) : 0;
    const roleMin = waitTimes.length > 0 ? Math.min(...waitTimes) : 0;

    const distribution = {
        immediate: waitTimes.filter(t => t < 10).length,
        fast: waitTimes.filter(t => t >= 10 && t < 100).length,
        medium: waitTimes.filter(t => t >= 100 && t < 500).length,
        slow: waitTimes.filter(t => t >= 500).length
    };

    return {
        role,
        acquires: ops.acquires.length,
        avgWait: roleAvg,
        maxWait: roleMax,
        minWait: roleMin,
        failures: ops.failures.length,
        distribution
    };
}).sort((a, b) => b.avgWait - a.avgWait);

// Get health status
function getHealthStatus() {
    if (avgWait < 10) return { status: 'Excellent', color: '#10b981', icon: '✅' };
    if (avgWait < 100) return { status: 'Good', color: '#3b82f6', icon: '✅' };
    if (avgWait < 500) return { status: 'Moderate', color: '#f59e0b', icon: '⚠️' };
    return { status: 'High Contention', color: '#ef4444', icon: '❌' };
}

const health = getHealthStatus();

// Generate HTML
const html = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Lock Metrics Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }
        
        .container {
            max-width: 1400px;
            margin: 0 auto;
        }
        
        header {
            background: white;
            padding: 30px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            margin-bottom: 24px;
        }
        
        h1 {
            color: #1f2937;
            font-size: 32px;
            margin-bottom: 8px;
        }
        
        .subtitle {
            color: #6b7280;
            font-size: 14px;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin-bottom: 24px;
        }
        
        .metric-card {
            background: white;
            padding: 24px;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        
        .metric-label {
            color: #6b7280;
            font-size: 14px;
            margin-bottom: 8px;
        }
        
        .metric-value {
            font-size: 36px;
            font-weight: bold;
            color: #1f2937;
        }
        
        .metric-unit {
            font-size: 16px;
            color: #9ca3af;
            margin-left: 4px;
        }
        
        .status-badge {
            display: inline-block;
            padding: 6px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            margin-top: 12px;
        }
        
        .table-container {
            background: white;
            border-radius: 12px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            overflow: hidden;
            margin-bottom: 24px;
        }
        
        .table-header {
            background: #f9fafb;
            padding: 20px;
            border-bottom: 2px solid #e5e7eb;
        }
        
        .table-title {
            font-size: 20px;
            font-weight: 600;
            color: #1f2937;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
        }
        
        th, td {
            padding: 16px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        
        th {
            background: #f9fafb;
            color: #6b7280;
            font-weight: 600;
            font-size: 14px;
            text-transform: uppercase;
        }
        
        td {
            color: #1f2937;
        }
        
        .bar-container {
            background: #e5e7eb;
            height: 8px;
            border-radius: 4px;
            overflow: hidden;
            margin-top: 4px;
        }
        
        .bar {
            height: 100%;
            background: linear-gradient(90deg, #3b82f6, #8b5cf6);
            border-radius: 4px;
            transition: width 0.3s ease;
        }
        
        .distribution {
            display: flex;
            gap: 8px;
            margin-top: 8px;
        }
        
        .dist-badge {
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 12px;
            font-weight: 500;
        }
        
        .dist-immediate { background: #d1fae5; color: #065f46; }
        .dist-fast { background: #dbeafe; color: #1e40af; }
        .dist-medium { background: #fef3c7; color: #92400e; }
        .dist-slow { background: #fee2e2; color: #991b1b; }
        
        .concurrent-item {
            background: #fef3c7;
            border-left: 4px solid #f59e0b;
            padding: 12px;
            border-radius: 4px;
            margin-bottom: 8px;
        }
        
        .empty-state {
            text-align: center;
            padding: 40px;
            color: #9ca3af;
        }
        
        footer {
            background: white;
            padding: 20px;
            border-radius: 12px;
            text-align: center;
            color: #6b7280;
            font-size: 14px;
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🔐 Lock Metrics Dashboard</h1>
            <p class="subtitle">Generated at ${new Date().toLocaleString()}</p>
        </header>
        
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-label">Total Operations</div>
                <div class="metric-value">${metrics.length}</div>
                <div class="status-badge" style="background: ${health.color}20; color: ${health.color};">
                    ${health.icon} ${health.status}
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Average Wait Time</div>
                <div class="metric-value">${avgWait.toFixed(1)}<span class="metric-unit">ms</span></div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Max Wait Time</div>
                <div class="metric-value">${maxWait.toFixed(0)}<span class="metric-unit">ms</span></div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Lock Acquisitions</div>
                <div class="metric-value">${acquires.length}</div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Failures</div>
                <div class="metric-value" style="color: ${failures.length > 0 ? '#ef4444' : '#10b981'};">
                    ${failures.length}
                </div>
            </div>
            
            <div class="metric-card">
                <div class="metric-label">Concurrent Attempts</div>
                <div class="metric-value" style="color: ${concurrentAttempts.length > 0 ? '#f59e0b' : '#10b981'};">
                    ${concurrentAttempts.length}
                </div>
            </div>
        </div>
        
        <div class="table-container">
            <div class="table-header">
                <div class="table-title">📊 Performance by Role</div>
            </div>
            <table>
                <thead>
                    <tr>
                        <th>Role</th>
                        <th>Acquires</th>
                        <th>Avg Wait</th>
                        <th>Max Wait</th>
                        <th>Distribution</th>
                        <th>Failures</th>
                    </tr>
                </thead>
                <tbody>
                    ${roleStats.map(r => `
                        <tr>
                            <td><strong>${r.role}</strong></td>
                            <td>${r.acquires}</td>
                            <td>
                                ${r.avgWait.toFixed(1)}ms
                                <div class="bar-container">
                                    <div class="bar" style="width: ${Math.min(100, (r.avgWait / 500) * 100)}%"></div>
                                </div>
                            </td>
                            <td>${r.maxWait.toFixed(0)}ms</td>
                            <td>
                                <div class="distribution">
                                    ${r.distribution.immediate > 0 ? `<span class="dist-badge dist-immediate">&lt;10ms: ${r.distribution.immediate}</span>` : ''}
                                    ${r.distribution.fast > 0 ? `<span class="dist-badge dist-fast">10-100ms: ${r.distribution.fast}</span>` : ''}
                                    ${r.distribution.medium > 0 ? `<span class="dist-badge dist-medium">100-500ms: ${r.distribution.medium}</span>` : ''}
                                    ${r.distribution.slow > 0 ? `<span class="dist-badge dist-slow">&gt;500ms: ${r.distribution.slow}</span>` : ''}
                                </div>
                            </td>
                            <td style="color: ${r.failures > 0 ? '#ef4444' : '#10b981'};">
                                ${r.failures > 0 ? '❌ ' + r.failures : '✅ 0'}
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>
        </div>
        
        ${concurrentAttempts.length > 0 ? `
        <div class="table-container">
            <div class="table-header">
                <div class="table-title">⚠️ Concurrent Lock Attempts (${concurrentAttempts.length})</div>
            </div>
            <div style="padding: 20px;">
                ${concurrentAttempts.slice(0, 20).map((attempt, i) => `
                    <div class="concurrent-item">
                        <strong>#${i + 1}: ${attempt.role}</strong><br>
                        Worker ${attempt.worker1}: waited ${attempt.wait1.toFixed(0)}ms<br>
                        Worker ${attempt.worker2}: waited ${attempt.wait2.toFixed(0)}ms<br>
                        <small>Time between: ${attempt.timeDiff.toFixed(0)}ms | ${new Date(attempt.timestamp).toLocaleTimeString()}</small>
                    </div>
                `).join('')}
                ${concurrentAttempts.length > 20 ? `<p class="empty-state">... and ${concurrentAttempts.length - 20} more</p>` : ''}
            </div>
        </div>
        ` : `
        <div class="table-container">
            <div class="table-header">
                <div class="table-title">✅ Concurrent Lock Attempts</div>
            </div>
            <div class="empty-state">
                <p>No concurrent lock attempts detected</p>
                <p>Perfect! No workers competing for the same lock.</p>
            </div>
        </div>
        `}
        
        <footer>
            Generated by Lock Metrics Analyzer | Total metrics: ${metrics.length} | Analysis time: ${new Date().toLocaleTimeString()}
        </footer>
    </div>
</body>
</html>
`;

fs.writeFileSync(outputFile, html);
console.log(`\n✅ HTML Report generated: ${outputFile}`);
console.log(`📊 Open in browser to view interactive dashboard\n`);
