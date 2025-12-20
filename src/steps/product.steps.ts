import { When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';
import { HomePage } from '../pages/HomePage';
import { ProductDetailPage } from '../pages/ProductDetailPage';
import { retryInteraction } from '../utils/retry';

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

