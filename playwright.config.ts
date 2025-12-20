import { defineConfig, devices } from '@playwright/test';

// Build reporter array dynamically
const reporters: any[] = process.env.CI
    ? [['blob'], ['list']]
    : [['html'], ['list']];

// Add Allure reporter if enabled
if (process.env.ENABLE_ALLURE !== 'false') {
    reporters.push(['allure-playwright', {
        outputFolder: process.env.ALLURE_OUTPUT_DIR || 'allure-results',
        detail: true,
        suiteTitle: true,
        categories: [
            {
                name: 'Product issues',
                messageRegex: '.*product.*',
            },
            {
                name: 'Network issues',
                messageRegex: '.*timeout.*|.*network.*',
            },
        ],
        environmentInfo: {
            'Test Environment': process.env.TEST_ENVIRONMENT || 'LOCAL',
            'Browser': 'Chromium',
            'Node Version': process.version,
        },
    }]);
}

export default defineConfig({
    testDir: './tests',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: parseInt(process.env.RETRIES || (process.env.CI ? '2' : '1'), 10),
    workers: process.env.CI ? 1 : undefined,
    reporter: reporters,
    use: {
        baseURL: 'http://fptshop.com.vn',
        trace: 'on-first-retry',
    },
    projects: [
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
        },
    ],
});
