const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const resultsDir = path.join(__dirname, '../../allure-results');
const reportDir = path.join(__dirname, '../../allure-report');
const blobsDir = path.join(__dirname, '../../allure-results-blobs'); // Temp dir for extracted shards

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

        // Helper function to copy files from a source directory
        // NOTE: Do NOT prefix file names! Allure result files contain internal
        // references to attachments/containers using the UUID. If we rename
        // files, those references break and Allure can't find them.
        // UUIDs are globally unique, so collisions are extremely unlikely.
        const copyFilesFromDir = (sourceDir, shardName) => {
            let count = 0;
            let skipped = 0;
            const files = fs.readdirSync(sourceDir);
            files.forEach(file => {
                const src = path.join(sourceDir, file);
                const dest = path.join(resultsDir, file); // Keep original name!
                if (fs.statSync(src).isFile()) {
                    // Skip if file already exists (shouldn't happen with UUIDs)
                    if (fs.existsSync(dest)) {
                        skipped++;
                        return;
                    }
                    fs.copyFileSync(src, dest);
                    count++;
                }
            });
            if (skipped > 0) {
                console.log(`      ⚠️  Skipped ${skipped} duplicate files`);
            }
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

                // Show sample files for debugging (first 3 result files)
                const sampleResults = filesInDir.filter(f => f.endsWith('-result.json')).slice(0, 3);
                if (sampleResults.length > 0) {
                    console.log(`      🔍 Sample result files: ${sampleResults.join(', ')}`);
                }

                const copiedCount = copyFilesFromDir(actualPath, shard);
                totalFiles += copiedCount;
                console.log(`      ✅ Copied ${copiedCount} files`);
            }
        });

        // CROSS-SHARD ANALYSIS: Check if same files exist in different shards
        console.log(`\n📊 Cross-shard file analysis:`);
        const shardFileMap = {};
        let duplicateCount = 0;

        shards.forEach(shard => {
            if (shard.startsWith('.')) return;
            const shardPath = path.join(blobsDir, shard);
            if (!fs.statSync(shardPath).isDirectory()) return;

            const nestedPath = path.join(shardPath, 'allure-results');
            const actualPath = fs.existsSync(nestedPath) ? nestedPath : shardPath;

            const files = fs.readdirSync(actualPath).filter(f => f.endsWith('-result.json'));
            files.slice(0, 100).forEach(file => { // Check first 100 files per shard
                if (!shardFileMap[file]) {
                    shardFileMap[file] = [];
                }
                shardFileMap[file].push(shard);
            });
        });

        // Find files that appear in multiple shards
        const filesInMultipleShards = Object.entries(shardFileMap)
            .filter(([_, shards]) => shards.length > 1);

        if (filesInMultipleShards.length > 0) {
            console.log(`   ⚠️  CRITICAL: ${filesInMultipleShards.length} files appear in MULTIPLE shards!`);
            console.log(`      This means shards are generating IDENTICAL results.`);
            filesInMultipleShards.slice(0, 5).forEach(([file, shards]) => {
                console.log(`      - ${file} appears in: ${shards.join(', ')}`);
            });
        } else {
            console.log(`   ✅ All files are unique across shards (no duplicates in first 100/shard).`);
        }

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

// DEEP DIAGNOSTICS: Analyze result files
console.log('\n🔬 DEEP DIAGNOSTICS:');
const resultFiles = files.filter(f => f.endsWith('-result.json'));
console.log(`   Result files (-result.json): ${resultFiles.length}`);

