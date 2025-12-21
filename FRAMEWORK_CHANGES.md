# Enhanced Test Automation Framework Summary

This document summarizes the recent enhancements made to the Playwright + Cucumber automation framework, focusing on robust reporting, diagnostics, CI optimization, and stability.

## 1. Advanced Reporting & Diagnostics

### A. Comprehensive Diagnostics System
We implemented a diagnostics module that automatically captures detailed context when a test fails.

*   **Network Logging** (`src/utils/network-logger.ts`): Captures all HTTP requests/responses, identifies slow APIs (>2s), and logs failed status codes (4xx, 5xx).
*   **Console Capture** (`src/utils/console-capture.ts`): Records browser console errors, warnings, and JavaScript exceptions.
*   **Performance Tracking** (`src/utils/performance-tracker.ts`): Measures execution time for every test step and identifies slow interactions.
*   **Failure Analysis** (`src/utils/diagnostics.ts`): Automatically analyzes failure data to suggest root causes (e.g., "Timeout", "Network Error", "Element Not Found").
*   **Artifacts**: Saves detailed JSON logs (`network.json`, `console.json`, `performance.json`) to a `diagnostics/` folder on failure.

### B. Allure Report Enhancements
The standard Allure report has been significantly upgraded.

*   **Categories** (`allure-categories.json`): Automatically groups test failures into meaningful categories like "🌐 Network Errors", "⏱️ Timeout Issues", "👁️ Visibility Issues", etc.
*   **Environment Info** (`src/utils/allure-helpers.ts`): Displays execution context in the report:
    *   Operating System, Node.js version, Browser.
    *   **Tags**: Shows which tags were run (e.g., `@brand`).
    *   **CI Info**: GitHub Actions workflow name, run ID, branch, commit hash.
*   **Trend Charts**: Implemented history preservation to show test result trends over time.
    *   **Locally**: `scripts/generate-allure-report.js` preserves history from previous reports.
    *   **CI**: GitHub Actions caches `allure-history` to persist trends across builds.

## 2. CI/CD Optimization (GitHub Actions)

### A. Docker Containerization
*   Migrated `merge-reports` jobs to run inside the `mcr.microsoft.com/playwright` Docker container.
*   **Benefit**: Eliminates redundant browser installation steps, speeds up workflow, and ensures environment consistency between test execution and reporting.

### B. Artifact Management
*   **On Failure**: Automatically uploads `diagnostics-*.zip` (JSON logs) and `traces-*.zip` (Playwright traces) for deeper debugging.
*   **Reports**: Generates and uploads a **single-file** Allure report (`complete-report.html`) that can be viewed anywhere without a server.

### C. Workflow Improvements
*   **Dependency Pinning**: Fixed `package.json` to use exact versions for stable builds.
*   **Version Sync**: Added a check to ensure `package.json` Playwright version matches the Docker container version.
*   **Robust Tagging**: Implemented reliable tag passing logic (`ALLURE_TAGS` env var) that works consistently in both CI (sharding) and local runs.

## 3. Local Execution Reliability

### A. New Runner Script
*   Created `scripts/run-cucumber.js` to replace direct `cucumber-js` calls.
*   **Purpose**: intercept CLI arguments (like `--tags`), set them as environment variables (`ALLURE_TAGS`), and spawn the Cucumber process. This ensures worker processes receive the correct context for reporting.

### B. NPM Scripts
Updated `package.json` scripts for better usability:
*   `npm run test:cucumber`: Runs tests with the new robust wrapper.
*   `npm run allure:generate`: Generates report *and* preserves history.
*   `npm run clean`: Safely cleans up report artifacts without deleting config files.

## Files Created/Modified

| Category | File | Description |
| :--- | :--- | :--- |
| **Diagnostics** | `src/utils/diagnostics.ts` | Central service for logging & analysis |
| | `src/utils/network-logger.ts` | HTTP request tracking |
| | `src/utils/console-capture.ts` | Browser console recording |
| | `src/utils/performance-tracker.ts` | Step timing metrics |
| **Allure** | `src/utils/allure-helpers.ts` | Environment & Executor info generators |
| | `allure-categories.json` | Failure categorization rules |
| | `scripts/generate-allure-report.js` | Report generation + History preservation |
| **Hooks** | `src/support/hooks.ts` | Integration of diagnostics & reporting into test lifecycle |
| **Execution** | `scripts/run-cucumber.js` | **NEW**: Robust local test runner wrapper |
| | `scripts/cucumber-shard.js` | CI sharding runner with tag support |
| **CI** | `.github/workflows/*.yml` | Added caching, docker usage, artifact upload |
