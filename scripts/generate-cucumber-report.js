const fs = require('fs');
const path = require('path');
const reporter = require('cucumber-html-reporter');

const reportFile = path.join(__dirname, '../cucumber-report.json');
const outputDir = path.join(__dirname, '../cucumber-report');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

if (!fs.existsSync(reportFile)) {
    console.error('❌ No cucumber-report.json found!');
    console.log('\n💡 Run tests first: npm run test:cucumber\n');
    process.exit(1);
}

console.log('📊 Generating Cucumber HTML Report...\n');

// Read the JSON report
let reportData;
try {
    reportData = JSON.parse(fs.readFileSync(reportFile, 'utf8'));
} catch (error) {
    console.error('❌ Error reading cucumber-report.json:', error.message);
    process.exit(1);
}

// Calculate summary
let passed = 0;
let failed = 0;

if (Array.isArray(reportData)) {
    reportData.forEach(feature => {
        if (feature.elements) {
            feature.elements.forEach(scenario => {
                const isFailed = scenario.steps.some(step => step.result.status === 'failed');
                if (isFailed) failed++;
                else passed++;
            });
        }
    });
}

console.log('==============================');
console.log('   TEST EXECUTION SUMMARY     ');
console.log('==============================');
console.log(`Total Scenarios: ${passed + failed}`);
console.log(`Passed: ${passed} ✅`);
console.log(`Failed: ${failed} ❌`);
console.log('==============================\n');

// Generate HTML report
const options = {
    theme: 'bootstrap',
    jsonFile: reportFile,
    output: path.join(outputDir, 'index.html'),
    reportSuiteAsScenarios: true,
    scenarioTimestamp: true,
    launchReport: false,
    metadata: {
        "App Version": process.env.APP_VERSION || "1.0.0",
        "Test Environment": process.env.TEST_ENVIRONMENT || "LOCAL",
        "Browser": "Chrome",
        "Platform": process.platform,
        "Parallel": process.env.PARALLEL_WORKERS || "4",
        "Executed": "Local"
    },
    failedSummaryReport: false,
    storeScreenshots: true,
    noInlineScreenshots: false,
};

try {
    reporter.generate(options);
    console.log('✅ HTML Report generated successfully!\n');
    console.log(`📂 Location: ${path.join(outputDir, 'index.html')}`);
    console.log(`🌐 Open: npm run report:open:cucumber\n`);
} catch (error) {
    console.error('❌ Error generating report:', error.message);
    process.exit(1);
}
