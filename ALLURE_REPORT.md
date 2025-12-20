# Allure Report

## 📋 Overview

Allure Report is integrated as an **additional** reporting option for both Playwright and Cucumber tests. It runs **in parallel** with the existing reporting systems (Playwright HTML reports, Cucumber HTML reports) without breaking any current functionality.

## 🎯 Features

| Feature | Existing Reports | Allure |
|---------|-----------------|--------|
| Screenshots | ✅ | ✅ |
| Test Status | ✅ | ✅ |
| Execution Time | ✅ | ✅ |
| Historical Trends | ❌ | ✅ |
| Categorization | Limited | ✅ |
| Behavior View | ❌ | ✅ |
| Timeline | ❌ | ✅ |
| Retries Tracking | Limited | ✅ |
| Environment Info | ✅ | ✅ |
| Custom Metadata | Limited | ✅ |

## 🚀 Quick Start

### Run Tests with Allure

```bash
# Playwright tests
npm test

# Cucumber tests
npm run test:cucumber

# Both
npm run test:all
```

> **Note:** Allure is enabled by default. Results are saved to `allure-results/`.

### View Allure Report

```bash
# Generate and open report
npm run allure:generate
npm run allure:open

# Or serve directly (auto-generates)
npm run allure:serve
```

## ⚙️ Configuration

### Environment Variables

Add to `.env`:

```env
# Enable/disable Allure (default: true)
ENABLE_ALLURE=true

# Output directory for Allure results (default: allure-results)
ALLURE_OUTPUT_DIR=allure-results
```

### Disable Allure

```bash
# Temporarily disable
ENABLE_ALLURE=false npm test

# Or set in .env
ENABLE_ALLURE=false
```

## 📦 Available Scripts

| Script | Description |
|--------|-------------|
| `npm run allure:generate` | Generate HTML report from results |
| `npm run allure:open` | Open generated report in browser |
| `npm run allure:serve` | Generate and serve report (auto-refresh) |
| `npm run allure:clean` | Delete Allure results and reports |
| `npm run test:allure` | Run Playwright tests + serve Allure |
| `npm run test:cucumber:allure` | Run Cucumber tests + serve Allure |
| `npm run test:all:allure` | Run all tests + generate + open Allure |
| `npm run clean:all` | Clean everything including Allure |

## 🏷️ Adding Allure Annotations (Playwright)

For richer reports, use the Allure utilities in your Playwright tests:

```typescript
import { allure } from '@/utils/allure';
import { test, expect } from '@playwright/test';

test('Filter by Brand: Apple', async ({ page }) => {
    // Add metadata
    allure.epic('E-commerce Functionality');
    allure.feature('Product Filtering');
    allure.story('Brand Filter');
    allure.severity('critical');
    allure.owner('QA Team');
    
    // Your test code...
});
```

### Available Annotations

| Annotation | Description |
|------------|-------------|
| `allure.epic(name)` | High-level feature group |
| `allure.feature(name)` | Feature name |
| `allure.story(name)` | User story |
| `allure.severity(level)` | blocker, critical, normal, minor, trivial |
| `allure.owner(name)` | Test owner/author |
| `allure.link(url, name?)` | External link |
| `allure.issue(id)` | Issue tracker link |
| `allure.testId(id)` | Test management system ID |
| `allure.description(text)` | Test description |
| `allure.tag(name)` | Custom tag |

## 🔄 CI/CD Integration

Allure reports are automatically generated in GitHub Actions:

1. Each shard uploads its Allure results
2. A dedicated `allure-report` job merges all results
3. Final report is uploaded as an artifact

### Artifacts

- `allure-report-playwright` - Playwright Allure report
- `allure-report-cucumber` - Cucumber Allure report

## 📊 Report Sections

### Overview
- Total tests summary (passed, failed, broken, skipped)
- Trend chart (if history is available)
- Environment information

### Suites
- Tests organized by test file/class
- Hierarchical view

### Graphs
- Status distribution
- Severity breakdown
- Duration trends

### Timeline
- Visual representation of test execution order
- Parallel execution visualization

### Behaviors
- Tests organized by Epic → Feature → Story
- BDD-style grouping

### Categories
- Automatic categorization of failures:
  - Product defects
  - Network issues
  - Infrastructure problems

## 🛠️ Troubleshooting

### No Results Found

```bash
❌ No allure-results directory found!
```

**Solution:** Run tests with Allure enabled:
```bash
ENABLE_ALLURE=true npm test
```

### Allure Command Not Found

```bash
❌ allure command not found
```

**Solution:** The scripts use `npx allure` which should work automatically. If not:
```bash
npm install -g allure-commandline
```

### Empty Report

**Solution:** Check if there are JSON files in `allure-results/`:
```bash
ls -la allure-results/
```

## 🔄 Rollback

If you encounter issues, you can disable Allure without affecting other reports:

```bash
# Quick disable
ENABLE_ALLURE=false npm test

# Your existing reports still work
npm run report:playwright
npm run report:cucumber
```

## 📁 File Locations

| Path | Description |
|------|-------------|
| `allure-results/` | Raw test results (JSON) |
| `allure-report/` | Generated HTML report |
| `.allure/` | Allure cache/plugins |
| `src/utils/allure.ts` | Playwright annotation utilities |
| `scripts/generate-allure-report.js` | Report generation script |
