import { Page, Locator, expect } from '@playwright/test';

export class Header {
    readonly page: Page;
    readonly searchInput: Locator;

    constructor(page: Page) {
        this.page = page;
        this.searchInput = page.locator('input[type="text"]', { hasText: 'Nhập tên điện thoại' })
            .or(page.locator('#search-box-input'))
            .or(page.locator('input[placeholder*="Bạn muốn tìm gì"]'));
    }

    async search(productName: string) {
        if (await this.searchInput.count() > 0) {
            await this.searchInput.first().fill(productName);
            await this.searchInput.first().press('Enter');
        }
    }
}
