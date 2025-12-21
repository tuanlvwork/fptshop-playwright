import { test, expect } from '@playwright/test';
import { HomePage } from '../src/pages/HomePage';

test.describe('Product Comparison', () => {
    test('should add two products to comparison list', async ({ page }) => {
        const homePage = new HomePage(page);
        await homePage.goto();

        await homePage.productList.addToCompare(0);
        await homePage.productList.addToCompare(1);

        // Use text locator to verify count based on previous step impl
        await expect(page.getByText('So sánh (2)').first()).toBeVisible({ timeout: 10000 });
    });
});
