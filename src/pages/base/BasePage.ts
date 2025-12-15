import { Page, Locator, expect } from '@playwright/test';

export abstract class BasePage {
    readonly page: Page;

    constructor(page: Page) {
        this.page = page;
    }

    async navigate(path: string) {
        await this.page.goto(path);
    }

    async getTitle() {
        return await this.page.title();
    }

    async waitForUrl(pattern: RegExp | string) {
        await this.page.waitForURL(pattern);
    }
}
