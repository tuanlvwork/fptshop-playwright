import { Before, After, AfterStep, BeforeStep, BeforeAll, AfterAll, setDefaultTimeout, Status } from '@cucumber/cucumber';
import { chromium, Browser } from '@playwright/test';
import { CustomWorld } from './world';
import config from '../config/config';
import * as fs from 'fs';
import * as path from 'path';
import { getDiagnostics, DiagnosticsService } from '../utils/diagnostics';
import { generateAllureEnvironment, generateAllureExecutor } from '../utils/allure-helpers';

setDefaultTimeout(config.defaultTimeout);

let browser: Browser;
let diagnostics: DiagnosticsService;

// Ensure directories exist
const tracesDir = path.join(process.cwd(), 'traces');
const diagnosticsDir = path.join(process.cwd(), 'diagnostics');

if (!fs.existsSync(tracesDir)) {
    fs.mkdirSync(tracesDir, { recursive: true });
}
if (!fs.existsSync(diagnosticsDir)) {
    fs.mkdirSync(diagnosticsDir, { recursive: true });
}

BeforeAll(async function () {
    browser = await chromium.launch({
        headless: config.headless
    });

    // Initialize diagnostics service
    diagnostics = getDiagnostics({
        enableNetworkLogging: true,
        enableConsoleCapture: true,
        enablePerformanceTracking: true,
        slowRequestThresholdMs: 2000,
        outputDir: diagnosticsDir,
    });

    // Copy Allure categories configuration to allure-results
    const categoriesSource = path.join(process.cwd(), 'allure-categories.json');
    const allureResultsDir = process.env.ALLURE_OUTPUT_DIR || path.join(process.cwd(), 'allure-results');
    const categoriesDest = path.join(allureResultsDir, 'categories.json');

    if (fs.existsSync(categoriesSource)) {
        if (!fs.existsSync(allureResultsDir)) {
            fs.mkdirSync(allureResultsDir, { recursive: true });
        }
        fs.copyFileSync(categoriesSource, categoriesDest);
        console.log('📂 Allure categories configuration copied');
    }

    // Generate Allure environment and executor info
    const envInfo: Record<string, string> = {
        'Tags': process.env.ALLURE_TAGS || 'None'
    };

    generateAllureEnvironment(envInfo);
    generateAllureExecutor();
    console.log('📋 Allure environment info generated');
});

AfterAll(async function () {
    await browser.close();
});

