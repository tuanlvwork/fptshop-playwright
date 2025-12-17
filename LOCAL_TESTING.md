# Local Test Execution and Reporting Guide

This guide explains how to run tests and generate reports locally for both Playwright and Cucumber.

## 🚀 Quick Start

### Playwright Tests

```bash
# Run all Playwright tests
npm test

# Run with UI mode (interactive)
npm run test:ui

# Run in headed mode (see browser)
npm run test:headed

# View the report
npm run report:playwright
# or open directly
npm run report:open:playwright
```

### Cucumber Tests

```bash
# Run all Cucumber tests
npm run test:cucumber

# Run in headed mode (see browser)
npm run test:cucumber:headed

# Generate enhanced HTML report
npm run report:cucumber

# Open the report
npm run report:open:cucumber
```

## 📊 Report Generation

### Playwright Reports

Playwright generates reports automatically after test execution:
- Reports are saved in `playwright-report/`
- View with: `npm run report:playwright`
- Or open: `npm run report:open:playwright`

The report includes:
- ✅ Test results with pass/fail status
- 📸 Screenshots on failure
- 🎬 Videos (if enabled)
- ⏱️ Execution timeline
- 📋 Detailed logs

### Cucumber Reports

Cucumber tests generate both simple HTML and enhanced reports:

**During Test Run:**
- `cucumber-report.html` - Basic report
- `cucumber-report.json` - Raw data

**Enhanced Report Generation:**
```bash
npm run report:cucumber
```

This creates an enhanced HTML report in `cucumber-report/index.html` with:
- ✅ Test execution summary
- 📸 Inline screenshots
- 📋 Console logs and errors
- ⏱️ Timing information
- 🏷️ Tagged scenarios
- 📊 Statistics and charts

## 🔍 Traces

### List Available Traces
```bash
npm run trace:list
```

### View Trace Files
```bash
# Most recent trace
npm run trace:show

# Specific trace number
npm run trace:show 2
```

## 🧹 Cleanup

```bash
# Clean all reports and artifacts
npm run clean

# Clean only reports
npm run clean:reports

# Clean only trace files
npm run clean:traces
```

## 📝 Workflow Examples

### Full Test Suite with Reports

```bash
# Clean previous results
npm run clean

# Run Playwright tests
npm test

# View Playwright report
npm run report:playwright

# Run Cucumber tests
npm run test:cucumber

# Generate Cucumber report
npm run report:cucumber

# View Cucumber report
npm run report:open:cucumber
```

### Debug Failed Tests

```bash
# Run tests in UI mode
npm run test:ui

# Or run headed to see browser
npm run test:cucumber:headed

# If tests fail, check traces
npm run trace:list
npm run trace:show
```

### Quick Test & Report

```bash
# Run Cucumber tests and generate report
npm run test:cucumber && npm run report:cucumber

# Open the report
npm run report:open:cucumber
```

## 🎨 Customization

### Environment Variables

Edit `.env` file to customize:
```env
HEADLESS=false          # See browser during tests
PARALLEL_WORKERS=2      # Reduce workers for debugging
ENABLE_TRACING=true     # Enable detailed traces
SCREENSHOT_TYPE=png     # Screenshot format
```

### Test Selection

```bash
# Run specific Playwright test
npx playwright test tests/brand-filter.spec.ts

# Run specific Cucumber tag
npx cucumber-js --tags "@brand"

# Run Cucumber with specific feature
npx cucumber-js features/brand_filter.feature
```

## 📂 Report Locations

| Type | Location | Open Command |
|------|----------|--------------|
| Playwright | `playwright-report/` | `npm run report:open:playwright` |
| Cucumber | `cucumber-report/` | `npm run report:open:cucumber` |
| Traces | `traces/` | `npm run trace:show` |
| Screenshots | Embedded in reports | - |

## 💡 Tips

1. **Always generate reports after tests** - They provide much more detail than console output
2. **Use headed mode for debugging** - See what the browser is doing
3. **Check traces for failures** - Interactive debugging with full context
4. **Clean old reports regularly** - Keeps workspace tidy
5. **Use .env for local configuration** - Don't commit your local settings
