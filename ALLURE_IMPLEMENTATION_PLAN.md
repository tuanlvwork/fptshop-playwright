# Allure Report Implementation Plan

## 📋 Overview

Implement Allure Report as an additional reporting option for both Playwright and Cucumber tests, running in parallel with existing reporting systems without breaking current functionality.

## 🎯 Goals

1. ✅ Add Allure reporting for Playwright tests
2. ✅ Add Allure reporting for Cucumber tests
3. ✅ Maintain existing cucumber-html-reporter functionality
4. ✅ Maintain existing Playwright HTML reports
5. ✅ Make Allure optional via configuration
6. ✅ Support both local and CI environments

## 📦 Phase 1: Dependencies & Setup

### 1.1 Install Packages

```bash
npm install --save-dev allure-commandline allure-playwright @cucumber/allure-reporter
```

**Packages:**
- `allure-commandline` - CLI tool to generate and serve Allure reports
- `allure-playwright` - Playwright Allure reporter
- `@cucumber/allure-reporter` - Cucumber Allure formatter

### 1.2 Update .gitignore

Add Allure-specific directories:
```
# Allure
allure-results/
allure-report/
.allure/
```

### 1.3 Environment Configuration

Add to `.env.example` and `.env`:
```env
# Allure Report Settings
ENABLE_ALLURE=true
ALLURE_OUTPUT_DIR=allure-results
```

Update `src/config/config.ts`:
```typescript
export interface TestConfig {
    // ... existing config
    
    // Allure
    enableAllure: boolean;
    allureOutputDir: string;
}

const config: TestConfig = {
    // ... existing config
    
    // Allure
    enableAllure: process.env.ENABLE_ALLURE !== 'false',
    allureOutputDir: process.env.ALLURE_OUTPUT_DIR || 'allure-results',
};
```

## 📦 Phase 2: Playwright Allure Integration

### 2.1 Update playwright.config.ts

```typescript
import { defineConfig } from '@playwright/test';

export default defineConfig({
    reporter: [
        // Existing reporters (keep as-is)
        ['html'],
        ['list'],
        
        // Add Allure reporter (conditional)
        ...(process.env.ENABLE_ALLURE !== 'false'
            ? [['allure-playwright', {
                outputFolder: process.env.ALLURE_OUTPUT_DIR || 'allure-results',
                detail: true,
                suiteTitle: true,
                categories: [
                    {
                        name: 'Product issues',
                        messageRegex: '.*product.*',
                    },
                    {
                        name: 'Network issues',
                        messageRegex: '.*timeout.*|.*network.*',
                    },
                ],
                environmentInfo: {
                    'Test Environment': process.env.TEST_ENVIRONMENT || 'LOCAL',
                    'Browser': 'Chromium',
                    'Node Version': process.version,
                },
            }]]
            : []
        ),
    ],
    // ... rest of config
});
```

### 2.2 Add Allure Annotations to Tests (Optional Enhancement)

Create `src/utils/allure.ts`:
```typescript
import { test } from '@playwright/test';

export const allure = {
    epic: (name: string) => test.info().annotations.push({ type: 'epic', description: name }),
    feature: (name: string) => test.info().annotations.push({ type: 'feature', description: name }),
    story: (name: string) => test.info().annotations.push({ type: 'story', description: name }),
    severity: (level: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial') => 
        test.info().annotations.push({ type: 'severity', description: level }),
    owner: (name: string) => test.info().annotations.push({ type: 'owner', description: name }),
    link: (url: string, name?: string) => 
        test.info().annotations.push({ type: 'link', description: `${name || url}|${url}` }),
    issue: (id: string) => 
        test.info().annotations.push({ type: 'issue', description: id }),
};
```

Usage example:
```typescript
test('Filter by Brand: Apple', async ({ page }) => {
    allure.epic('E-commerce Functionality');
    allure.feature('Product Filtering');
    allure.story('Brand Filter');
    allure.severity('critical');
    allure.owner('QA Team');
    
    // ... test steps
});
```

## 📦 Phase 3: Cucumber Allure Integration

### 3.1 Create Allure Reporter Configuration

