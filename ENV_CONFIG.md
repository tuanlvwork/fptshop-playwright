# Environment Configuration Setup

This project uses environment variables for configuration management.

## Setup

1. Copy the example file to create your local configuration:
   ```bash
   cp .env.example .env
   ```

2. Edit `.env` to customize settings for your local environment

## Available Configuration

### Application Settings
- `BASE_URL` - Base URL for the application (default: https://fptshop.com.vn)

### Browser Settings
- `HEADLESS` - Run browser in headless mode (default: true)
- `VIEWPORT_WIDTH` - Browser viewport width (default: 1920)
- `VIEWPORT_HEIGHT` - Browser viewport height (default: 1080)

### Test Timeouts
- `DEFAULT_TIMEOUT` - Default test timeout in ms (default: 60000)
- `NAVIGATION_TIMEOUT` - Page navigation timeout in ms (default: 30000)
- `ACTION_TIMEOUT` - Action timeout in ms (default: 10000)

### Execution Settings
- `PARALLEL_WORKERS` - Number of parallel workers (default: 4)
- `RETRIES` - Number of test retries on failure (default: 1)

### Screenshot Settings
- `SCREENSHOT_ON_FAILURE` - Capture screenshots on failure (default: true)
- `SCREENSHOT_TYPE` - Screenshot format: png or jpeg (default: png)
- `FULL_PAGE_SCREENSHOT` - Capture full page screenshots (default: true)

### Trace Settings
- `ENABLE_TRACING` - Enable Playwright tracing (default: true)
- `TRACE_ON_FAILURE_ONLY` - Only save traces for failed tests (default: true)

### Report Settings
- `REPORT_TITLE` - Title for test reports (default: FPT Shop Test Automation)
- `TEST_ENVIRONMENT` - Test environment name (default: STAGING)
- `APP_VERSION` - Application version (default: 1.0.0)

### CI Settings
- `CI` - Running in CI environment (default: false)

## Example Configurations

### Local Development (Default)
```env
HEADLESS=false
PARALLEL_WORKERS=2
ENABLE_TRACING=true
```

### CI Environment
```env
HEADLESS=true
PARALLEL_WORKERS=4
CI=true
SCREENSHOT_TYPE=jpeg
```

### Debug Mode
```env
HEADLESS=false
ENABLE_TRACING=true
TRACE_ON_FAILURE_ONLY=false
DEFAULT_TIMEOUT=120000
```
