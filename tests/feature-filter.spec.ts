import { test, expect } from '@playwright/test';
import { HomePage } from '../src/pages/HomePage';

test.describe('Feature Filtering', () => {
    let homePage: HomePage;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        await homePage.goto();
    });

    const scenarios = [
        { feature: 'RAM', value: '8 GB', slug: 'ram-8gb' },
        { feature: 'ROM', value: '256 GB', slug: 'rom-256gb' }
    ];

    for (const scenario of scenarios) {
        test(`should filter by ${scenario.feature}: ${scenario.value}`, async () => {
            // Basic implementation assuming the label text is unique enough
            await homePage.filterBar.filterByFeature(scenario.feature, scenario.value);
            await homePage.verifyUrlContains(scenario.slug);
        });
    }
});
