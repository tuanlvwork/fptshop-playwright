const fs = require('fs');
const path = require('path');
const reporter = require('cucumber-html-reporter');

const reportsDir = path.join(__dirname, '../all-cucumber-reports');
const outputDir = path.join(__dirname, '../cucumber-report');

if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
}

// 1. Find all JSON files
const jsonFiles = fs.readdirSync(reportsDir).filter(file => file.endsWith('.json'));

if (jsonFiles.length === 0) {
    console.log('No JSON reports found to merge.');
    process.exit(0);
}

console.log(`Found ${jsonFiles.length} JSON reports to merge.`);

// 2. Merge JSON content
let mergedResults = [];

jsonFiles.forEach(file => {
    const filePath = path.join(reportsDir, file);
    const content = fs.readFileSync(filePath, 'utf8');
    try {
        const json = JSON.parse(content);
        if (Array.isArray(json)) {
            mergedResults = mergedResults.concat(json);
        }
    } catch (err) {
        console.error(`Error parsing ${file}:`, err);
    }
});

const mergedJsonPath = path.join(outputDir, 'merged-report.json');
fs.writeFileSync(mergedJsonPath, JSON.stringify(mergedResults, null, 2));
console.log(`Merged JSON written to ${mergedJsonPath}`);

// Calculate and log summary
let passed = 0;
let failed = 0;
mergedResults.forEach(feature => {
    if (feature.elements) {
        feature.elements.forEach(scenario => {
            const isFailed = scenario.steps.some(step => step.result.status === 'failed');
            if (isFailed) failed++;
            else passed++;
        });
    }
});

console.log('==============================');
console.log('       TEST EXECUTION SUMMARY       ');
console.log('==============================');
console.log(`Total Scenarios: ${passed + failed}`);
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);
console.log('==============================');

// Detailed failure report
if (failed > 0) {
    console.log('\n🔴 FAILED SCENARIOS DETAILS:');
    console.log('==============================\n');

    mergedResults.forEach(feature => {
        if (feature.elements) {
            feature.elements.forEach(scenario => {
                const failedSteps = scenario.steps.filter(step => step.result.status === 'failed');
                if (failedSteps.length > 0) {
                    console.log(`\n📋 Feature: ${feature.name}`);
                    console.log(`   Scenario: ${scenario.name}`);

                    failedSteps.forEach((step, index) => {
                        console.log(`\n   ❌ Failed Step ${index + 1}: ${step.name}`);

                        if (step.result.error_message) {
                            console.log(`   💥 Error: ${step.result.error_message.split('\n')[0]}`);
                        }

                        if (step.result.duration) {
                            console.log(`   ⏱️  Duration: ${(step.result.duration / 1000000).toFixed(2)}ms`);
                        }

                        if (step.embeddings && step.embeddings.length > 0) {
                            const textAttachments = step.embeddings.filter(e => e.mime_type === 'text/plain').length;
                            const imageAttachments = step.embeddings.filter(e => e.mime_type.startsWith('image')).length;
                            console.log(`   📎 Attachments: ${textAttachments} text, ${imageAttachments} screenshots`);
                        }
                    });
                    console.log('\n   ' + '─'.repeat(60));
                }
            });
        }
    });
    console.log('\n==============================\n');
}

// 3. Generate HTML Report
const options = {
    theme: 'bootstrap',
    jsonFile: mergedJsonPath,
    output: path.join(outputDir, 'index.html'),
    reportSuiteAsScenarios: true,
    scenarioTimestamp: true,
    launchReport: false,
    metadata: {
        "App Version": "1.0.0",
        "Test Environment": "STAGING",
        "Browser": "Chrome",
        "Platform": process.platform,
        "Parallel": "Scenarios",
        "Executed": "Remote"
    },
    failedSummaryReport: true,
};

reporter.generate(options);
console.log('HTML Report generated successfully.');
