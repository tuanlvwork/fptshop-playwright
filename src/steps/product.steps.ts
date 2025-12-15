import { When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../support/world';
import { HomePage } from '../pages/HomePage';
import { ProductDetailPage } from '../pages/ProductDetailPage';

When('I click on product at index {int}', async function (this: CustomWorld, index: number) {
    const homePage = new HomePage(this.page);
    await homePage.productList.clickProductAtIndex(index);
});

Then('I should see the product detail page', async function (this: CustomWorld) {
    const productDetailPage = new ProductDetailPage(this.page);
    await productDetailPage.verifyVisible();
});
