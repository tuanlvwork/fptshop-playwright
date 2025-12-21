# FPT Shop Automation Project

This project implements automation tests for FPT Shop (fptshop.com.vn) using two complementary approaches:
1.  **Playwright Native**: For high-speed, developer-focused regression testing.
2.  **Cucumber (BDD)**: For business-readable scenarios using Gherkin syntax.

## Project Structure

```
├── .github/workflows/      # CI/CD Workflows
├── features/               # Cucumber Feature files (.feature)
├── pages/                  # Playwright Native Page Objects
├── scripts/                # Helper scripts (sharding, reporting)
├── src/                    # Cucumber Source Code
│   ├── pages/              # Hierarchical Page Objects (H-POM)
│   ├── steps/              # Step Definitions
│   ├── support/            # World & Hooks
│   └── utils/              # Diagnostics & Logging Modules (NEW)
├── tests/                  # Playwright Native Tests (.spec.ts)
└── playwright.config.ts    # Playwright Configuration
```

## Prerequisites

*   Node.js (v18 or higher)
*   npm

## Installation

```bash
npm install
npx playwright install --with-deps
```

## Running Tests

### 1. Cucumber (BDD) - Recommended for QA

Run all features:
```bash
# Standard run (Basic reporting)
npm run test:cucumber

# Run with Allure Reporting (Recommended)
ENABLE_ALLURE=true npm run test:cucumber
```

Run specific tags:
```bash
ENABLE_ALLURE=true npm run test:cucumber -- --tags="@brand"
```

### 2. Playwright Native - Recommended for Devs

Run all tests:
```bash
npx playwright test
```

## Reporting & Diagnostics

### Allure Reporting (Enhanced)
We use a customized Allure setup that provides rich context:
*   **Categories**: Failures are automatically grouped (e.g., "🌐 Network Errors", "⏱️ Timeout Issues").
*   **Environment**: Shows executed Tags, CI info, and Browser details.
*   **Trends**: Tracks test history over time (works locally and in CI).

To view reports locally:
```bash
npm run allure:generate
npm run allure:open
```

### Failure Diagnostics
When a test fails, the framework automatically captures:
1.  **Network Logs** (`network.json`): All HTTP requests/responses, identifying slow APIs and 5xx errors.
2.  **Console Logs** (`console.json`): Browser console errors and warnings.
3.  **Performance** (`performance.json`): Execution timing for every step.
4.  **Traces**: Playwright traces for visual debugging (CI only).

These artifacts are attached to the Allure report and uploaded to GitHub Actions on failure.

## CI/CD Pipeline

The project uses GitHub Actions with optimized workflows:
*   **Dockerized**: Tests run in `mcr.microsoft.com/playwright` container for speed and consistency.
*   **Sharding**: 4x concurrency for fast execution.
*   **Artifacts**:
    *   `diagnostics-{shard}`: JSON logs for debugging.
    *   `traces-{shard}`: Playwright visual traces.
    *   `allure-report-single`: A portable HTML report containing all results.
