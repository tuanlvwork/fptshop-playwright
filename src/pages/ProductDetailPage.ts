import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base/BasePage';

export class ProductDetailPage extends BasePage {
    readonly pageHeader: Locator;
    readonly buyNowButton: Locator;

    constructor(page: Page) {
        super(page);
        this.pageHeader = page.locator('h1');
        this.buyNowButton = page.locator('text=Mua ngay').or(page.locator('button:has-text("Mua ngay")'));
    }

    async verifyVisible() {
        await expect(this.pageHeader).toBeVisible();
        await expect(this.buyNowButton).toBeVisible();
    }
}
