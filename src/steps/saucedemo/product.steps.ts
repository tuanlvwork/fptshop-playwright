import { When, Then, Given } from '@cucumber/cucumber';
import { CustomWorld } from '@support/custom-world';
import { expect } from '@playwright/test';

// ============================================
// INVENTORY PAGE ASSERTIONS
// ============================================

Then('I should see the inventory page', async function (this: CustomWorld) {
    await expect(this.page).toHaveURL(/.*inventory\.html/);
    await expect(this.page.locator('.inventory_list')).toBeVisible();
});

Then('I should see at least {int} product(s) listed', async function (this: CustomWorld, count: number) {
    const products = this.page.locator('.inventory_item');
    await expect(products.first()).toBeVisible();
    expect(await products.count()).toBeGreaterThanOrEqual(count);
});

// ============================================
// ADD TO CART ACTIONS
// ============================================

When('I add the first item to the cart', async function (this: CustomWorld) {
    const addToCartButton = this.page.locator('.inventory_item').first().locator('button:has-text("Add to cart")');
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();
});

When('I add the second item to the cart', async function (this: CustomWorld) {
    const addToCartButton = this.page.locator('.inventory_item').nth(1).locator('button:has-text("Add to cart")');
    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();
});

When('I remove the first item from cart', async function (this: CustomWorld) {
    const removeButton = this.page.locator('.inventory_item').first().locator('button:has-text("Remove")');
    await expect(removeButton).toBeVisible();
    await removeButton.click();
});

When('I remove the item from cart page', async function (this: CustomWorld) {
    const removeButton = this.page.locator('.cart_item').first().locator('button:has-text("Remove")');
    await expect(removeButton).toBeVisible();
    await removeButton.click();
});

// ============================================
// CART BADGE ASSERTIONS
// ============================================

Then('the cart badge should show {string} item(s)', async function (this: CustomWorld, count: string) {
    const badge = this.page.locator('.shopping_cart_badge');
    await expect(badge).toBeVisible();
    await expect(badge).toHaveText(count);
});

Then('the cart badge should not be visible', async function (this: CustomWorld) {
    const badge = this.page.locator('.shopping_cart_badge');
    await expect(badge).not.toBeVisible();
});

// ============================================
// CART PAGE ACTIONS & ASSERTIONS
// ============================================

When('I click on the cart icon', async function (this: CustomWorld) {
    const cartLink = this.page.locator('.shopping_cart_link');
    await expect(cartLink).toBeVisible();
    await cartLink.click();
});

When('I click continue shopping', async function (this: CustomWorld) {
    const continueButton = this.page.locator('[data-test="continue-shopping"]');
    await expect(continueButton).toBeVisible();
    await continueButton.click();
});

Then('I should be on the cart page', async function (this: CustomWorld) {
    await expect(this.page).toHaveURL(/.*cart\.html/);
    await expect(this.page.locator('.cart_list')).toBeVisible();
});

Then('I should see {int} item(s) in the cart', async function (this: CustomWorld, count: number) {
    const cartItems = this.page.locator('.cart_item');
    await expect(cartItems).toHaveCount(count);
});

Then('the cart should be empty', async function (this: CustomWorld) {
    const cartItems = this.page.locator('.cart_item');
    await expect(cartItems).toHaveCount(0);
});

// ============================================
// SORTING ACTIONS & ASSERTIONS
// ============================================

When('I sort products by {string}', async function (this: CustomWorld, sortOption: string) {
    const sortDropdown = this.page.locator('.product_sort_container');
    await expect(sortDropdown).toBeVisible();
    await sortDropdown.selectOption({ label: sortOption });
});

Then('products should be sorted by {string}', async function (this: CustomWorld, sortOption: string) {
    const productNames = this.page.locator('.inventory_item_name');
    const productPrices = this.page.locator('.inventory_item_price');

    const names = await productNames.allTextContents();
    const prices = await productPrices.allTextContents();
    const numericPrices = prices.map(p => parseFloat(p.replace('$', '')));

    switch (sortOption) {
        case 'Name (A to Z)':
            const sortedAZ = [...names].sort();
            expect(names).toEqual(sortedAZ);
            break;
        case 'Name (Z to A)':
            const sortedZA = [...names].sort().reverse();
            expect(names).toEqual(sortedZA);
            break;
        case 'Price (low to high)':
            const sortedLowHigh = [...numericPrices].sort((a, b) => a - b);
            expect(numericPrices).toEqual(sortedLowHigh);
            break;
        case 'Price (high to low)':
            const sortedHighLow = [...numericPrices].sort((a, b) => b - a);
            expect(numericPrices).toEqual(sortedHighLow);
            break;
        default:
            throw new Error(`Unknown sort option: ${sortOption}`);
    }
});

