# Lazy Login Implementation Guide

This document outlines the **Lazy Login** (Session Reuse) implementation pattern used in our Cucumber + Playwright framework. This approach significantly reduces test execution time by logging in only when necessary and reusing authenticated browser states across tests.

## 1. Overview

**Lazy Login** ensures that we don't perform a full UI login operation for every single test scenario. Instead, we:
1.  **Check** if a valid session file (storage state) exists.
2.  **Reuse** the session if valid.
3.  **Login & Save** if the session is missing or expired/invalid.

This "self-healing" mechanism guarantees that tests are robust against expired tokens while remaining fast.

## 2. Architecture

The implementation relies on three main components:
1.  **Auth Helper**: A utility function to perform the actual login and save the storage state to a JSON file.
2.  **Step Definition**: A smart step (e.g., `Given I am logged in as "standard_user"`) that manages the logic of loading vs. creating sessions.
3.  **Storage State**: JSON files stored in the `auth/` directory containing cookies and local storage data.

## 3. Implementation Details

### 3.1. Auth Helper (`src/utils/saucedemo/auth-helper.ts`)

This helper handles the "Login & Save" part. It performs the UI interactions and saves the state.

```typescript
import { Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { USERS } from '../../config/saucedemo/users';

export async function performLogin(page: Page, role: string, savePath: string) {
    const user = USERS[role as keyof typeof USERS];
    if (!user) {
        throw new Error(`User role "${role}" not found in configuration.`);
    }
    
    // 1. Perform UI Login
    await page.goto('https://www.saucedemo.com/');
    await page.fill('#user-name', user.username);
    await page.fill('#password', user.password);
    await page.click('#login-button');

    // 2. Validate Login Success
    await page.waitForURL(/.*\/inventory\.html/, { timeout: 10000 });

    // 3. Ensure directory exists
    const dir = path.dirname(savePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // 4. Save Storage State
    await page.context().storageState({ path: savePath });
}
```

### 3.2. Smart Step Definition (`src/steps/saucedemo/auth.steps.ts`)

This is the "Brain" of the operation. It decides whether to reuse a session or create a new one.

**Key Logic Flow:**
1.  Construct path to `auth/{role}.json`.
2.  Create auth directory if it doesn't exist.
3.  **Phase 1 (Try Reuse)**:
    *   If file exists, create a new context with `storageState: authFile`.
    *   **Restore listeners and tracing** (important for debugging).
    *   Navigate to a protected page (e.g., Inventory).
    *   Verify if we are still logged in (URL contains `/inventory.html` AND element is visible).
    *   If successful, proceed.
4.  **Phase 2 (Clean & Heal)**:
    *   If Phase 1 failed or file didn't exist:
    *   Discard the failed context.
    *   Create a fresh blank context.
    *   **Restore listeners and tracing**.
    *   Call `performLogin` to log in and save the new state.

```typescript
// Helper functions to restore state
const attachPageListeners = (world: CustomWorld) => {
    world.page.on('console', (msg) => {
        const logEntry = `[${msg.type()}] ${msg.text()}`;
        world.addConsoleLog(logEntry);
    });
    world.page.on('pageerror', (error) => {
        world.addError(`Page Error: ${error.message}`);
    });
    world.page.on('requestfailed', (request) => {
        world.addError(`Request Failed: ${request.url()} - ${request.failure()?.errorText}`);
    });
};

const startTracing = async (world: CustomWorld) => {
    if (config.enableTracing) {
        await world.context.tracing.start({
            screenshots: true,
            snapshots: true,
            sources: true
        });
    }
};

Given('I am logged in as {string}', async function (this: CustomWorld, role: string) {
    const authDir = path.join(process.cwd(), 'auth');
    const authFile = path.join(authDir, `${role}.json`);

    // Ensure auth directory exists
    if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
    }

    let verifySuccess = false;

    const contextOptions = {
        viewport: {
            width: config.viewportWidth,
            height: config.viewportHeight
        }
    };

    // --- PHASE 1: Try to Reuse ---
    if (fs.existsSync(authFile)) {
        try {
            // Close initial context/page
            await this.page?.close();
            await this.context?.close();

            // Load State
            this.context = await this.browser.newContext({
                ...contextOptions,
                storageState: authFile,
            });
            this.page = await this.context.newPage();
            
            // Restore listeners and tracing
            attachPageListeners(this);
            await startTracing(this);

            // Validate Session (navigate + check visibility)
            await this.page.goto('https://www.saucedemo.com/inventory.html');
            if (this.page.url().includes('/inventory.html')) {
                const inventoryList = this.page.locator('.inventory_list');
                if (await inventoryList.count() > 0 && await inventoryList.isVisible()) {
                    verifySuccess = true;
                }
            }
        } catch (e) {
            console.log(`Session expired for ${role}, creating new one...`);
        }
    }

    // --- PHASE 2: Heal (Login if needed) ---
    if (!verifySuccess) {
        // Reset Context
        try { await this.page?.close(); await this.context?.close(); } catch(e){}
        
        this.context = await this.browser.newContext(contextOptions);
        this.page = await this.context.newPage();

        // Restore listeners and tracing
        attachPageListeners(this);
        await startTracing(this);

        // Login & Save
        await performLogin(this.page, role, authFile);
    }
});
```

## 4. Important Considerations

### 4.1. Directory Structure
The `auth/` directory is automatically created by the implementation, so no manual setup is required. Session files are stored as:
```
auth/
  ├── standard.json
  ├── problem.json
  ├── visual.json
  └── error.json
```

**Note**: Add `auth/` to your `.gitignore` to avoid committing sensitive session data.

### 4.2. Session Validation Strategy
The implementation uses **dual validation**:
1. **URL Check**: Ensures we're on the expected page (`/inventory.html`)
2. **Element Check**: Verifies the inventory list exists AND is visible

This prevents false positives where the page loads but the user is redirected or content is missing.

### 4.3. State Restoration
When reusing a session, the implementation **must restore**:
- Console listeners (for debugging)
- Error listeners (for diagnostics)
- Request failure listeners (for network monitoring)
- Tracing (if enabled in config)

Failing to restore these will result in incomplete diagnostic data.

### 4.4. Parallel Execution
Each user role has its own session file, allowing **parallel test execution** with different roles without conflicts:
```gherkin
# These can run in parallel
Scenario: Standard user workflow
  Given I am logged in as "standard"
  
Scenario: Problem user workflow  
  Given I am logged in as "problem"
```

## 5. How to Apply to New Projects (e.g. FPT Shop)

To implement this for a new site (e.g., FPT Shop):

1.  **Define Users**: Add credentials to your config/users file.
2.  **Create Helper**: `src/utils/fptshop/auth-helper.ts`
    *   Implement `performLogin` that navigates to FPT Shop login, enters creds, waits for success, and saves state.
3.  **Create Step**: `src/steps/fptshop/auth.steps.ts`
    *   Copy the logic from Saucedemo's `I am logged in as...` step.
    *   Update the validation URL/selector (e.g., check for "Account Information" element).
    *   Point to the new `performLogin` helper.

## 6. Benefits

*   **Speed**: Skips UI login (filling forms, clicking buttons) for most tests.
*   **Stability**: If a session expires mid-suite, the framework automatically detects it and logs in again, fixing the test run "on the fly".
*   **Isolation**: Each user role has its own state file (`standard_user.json`, `admin.json`), allowing easy parallel testing of different roles.
