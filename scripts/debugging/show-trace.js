const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

const tracesDir = path.join(__dirname, '../../traces');
const traceNumber = process.argv[2];

if (!fs.existsSync(tracesDir)) {
    console.error('\n❌ No traces directory found. Run some tests first!\n');
    process.exit(1);
}

const traceFiles = fs.readdirSync(tracesDir)
    .filter(file => file.endsWith('.zip'))
    .map(file => {
        const filePath = path.join(tracesDir, file);
        const stats = fs.statSync(filePath);
        return {
            name: file,
            path: filePath,
            created: stats.mtime
        };
    })
    .sort((a, b) => b.created - a.created); // Most recent first

if (traceFiles.length === 0) {
    console.error('\n❌ No trace files found. Traces are only generated for failed tests.\n');
    console.log('💡 Run: npm run trace:list to see available traces\n');
    process.exit(1);
}

let selectedTrace;

if (!traceNumber) {
    // No argument provided, open the most recent trace
    selectedTrace = traceFiles[0];
    console.log(`\n🔍 Opening most recent trace: ${selectedTrace.name}\n`);
} else {
    const index = parseInt(traceNumber) - 1;

    if (isNaN(index) || index < 0 || index >= traceFiles.length) {
        console.error(`\n❌ Invalid trace number: ${traceNumber}`);
        console.log(`\n💡 Available traces: 1-${traceFiles.length}`);
        console.log('💡 Run: npm run trace:list to see all traces\n');
        process.exit(1);
    }

    selectedTrace = traceFiles[index];
    console.log(`\n🔍 Opening trace #${traceNumber}: ${selectedTrace.name}\n`);
}

console.log('📂 Trace file:', selectedTrace.path);
console.log('⏳ Launching Playwright Trace Viewer...\n');

const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(cmd, ['playwright', 'show-trace', selectedTrace.path], {
    stdio: 'inherit',
    shell: true
});

child.on('error', (error) => {
    console.error('\n❌ Error launching trace viewer:', error.message);
    console.log('\n💡 Make sure Playwright is installed: npm install\n');
    process.exit(1);
});

child.on('close', (code) => {
    if (code !== 0) {
        console.error(`\n❌ Trace viewer exited with code ${code}\n`);
        process.exit(code);
    }
});
