import * as fs from 'fs';
import * as path from 'path';

interface EnvironmentInfo {
    [key: string]: string;
}

/**
 * Generate Allure environment properties file
 * This adds context information to the Allure report
 */
export function generateAllureEnvironment(additionalInfo: EnvironmentInfo = {}): void {
    const allureResultsDir = process.env.ALLURE_OUTPUT_DIR || path.join(process.cwd(), 'allure-results');

    if (!fs.existsSync(allureResultsDir)) {
        fs.mkdirSync(allureResultsDir, { recursive: true });
    }

    const environment: EnvironmentInfo = {
        'Browser': 'Chromium',
        'Node.js': process.version,
        'Platform': process.platform,
        'Architecture': process.arch,
        'Base URL': process.env.BASE_URL || 'https://fptshop.com.vn',
        'Headless': process.env.HEADLESS !== 'false' ? 'true' : 'false',
        'CI': process.env.CI || 'false',
        'Test Framework': 'Cucumber + Playwright',
        ...additionalInfo,
    };

    // Add CI-specific info
    if (process.env.GITHUB_ACTIONS) {
        environment['CI Provider'] = 'GitHub Actions';
        environment['Workflow'] = process.env.GITHUB_WORKFLOW || 'N/A';
        environment['Run ID'] = process.env.GITHUB_RUN_ID || 'N/A';
        environment['Run Number'] = process.env.GITHUB_RUN_NUMBER || 'N/A';
        environment['Branch'] = process.env.GITHUB_REF_NAME || 'N/A';
        environment['Commit'] = process.env.GITHUB_SHA?.substring(0, 8) || 'N/A';
    }

    // Convert to properties format
    const content = Object.entries(environment)
        .map(([key, value]) => `${key}=${value}`)
        .join('\n');

    fs.writeFileSync(path.join(allureResultsDir, 'environment.properties'), content);
}

/**
 * Generate Allure executor info (for CI)
 */
export function generateAllureExecutor(): void {
    const allureResultsDir = process.env.ALLURE_OUTPUT_DIR || path.join(process.cwd(), 'allure-results');

    if (!fs.existsSync(allureResultsDir)) {
        fs.mkdirSync(allureResultsDir, { recursive: true });
    }

    const executor = {
        name: process.env.GITHUB_ACTIONS ? 'GitHub Actions' : 'Local',
        type: process.env.CI ? 'ci' : 'local',
        buildName: process.env.GITHUB_WORKFLOW || 'Local Run',
        buildOrder: parseInt(process.env.GITHUB_RUN_NUMBER || '1'),
        buildUrl: process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
            ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
            : undefined,
        reportUrl: undefined,
    };

    fs.writeFileSync(
        path.join(allureResultsDir, 'executor.json'),
        JSON.stringify(executor, null, 2)
    );
}