Create `src/config/allure-reporter.ts`:
```typescript
import config from './config';

export const allureReporterConfig = {
    reporter: '@cucumber/allure-reporter',
    options: {
        resultsDir: config.allureOutputDir,
        labels: {
            epic: ['tag:@combination', 'tag:@brand', 'tag:@price', 'tag:@search', 'tag:@detail'],
            feature: ['tag:*'],
        },
        links: {
            issue: {
                pattern: 'https://github.com/yourorg/yourrepo/issues/{}',
                nameTemplate: 'Issue #{}',
            },
            tms: {
                pattern: 'https://jira.yourorg.com/browse/{}',
                nameTemplate: 'Test Case {}',
            },
        },
        categories: [
            {
                name: 'Ignored tests',
                matchedStatuses: ['skipped'],
            },
            {
                name: 'Infrastructure problems',
                matchedStatuses: ['broken'],
            },
            {
                name: 'Outdated tests',
                matchedStatuses: ['broken'],
                messageRegex: '.*FileNotFound.*',
            },
            {
                name: 'Product defects',
                matchedStatuses: ['failed'],
            },
        ],
        environmentInfo: {
            'Test Environment': process.env.TEST_ENVIRONMENT || 'LOCAL',
            'Browser': 'Chromium',
            'Base URL': config.baseUrl,
            'Node Version': process.version,
        },
    },
};
```

### 3.2 Update cucumber.js

```javascript
const { allureReporterConfig } = require('./src/config/allure-reporter');

const common = {
    requireModule: ['ts-node/register', 'tsconfig-paths/register'],
    require: ['src/steps/*.ts', 'src/support/*.ts'],
};

// Conditionally add Allure formatter
const allureFormat = process.env.ENABLE_ALLURE !== 'false'
    ? [`${allureReporterConfig.reporter}:${allureReporterConfig.options.resultsDir}`]
    : [];

module.exports = {
    default: {
        ...common,
        parallel: 4,
        format: [
            'progress-bar',
            'html:cucumber-report.html',
            'json:cucumber-report.json',
            ...allureFormat,  // Add Allure format
        ],
        paths: ['features/*.feature'],
    },
    shard: {
        ...common,
        format: [
            'progress',
            ...allureFormat,  // Also add to shard
        ],
    }
};
```

### 3.3 Add Allure Attachments to Hooks

Update `src/support/hooks.ts`:
```typescript
import { addAttachment } from '@cucumber/allure-reporter';
import config from '@config/config';

AfterStep(async function (this: CustomWorld, { result, pickle, pickleStep }) {
    if (result.status === Status.FAILED) {
        // Existing attachments...
        
        // Add Allure-specific attachment if enabled
        if (config.enableAllure && config.screenshotOnFailure) {
            const screenshot = await this.page.screenshot({ 
                fullPage: false, 
                type: config.screenshotType 
            });
            
            // Standard Cucumber attachment
            this.attach(screenshot, `image/${config.screenshotType}`);
            
            // Allure attachment with better naming
            addAttachment(`Screenshot - ${pickleStep.text}`, screenshot, `image/${config.screenshotType}`);
        }
    }
});
```

## 📦 Phase 4: Scripts & Commands

### 4.1 Update package.json

Add new scripts:
```json
{
  "scripts": {
    // Existing scripts...
    
    // Allure generation
    "allure:generate": "allure generate allure-results --clean -o allure-report",
    "allure:open": "allure open allure-report",
    "allure:serve": "allure serve allure-results",
    "allure:clean": "rm -rf allure-results allure-report .allure",
    
    // Combined test + report
    "test:allure": "npm test && npm run allure:serve",
    "test:cucumber:allure": "npm run test:cucumber && npm run allure:serve",
    
    // Full workflow
    "test:all:allure": "npm run clean:reports && npm test && npm run test:cucumber && npm run allure:generate && npm run allure:open",
    
    // Clean everything including Allure
    "clean:all": "npm run clean && npm run allure:clean"
  }
}
```

### 4.2 Create Allure Report Generator Script

Create `scripts/generate-allure-report.js`:
```javascript
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const resultsDir = path.join(__dirname, '../allure-results');
const reportDir = path.join(__dirname, '../allure-report');

console.log('🔍 Checking for Allure results...\n');

if (!fs.existsSync(resultsDir)) {
    console.error('❌ No allure-results directory found!');
    console.log('\n💡 Run tests first with Allure enabled:');
    console.log('   ENABLE_ALLURE=true npm test');
    console.log('   or');
    console.log('   ENABLE_ALLURE=true npm run test:cucumber\n');
    process.exit(1);
}

const files = fs.readdirSync(resultsDir);
if (files.length === 0) {
    console.error('❌ No Allure results found!');
    process.exit(1);
}

console.log(`✅ Found ${files.length} Allure result files\n`);
console.log('📊 Generating Allure Report...\n');

try {
    execSync(`allure generate ${resultsDir} --clean -o ${reportDir}`, { 
        stdio: 'inherit' 
    });
    
    console.log('\n✅ Allure Report generated successfully!');
    console.log(`\n📂 Location: ${reportDir}`);
    console.log(`🌐 Open: npm run allure:open`);
    console.log(`🚀 Serve: npm run allure:serve\n`);
} catch (error) {
    console.error('\n❌ Error generating Allure report:', error.message);
    process.exit(1);
}
```

