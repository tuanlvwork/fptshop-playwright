import { When } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';
import { HomePage } from '../pages/HomePage';

When('I filter by brand {string} with slug {string}', async function (this: CustomWorld, brand: string, slug: string) {
    const homePage = new HomePage(this.page);
    await homePage.filterBar.filterByBrand(slug);
});

When('I filter by price range {string} with param {string}', async function (this: CustomWorld, label: string, param: string) {
    const homePage = new HomePage(this.page);
    await homePage.filterBar.filterByPrice(param);
});

When('I filter by brand {string} and price {string}', async function (this: CustomWorld, brand: string, priceParam: string) {
    const homePage = new HomePage(this.page);
    // Combination filter logic
    // We can reuse the filterBar methods or navigate directly as per previous logic
    // Let's use direct navigation for combination as it's cleaner for this specific test case
    await this.page.goto(`/dien-thoai/${brand}?gia=${priceParam}`);
});
