import { Page, Locator, expect } from '@playwright/test';
import { BasePage } from './base/BasePage';
import { Header } from './components/Header';
import { FilterBar } from './components/FilterBar';
import { ProductList } from './components/ProductList';

export class HomePage extends BasePage {
    readonly header: Header;
    readonly filterBar: FilterBar;
    readonly productList: ProductList;
    readonly pageHeader: Locator;

    constructor(page: Page) {
        super(page);
        this.header = new Header(page);
        this.filterBar = new FilterBar(page);
        this.productList = new ProductList(page);
        this.pageHeader = page.locator('h1');
    }

    async goto() {
        await this.navigate('/dien-thoai');
    }

    async verifyHeaderContains(text: string) {
        await expect(this.pageHeader).toContainText(text, { ignoreCase: true });
    }

    async verifyUrlContains(text: string) {
        await expect(this.page).toHaveURL(new RegExp(text));
    }
}