Add to package.json:
```json
"allure:generate": "node scripts/generate-allure-report.js",
```

## 📦 Phase 5: CI/CD Integration

### 5.1 Update GitHub Actions Workflows

#### For Playwright Tests (`.github/workflows/playwright-tests.yml`):

```yaml
jobs:
  test:
    # ... existing test job
    
    steps:
      # ... existing steps
      
      # Add after test execution
      - name: Upload Allure Results
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: allure-results-playwright-${{ matrix.shardIndex }}
          path: allure-results/
          retention-days: 7

  # Add new job for Allure report
  allure-report:
    if: always()
    needs: [test]
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Download all Allure results
        uses: actions/download-artifact@v4
        with:
          pattern: allure-results-playwright-*
          merge-multiple: true
          path: allure-results
      
      - name: Generate Allure Report
        uses: simple-elf/allure-report-action@master
        with:
          allure_results: allure-results
          allure_report: allure-report
          gh_pages: gh-pages
          allure_history: allure-history
      
      - name: Upload Allure Report
        uses: actions/upload-artifact@v4
        with:
          name: allure-report-playwright
          path: allure-report
          retention-days: 30
```

#### For Cucumber Tests (`.github/workflows/cucumber-tests.yml`):

Similar updates with `allure-results-cucumber-*` naming.

## 📦 Phase 6: Documentation

### 6.1 Create ALLURE_REPORT.md

Document:
- What is Allure and why use it
- How to enable/disable
- Local usage commands
- CI integration
- Comparison with existing reports
- Migration guide

### 6.2 Update LOCAL_TESTING.md

Add Allure section:
```markdown
## 📊 Allure Reports

### Generate Allure Report

```bash
# Run tests with Allure
ENABLE_ALLURE=true npm test

# Generate and open report
npm run allure:generate
npm run allure:open

# Or serve directly
npm run allure:serve
```

### Features

- 📈 Detailed test execution graphs
- 🏷️ Test categorization and tagging
- 📸 Screenshots and attachments
- ⏱️ Historical trends
- 📊 Suites and behaviors view
```

## 📦 Phase 7: Testing & Validation

### 7.1 Test Checklist

- [ ] Playwright tests generate Allure results
- [ ] Cucumber tests generate Allure results
- [ ] Existing Playwright HTML report still works
- [ ] Existing Cucumber HTML report still works
- [ ] Allure can be disabled via ENABLE_ALLURE=false
- [ ] Reports work locally
- [ ] Reports work in CI
- [ ] Sharded tests aggregate correctly
- [ ] Screenshots appear in Allure
- [ ] Traces/attachments appear in Allure

### 7.2 Validation Commands

```bash
# Test Playwright with Allure
ENABLE_ALLURE=true npm test
npm run allure:serve

# Test Cucumber with Allure
ENABLE_ALLURE=true npm run test:cucumber
npm run allure:serve

# Test without Allure (should still work)
ENABLE_ALLURE=false npm test
npm run report:playwright

# Test both
npm run test:all:allure
```

## 🎯 Rollout Plan

### Day 1: Setup
1. Install dependencies
2. Update configurations
3. Add environment variables

### Day 2: Playwright Integration
1. Update playwright.config.ts
2. Add Allure annotations utility
3. Test locally

### Day 3: Cucumber Integration
1. Update cucumber.js
2. Update hooks for attachments
3. Test locally

### Day 4: Scripts & CI
1. Add npm scripts
2. Update GitHub Actions workflows
3. Test in CI

### Day 5: Documentation & Validation
1. Write documentation
2. Run full test suite
3. Validate all scenarios

## 🔄 Rollback Plan

If issues arise:

1. **Quick Rollback:**
   ```bash
   ENABLE_ALLURE=false npm test
   ```

2. **Complete Rollback:**
   - Revert commits
   - Remove Allure packages
   - Keep existing reports working

3. **Partial Rollback:**
   - Keep Playwright Allure
   - Disable Cucumber Allure
   - Or vice versa

## 📊 Success Metrics

After implementation:

- ✅ All existing reports still work
- ✅ Allure reports generated successfully
- ✅ Can toggle Allure on/off
- ✅ CI generates and publishes Allure
- ✅ Team can access historical trends
- ✅ Zero breaking changes to existing workflow

## 🎨 Benefits of Allure vs Existing Reports

| Feature | Existing | Allure |
|---------|----------|--------|
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

## 📝 Notes

- Allure runs **in parallel** with existing reports
- No changes to test code required (optional enhancements available)
- Configuration-driven (can be disabled anytime)
- CI/CD ready
- Supports sharding and parallel execution
- Backward compatible