if (resultFiles.length > 0) {
    const historyIds = new Set();
    const testCaseIds = new Set();
    const fullNames = new Set();
    const sampleResults = [];

    // Analyze first 1000 result files (for performance)
    const filesToAnalyze = resultFiles.slice(0, 1000);

    filesToAnalyze.forEach(file => {
        try {
            const content = JSON.parse(fs.readFileSync(path.join(resultsDir, file), 'utf8'));
            if (content.historyId) historyIds.add(content.historyId);
            if (content.testCaseId) testCaseIds.add(content.testCaseId);
            if (content.fullName) fullNames.add(content.fullName);

            // Collect samples for inspection
            if (sampleResults.length < 5) {
                sampleResults.push({
                    file: file,
                    name: content.name?.substring(0, 50),
                    fullName: content.fullName?.substring(0, 80),
                    historyId: content.historyId?.substring(0, 20),
                    testCaseId: content.testCaseId?.substring(0, 20),
                    status: content.status
                });
            }
        } catch (e) {
            // Skip invalid files
        }
    });

    console.log(`   Analyzed ${filesToAnalyze.length} result files:`);
    console.log(`      📝 Unique historyIds: ${historyIds.size}`);
    console.log(`      🔑 Unique testCaseIds: ${testCaseIds.size}`);
    console.log(`      📋 Unique fullNames: ${fullNames.size}`);

    // KEY INSIGHT: If historyIds << resultFiles, there are duplicates!
    if (historyIds.size < filesToAnalyze.length / 2) {
        console.log(`\n   ⚠️  WARNING: Many duplicate historyIds detected!`);
        console.log(`      This means Allure will MERGE results with the same historyId.`);
        console.log(`      Expected: ~${filesToAnalyze.length} unique tests`);
        console.log(`      Actual: ${historyIds.size} unique historyIds`);
    }

    console.log(`\n   📋 Sample result files:`);
    sampleResults.forEach((sample, i) => {
        console.log(`      ${i + 1}. ${sample.file}`);
        console.log(`         name: ${sample.name}`);
        console.log(`         historyId: ${sample.historyId}...`);
        console.log(`         status: ${sample.status}`);
    });
}

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

    // 3. Process and Copy categories.json with Priority logic
    const categoriesSource = path.join(__dirname, '../../allure-categories.json');
    const categoriesDest = path.join(resultsDir, 'categories.json');

    if (fs.existsSync(categoriesSource)) {
        console.log('📋 Processing categories with strict priority (waterfall matching)...');
        try {
            const categories = JSON.parse(fs.readFileSync(categoriesSource, 'utf8'));
            const finalCategories = [];
            const exclusions = [];

            categories.forEach(originalCat => {
                const newCat = { ...originalCat };

                if (newCat.messageRegex) {
                    const originalRegex = newCat.messageRegex;

                    // Apply negative lookahead for all higher-priority (previous) categories
                    if (exclusions.length > 0) {
                        const combinedExclusion = exclusions.map(e => `(?:${e})`).join('|');
                        // Prepend lookahead. usage of ^ ensures it checks from start of string
                        newCat.messageRegex = `^(?!${combinedExclusion})${originalRegex}`;
                    }

                    exclusions.push(originalRegex);
                }
                finalCategories.push(newCat);
            });

            fs.writeFileSync(categoriesDest, JSON.stringify(finalCategories, null, 2));
            console.log(`   ✅ Processed ${finalCategories.length} categories.`);
        } catch (err) {
            console.error('   ⚠️ Error processing categories.json, falling back to simple copy:', err.message);
            fs.copyFileSync(categoriesSource, categoriesDest);
        }
    }

    // 4. Generate Standard Report (no history for now - debugging)
    execSync(`npx allure generate ${resultsDir} --clean -o ${reportDir}`, { stdio: 'inherit' });

    // 5. Generate Single-File Report
    const singleFileDir = path.join(__dirname, '../../allure-report-single');
    execSync(`npx allure generate ${resultsDir} --clean --single-file -o ${singleFileDir}`, { stdio: 'inherit' });

    // 6. Copy alias
    fs.copyFileSync(path.join(singleFileDir, 'index.html'), path.join(reportDir, 'complete-report.html'));

    console.log('✅ Reports generated successfully!');
    console.log(`   ${reportDir}/complete-report.html`);

} catch (error) {
    console.error('\n❌ Error generating Allure report:', error.message);
    process.exit(1);
}
