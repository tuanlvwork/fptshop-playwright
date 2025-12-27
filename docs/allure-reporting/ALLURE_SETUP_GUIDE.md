# Allure Report Integration Guide

This guide describes how to implement a robust Allure Reporting system for Cucumber-Playwright projects, including historical trend data, single-file reports, and rich failure diagnostics.

## 1. Install Dependencies

Add the following development dependencies to your `package.json`:

```bash
npm install --save-dev allure-commandline allure-cucumberjs allure-js-commons
```

## 2. Allure Categories Configuration

Create a file named `allure-categories.json` in your project root. This file categorizes test failures (e.g., Timeout, Visual Regression, Network issues) automatically based on error messages.

**`allure-categories.json`**:
```json
[
    {
        "name": "📸 Visual Regression Failures",
        "messageRegex": ".*(Screenshot|snapshot|image mismatch).*",
        "matchedStatuses": ["failed"]
    },
    {
        "name": "⏱️ Timeout Issues",
        "messageRegex": ".*(Timeout|timed out|exceeded.*time).*",
        "matchedStatuses": ["broken", "failed"]
    },
    {
        "name": "❌ Assertion Failures",
        "messageRegex": ".*(expect\\(|Received:|Expected:).*",
        "matchedStatuses": ["failed"]
    },
    {
        "name": "🕵️ Locator Issues",
        "messageRegex": ".*(waiting for locator|selector.*not found|no element found).*",
        "matchedStatuses": ["broken", "failed"]
    },
    {
        "name": "🌐 Network/API Errors",
        "messageRegex": ".*(net::|ERR_|500|404|fetch failed).*",
        "matchedStatuses": ["broken", "failed"]
    },
    {
        "name": "❓ Uncategorized Failures",
        "messageRegex": ".*",
        "matchedStatuses": ["failed", "broken"]
    }
]
```

## 3. Report Generation Script

Create a script `scripts/generate-allure-report.js`. This script handles categories, history preservation (for trend charts), and generating a portable single-file HTML report.

**`scripts/generate-allure-report.js`**:
```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const resultsDir = path.join(__dirname, '../allure-results');
const reportDir = path.join(__dirname, '../allure-report');

console.log('🔍 Checking for Allure results...');

// 1. Install Allure CLI if missing
try {
    execSync('npx allure --version', { stdio: 'pipe' });
} catch (e) {
    console.log('📦 Installing Allure commandline...');
    execSync('npm install -g allure-commandline', { stdio: 'inherit' });
}

// 2. Copy Categories
const categoriesSource = path.join(__dirname, '../allure-categories.json');
if (fs.existsSync(categoriesSource)) {
    fs.copyFileSync(categoriesSource, path.join(resultsDir, 'categories.json'));
}

// 3. Preserve History for Trends
const historySource = path.join(reportDir, 'history');
const historyDest = path.join(resultsDir, 'history');
if (fs.existsSync(historySource)) {
    if (!fs.existsSync(historyDest)) fs.mkdirSync(historyDest, { recursive: true });
    fs.readdirSync(historySource).forEach(file => {
        fs.copyFileSync(path.join(historySource, file), path.join(historyDest, file));
    });
    console.log('📜 History preserved.');
}

// 4. Generate Standard Report (to compute new trends)
console.log('📊 Generating Standard Report...');
execSync(`npx allure generate ${resultsDir} --clean -o ${reportDir}`, { stdio: 'inherit' });

// 5. Update Results with New History from Standard Report
// This is critical for the single-file report to have the latest trend point
const newHistorySource = path.join(reportDir, 'history');
if (fs.existsSync(newHistorySource)) {
    if (!fs.existsSync(historyDest)) fs.mkdirSync(historyDest, { recursive: true });
    fs.readdirSync(newHistorySource).forEach(file => {
        fs.copyFileSync(path.join(newHistorySource, file), path.join(historyDest, file));
    });
}

// 6. Generate Single-File Report
const singleFileDir = path.join(__dirname, '../allure-report-single');
console.log('📄 Generating Single-File Report...');
execSync(`npx allure generate ${resultsDir} --clean --single-file -o ${singleFileDir}`, { stdio: 'inherit' });

console.log(`✅ Reports generated at: ${reportDir}`);
```

Add these scripts to your `package.json`:
```json
"scripts": {
  "allure:generate": "node scripts/generate-allure-report.js",
  "allure:open": "npx allure open allure-report"
}
```

## 4. Failure Diagnostics System

To capture rich diagnostic information (network logs, console errors, performance metrics) when tests fail, implement the following utility classes in `src/utils/`.

