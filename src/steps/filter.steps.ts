import { When } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';
import { HomePage } from '../pages/HomePage';
import { retryInteraction, retryNavigation } from '../utils/retry';

/**
 * Filter by brand with retry for element interaction failures.
 */
When('I filter by brand {string} with slug {string}', async function (this: CustomWorld, brand: string, slug: string) {
    const homePage = new HomePage(this.page);

    await retryInteraction(async () => {
        await homePage.filterBar.filterByBrand(slug);
    }, {
        maxAttempts: 3,
        errorMessage: `Failed to filter by brand: ${brand}`,
    });
});

/**
 * Filter by price range with retry for element interaction failures.
 */
When('I filter by price range {string} with param {string}', async function (this: CustomWorld, label: string, param: string) {
    const homePage = new HomePage(this.page);

    await retryInteraction(async () => {
        await homePage.filterBar.filterByPrice(param);
    }, {
        maxAttempts: 3,
        errorMessage: `Failed to filter by price: ${label}`,
    });
});

/**
 * Combination filter (brand + price) with retry for navigation failures.
 */
When('I filter by brand {string} and price {string}', async function (this: CustomWorld, brand: string, priceParam: string) {
    await retryNavigation(async () => {
        await this.page.goto(`/dien-thoai/${brand}?gia=${priceParam}`);
    }, {
        maxAttempts: 3,
        errorMessage: `Failed to filter by brand "${brand}" and price "${priceParam}"`,
    });
});

When('I sort items by {string}', async function (this: CustomWorld, criteria: string) {
    const homePage = new HomePage(this.page);
    await retryInteraction(async () => {
        await homePage.filterBar.sortBy(criteria);
    }, { maxAttempts: 3, errorMessage: `Failed to sort by ${criteria}` });
});

When('I filter by {string} with value {string}', async function (this: CustomWorld, featureName: string, value: string) {
    const homePage = new HomePage(this.page);
    await retryInteraction(async () => {
        await homePage.filterBar.filterByFeature(featureName, value);
    }, { maxAttempts: 3, errorMessage: `Failed to filter by ${featureName}: ${value}` });
});
