# Scripts Directory

This directory contains all automation scripts organized by purpose.

## 📁 Structure

```
scripts/
├── analysis/           # Metrics analysis and monitoring
├── reporting/          # Report generation and processing
├── execution/          # Test execution utilities
└── debugging/          # Debugging and trace tools
```

---

## 📊 Analysis (`analysis/`)

Scripts for analyzing test metrics and performance.

### `analyze-auth-race.js`
**Purpose**: Detect race conditions in auth session creation  
**Usage**: `npm run analyze:auth-race`  
**Reads**: Test logs from stdin or file  
**Outputs**: Race condition analysis and recommendations  

### `analyze-lock-metrics.js`
**Purpose**: Analyze file locking performance and contention  
**Usage**: `npm run analyze:lock-metrics`  
**Reads**: `diagnostics/lock-metrics.json`  
**Outputs**: Detailed metrics analysis with statistics  

### `generate-lock-metrics-report.js`
**Purpose**: Generate interactive HTML dashboard for lock metrics  
**Usage**: `npm run generate:lock-report`  
**Reads**: `diagnostics/lock-metrics.json`  
**Outputs**: `diagnostics/lock-metrics-report.html`  

---

## 📝 Reporting (`reporting/`)

Scripts for generating and processing test reports.

### `generate-cucumber-report.js`
**Purpose**: Generate HTML report from Cucumber JSON  
**Usage**: `npm run report:cucumber`  
**Reads**: `cucumber-report.json`  
**Outputs**: `cucumber-report.html`  

### `merge-cucumber-reports.js`
**Purpose**: Merge reports from multiple shards (CI)  
**Usage**: Automatically run in CI after shards complete  
**Reads**: `all-cucumber-reports/cucumber-report-*.json`  
**Outputs**: Combined reports in `cucumber-report/`  

### `generate-allure-report.js`
**Purpose**: Generate Allure report with categories  
**Usage**: `npm run allure:generate`  
**Reads**: `allure-results/` or merged results  
**Outputs**: `allure-report/` with complete-report.html  

### `capture-report-screenshot.js`
**Purpose**: Capture screenshot of Cucumber report  
**Usage**: Automatically run after report generation  
**Reads**: `cucumber-report.html`  
**Outputs**: `cucumber-report-summary.png`  

---

## 🚀 Execution (`execution/`)

Scripts for running and managing test execution.

### `run-cucumber.js`
**Purpose**: Local test execution wrapper  
**Usage**: `npm run test:cucumber`  
**Features**:
- Handles CLI arguments
- Sets environment variables
- Manages Allure configuration  

### `cucumber-shard.js`
**Purpose**: Execute tests with sharding (parallel)  
**Usage**: `npm run test:cucumber:shard -- --shard=1/8`  
**Features**:
- Distributes tests across shards
- Manages parallel execution
- CI-optimized  

---

## 🐛 Debugging (`debugging/`)

Scripts for debugging test failures and traces.

### `list-traces.js`
**Purpose**: List all available Playwright traces  
**Usage**: `node scripts/debugging/list-traces.js`  
**Outputs**: Table of traces with timestamps and scenarios  

### `show-trace.js`
**Purpose**: Open specific trace in Playwright trace viewer  
**Usage**: `node scripts/debugging/show-trace.js <trace-file>`  
**Features**: Auto-launches Playwright trace viewer  

---

## 🎯 Quick Reference

### Most Used Commands

```bash
# Run tests
npm run test:cucumber

# Generate reports
npm run allure:generate
npm run generate:lock-report

# Analyze
npm run analyze:lock-metrics
npm run analyze:auth-race

# Debug
node scripts/debugging/list-traces.js
```

### CI Usage

These scripts are automatically used in `.github/workflows/cucumber-tests.yml`:

- **Test Execution**: `execution/cucumber-shard.js`
- **Report Merging**: `reporting/merge-cucumber-reports.js`
- **Screenshot**: `reporting/capture-report-screenshot.js`
- **Allure**: `reporting/generate-allure-report.js`
- **Metrics Analysis**: `analysis/analyze-lock-metrics.js`
- **HTML Dashboard**: `analysis/generate-lock-metrics-report.js`

---

## 📝 Adding New Scripts

### 1. Choose the Right Category

- **Analysis**: Metrics, statistics, performance analysis
- **Reporting**: Report generation, formatting, merging
- **Execution**: Test running, sharding, orchestration
- **Debugging**: Traces, logs, troubleshooting

### 2. Create the Script

```bash
# Example: Add new analyzer
touch scripts/analysis/my-analyzer.js
chmod +x scripts/analysis/my-analyzer.js
```

### 3. Add to package.json

```json
{
  "scripts": {
    "analyze:my-feature": "node scripts/analysis/my-analyzer.js"
  }
}
```

### 4. Update This README

Add documentation for your new script in the appropriate section.

---

## 🔧 Script Standards

All scripts should follow these standards:

### Shebang
```javascript
#!/usr/bin/env node
```

### Documentation
```javascript
/**
 * Script Name
 * 
 * Description of what it does
 * 
 * Usage:
 *   node scripts/category/script-name.js [options]
 */
```

### Error Handling
```javascript
if (!fs.existsSync(requiredFile)) {
    console.error('❌ Required file not found');
    process.exit(1);
}
```

### Output
- Use emojis for visual clarity (✅ ❌ ⚠️ 📊)
- Provide progress indicators for long operations
- Output should be both human and machine readable

---

## 📚 Related Documentation

- [Lazy Login Implementation](../docs/lazy-login/LAZY_LOGIN_IMPLEMENTATION.md)
- [Lock Metrics Guide](../docs/lazy-login/LOCK_METRICS_CI_TESTING.md)
- [HTML Dashboard](../docs/lazy-login/HTML_DASHBOARD.md)
- [Allure Setup Guide](../docs/allure-reporting/ALLURE_SETUP_GUIDE.md)

---

**Last Updated**: 2025-12-27  
**Total Scripts**: 11  
**Categories**: 4