### 4.1. Network Logger
**`src/utils/network-logger.ts`**
```typescript
import { Page, Request, Response } from '@playwright/test';

export interface NetworkLogEntry {
    timestamp: string;
    method: string;
    url: string;
    status?: number;
    error?: string;
    duration?: number;
    // ... add responseHeaders, size etc if needed
}

export class NetworkLogger {
    private logs: NetworkLogEntry[] = [];
    private requestStartTimes: Map<string, number> = new Map();
    private isRecording: boolean = false;

    constructor(private slowThresholdMs: number = 2000) {}

    async startRecording(page: Page): Promise<void> {
        this.isRecording = true;
        this.logs = [];
        this.requestStartTimes.clear();

        page.on('request', (req) => {
            if (!this.isRecording) return;
            this.requestStartTimes.set(req.url(), Date.now());
            this.logs.push({
                timestamp: new Date().toISOString(),
                method: req.method(),
                url: req.url()
            });
        });

        page.on('response', (res) => {
            if (!this.isRecording) return;
            const start = this.requestStartTimes.get(res.url());
            const entry = this.logs.find(l => l.url === res.url() && !l.status);
            if (entry) {
                entry.status = res.status();
                entry.duration = start ? Date.now() - start : undefined;
            }
        });

        page.on('requestfailed', (req) => {
            if (!this.isRecording) return;
            const entry = this.logs.find(l => l.url === req.url() && !l.status);
            if (entry) entry.error = req.failure()?.errorText || 'Unknown';
        });
    }

    getFailedRequests() {
        return this.logs.filter(l => l.error || (l.status && l.status >= 400));
    }

    getSlowRequests() {
        return this.logs.filter(l => l.duration && l.duration > this.slowThresholdMs);
    }
    
    stopRecording() { this.isRecording = false; }
    
    getSummary() {
      // Return a string summary of failures/slow requests
      const failed = this.getFailedRequests();
      if (failed.length === 0) return '';
      return `❌ Failed Requests: ${failed.length}\n` + failed.map(f => `   ${f.method} ${f.url} (${f.status || f.error})`).join('\n');
    }
}
```

### 4.2. Console Capture
**`src/utils/console-capture.ts`**
```typescript
import { Page } from '@playwright/test';

export class ConsoleCapture {
    private logs: any[] = [];
    private errors: any[] = [];
    private isRecording: boolean = false;

    async startCapture(page: Page) {
        this.isRecording = true;
        this.logs = [];
        this.errors = [];
        
        page.on('console', msg => {
            if (!this.isRecording) return;
            this.logs.push({ type: msg.type(), text: msg.text() });
            if (msg.type() === 'error') this.errors.push({ message: msg.text() });
        });

        page.on('pageerror', err => {
            if (!this.isRecording) return;
            this.errors.push({ message: err.message, stack: err.stack });
        });
    }

    getErrors() { return [...this.errors]; }
    stopCapture() { this.isRecording = false; }
    
    getSummary() {
        if (this.errors.length === 0) return '';
        return `💥 Console Errors:\n` + this.errors.map(e => `   ${e.message}`).join('\n');
    }
}
```

### 4.3. Performance Tracker
**`src/utils/performance-tracker.ts`**
```typescript
export class PerformanceTracker {
    private timings: any[] = [];
    private currentStep?: any;

    startStep(name: string) {
        this.currentStep = { name, start: Date.now() };
    }

    endStep(status: string) {
        if (this.currentStep) {
            this.currentStep.duration = Date.now() - this.currentStep.start;
            this.currentStep.status = status;
            this.timings.push(this.currentStep);
        }
    }
    
    getSummary() {
        // Return summary of slow steps
        return ''; 
    }
}
```

### 4.4. Diagnostics Service (Coordinator)
**`src/utils/diagnostics.ts`**
```typescript
import { Page } from '@playwright/test';
import { NetworkLogger } from './network-logger';
import { ConsoleCapture } from './console-capture';
import { PerformanceTracker } from './performance-tracker';

export class DiagnosticsService {
    private networkLogger = new NetworkLogger();
    private consoleCapture = new ConsoleCapture();
    private performanceTracker = new PerformanceTracker();

    async startScenario(name: string, page: Page) {
        await this.networkLogger.startRecording(page);
        await this.consoleCapture.startCapture(page);
    }
    
    startStep(name: string) { this.performanceTracker.startStep(name); }
    endStep(status: string) { this.performanceTracker.endStep(status); }

    async endScenario(status: string, error?: Error) {
        this.networkLogger.stopRecording();
        this.consoleCapture.stopCapture();
        
        return {
            failureAnalysis: status === 'failed' ? this.analyzeFailure(error) : undefined
        };
    }
    
    private analyzeFailure(error?: Error) {
        let analysis = '';
        // Analyze network, console, and error message to provide insights
        const failedReqs = this.networkLogger.getFailedRequests();
        if (failedReqs.length > 0) analysis += `🌐 API Failures: ${failedReqs.length}\n`;
        
        const consoleErrs = this.consoleCapture.getErrors();
        if (consoleErrs.length > 0) analysis += `💥 JS Errors: ${consoleErrs.length}\n`;
        
        return analysis || 'No specific patterns detected.';
    }

    getNetworkLogger() { return this.networkLogger; }
    getConsoleCapture() { return this.consoleCapture; }
}

let instance: DiagnosticsService;
export function getDiagnostics() {
    if (!instance) instance = new DiagnosticsService();
    return instance;
}
```

