import { Page, Locator, expect } from '@playwright/test';
import { step } from 'allure-js-commons';

export class FilterBar {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async filterByBrand(brandSlug: string) {
        await step(`Click brand filter: ${brandSlug}`, async () => {
            // Updated locator to be more specific if possible, but href is key
            const brandFilter = this.page.locator(`a[href*="/dien-thoai/${brandSlug}"]`).first();

            // Try to scroll into view first (for carousels)
            if (await brandFilter.count() > 0) {
                await brandFilter.scrollIntoViewIfNeeded();
            }

            if (await brandFilter.isVisible()) {
                await brandFilter.click();
            } else {
                console.log(`Brand filter for ${brandSlug} not visible. Checking expandable options...`);
                // Future: Add logic to open "See more" if needed
            }
        });
    }

    async filterByPrice(priceParam: string) {
        await step(`Filter by price param: ${priceParam}`, async () => {
            const currentUrl = this.page.url();
            const separator = currentUrl.includes('?') ? '&' : '?';
            const targetUrl = `${currentUrl}${separator}gia=${priceParam}`;

            await step(`Navigate to: ${targetUrl}`, async () => {
                await this.page.goto(targetUrl);
            });
        });
    }
    async sortBy(criteria: string) {
        await step(`Sort by: ${criteria}`, async () => {
            const sortOption = this.page.locator(`span`).filter({ hasText: criteria }).first();
            if (await sortOption.isVisible()) {
                await sortOption.click();
            } else {
                throw new Error(`Sort option "${criteria}" not found`);
            }
        });
    }

    async filterByFeature(featureName: string, value: string) {
        await step(`Filter by ${featureName}: ${value}`, async () => {
            const option = this.page.locator(`label`).filter({ hasText: value }).first();
            if (await option.count() > 0) {
                await option.scrollIntoViewIfNeeded();
                await option.check(); // Use check if it's a checkbox/label pair, or click
            } else {
                throw new Error(`Filter option "${value}" for "${featureName}" not found`);
            }
        });
    }
}
