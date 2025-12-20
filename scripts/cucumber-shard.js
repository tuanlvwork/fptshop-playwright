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

// Simple flat directory check. If recursive is needed, use a glob library or recursive function.
const allFiles = fs.readdirSync(featuresDir)
    .filter(file => file.endsWith('.feature'))
    .sort() // Deterministic order
    .map(file => path.join('features', file));

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
const enableAllure = process.env.ENABLE_ALLURE !== 'false';
const allureOutputDir = process.env.ALLURE_OUTPUT_DIR || 'allure-results';

const cucumberArgs = [
    ...filesToRun, // Pass specific files
    '--profile', 'shard',
    '--format', 'progress', // Use progress instead of progress-bar for CI
    '--format', `html:${reportFileHtml}`,
    '--format', `json:${reportFileJson}`,
];

// Add Allure formatter if enabled
if (enableAllure) {
    cucumberArgs.push('--format', 'allure-cucumberjs/reporter');
    cucumberArgs.push('--format-options', JSON.stringify({ resultsDir: allureOutputDir }));
    console.log(`Allure enabled, results will be written to: ${allureOutputDir}`);
}

if (tagsArg) {
    const tags = tagsArg.split('=')[1] || args[args.indexOf(tagsArg) + 1];
    // Handle case where tags might be passed as --tags "tag" or --tags="tag"
    // The shell script passes it as --tags 'tag', so node receives it as two args usually, 
    // but here we are parsing from process.argv manually passed from npm script.
    // The npm script invocation is: node scripts/cucumber-shard.js --shard=... --tags '...'

    // Let's rely on how we passed it in YAML: $TAGS_ARG which is "--tags '...'"
    // process.argv will see: ... '--shard=...', '--tags', '@tag'

    const tagsIndex = args.indexOf('--tags');
    if (tagsIndex !== -1 && args[tagsIndex + 1]) {
        cucumberArgs.push('--tags', args[tagsIndex + 1]);
    } else {
        // Try to handle --tags=... format if that was passed
        const directTags = args.find(a => a.startsWith('--tags='));
        if (directTags) {
            cucumberArgs.push(directTags);
        }
    }
}

if (parallelArg) {
    const workers = parallelArg.split('=')[1];
    cucumberArgs.push('--parallel', workers);
}

console.log(`Running command: npx cucumber-js ${cucumberArgs.join(' ')}`);

const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(cmd, ['cucumber-js', ...cucumberArgs], { stdio: 'inherit' });

child.on('close', (code) => {
    process.exit(code);
});

