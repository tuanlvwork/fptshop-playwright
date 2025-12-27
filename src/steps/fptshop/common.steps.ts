import { Given, Then } from '@cucumber/cucumber';
import { CustomWorld } from '@support/custom-world';
import { HomePage } from '@pages/HomePage';
import { expect } from '@playwright/test';
import { retryNavigation } from '@utils/common/retry';

/**
 * Navigation step with built-in retry for network failures.
 * Retries up to 3 times with exponential backoff (2s, 4s, 8s).
 */
Given('I am on the FPT Shop phone page', async function (this: CustomWorld) {
    const homePage = new HomePage(this.page);

    await retryNavigation(async () => {
        await homePage.goto();
    }, {
        maxAttempts: 3,
        delayMs: 2000,
        errorMessage: 'Failed to navigate to FPT Shop phone page',
    });
});

Then('I should see the URL contains {string}', async function (this: CustomWorld, text: string) {
    const homePage = new HomePage(this.page);
    await homePage.verifyUrlContains(text);
});

Then('I should see the header contains {string}', async function (this: CustomWorld, text: string) {
    const homePage = new HomePage(this.page);
    await homePage.verifyHeaderContains(text);
});

Then('I should see the footer is visible', async function (this: CustomWorld) {
    await expect(this.page.locator('footer')).toBeVisible();
});

