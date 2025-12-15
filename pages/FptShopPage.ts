import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './BasePage';

export class FptShopPage extends BasePage {
    readonly searchInput: Locator;
    readonly productItems: Locator;
    readonly pageHeader: Locator;
    readonly buyNowButton: Locator;

    constructor(page: Page) {
        super(page);
        // Initialize locators
        this.searchInput = page.locator('input[type="text"]', { hasText: 'Nhập tên điện thoại' })
            .or(page.locator('#search-box-input'))
            .or(page.locator('input[placeholder*="Bạn muốn tìm gì"]'));
        this.productItems = page.locator('.product-item, .card').filter({ has: page.locator('a') });
        this.pageHeader = page.locator('h1');
        this.buyNowButton = page.locator('text=Mua ngay').or(page.locator('button:has-text("Mua ngay")'));
    }

    async goto() {
        await this.navigate('/dien-thoai');
    }

    async filterByBrand(brandSlug: string) {
        const brandFilter = this.page.locator(`a[href*="/dien-thoai/${brandSlug}"]`).first();
        if (await brandFilter.isVisible()) {
            await brandFilter.click();
        } else {
            console.log(`Brand filter for ${brandSlug} not visible`);
        }
    }

    async filterByPrice(priceParam: string) {
        // Direct navigation strategy as used in the original test
        await this.navigate(`/dien-thoai?gia=${priceParam}`);
    }

    async filterByBrandAndPrice(brandSlug: string, priceParam: string) {
        await this.navigate(`/dien-thoai/${brandSlug}?gia=${priceParam}`);
    }

    async searchProduct(productName: string) {
        if (await this.searchInput.count() > 0) {
            await this.searchInput.first().fill(productName);
            await this.searchInput.first().press('Enter');
        }
    }

    async clickProductAtIndex(index: number) {
        if (await this.productItems.count() > index) {
            const card = this.productItems.nth(index);
            const productLink = card.locator('a').first();
            await productLink.click();
        }
    }

    async verifyUrlContains(text: string) {
        await expect(this.page).toHaveURL(new RegExp(text));
    }

    async verifyHeaderContains(text: string) {
        await expect(this.pageHeader).toContainText(text, { ignoreCase: true });
    }

    async verifyProductListVisible() {
        await expect(this.productItems.first()).toBeVisible();
    }

    async verifyProductDetailVisible() {
        await expect(this.pageHeader).toBeVisible();
        await expect(this.buyNowButton).toBeVisible();
    }
}
