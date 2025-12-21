import { test, expect } from '@playwright/test';
import { HomePage } from '../src/pages/HomePage';

test.describe('Product Sorting', () => {
    let homePage: HomePage;

    test.beforeEach(async ({ page }) => {
        homePage = new HomePage(page);
        await homePage.goto();
    });

    const scenarios = [
        { criteria: 'Giá tăng dần', param: 'sort=price-asc' }, // Updated text based on live site
        { criteria: 'Giá giảm dần', param: 'sort=price-desc' },
        { criteria: 'Nổi bật', param: 'sort=selling' }      // Updated to match site
    ];

    for (const scenario of scenarios) {
        test(`should sort by ${scenario.criteria}`, async () => {
            await homePage.filterBar.sortBy(scenario.criteria);
            await homePage.verifyUrlContains(scenario.param);
        });
    }
});
