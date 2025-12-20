import { test } from '@playwright/test';
import { FptShopPage } from '../pages/FptShopPage';
import { allure } from '../src/utils/allure';

const products = [
    'iPhone 15 Pro Max',
    'Samsung Galaxy Z Fold5',
    'Xiaomi 13T',
    'OPPO Find N3 Flip',
    'Vivo V29e',
    'Realme 11',
    'Nokia G22',
    'Asus ROG Phone 7',
    'Tecno Pova 5',
    'Samsung Galaxy S23 Ultra',
    'iPhone 14',
    'iPhone 13',
    'Samsung Galaxy A54',
    'Xiaomi Redmi Note 12',
    'OPPO Reno10',
    'Vivo Y36',
    'Realme C55',
    'Nokia C32',
    'Samsung Galaxy M34',
    'iPhone 11',
];

test.describe('Product Search Tests', () => {
    let fptShopPage: FptShopPage;

    test.beforeEach(async ({ page }) => {
        fptShopPage = new FptShopPage(page);
        await fptShopPage.goto();
    });

    for (const product of products) {
        test(`Search for Product: ${product}`, async ({ page }) => {
            // Allure metadata
            allure.epic('E-commerce');
            allure.feature('Product Search');
            allure.story('Search by Product Name');
            allure.severity('blocker');
            allure.owner('QA Team');
            allure.tag('search');
            allure.tag(product.split(' ')[0]); // Tag with brand name (first word)
            allure.description(`Verify that searching for "${product}" returns relevant product results`);

            await fptShopPage.searchProduct(product);
            await fptShopPage.verifyProductListVisible();
        });
    }
});

