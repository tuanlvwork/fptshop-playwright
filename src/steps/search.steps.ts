import { When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';
import { HomePage } from '../pages/HomePage';
import { retryInteraction } from '../utils/retry';

/**
 * Search for product with retry for element interaction failures.
 */
When('I search for product {string}', async function (this: CustomWorld, product: string) {
    const homePage = new HomePage(this.page);

    await retryInteraction(async () => {
        await homePage.header.search(product);
    }, {
        maxAttempts: 3,
        errorMessage: `Failed to search for product: ${product}`,
    });
});

/**
 * Verify product list is visible with retry for page load timing issues.
 */
Then('I should see the product list is visible', async function (this: CustomWorld) {
    const homePage = new HomePage(this.page);

    await retryInteraction(async () => {
        await homePage.productList.verifyVisible();
    }, {
        maxAttempts: 3,
        delayMs: 1000,
        errorMessage: 'Failed to verify product list is visible',
    });
});

