import { Page, Locator, expect } from '@playwright/test';

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
        if (await this.productItems.count() > index) {
            const card = this.productItems.nth(index);
            const productLink = card.locator('a').first();
            await productLink.click();
        }
    }

    async verifyVisible() {
        await expect(this.productItems.first()).toBeVisible();
    }
}
