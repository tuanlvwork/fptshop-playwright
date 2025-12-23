const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const resultsDir = path.join(__dirname, '../allure-results');
const reportDir = path.join(__dirname, '../allure-report');
const blobsDir = path.join(__dirname, '../allure-results-blobs'); // Temp dir for extracted shards

console.log('🔍 Checking for Allure results...');

// 0. Merge Sharded Results (if they exist in blobsDir)
if (fs.existsSync(blobsDir)) {
    console.log(`📦 Found 'allure-results-blobs' directory. Listing contents...`);
    // Ensure results dir exists
    if (!fs.existsSync(resultsDir)) {
        fs.mkdirSync(resultsDir, { recursive: true });
    }

    try {
        const shards = fs.readdirSync(blobsDir);
        console.log(`   Found ${shards.length} items: ${JSON.stringify(shards)}`);

        let totalFiles = 0;
        let processedShards = 0;

        // Helper function to copy JSON files from a source directory
        const copyFilesFromDir = (sourceDir, shardPrefix) => {
            let count = 0;
            const files = fs.readdirSync(sourceDir);
            files.forEach(file => {
                const src = path.join(sourceDir, file);
                if (fs.statSync(src).isFile()) {
                    // Prefix file with shard name to GUARANTEE uniqueness
                    const destName = `${shardPrefix}_${file}`;
                    const dest = path.join(resultsDir, destName);
                    fs.copyFileSync(src, dest);
                    count++;
                }
            });
            return count;
        };

        shards.forEach(shard => {
            const shardPath = path.join(blobsDir, shard);

            // Skip hidden files or system files
            if (shard.startsWith('.')) return;

            if (fs.statSync(shardPath).isDirectory()) {
                processedShards++;
                console.log(`   ➡️  Processing shard: ${shard}`);

                // Check for nested 'allure-results' directory (common with download-artifact)
                const nestedPath = path.join(shardPath, 'allure-results');
                const actualPath = fs.existsSync(nestedPath) ? nestedPath : shardPath;

                if (actualPath !== shardPath) {
                    console.log(`      📂 Found nested 'allure-results' directory`);
                }

                const filesInDir = fs.readdirSync(actualPath);
                console.log(`      📄 Files found: ${filesInDir.length}`);

                const copiedCount = copyFilesFromDir(actualPath, shard);
                totalFiles += copiedCount;
                console.log(`      ✅ Copied ${copiedCount} files`);
            }
        });
        console.log(`\n✅ Merged ${totalFiles} files from ${processedShards} shards into ${resultsDir}`);
    } catch (mergeError) {
        console.error('❌ Error merging sharded results:', mergeError.message);
        console.error(mergeError.stack);
    }
} else {
    // If running locally without shards, checking standard location
    console.log(`   No shards found at ${blobsDir}. Using existing contents of allure-results.`);
}

// 1. Validate Results
if (!fs.existsSync(resultsDir)) {
    console.error('❌ No allure-results directory found!');
    console.log('💡 Run tests first with ENABLE_ALLURE=true');
    process.exit(1);
}

const files = fs.readdirSync(resultsDir);
const jsonFiles = files.filter(f => f.endsWith('.json') || f.endsWith('-result.json'));

console.log(`\n📊 Allure Results Status:`);
console.log(`   Total Files: ${files.length}`);
console.log(`   JSON Result Files: ${jsonFiles.length}`);

if (jsonFiles.length === 0) {
    console.error('❌ No Allure JSON results found!');
    process.exit(1);
}

console.log('\n🚀 Generating Allure Report...\n');

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
        console.log('📋 Copying categories definition');
        fs.copyFileSync(categoriesSource, categoriesDest);
    }

    // 4. Preserve History
    const historySource = path.join(reportDir, 'history');
    const historyDest = path.join(resultsDir, 'history');

    if (fs.existsSync(historySource)) {
        console.log('📜 Preserving history...');
        if (!fs.existsSync(historyDest)) fs.mkdirSync(historyDest, { recursive: true });

        fs.readdirSync(historySource).forEach(file => {
            fs.copyFileSync(path.join(historySource, file), path.join(historyDest, file));
        });
    }

    // 5. Generate Standard Report
    execSync(`npx allure generate ${resultsDir} --clean -o ${reportDir}`, { stdio: 'inherit' });

    // 6. Update Results with New History
    const newHistorySource = path.join(reportDir, 'history');
    const resultsHistoryPath = path.join(resultsDir, 'history');

    if (fs.existsSync(newHistorySource)) {
        if (!fs.existsSync(resultsHistoryPath)) fs.mkdirSync(resultsHistoryPath, { recursive: true });

        fs.readdirSync(newHistorySource).forEach(file => {
            fs.copyFileSync(path.join(newHistorySource, file), path.join(resultsHistoryPath, file));
        });
    }

    // 7. Generate Single-File Report
    const singleFileDir = path.join(__dirname, '../allure-report-single');
    execSync(`npx allure generate ${resultsDir} --clean --single-file -o ${singleFileDir}`, { stdio: 'inherit' });

    // 8. Copy alias
    fs.copyFileSync(path.join(singleFileDir, 'index.html'), path.join(reportDir, 'complete-report.html'));

    console.log('✅ Reports generated successfully!');
    console.log(`   ${reportDir}/complete-report.html`);

} catch (error) {
    console.error('\n❌ Error generating Allure report:', error.message);
    process.exit(1);
}
