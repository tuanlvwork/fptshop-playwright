import { Page, Locator, expect } from '@playwright/test';
import { step } from 'allure-js-commons';

export class Header {
    readonly page: Page;
    readonly searchInput: Locator;

    constructor(page: Page) {
        this.page = page;
        // Updated selector based on actual site inspection
        this.searchInput = page.locator('input[name="search"]');
    }

    async search(productName: string) {
        await step(`Search for: ${productName}`, async () => {
            if (await this.searchInput.count() > 0) {
                await this.searchInput.first().fill(productName);
                await this.searchInput.first().press('Enter');
            } else {
                console.log('Search input not found!');
            }
        });
    }
}
