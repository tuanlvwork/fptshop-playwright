#!/usr/bin/env node

/**
 * Race Condition Detector for Lazy Login
 * 
 * This script analyzes test logs to detect potential race conditions
 * when multiple workers try to create the same session file simultaneously.
 * 
 * Usage:
 *   node scripts/analyze-auth-race.js <log-file>
 *   npm test 2>&1 | node scripts/analyze-auth-race.js
 */

const fs = require('fs');
const readline = require('readline');

// Track session operations by role
const sessionOps = {};

// Patterns to match
const patterns = {
    phase1Start: /\[([^\]]+)\] \[PID:(\d+)\] \[([^\]]+)\] Phase 1: Attempting to reuse/,
    phase1Success: /\[([^\]]+)\] \[PID:(\d+)\] \[([^\]]+)\] ✅ Phase 1: Session reused/,
    phase1Fail: /\[([^\]]+)\] \[PID:(\d+)\] \[([^\]]+)\] ❌ Phase 1:/,
    phase1NoFile: /\[([^\]]+)\] \[PID:(\d+)\] \[([^\]]+)\] ℹ️  Phase 1: No session file/,
    phase2Start: /\[([^\]]+)\] \[PID:(\d+)\] \[([^\]]+)\] Phase 2: Starting fresh login/,
    phase2Login: /\[([^\]]+)\] \[PID:(\d+)\] \[([^\]]+)\] ⚠️  Phase 2: Performing UI login/,
    phase2Done: /\[([^\]]+)\] \[PID:(\d+)\] \[([^\]]+)\] ✅ Phase 2: Login completed/,
    authWrite: /\[([^\]]+)\] \[PID:(\d+)\] \[([^\]]+)\] AuthHelper: Writing session to/,
};

function parseLog(line) {
    for (const [type, pattern] of Object.entries(patterns)) {
        const match = line.match(pattern);
        if (match) {
            return {
                type,
                timestamp: new Date(match[1]),
                pid: match[2],
                role: match[3],
                line,
            };
        }
    }
    return null;
}

function analyzeRaceConditions() {
    console.log('\n=== Race Condition Analysis ===\n');

    let totalPhase1Success = 0;
    let totalPhase2Runs = 0;
    let potentialRaces = [];

    // Analyze each role
    for (const [role, ops] of Object.entries(sessionOps)) {
        const phase1Success = ops.filter(op => op.type === 'phase1Success').length;
        const phase2Runs = ops.filter(op => op.type === 'phase2Login').length;

        totalPhase1Success += phase1Success;
        totalPhase2Runs += phase2Runs;

        console.log(`Role: ${role}`);
        console.log(`  ✅ Session Reuses (Phase 1): ${phase1Success}`);
        console.log(`  🔄 Fresh Logins (Phase 2): ${phase2Runs}`);

        // Detect concurrent Phase 2 operations
        const phase2Logins = ops.filter(op => op.type === 'phase2Login');
        for (let i = 0; i < phase2Logins.length; i++) {
            for (let j = i + 1; j < phase2Logins.length; j++) {
                const timeDiff = Math.abs(
                    phase2Logins[i].timestamp - phase2Logins[j].timestamp
                );

                // If two workers started Phase 2 within 5 seconds
                if (timeDiff < 5000) {
                    potentialRaces.push({
                        role,
                        worker1: phase2Logins[i],
                        worker2: phase2Logins[j],
                        timeDiff,
                    });
                }
            }
        }
        console.log('');
    }

    // Summary
    console.log('=== Summary ===');
    console.log(`Total session reuses: ${totalPhase1Success}`);
    console.log(`Total fresh logins: ${totalPhase2Runs}`);

    if (totalPhase1Success + totalPhase2Runs > 0) {
        const reuseRate = (totalPhase1Success / (totalPhase1Success + totalPhase2Runs) * 100).toFixed(1);
        console.log(`Session reuse rate: ${reuseRate}%`);
    }

    // Race condition warnings
    if (potentialRaces.length > 0) {
        console.log(`\n⚠️  POTENTIAL RACE CONDITIONS DETECTED: ${potentialRaces.length}`);
        console.log('\nDetails:');
        potentialRaces.forEach((race, idx) => {
            console.log(`\n${idx + 1}. Role: ${race.role}`);
            console.log(`   Worker 1 (PID ${race.worker1.pid}): ${race.worker1.timestamp.toISOString()}`);
            console.log(`   Worker 2 (PID ${race.worker2.pid}): ${race.worker2.timestamp.toISOString()}`);
            console.log(`   Time difference: ${race.timeDiff}ms`);
            console.log(`   ⚠️  Both workers attempted to create the same session file!`);
        });
        console.log('\n💡 Recommendation: Consider adding file locking for this role.');
    } else {
        console.log('\n✅ No race conditions detected!');
    }
}

async function processInput(input) {
    const rl = readline.createInterface({
        input,
        crlfDelay: Infinity,
    });

    for await (const line of rl) {
        const event = parseLog(line);
        if (event) {
            if (!sessionOps[event.role]) {
                sessionOps[event.role] = [];
            }
            sessionOps[event.role].push(event);
        }
    }

    analyzeRaceConditions();
}

// Main
const args = process.argv.slice(2);

if (args.length > 0) {
    // Read from file
    const logFile = args[0];
    if (!fs.existsSync(logFile)) {
        console.error(`Error: File not found: ${logFile}`);
        process.exit(1);
    }
    processInput(fs.createReadStream(logFile));
} else {
    // Read from stdin
    processInput(process.stdin);
}
