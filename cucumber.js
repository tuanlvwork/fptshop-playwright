const common = {
    requireModule: ['ts-node/register', 'tsconfig-paths/register'],
    require: ['src/steps/*.ts', 'src/support/*.ts'],
};

// Allure configuration
const allureOutputDir = process.env.ALLURE_OUTPUT_DIR || 'allure-results';
const enableAllure = process.env.ENABLE_ALLURE !== 'false';

// Retry configuration: CI defaults to 2, local defaults to 1
const isCI = process.env.CI === 'true' || process.env.CI === '1';
const retries = parseInt(process.env.RETRIES || (isCI ? '2' : '1'), 10);

// Verbose mode: shows step-by-step details
const verbose = process.env.VERBOSE === 'true';

// Conditionally add Allure formatter
const allureFormat = enableAllure ? ['allure-cucumberjs/reporter'] : [];
const allureFormatOptions = enableAllure ? {
    resultsDir: allureOutputDir,
} : {};

module.exports = {
    // Default profile: progress bar with parallel execution
    default: {
        ...common,
        parallel: verbose ? 1 : 4,
        retry: retries,
        format: verbose
            ? [
                '@cucumber/pretty-formatter',
                ...allureFormat,
            ]
            : [
                'progress-bar',
                'html:cucumber-report.html',
                'json:cucumber-report.json',
                ...allureFormat,
            ],
        formatOptions: allureFormatOptions,
        paths: ['features/*.feature'],
        publish: false,
    },
    // Shard profile for CI - minimal config, expects explicit args for require/paths
    shard: {
        retry: retries,
        format: [
            'progress',
            ...allureFormat,
        ],
        formatOptions: allureFormatOptions,
        publish: false,
    }
}
