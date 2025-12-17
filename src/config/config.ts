import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export interface TestConfig {
    // Application
    baseUrl: string;

    // Browser Settings
    headless: boolean;
    viewportWidth: number;
    viewportHeight: number;

    // Timeouts
    defaultTimeout: number;
    navigationTimeout: number;
    actionTimeout: number;

    // Execution
    parallelWorkers: number;
    retries: number;

    // Screenshots
    screenshotOnFailure: boolean;
    screenshotType: 'png' | 'jpeg';
    fullPageScreenshot: boolean;

    // Tracing
    enableTracing: boolean;
    traceOnFailureOnly: boolean;

    // Reports
    reportTitle: string;
    testEnvironment: string;
    appVersion: string;

    // CI
    isCI: boolean;
}

const config: TestConfig = {
    // Application
    baseUrl: process.env.BASE_URL || 'https://fptshop.com.vn',

    // Browser Settings
    headless: process.env.HEADLESS !== 'false',
    viewportWidth: parseInt(process.env.VIEWPORT_WIDTH || '1920', 10),
    viewportHeight: parseInt(process.env.VIEWPORT_HEIGHT || '1080', 10),

    // Timeouts
    defaultTimeout: parseInt(process.env.DEFAULT_TIMEOUT || '60000', 10),
    navigationTimeout: parseInt(process.env.NAVIGATION_TIMEOUT || '30000', 10),
    actionTimeout: parseInt(process.env.ACTION_TIMEOUT || '10000', 10),

    // Execution
    parallelWorkers: parseInt(process.env.PARALLEL_WORKERS || '4', 10),
    retries: parseInt(process.env.RETRIES || '1', 10),

    // Screenshots
    screenshotOnFailure: process.env.SCREENSHOT_ON_FAILURE !== 'false',
    screenshotType: (process.env.SCREENSHOT_TYPE as 'png' | 'jpeg') || 'png',
    fullPageScreenshot: process.env.FULL_PAGE_SCREENSHOT !== 'false',

    // Tracing
    enableTracing: process.env.ENABLE_TRACING !== 'false',
    traceOnFailureOnly: process.env.TRACE_ON_FAILURE_ONLY !== 'false',

    // Reports
    reportTitle: process.env.REPORT_TITLE || 'FPT Shop Test Automation',
    testEnvironment: process.env.TEST_ENVIRONMENT || 'STAGING',
    appVersion: process.env.APP_VERSION || '1.0.0',

    // CI
    isCI: process.env.CI === 'true' || process.env.CI === '1',
};

export default config;
