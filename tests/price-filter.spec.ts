import { test } from '@playwright/test';
import { FptShopPage } from '../pages/FptShopPage';

const priceRanges = [
    { label: 'Dưới 2 triệu', urlParam: 'duoi-2-trieu' },
    { label: 'Từ 2 - 4 triệu', urlParam: 'tu-2-4-trieu' },
    { label: 'Từ 4 - 7 triệu', urlParam: 'tu-4-7-trieu' },
    { label: 'Từ 7 - 13 triệu', urlParam: 'tu-7-13-trieu' },
    { label: 'Từ 13 - 20 triệu', urlParam: 'tu-13-20-trieu' },
    { label: 'Trên 20 triệu', urlParam: 'tren-20-trieu' },
];

test.describe('Price Filter Tests', () => {
    let fptShopPage: FptShopPage;

    test.beforeEach(async ({ page }) => {
        fptShopPage = new FptShopPage(page);
        await fptShopPage.goto();
    });

    for (const range of priceRanges) {
        test(`Filter by Price: ${range.label}`, async ({ page }) => {
            await fptShopPage.filterByPrice(range.urlParam);
            await fptShopPage.verifyUrlContains(range.urlParam);
            await fptShopPage.verifyProductListVisible();
        });
    }
});
