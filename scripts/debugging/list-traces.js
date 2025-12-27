const fs = require('fs');
const path = require('path');

const tracesDir = path.join(__dirname, '../../traces');

console.log('\n🔍 Available Trace Files\n');
console.log('='.repeat(80));

if (!fs.existsSync(tracesDir)) {
    console.log('\n📁 No traces directory found. Run some tests first!\n');
    process.exit(0);
}

const traceFiles = fs.readdirSync(tracesDir)
    .filter(file => file.endsWith('.zip'))
    .map(file => {
        const filePath = path.join(tracesDir, file);
        const stats = fs.statSync(filePath);
        return {
            name: file,
            path: filePath,
            size: stats.size,
            created: stats.mtime
        };
    })
    .sort((a, b) => b.created - a.created); // Most recent first

if (traceFiles.length === 0) {
    console.log('\n📁 No trace files found. Traces are only generated for failed tests.\n');
    process.exit(0);
}

console.log(`\n📊 Found ${traceFiles.length} trace file(s):\n`);

traceFiles.forEach((trace, index) => {
    const sizeKB = (trace.size / 1024).toFixed(2);
    const timeAgo = getTimeAgo(trace.created);

    console.log(`${index + 1}. ${trace.name}`);
    console.log(`   📅 Created: ${trace.created.toLocaleString()} (${timeAgo})`);
    console.log(`   📦 Size: ${sizeKB} KB`);
    console.log(`   💻 View: npm run trace:show ${index + 1}`);
    console.log(`   🔧 Command: npx playwright show-trace ${trace.path}`);
    console.log('');
});

console.log('='.repeat(80));
console.log('\n💡 Tip: Use "npm run trace:show <number>" to open a trace file\n');

function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);

    if (seconds < 60) return `${seconds} second(s) ago`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)} minute(s) ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)} hour(s) ago`;
    return `${Math.floor(seconds / 86400)} day(s) ago`;
}
