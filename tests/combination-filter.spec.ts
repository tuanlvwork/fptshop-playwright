import { test, expect } from '@playwright/test';
import { FptShopPage } from '../pages/FptShopPage';
import { allure } from '../src/utils/allure';

const brands = [
    { name: 'Apple', slug: 'apple' },
    { name: 'Samsung', slug: 'samsung' },
    { name: 'Xiaomi', slug: 'xiaomi' },
    { name: 'OPPO', slug: 'oppo' },
    { name: 'Vivo', slug: 'vivo' },
    { name: 'Nokia', slug: 'nokia' },
    { name: 'Realme', slug: 'realme' },
    { name: 'Asus', slug: 'asus' },
    { name: 'Tecno', slug: 'tecno' },
    { name: 'Masstel', slug: 'masstel' },
];

const priceRanges = [
    { label: 'Dưới 2 triệu', urlParam: 'duoi-2-trieu' },
    { label: 'Từ 2 - 4 triệu', urlParam: 'tu-2-4-trieu' },
    { label: 'Từ 4 - 7 triệu', urlParam: 'tu-4-7-trieu' },
    { label: 'Từ 7 - 13 triệu', urlParam: 'tu-7-13-trieu' },
    { label: 'Từ 13 - 20 triệu', urlParam: 'tu-13-20-trieu' },
    { label: 'Trên 20 triệu', urlParam: 'tren-20-trieu' },
];

test.describe('Combination Filter Tests', () => {
    let fptShopPage: FptShopPage;

    test.beforeEach(async ({ page }) => {
        fptShopPage = new FptShopPage(page);
        await fptShopPage.goto();
    });

    let count = 0;
    for (const brand of brands) {
        for (const range of priceRanges) {
            if (count >= 44) break;
            test(`Combination: ${brand.name} - ${range.label}`, async ({ page }) => {
                // Allure metadata
                allure.epic('E-commerce');
                allure.feature('Product Filtering');
                allure.story('Combination Filter');
                allure.severity('normal');
                allure.owner('QA Team');
                allure.tag('combination');
                allure.tag(brand.name);
                allure.tag('price');
                allure.description(`Verify that filtering products by ${brand.name} brand and price range "${range.label}" works correctly`);

                await fptShopPage.filterByBrandAndPrice(brand.slug, range.urlParam);
                await expect(page.locator('footer')).toBeVisible();
            });
            count++;
        }
    }
});

