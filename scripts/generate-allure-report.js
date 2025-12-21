const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const resultsDir = path.join(__dirname, '../allure-results');
const reportDir = path.join(__dirname, '../allure-report');

console.log('🔍 Checking for Allure results...\n');

if (!fs.existsSync(resultsDir)) {
    console.error('❌ No allure-results directory found!');
    console.log('\n💡 Run tests first with Allure enabled:');
    console.log('   ENABLE_ALLURE=true npm test');
    console.log('   or');
    console.log('   ENABLE_ALLURE=true npm run test:cucumber\n');
    process.exit(1);
}

const files = fs.readdirSync(resultsDir);
const jsonFiles = files.filter(f => f.endsWith('.json') || f.endsWith('-result.json'));

if (files.length === 0) {
    console.error('❌ No Allure results found!');
    console.log('\n💡 Make sure tests ran with ENABLE_ALLURE=true\n');
    process.exit(1);
}

console.log(`✅ Found ${files.length} Allure result files (${jsonFiles.length} JSON files)\n`);
console.log('📊 Generating Allure Report...\n');

try {
    // Check if allure command is available
    try {
        execSync('npx allure --version', { stdio: 'pipe' });
    } catch (e) {
        console.log('📦 Installing Allure commandline...');
        execSync('npm install -g allure-commandline --save-dev', { stdio: 'inherit' });
    }

    // Preserve history for Trend charts
    // 1. Check if previous history exists
    const historySource = path.join(reportDir, 'history');
    const historyDest = path.join(resultsDir, 'history');

    if (fs.existsSync(historySource)) {
        console.log('📜 Found previous history. Preserving for Trend chart...');
        if (!fs.existsSync(historyDest)) {
            fs.mkdirSync(historyDest, { recursive: true });
        }

        // Copy all history files
        const historyFiles = fs.readdirSync(historySource);
        historyFiles.forEach(file => {
            fs.copyFileSync(
                path.join(historySource, file),
                path.join(historyDest, file)
            );
        });
        console.log(`   Copied ${historyFiles.length} history files.`);
    }

    // Generate standard report (for local serving)
    execSync(`npx allure generate ${resultsDir} --clean -o ${reportDir}`, {
        stdio: 'inherit'
    });
    console.log('\n✅ Standard report generated (with history preservation)!');

    // Generate single-file report (portable, for GCS/sharing)
    const singleFileDir = path.join(__dirname, '../allure-report-single');
    execSync(`npx allure generate ${resultsDir} --clean --single-file -o ${singleFileDir}`, {
        stdio: 'inherit'
    });

    // Copy to main report folder
    fs.copyFileSync(
        path.join(singleFileDir, 'index.html'),
        path.join(reportDir, 'complete-report.html')
    );
    console.log('✅ Single-file report generated!');

    console.log('\n📂 Reports generated:');
    console.log(`   Standard: ${reportDir}/index.html (needs server)`);
    console.log(`   Portable: ${reportDir}/complete-report.html (works anywhere, uploadable to GCS)`);
    console.log(`\n🌐 Open: npm run allure:open`);
    console.log(`🚀 Serve: npm run allure:serve\n`);
} catch (error) {
    console.error('\n❌ Error generating Allure report:', error.message);
    process.exit(1);
}
