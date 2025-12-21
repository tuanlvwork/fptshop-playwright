import { Page, Locator, expect } from '@playwright/test';
import { step } from 'allure-js-commons';

export class ProductList {
    readonly page: Page;
    readonly productItems: Locator;

    constructor(page: Page) {
        this.page = page;
        this.productItems = page.locator('.product-item, .card').filter({ has: page.locator('a') });
    }

    async getFirstProduct() {
        return this.productItems.first();
    }

    async clickProductAtIndex(index: number) {
        await step(`Click product at index ${index}`, async () => {
            if (await this.productItems.count() > index) {
                const card = this.productItems.nth(index);
                const productLink = card.locator('a').first();
                await productLink.click();
            }
        });
    }

    async addToCompare(index: number) {
        await step(`Add product ${index} to compare`, async () => {
            // Locate "Thêm vào so sánh"
            // Based on inspection, it's text "Thêm vào so sánh"
            // Usually it appears on hover. 
            const card = this.productItems.nth(index);
            await card.hover();

            const compareBtn = card.locator('text=Thêm vào so sánh').first();
            // or selector .cdt-product__compare

            if (await compareBtn.isVisible()) {
                await compareBtn.click();
            } else {
                console.log('Compare button not visible, trying force click or alternative selector');
                // Attempt without check?
                await compareBtn.click({ force: true });
            }
        });
    }

    async verifyVisible() {
        await expect(this.productItems.first()).toBeVisible();
    }
}
