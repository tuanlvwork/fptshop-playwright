import { When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';
import { HomePage } from '../pages/HomePage';

When('I search for product {string}', async function (this: CustomWorld, product: string) {
    const homePage = new HomePage(this.page);
    await homePage.header.search(product);
});

Then('I should see the product list is visible', async function (this: CustomWorld) {
    const homePage = new HomePage(this.page);
    await homePage.productList.verifyVisible();
});
