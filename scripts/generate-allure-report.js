const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const resultsDir = path.join(__dirname, '../allure-results');
const reportDir = path.join(__dirname, '../allure-report');
const blobsDir = path.join(__dirname, '../allure-results-blobs'); // Temp dir for extracted shards

console.log('🔍 Checking for Allure results...');

// 0. Merge Sharded Results (if they exist in blobsDir)
// This fixes the issue where shards overwrite each other if merge-multiple: true is used with identical filenames
if (fs.existsSync(blobsDir)) {
    console.log('📦 Found sharded results in allure-results-blobs. Merging...');
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
    }

    try {
        const shards = fs.readdirSync(blobsDir);
        let totalFiles = 0;

        shards.forEach(shard => {
            const shardPath = path.join(blobsDir, shard);
            // Verify it is a directory (it should be, e.g., allure-results-cucumber-1)
            if (fs.statSync(shardPath).isDirectory()) {
                const files = fs.readdirSync(shardPath);
                files.forEach(file => {
                    const src = path.join(shardPath, file);
                    let dest = path.join(resultsDir, file);

                    // Handle Collisions by renaming
                    if (fs.existsSync(dest)) {
                        const ext = path.extname(file);
                        const name = path.basename(file, ext);
                        const timestamp = Date.now();
                        // Append shard name and timestamp to ensure uniqueness
                        dest = path.join(resultsDir, `${name}_${shard}_${timestamp}${ext}`);
                        console.warn(`⚠️  Collision detected for ${file}. Renamed to ${path.basename(dest)}`);
                    }

                    fs.copyFileSync(src, dest);
                    totalFiles++;
                });
            }
        });
        console.log(`✅ Merged ${totalFiles} files from ${shards.length} shards into ${resultsDir}`);
    } catch (mergeError) {
        console.error('❌ Error merging sharded results:', mergeError.message);
        // Continue, as there might be files in resultsDir anyway if run locally
    }
}

// 1. Validate Results Existence
if (!fs.existsSync(resultsDir)) {
    console.error('❌ No allure-results directory found!');
    console.log('\n💡 Run tests first with Allure enabled:');
    console.log('   ENABLE_ALLURE=true npm test');
    process.exit(1);
}

const files = fs.readdirSync(resultsDir);
const jsonFiles = files.filter(f => f.endsWith('.json') || f.endsWith('-result.json'));

if (files.length === 0) {
    console.error('❌ No Allure results found!');
    process.exit(1);
}

console.log(`✅ Found ${files.length} Allure result files (${jsonFiles.length} JSON files)\n`);
console.log('📊 Generating Allure Report...\n');

try {
    // 2. Install Allure CLI if missing
    try {
        execSync('npx allure --version', { stdio: 'pipe' });
    } catch (e) {
        console.log('📦 Installing Allure commandline...');
        execSync('npm install -g allure-commandline --save-dev', { stdio: 'inherit' });
    }

    // 3. Copy categories.json
    const categoriesSource = path.join(__dirname, '../allure-categories.json');
    const categoriesDest = path.join(resultsDir, 'categories.json');

    if (fs.existsSync(categoriesSource)) {
        console.log('📋 Copying custom categories definition...');
        fs.copyFileSync(categoriesSource, categoriesDest);
    }

    // 4. Preserve History for Trends
    const historySource = path.join(reportDir, 'history');
    const historyDest = path.join(resultsDir, 'history');

    if (fs.existsSync(historySource)) {
        console.log('📜 Found previous history. Preserving for Trend chart...');
        if (!fs.existsSync(historyDest)) {
            fs.mkdirSync(historyDest, { recursive: true });
        }

        const historyFiles = fs.readdirSync(historySource);
        historyFiles.forEach(file => {
            fs.copyFileSync(
                path.join(historySource, file),
                path.join(historyDest, file)
            );
        });
        console.log(`   Copied ${historyFiles.length} history files.`);
    }

    // 5. Generate Standard Report
    execSync(`npx allure generate ${resultsDir} --clean -o ${reportDir}`, {
        stdio: 'inherit'
    });
    console.log('\n✅ Standard report generated (with history preservation)!');

    // 6. Update Results with New History (for single-file report)
    const newHistorySource = path.join(reportDir, 'history');
    const resultsHistoryPath = path.join(resultsDir, 'history');

    if (fs.existsSync(newHistorySource)) {
        if (!fs.existsSync(resultsHistoryPath)) {
            fs.mkdirSync(resultsHistoryPath, { recursive: true });
        }

        const newHistoryFiles = fs.readdirSync(newHistorySource);
        newHistoryFiles.forEach(file => {
            fs.copyFileSync(path.join(newHistorySource, file), path.join(resultsHistoryPath, file));
        });
        console.log('   Updated results with latest history for single-file report.');
    }

    // 7. Generate Single-File Report
    const singleFileDir = path.join(__dirname, '../allure-report-single');
    execSync(`npx allure generate ${resultsDir} --clean --single-file -o ${singleFileDir}`, {
        stdio: 'inherit'
    });

    // 8. Copy to main report folder (optional alias)
    fs.copyFileSync(
        path.join(singleFileDir, 'index.html'),
        path.join(reportDir, 'complete-report.html')
    );
    console.log('✅ Single-file report generated!');

    console.log('\n📂 Reports generated:');
    console.log(`   Standard: ${reportDir}/index.html`);
    console.log(`   Portable: ${reportDir}/complete-report.html`);
} catch (error) {
    console.error('\n❌ Error generating Allure report:', error.message);
    process.exit(1);
}
