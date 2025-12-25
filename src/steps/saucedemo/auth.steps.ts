import { Given, When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../../support/custom-world';
import { performLogin } from '../../utils/saucedemo/auth-helper';
import { USERS } from '../../config/saucedemo/users';
import config from '../../config/config';
import * as path from 'path';
import * as fs from 'fs';
import { expect } from '@playwright/test';

// Helper to setup page listeners
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

// Helper to start tracing
const startTracing = async (world: CustomWorld) => {
    if (config.enableTracing) {
        await world.context.tracing.start({
            screenshots: true,
            snapshots: true,
            sources: true
        });
    }
};

// ============================================
// LOGIN PAGE NAVIGATION
// ============================================

Given('I am on the SauceDemo login page', async function (this: CustomWorld) {
    await this.page.goto('https://www.saucedemo.com/');
    await expect(this.page.locator('#login-button')).toBeVisible();
});

// ============================================
// LOGIN ACTIONS
// ============================================

When('I login as {string}', async function (this: CustomWorld, role: string) {
    const user = USERS[role as keyof typeof USERS];
    if (!user) {
        throw new Error(`User role "${role}" not found in configuration.`);
    }

    await this.page.fill('#user-name', user.username);
    await this.page.fill('#password', user.password);
    await this.page.click('#login-button');

    // Wait for inventory page to load
    await this.page.waitForURL(/.*inventory\.html/, { timeout: 15000 });
});

When('I attempt to login as {string}', async function (this: CustomWorld, role: string) {
    const user = USERS[role as keyof typeof USERS];
    if (!user) {
        throw new Error(`User role "${role}" not found in configuration.`);
    }

    await this.page.fill('#user-name', user.username);
    await this.page.fill('#password', user.password);
    await this.page.click('#login-button');

    // Wait for error or page change
    await this.page.waitForTimeout(1000);
});

When('I attempt to login with username {string} and password {string}', async function (
    this: CustomWorld,
    username: string,
    password: string
) {
    await this.page.fill('#user-name', username);
    await this.page.fill('#password', password);
    await this.page.click('#login-button');

    // Wait for error
    await this.page.waitForTimeout(500);
});

// ============================================
// LAZY LOGIN WITH SESSION REUSE
// ============================================

Given('I am logged in as {string}', async function (this: CustomWorld, role: string) {
    const authDir = path.join(process.cwd(), 'auth');
    const authFile = path.join(authDir, `${role}.json`);

    // Ensure auth directory exists
    if (!fs.existsSync(authDir)) {
        fs.mkdirSync(authDir, { recursive: true });
    }

    let storageStateExists = fs.existsSync(authFile);
    let verifySuccess = false;

    const contextOptions = {
        viewport: {
            width: config.viewportWidth,
            height: config.viewportHeight
        }
    };

    // Phase 1: Check existing session
    if (storageStateExists) {
        try {
            // Close the initial blank context/page set up in Before hook
            await this.page?.close();
            await this.context?.close();

            // Create new context with storage state
            this.context = await this.browser.newContext({
                ...contextOptions,
                storageState: authFile,
            });
            this.page = await this.context.newPage();

            // Restore listeners and tracing
            attachPageListeners(this);
            await startTracing(this);

            await this.page.goto('https://www.saucedemo.com/inventory.html');

            // Check if we are still at inventory (not redirected)
            if (this.page.url().includes('/inventory.html')) {
                const inventoryList = this.page.locator('.inventory_list');
                if (await inventoryList.count() > 0 && await inventoryList.isVisible()) {
                    verifySuccess = true;
                }
            }
        } catch (error) {
            console.log(`Phase 1 Check failed for ${role}: ${error}`);
            verifySuccess = false;
        }
    }

    // Phase 2: Clean & Heal
    if (!verifySuccess) {
        // Close invalid context
        try {
            await this.page?.close();
            await this.context?.close();
        } catch (e) { /* ignore */ }

        // Fresh context
        this.context = await this.browser.newContext(contextOptions);
        this.page = await this.context.newPage();

        // Restore listeners and tracing
        attachPageListeners(this);
        await startTracing(this);

        // Perform login
        await performLogin(this.page, role, authFile);
    }
});

// ============================================
// LOGIN ASSERTIONS
// ============================================

Then('I should be on the login page', async function (this: CustomWorld) {
    await expect(this.page).toHaveURL('https://www.saucedemo.com/');
    await expect(this.page.locator('#login-button')).toBeVisible();
});