## 5. Hooks Integration (`src/support/hooks.ts`)

Update your Cucumber hooks to use the `DiagnosticsService`.

```typescript
import { Before, After, AfterStep, BeforeStep, Status } from '@cucumber/cucumber';
import { getDiagnostics } from '../utils/diagnostics';
import config from '../config/config';

// Initialize service
const diagnostics = getDiagnostics();

Before(async function (this: CustomWorld, scenario) {
    // ... Start browser context ...
    
    // Start diagnostics
    await diagnostics.startScenario(scenario.pickle.name, this.page);
});

BeforeStep(async function ({ pickleStep }) {
    diagnostics.startStep(pickleStep.text);
});

AfterStep(async function (this: CustomWorld, { result, pickleStep }) {
    // End step timing
    diagnostics.endStep(result.status === Status.FAILED ? 'failed' : 'passed');

    // On Failure: Attach detailed diagnostics
    if (result.status === Status.FAILED) {
        // 1. Screenshot
        const screenshot = await this.page.screenshot();
        this.attach(screenshot, 'image/png');

        // 2. Attach Network Issues
        const networkLog = diagnostics.getNetworkLogger().getSummary();
        if (networkLog) this.attach(networkLog, 'text/plain');

        // 3. Attach Console Errors
        const consoleLog = diagnostics.getConsoleCapture().getSummary();
        if (consoleLog) this.attach(consoleLog, 'text/plain');
    }
});

After(async function (this: CustomWorld, scenario) {
    const isFailed = scenario.result?.status === Status.FAILED;
    
    // Generate final report and analysis
    const report = await diagnostics.endScenario(
        isFailed ? 'failed' : 'passed',
        isFailed ? new Error(scenario.result?.message) : undefined
    );

    if (isFailed && report.failureAnalysis) {
        this.attach(`🔍 AI Failure Analysis:\n${report.failureAnalysis}`, 'text/plain');
    }

    await this.page.close();
    await this.context.close();
});
```

## 6. GitHub Actions Workflow

Configure your workflow to:
1. Run tests and upload `allure-results`.
2. Generate report in a separate job.
3. Manage `allure-history` caching for trend charts.

**`.github/workflows/your-workflow.yml`**:

```yaml
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      # ... checkout, install, etc.
      
      - name: Run Tests
        run: npm run test:cucumber
        env:
          ENABLE_ALLURE: 'true'

      - name: Upload Allure Results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: allure-results-${{ matrix.shardIndex }}
          path: allure-results/
          retention-days: 1

  allure-report:
    if: always()
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: 20 }

      # 1. Download all results
      - name: Download Allure Results
        uses: actions/download-artifact@v4
        with:
          pattern: allure-results-*
          merge-multiple: true
          path: allure-results

      - name: Install Allure CLI
        run: npm install -g allure-commandline

      # 2. Restore History
      - name: Load Allure History
        uses: actions/cache@v4
        with:
          path: allure-history
          key: allure-history-${{ runner.os }}-${{ github.run_id }}
          restore-keys: allure-history-${{ runner.os }}-

      # 3. Generate Report (Standard + Single File)
      - name: Generate Allure Report
        run: |
          # Copy history to results
          if [ -d "allure-history" ]; then
            mkdir -p allure-results/history
            cp -r allure-history/* allure-results/history/ || true
          fi

          # Generate Standard Report (calculates trends)
          allure generate allure-results --clean -o allure-report

          # Capture new history
          mkdir -p allure-history
          cp -r allure-report/history/* allure-history/
          
          # Update results with new history for single-file report
          mkdir -p allure-results/history
          cp -r allure-report/history/* allure-results/history/

          # Generate Portable Single-File Report
          allure generate allure-results --clean --single-file -o allure-report-single

      # 4. Upload Report
      - name: Upload Single-File Report
        uses: actions/upload-artifact@v4
        with:
          name: allure-report-cucumber
          path: allure-report-single/index.html
```