Then('the sort dropdown should show {string}', async function (this: CustomWorld, expectedValue: string) {
    const sortDropdown = this.page.locator('.product_sort_container');
    await expect(sortDropdown).toBeVisible();
    // Check the selected option text
    const selectedText = await sortDropdown.locator('option:checked').textContent();
    expect(selectedText).toBe(expectedValue);
});

// ============================================
// PRODUCT DETAIL ACTIONS & ASSERTIONS
// ============================================

When('I click on the first product name', async function (this: CustomWorld) {
    const productName = this.page.locator('.inventory_item_name').first();
    await expect(productName).toBeVisible();
    await productName.click();
});

When('I add product to cart from detail page', async function (this: CustomWorld) {
    const addButton = this.page.locator('[data-test="add-to-cart"]');
    await expect(addButton).toBeVisible();
    await addButton.click();
});

When('I click back to products', async function (this: CustomWorld) {
    const backButton = this.page.locator('[data-test="back-to-products"]');
    await expect(backButton).toBeVisible();
    await backButton.click();
});

Then('I should be on the product detail page', async function (this: CustomWorld) {
    await expect(this.page).toHaveURL(/.*inventory-item\.html/);
    await expect(this.page.locator('.inventory_details')).toBeVisible();
});

Then('I should see the product name', async function (this: CustomWorld) {
    await expect(this.page.locator('.inventory_details_name')).toBeVisible();
});

Then('I should see the product description', async function (this: CustomWorld) {
    await expect(this.page.locator('.inventory_details_desc')).toBeVisible();
});

Then('I should see the product price', async function (this: CustomWorld) {
    await expect(this.page.locator('.inventory_details_price')).toBeVisible();
});

Then('I should see the add to cart button', async function (this: CustomWorld) {
    await expect(this.page.locator('[data-test="add-to-cart"]')).toBeVisible();
});

Then('I should see the product image', async function (this: CustomWorld) {
    await expect(this.page.locator('.inventory_details_img')).toBeVisible();
});

// ============================================
// ERROR HANDLING
// ============================================

Then('I should see the error message {string}', async function (this: CustomWorld, expectedMessage: string) {
    const errorContainer = this.page.locator('[data-test="error"]');
    await expect(errorContainer).toBeVisible();
    await expect(errorContainer).toContainText(expectedMessage);
});

// ============================================
// DYNAMIC ITEM COUNT
// ============================================

When('I add {int} items to the cart', async function (this: CustomWorld, count: number) {
    const addToCartButtons = this.page.locator('.inventory_item button:has-text("Add to cart")');

    for (let i = 0; i < count; i++) {
        await addToCartButtons.nth(i).click();
    }
});

// ============================================
// PRODUCT ELEMENT ASSERTIONS (for Scenario Outline)
// ============================================

Then('I should see the {word}', async function (this: CustomWorld, element: string) {
    let locator;

    switch (element) {
        case 'product':
            // Handle compound like "product name", "product description"
            // This step won't be reached for compounds due to other specific steps
            locator = this.page.locator('.inventory_details');
            break;
        default:
            throw new Error(`Unknown element: ${element}`);
    }

    await expect(locator).toBeVisible();
});

// ============================================
// NAVIGATION PAGE ASSERTIONS
// ============================================

Then('I should be on the {word} page', async function (this: CustomWorld, pageName: string) {
    switch (pageName) {
        case 'inventory':
            await expect(this.page).toHaveURL(/.*inventory\.html/);
            await expect(this.page.locator('.inventory_list')).toBeVisible();
            break;
        case 'cart':
            await expect(this.page).toHaveURL(/.*cart\.html/);
            await expect(this.page.locator('.cart_list')).toBeVisible();
            break;
        case 'login':
            await expect(this.page).toHaveURL('https://www.saucedemo.com/');
            await expect(this.page.locator('#login-button')).toBeVisible();
            break;
        default:
            throw new Error(`Unknown page: ${pageName}`);
    }
});

Given('I navigate to the {word} page', async function (this: CustomWorld, pageName: string) {
    switch (pageName) {
        case 'cart':
            await this.page.locator('.shopping_cart_link').click();
            break;
        default:
            throw new Error(`Unknown page to navigate: ${pageName}`);
    }
});
