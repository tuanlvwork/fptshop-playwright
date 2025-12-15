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
    }
};

reporter.generate(options);
console.log('HTML Report generated successfully.');
