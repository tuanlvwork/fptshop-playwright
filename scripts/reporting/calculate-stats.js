const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, '../../cucumber-report/merged-report.json');

if (!fs.existsSync(reportPath)) {
    console.error(`Error: Report file not found at ${reportPath}`);
    process.exit(1);
}

try {
    const content = fs.readFileSync(reportPath, 'utf8');
    const features = JSON.parse(content);

    let passed = 0;
    let failed = 0;
    let total = 0;

    features.forEach(feature => {
        if (feature.elements) {
            feature.elements.forEach(scenario => {
                total++;
                const isFailed = scenario.steps.some(step => step.result.status === 'failed');
                if (isFailed) failed++;
                else passed++;
            });
        }
    });

    console.log('--------------------------------');
    console.log('       TEST STATISTICS       ');
    console.log('--------------------------------');
    console.log(`Total Cases : ${total}`);
    console.log(`Passed      : ${passed}`);
    console.log(`Failed      : ${failed}`);
    console.log('--------------------------------');

    // Write to GITHUB_STEP_SUMMARY if available
    if (process.env.GITHUB_STEP_SUMMARY) {
        const summary = `
### Test Execution Statistics
| Metric | Count |
| :--- | :--- |
| **Total Cases** | ${total} |
| **Passed** | 🟢 ${passed} |
| **Failed** | 🔴 ${failed} |
`;
        fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY, summary);
    }

} catch (err) {
    console.error('Error parsing report:', err);
    process.exit(1);
}
