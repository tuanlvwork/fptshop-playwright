import { test } from '@playwright/test';
import { FptShopPage } from '../pages/FptShopPage';
import { allure } from '../src/utils/allure';

test.describe('Product Detail Tests', () => {
    let fptShopPage: FptShopPage;

    test.beforeEach(async ({ page }) => {
        fptShopPage = new FptShopPage(page);
        await fptShopPage.goto();
    });

    for (let i = 0; i < 20; i++) {
        test(`Product Detail View: Item ${i + 1}`, async ({ page }) => {
            // Allure metadata
            allure.epic('E-commerce');
            allure.feature('Product Details');
            allure.story('View Product Details');
            allure.severity('critical');
            allure.owner('QA Team');
            allure.tag('detail');
            allure.tag('product');
            allure.description(`Verify that clicking on product #${i + 1} displays the product detail page correctly`);

            await fptShopPage.clickProductAtIndex(i);
            await fptShopPage.verifyProductDetailVisible();
        });
    }
});