Before(async function (this: CustomWorld, scenario) {
    this.testMetadata.startTime = Date.now();
    this.testMetadata.scenarioName = scenario.pickle.name;

    this.context = await browser.newContext({
        baseURL: config.baseUrl,
        viewport: {
            width: config.viewportWidth,
            height: config.viewportHeight
        }
    });
    this.page = await this.context.newPage();

    // Start tracing for detailed debugging
    if (config.enableTracing) {
        await this.context.tracing.start({
            screenshots: true,
            snapshots: true,
            sources: true
        });
    }

    // Start diagnostics recording
    await diagnostics.startScenario(scenario.pickle.name, this.page);

    // Legacy console/error capture (for backwards compatibility)
    this.page.on('console', (msg) => {
        const logEntry = `[${msg.type()}] ${msg.text()}`;
        this.addConsoleLog(logEntry);
    });

    this.page.on('pageerror', (error) => {
        this.addError(`Page Error: ${error.message}`);
    });

    this.page.on('requestfailed', (request) => {
        this.addError(`Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
    });
});

BeforeStep(async function (this: CustomWorld, { pickleStep }) {
    // Start timing this step
    diagnostics.startStep(pickleStep.text);
});

AfterStep(async function (this: CustomWorld, { result, pickle, pickleStep }) {
    // End step timing
    const stepStatus = result.status === Status.FAILED ? 'failed' : 'passed';
    diagnostics.endStep(stepStatus, result.message);

    // Record page metrics after navigation steps
    const stepText = pickleStep.text.toLowerCase();
    if (stepText.includes('navigate') || stepText.includes('go to') || stepText.includes('open')) {
        await diagnostics.recordPageMetrics();
    }

    if (result.status === Status.FAILED) {
        // Get enhanced diagnostics
        const networkLogger = diagnostics.getNetworkLogger();
        const consoleCapture = diagnostics.getConsoleCapture();
        const performanceTracker = diagnostics.getPerformanceTracker();

        // Capture detailed step information with diagnostics
        const stepInfo = `
            ❌ Failed Step: ${pickleStep.text}
            📝 Scenario: ${pickle.name}
            ⏱️  Duration: ${result.duration?.nanos ? (result.duration.nanos / 1000000).toFixed(2) + 'ms' : 'N/A'}
            🌐 URL: ${this.page.url()}
            📄 Page Title: ${await this.page.title()}
        `;
        this.attach(stepInfo, 'text/plain');

        // Attach network diagnostics
        const failedRequests = networkLogger.getFailedRequests();
        const slowRequests = networkLogger.getSlowRequests();

        if (failedRequests.length > 0 || slowRequests.length > 0) {
            let networkInfo = '📡 Network Issues:\n';
            if (failedRequests.length > 0) {
                networkInfo += `\n❌ Failed Requests (${failedRequests.length}):\n`;
                failedRequests.slice(0, 5).forEach(req => {
                    networkInfo += `   ${req.method} ${req.url.substring(0, 80)}...\n`;
                    networkInfo += `   Status: ${req.status || 'N/A'}, Error: ${req.error || 'N/A'}\n`;
                });
            }
            if (slowRequests.length > 0) {
                networkInfo += `\n🐢 Slow Requests (${slowRequests.length}):\n`;
                slowRequests.slice(0, 5).forEach(req => {
                    networkInfo += `   ${req.method} ${req.url.substring(0, 80)}... (${req.duration}ms)\n`;
                });
            }
            this.attach(networkInfo, 'text/plain');
        }

        // Attach console errors
        const consoleErrors = consoleCapture.getErrors();
        if (consoleErrors.length > 0) {
            let consoleInfo = '💥 Console Errors:\n';
            consoleErrors.slice(0, 10).forEach((err, i) => {
                consoleInfo += `   ${i + 1}. ${err.message.substring(0, 150)}\n`;
            });
            this.attach(consoleInfo, 'text/plain');
        }

        // Legacy console logs (for backwards compatibility)
        if (this.testMetadata.consoleLogs.length > 0) {
            const logs = `📋 Console Logs:\n${this.testMetadata.consoleLogs.join('\n')}`;
            this.attach(logs, 'text/plain');
        }

        if (this.testMetadata.errors.length > 0) {
            const errors = `⚠️  Errors:\n${this.testMetadata.errors.join('\n')}`;
            this.attach(errors, 'text/plain');
        }

        // Capture screenshot at failure point
        if (config.screenshotOnFailure) {
            const screenshot = await this.page.screenshot({
                fullPage: false,
                type: config.screenshotType
            });
            this.attach(screenshot, `image/${config.screenshotType}`);
        }
    }
});

After(async function (this: CustomWorld, scenario) {
    const duration = this.testMetadata.startTime
        ? ((Date.now() - this.testMetadata.startTime) / 1000).toFixed(2)
        : 'N/A';

    const isFailed = scenario.result?.status === Status.FAILED;

    // End diagnostics and get report
    const report = await diagnostics.endScenario(
        isFailed ? 'failed' : 'passed',
        isFailed ? new Error(scenario.result?.message || 'Unknown error') : undefined
    );

    if (isFailed) {
        // Save detailed diagnostics to files
        const savedFiles = await diagnostics.saveDiagnostics(scenario.pickle.name);

        // Attach failure analysis
        if (report.failureAnalysis) {
            this.attach(`\n🔍 Failure Analysis:\n${report.failureAnalysis}`, 'text/plain');
        }

        // Save trace file for failed scenarios
        const sanitizedName = scenario.pickle.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const tracePath = path.join(tracesDir, `trace-${sanitizedName}-${Date.now()}.zip`);
        await this.context.tracing.stop({ path: tracePath });

        this.attach(`🔍 Trace saved to: ${tracePath}\nOpen with: npx playwright show-trace ${tracePath}`, 'text/plain');
        this.attach(`📁 Diagnostics saved to: ${savedFiles.join(', ')}`, 'text/plain');

        // Capture full page screenshot
        if (config.screenshotOnFailure) {
            const screenshot = await this.page.screenshot({
                fullPage: config.fullPageScreenshot,
                type: config.screenshotType
            });
            this.attach(screenshot, `image/${config.screenshotType}`);
        }

        // Attach comprehensive test summary
        const summary = `
📊 Test Summary
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
⏱️  Total Duration: ${duration}s
📡 Network Requests: ${diagnostics.getNetworkLogger().getLogs().length}
❌ Failed Requests: ${diagnostics.getNetworkLogger().getFailedRequests().length}
🐢 Slow Requests: ${diagnostics.getNetworkLogger().getSlowRequests().length}
💥 Console Errors: ${diagnostics.getConsoleCapture().getErrors().length}
📊 Steps Executed: ${diagnostics.getPerformanceTracker().getStepTimings().length}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`;
        this.attach(summary, 'text/plain');
    } else {
        // Discard trace if passed to save disk space
        await this.context.tracing.stop();
    }

    await this.page.close();
    await this.context.close();
});
