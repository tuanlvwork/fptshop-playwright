# FPT Shop Automation Project

This project implements automation tests for FPT Shop (fptshop.com.vn) using two complementary approaches:
1.  **Playwright Native**: For high-speed, developer-focused regression testing.
2.  **Cucumber (BDD)**: For business-readable scenarios using Gherkin syntax.

## Project Structure

```
├── .github/workflows/      # CI/CD Workflows (8 shards, Dockerized)
├── features/               # Cucumber Feature files (.feature)
│   ├── brand_filter.feature
│   ├── sorting.feature
│   ├── feature_filter.feature
│   └── ...
├── pages/                  # Playwright Native Page Objects
├── scripts/                # Helper scripts (sharding, reporting)
├── src/                    # Cucumber Source Code
│   ├── pages/              # Hierarchical Page Objects (H-POM)
│   ├── steps/              # Step Definitions
│   ├── support/            # World & Hooks
│   └── utils/              # Diagnostics & Logging Modules
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
cp .env.example .env
```

## Configuration

Configure the project by editing `.env`. Key variables:

| Variable | Description | Default |
| :--- | :--- | :--- |
| `BASE_URL` | Application URL | https://fptshop.com.vn |
| `HEADLESS` | Run without UI | `true` |
| `PARALLEL_WORKERS` | Local parallel threads | `4` |
| `ENABLE_ALLURE` | Enable Allure reporting | `false` |
| `SCREENSHOT_ON_FAILURE`| Capture screenshot if failed | `true` |
| `TRACE_ON_FAILURE_ONLY`| Save traces only on error | `true` |

See `.env.example` for full list.

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
When a test fails, the framework automatically captures and analyzes:
1.  **Network Logs** (`src/utils/network-logger.ts`): Captures all HTTP requests, identifies slow APIs (>2s), and logs failed status codes.
2.  **Console Logs** (`src/utils/console-capture.ts`): Records browser console errors and JS exceptions.
3.  **Performance** (`src/utils/performance-tracker.ts`): Measures execution time for every test step.
4.  **Failure Analysis** (`src/utils/diagnostics.ts`): Automatically suggests root causes (e.g., "Timeout", "Element Not Found").

These artifacts are attached to the Allure report and uploaded to GitHub Actions on failure.

## CI/CD Pipeline

The project uses GitHub Actions with optimized workflows:
*   **Dockerized**: Tests run in `mcr.microsoft.com/playwright` container for speed and consistency.
*   **Sharding**: **8x concurrency** for fast execution of the large test suite.
*   **Artifacts**:
    *   `diagnostics-{shard}`: JSON logs for debugging.
    *   `traces-{shard}`: Playwright visual traces.
    *   `allure-report-single`: A portable HTML report containing all results.

## Technical Architecture

### Key Modules
| Module | Description |
| :--- | :--- |
| `src/utils/diagnostics.ts` | Central service that orchestrates logging and failure analysis. |
| `scripts/run-cucumber.js` | Robust local wrapper ensuring CLI tags (e.g., `@brand`) are correctly passed to report environment. |
| `allure-categories.json` | Regex rules for grouping failures in reports. |

### Best Practices Enforced
*   **Declarative Gherkin**: Features describe *Business Behavior*, not UI clicks.
*   **Nested Steps**: Page Objects use `allure.step()` to wrap low-level actions, keeping reports clean but debuggable.
*   **Atomic Tests**: Each scenario is independent.

## 📚 Documentation

Comprehensive documentation is available in the [`docs/`](docs/) directory:

### Core Features
- **[Lazy Login Implementation](docs/lazy-login/LAZY_LOGIN_IMPLEMENTATION.md)** - Session reuse for faster test execution
- **[Auth Race Monitoring](docs/lazy-login/AUTH_RACE_MONITORING.md)** - Race condition detection and monitoring
- **[Allure Setup Guide](docs/allure-reporting/ALLURE_SETUP_GUIDE.md)** - Complete Allure integration guide

### Quick Links
- [📂 Documentation Index](docs/README.md) - Complete documentation overview
- [🔍 Monitoring Guide](docs/lazy-login/AUTH_MONITORING_GUIDE.md) - How to monitor auth operations

## 🤝 Contributing

When adding new features:
1. Write tests first (TDD approach)
2. Update relevant documentation in `docs/`
3. Add examples to feature files
4. Update this README if adding major functionality
