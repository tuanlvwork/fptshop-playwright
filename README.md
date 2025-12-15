# FPT Shop Automation Project

This project implements automation tests for FPT Shop (fptshop.com.vn) using two complementary approaches:
1.  **Playwright Native**: For high-speed, developer-focused regression testing.
2.  **Cucumber (BDD)**: For business-readable scenarios using Gherkin syntax.

## Project Structure

```
├── .github/workflows/      # CI/CD Workflows
│   ├── playwright-tests.yml # Playwright Native workflow
│   └── cucumber-tests.yml   # Cucumber workflow
├── features/               # Cucumber Feature files (.feature)
├── pages/                  # Playwright Native Page Objects
├── scripts/                # Helper scripts (sharding, merging)
├── src/                    # Cucumber Source Code
│   ├── pages/              # Hierarchical Page Objects (H-POM)
│   ├── steps/              # Step Definitions
│   └── support/            # World & Hooks
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

## Approach 1: Playwright Native

Best for developers and fast regression feedback.

### Running Tests

Run all tests:
```bash
npx playwright test
```

Run specific test file:
```bash
npx playwright test tests/product-search.spec.ts
```

View Report:
```bash
npx playwright show-report
```

## Approach 2: Cucumber (BDD)

Best for collaboration with stakeholders and documenting requirements.

### Running Tests

Run all features:
```bash
npm run test:cucumber
```

Run with Sharding (Simulate CI):
```bash
# Run shard 1 of 4
npm run test:cucumber:shard -- --shard=1/4
```

### Reports

Cucumber generates reports in:
*   `cucumber-report/index.html` (Unified HTML report)

## CI/CD

This project uses GitHub Actions with two separate workflows:

1.  **Playwright Tests**: Runs native tests across 4 shards, merges blob reports.
2.  **Cucumber Tests**: Runs feature files across 4 shards, merges JSON reports into a unified HTML report.

Both workflows feature:
*   **Parallel Sharding**: 4x concurrency.
*   **Smart Caching**: `node_modules` and Playwright binaries are cached to speed up runs.
