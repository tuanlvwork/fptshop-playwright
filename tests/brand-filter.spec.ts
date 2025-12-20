import { test } from '@playwright/test';
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

test.describe('Brand Filter Tests', () => {
    let fptShopPage: FptShopPage;

    test.beforeEach(async ({ page }) => {
        fptShopPage = new FptShopPage(page);
        await fptShopPage.goto();
    });

    for (const brand of brands) {
        test(`Filter by Brand: ${brand.name}`, async ({ page }) => {
            // Allure metadata
            allure.epic('E-commerce');
            allure.feature('Product Filtering');
            allure.story('Brand Filter');
            allure.severity('critical');
            allure.owner('QA Team');
            allure.tag('brand');
            allure.tag(brand.name);
            allure.description(`Verify that filtering products by ${brand.name} brand works correctly`);

            await fptShopPage.filterByBrand(brand.slug);
            await fptShopPage.verifyUrlContains(brand.slug);
            await fptShopPage.verifyHeaderContains(brand.name);
        });
    }
});

