import { When, Then } from '@cucumber/cucumber';
import { expect } from '@playwright/test';
import { CustomWorld } from '../../support/custom-world';
import { HomePage } from '../../pages/HomePage';
import { ProductDetailPage } from '../../pages/ProductDetailPage';
import { retryInteraction } from '../../utils/retry';

/**
 * Click on product with retry for element interaction failures.
 */
When('I click on product at index {int}', async function (this: CustomWorld, index: number) {
    const homePage = new HomePage(this.page);

    await retryInteraction(async () => {
        await homePage.productList.clickProductAtIndex(index);
    }, {
        maxAttempts: 3,
        errorMessage: `Failed to click on product at index ${index}`,
    });
});

/**
 * Verify product detail page is visible with retry for page load timing issues.
 */
Then('I should see the product detail page', async function (this: CustomWorld) {
    const productDetailPage = new ProductDetailPage(this.page);

    await retryInteraction(async () => {
        await productDetailPage.verifyVisible();
    }, {
        maxAttempts: 3,
        delayMs: 1000,
        errorMessage: 'Failed to verify product detail page is visible',
    });
});


When('I add the first product to compare', async function (this: CustomWorld) {
    const homePage = new HomePage(this.page);
    await retryInteraction(async () => {
        await homePage.productList.addToCompare(0);
    }, { maxAttempts: 3, errorMessage: 'Failed to add first product to compare' });
});

When('I add the second product to compare', async function (this: CustomWorld) {
    const homePage = new HomePage(this.page);
    await retryInteraction(async () => {
        await homePage.productList.addToCompare(1);
    }, { maxAttempts: 3, errorMessage: 'Failed to add second product to compare' });
});

Then('I should see the comparison badge count is {int}', async function (this: CustomWorld, count: number) {
    // Basic verification: Look for a badge with the number
    // Based on standard UI, this is usually .compare-count or similar
    // Since we didn't inspect this exact element, we will try text match
    // This might fail if the selector is tricky
    const badge = this.page.locator('.c-compare .counter, .compare-sticky .count, #compare-counter').first();
    // Fallback: look for text `So sánh (${count})`
    const textBadge = this.page.locator(`text=So sánh (${count})`);

    await retryInteraction(async () => {
        // Try logical selectors
        if (await badge.isVisible()) {
            // await expect(badge).toHaveText(String(count));
            // Just visibility is good enough for now? No, need count.
        }
        // If specific badge not found, rely on text
        await expect(this.page.getByText(`So sánh (${count})`).first()).toBeVisible();
    }, { maxAttempts: 3, errorMessage: `Comparison count ${count} not visible` });
});
