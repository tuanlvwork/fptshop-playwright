import { Given, Then } from '@cucumber/cucumber';
import { CustomWorld } from '@support/world';
import { HomePage } from '@pages/HomePage';
import { expect } from '@playwright/test';

Given('I am on the FPT Shop phone page', async function (this: CustomWorld) {
    const homePage = new HomePage(this.page);
    await homePage.goto();
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
