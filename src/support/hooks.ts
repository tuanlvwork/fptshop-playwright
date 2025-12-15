import { Before, After, AfterStep, BeforeAll, AfterAll, setDefaultTimeout, Status } from '@cucumber/cucumber';
import { chromium, Browser } from '@playwright/test';
import { CustomWorld } from './world';
import * as fs from 'fs';
import * as path from 'path';

setDefaultTimeout(60 * 1000);

let browser: Browser;

// Ensure traces directory exists
const tracesDir = path.join(process.cwd(), 'traces');
if (!fs.existsSync(tracesDir)) {
    fs.mkdirSync(tracesDir, { recursive: true });
}

BeforeAll(async function () {
    browser = await chromium.launch({ headless: true });
});

AfterAll(async function () {
    await browser.close();
});

Before(async function (this: CustomWorld) {
    this.testMetadata.startTime = Date.now();

    this.context = await browser.newContext({
        baseURL: 'http://fptshop.com.vn',
    });
    this.page = await this.context.newPage();

    // Start tracing for detailed debugging
    await this.context.tracing.start({
        screenshots: true,
        snapshots: true,
        sources: true
    });

    // Capture console logs
    this.page.on('console', (msg) => {
        const logEntry = `[${msg.type()}] ${msg.text()}`;
        this.addConsoleLog(logEntry);
    });

    // Capture page errors
    this.page.on('pageerror', (error) => {
        this.addError(`Page Error: ${error.message}`);
    });

    // Capture request failures
    this.page.on('requestfailed', (request) => {
        this.addError(`Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
    });
});

AfterStep(async function (this: CustomWorld, { result, pickle, pickleStep }) {
    if (result.status === Status.FAILED) {
        // Capture detailed step information
        const stepInfo = `
❌ Failed Step: ${pickleStep.text}
📝 Scenario: ${pickle.name}
⏱️  Duration: ${result.duration?.nanos ? (result.duration.nanos / 1000000).toFixed(2) + 'ms' : 'N/A'}
🌐 URL: ${this.page.url()}
📄 Page Title: ${await this.page.title()}
`;

        this.attach(stepInfo, 'text/plain');

        // Attach console logs if any
        if (this.testMetadata.consoleLogs.length > 0) {
            const logs = `📋 Console Logs:\n${this.testMetadata.consoleLogs.join('\n')}`;
            this.attach(logs, 'text/plain');
        }

        // Attach errors if any
        if (this.testMetadata.errors.length > 0) {
            const errors = `⚠️  Errors:\n${this.testMetadata.errors.join('\n')}`;
            this.attach(errors, 'text/plain');
        }

        // Capture screenshot at failure point
        const screenshot = await this.page.screenshot({ fullPage: false, type: 'jpeg', quality: 80 });
        this.attach(screenshot, 'image/jpeg');
    }
});

After(async function (this: CustomWorld, scenario) {
    const duration = this.testMetadata.startTime
        ? ((Date.now() - this.testMetadata.startTime) / 1000).toFixed(2)
        : 'N/A';

    if (scenario.result?.status === Status.FAILED) {
        // Save trace file for failed scenarios
        const sanitizedName = scenario.pickle.name.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const tracePath = path.join(tracesDir, `trace-${sanitizedName}-${Date.now()}.zip`);
        await this.context.tracing.stop({ path: tracePath });

        this.attach(`🔍 Trace saved to: ${tracePath}\nOpen with: npx playwright show-trace ${tracePath}`, 'text/plain');

        // Capture full page screenshot
        const screenshot = await this.page.screenshot({ fullPage: true, type: 'jpeg', quality: 80 });
        this.attach(screenshot, 'image/jpeg');

        // Attach test summary
        const summary = `
⏱️  Total Duration: ${duration}s
📊 Console Logs: ${this.testMetadata.consoleLogs.length}
⚠️  Errors Captured: ${this.testMetadata.errors.length}
`;
        this.attach(summary, 'text/plain');
    } else {
        // Discard trace if passed to save disk space
        await this.context.tracing.stop();
    }

    await this.page.close();
    await this.context.close();
});
