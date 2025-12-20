const common = {
    requireModule: ['ts-node/register', 'tsconfig-paths/register'],
    require: ['src/steps/*.ts', 'src/support/*.ts'],
};

// Allure configuration
const allureOutputDir = process.env.ALLURE_OUTPUT_DIR || 'allure-results';
const enableAllure = process.env.ENABLE_ALLURE !== 'false';

// Conditionally add Allure formatter
const allureFormat = enableAllure ? ['allure-cucumberjs/reporter'] : [];
const allureFormatOptions = enableAllure ? {
    resultsDir: allureOutputDir,
} : {};

module.exports = {
    default: {
        ...common,
        parallel: 4,
        format: [
            'progress-bar',
            'html:cucumber-report.html',
            'json:cucumber-report.json',
            ...allureFormat,
        ],
        formatOptions: allureFormatOptions,
        paths: ['features/*.feature'],
    },
    shard: {
        ...common,
        format: [
            'progress',
            ...allureFormat,
        ],
        formatOptions: allureFormatOptions,
    }
}

