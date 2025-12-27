const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');

const args = process.argv.slice(2);
const shardArg = args.find(arg => arg.startsWith('--shard='));

if (!shardArg) {
    console.error('Error: --shard=x/y argument is required');
    process.exit(1);
}

const [shardIndex, shardTotal] = shardArg.split('=')[1].split('/').map(Number);

if (!shardIndex || !shardTotal) {
    console.error('Error: Invalid shard format. Use --shard=x/y');
    process.exit(1);
}

const featuresDir = path.join(__dirname, '../features');

// Recursive function to find all .feature files in subdirectories
function findFeatureFiles(dir, baseDir = '') {
    let results = [];
    const items = fs.readdirSync(dir, { withFileTypes: true });

    for (const item of items) {
        const fullPath = path.join(dir, item.name);
        const relativePath = path.join(baseDir, item.name);

        if (item.isDirectory()) {
            // Recursively search subdirectories
            results = results.concat(findFeatureFiles(fullPath, relativePath));
        } else if (item.isFile() && item.name.endsWith('.feature')) {
            results.push(path.join('features', relativePath));
        }
    }

    return results;
}

// Find all feature files recursively and sort for deterministic sharding
const allFiles = findFeatureFiles(featuresDir).sort();

const filesToRun = allFiles.filter((_, index) => (index % shardTotal) + 1 === shardIndex);

if (filesToRun.length === 0) {
    console.log(`Shard ${shardIndex}/${shardTotal}: No files to run.`);
    process.exit(0);
}

console.log(`Shard ${shardIndex}/${shardTotal}: Running files:`, filesToRun);

// Construct arguments to pass to cucumber-js
// We override the report name to avoid conflicts and allow artifact upload
const reportFileHtml = `cucumber-report-${shardIndex}.html`;
const reportFileJson = `cucumber-report-${shardIndex}.json`;

const tagsArg = args.find(arg => arg.startsWith('--tags'));
const parallelArg = args.find(arg => arg.startsWith('--parallel='));

// Check if Allure is enabled
// Uses same logic as playwright.config.ts and cucumber.js - enabled unless explicitly 'false'
const enableAllure = process.env.ENABLE_ALLURE !== 'false';
const allureOutputDir = process.env.ALLURE_OUTPUT_DIR || 'allure-results';

console.log(`ENABLE_ALLURE env: ${process.env.ENABLE_ALLURE}`);
console.log(`Allure enabled: ${enableAllure}`);

// Ensure allure-results directory exists
const resultsPath = path.join(process.cwd(), allureOutputDir);
if (enableAllure) {
    if (!fs.existsSync(resultsPath)) {
        fs.mkdirSync(resultsPath, { recursive: true });
        console.log(`Created Allure results directory: ${resultsPath}`);
    }
    console.log(`Allure enabled, results will be written to: ${resultsPath}`);
}

// Build cucumber arguments - use profile 'shard' to avoid default profile's paths
// The shard profile provides request/require-module config but does not include 'paths', ensuring only specific files run
const cucumberArgs = [
    ...filesToRun, // Pass specific files
    '--profile', 'shard',
    // Explicitly pass require/module to ensure they work in CI environment
    '--require-module', 'ts-node/register',
    '--require-module', 'tsconfig-paths/register',
    // Use glob patterns that include subdirectories
    '--require', 'src/steps/**/*.ts',
    '--require', 'src/support/*.ts',
    '--format', 'progress', // Use progress instead of progress-bar for CI
    '--format', `html:${reportFileHtml}`,
    '--format', `json:${reportFileJson}`,
];

// Add Allure formatter if enabled
// We add it manually because the 'shard' profile in cucumber.js might not effectively load it
// if the environment variable resolution differs in the child process.
if (enableAllure) {
    cucumberArgs.push('--format', 'allure-cucumberjs/reporter');
    // CRITICAL: Pass formatOptions to tell allure-cucumberjs where to write results
    cucumberArgs.push('--format-options', JSON.stringify({ resultsDir: resultsPath }));
}

let tagsForEnv = '';

if (tagsArg) {
    console.log(`Tags arg detected. Raw args:`, args);
    const tagsIndex = args.indexOf('--tags');
    if (tagsIndex !== -1 && args[tagsIndex + 1]) {
        const tagValue = args[tagsIndex + 1];
        // Remove surrounding quotes if present (shell might include them)
        const cleanTag = tagValue.replace(/^['"]|['"]$/g, '');
        console.log(`Tag value: "${tagValue}" -> cleaned: "${cleanTag}"`);
        cucumberArgs.push('--tags', cleanTag);
        tagsForEnv = cleanTag;
    } else {
        const directTags = args.find(a => a.startsWith('--tags='));
        if (directTags) {
            const tagValue = directTags.split('=')[1];
            const cleanTag = tagValue.replace(/^['"]|['"]$/g, '');
            console.log(`Direct tag value: "${tagValue}" -> cleaned: "${cleanTag}"`);
            cucumberArgs.push('--tags', cleanTag);
            tagsForEnv = cleanTag;
        }
    }
}

if (parallelArg) {
    const workers = parallelArg.split('=')[1];
    cucumberArgs.push('--parallel', workers);
}

console.log(`Running command: npx cucumber-js ${cucumberArgs.join(' ')}`);

// Set ALLURE_RESULTS_DIR environment variable for allure-cucumberjs
const childEnv = {
    ...process.env,
    ALLURE_RESULTS_DIR: resultsPath,
    ALLURE_OUTPUT_DIR: resultsPath, // Ensure both vars point to the absolute path
    ALLURE_TAGS: tagsForEnv || process.env.TAGS || 'None',
};

const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(cmd, ['cucumber-js', ...cucumberArgs], {
    stdio: 'inherit',
    env: childEnv,
});

child.on('close', (code) => {
    // List what was generated in allure-results
    console.log(`\n=== Allure Results Check ===`);
    if (fs.existsSync(resultsPath)) {
        const files = fs.readdirSync(resultsPath);
        console.log(`Total files in ${resultsPath}: ${files.length}`);
        if (files.length > 0) {
            console.log(`First 10 files: ${files.slice(0, 10).join(', ')}`);
        }
    } else {
        console.log(`Directory ${resultsPath} does not exist!`);
    }

    process.exit(code);
});
