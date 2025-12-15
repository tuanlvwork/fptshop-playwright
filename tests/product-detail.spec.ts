import { test } from '@playwright/test';
import { FptShopPage } from '../pages/FptShopPage';

test.describe('Product Detail Tests', () => {
    let fptShopPage: FptShopPage;

    test.beforeEach(async ({ page }) => {
        fptShopPage = new FptShopPage(page);
        await fptShopPage.goto();
    });

    for (let i = 0; i < 20; i++) {
        test(`Product Detail View: Item ${i + 1}`, async ({ page }) => {
            await fptShopPage.clickProductAtIndex(i);
            await fptShopPage.verifyProductDetailVisible();
        });
    }
});
