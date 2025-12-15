import { Page, Locator, expect } from '@playwright/test';

export class FilterBar {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
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
        // Direct navigation strategy as used in original tests for stability
        // But in a real component, this might click a dropdown. 
        // Since we are migrating, let's keep the logic but maybe expose it as a navigation helper in the Page, 
        // or if it's a UI interaction, put it here.
        // The original test used `page.goto` for price because of complexity.
        // Let's assume for H-POM we want to try UI interaction if possible, but fallback to URL for now to match previous stability.
        // Actually, the previous POM `FptShopPage` used `navigate`.
        // Let's keep this method here but it might need to interact with the Page object to navigate.
        // Ideally components shouldn't do full page navigation, but for filters it's often a reload.

        // For H-POM purity, let's assume this component *should* find the element.
        // If we stick to the previous logic of "goto", it belongs more in the Page controller or a specific "Navigation" helper.
        // However, to keep it simple and working:
        const currentUrl = this.page.url();
        if (currentUrl.includes('?')) {
            await this.page.goto(`${currentUrl}&gia=${priceParam}`);
        } else {
            await this.page.goto(`${currentUrl}?gia=${priceParam}`);
        }
    }
}
