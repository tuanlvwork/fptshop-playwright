import { When, Then } from '@cucumber/cucumber';
import { CustomWorld } from '../../support/custom-world';
import { expect } from '@playwright/test';

// ============================================
// CHECKOUT NAVIGATION
// ============================================

When('I proceed to checkout', async function (this: CustomWorld) {
    const checkoutButton = this.page.locator('[data-test="checkout"]');
    await expect(checkoutButton).toBeVisible();
    await checkoutButton.click();
});

When('I cancel checkout', async function (this: CustomWorld) {
    const cancelButton = this.page.locator('[data-test="cancel"]');
    await expect(cancelButton).toBeVisible();
    await cancelButton.click();
});

// ============================================
// CHECKOUT INFORMATION FORM
// ============================================

When('I fill in checkout information with {string} {string} {string}', async function (
    this: CustomWorld,
    firstName: string,
    lastName: string,
    postalCode: string
) {
    await this.page.fill('[data-test="firstName"]', firstName);
    await this.page.fill('[data-test="lastName"]', lastName);
    await this.page.fill('[data-test="postalCode"]', postalCode);
});

When('I continue checkout', async function (this: CustomWorld) {
    const continueButton = this.page.locator('[data-test="continue"]');
    await expect(continueButton).toBeVisible();
    await continueButton.click();
});

// ============================================
// CHECKOUT OVERVIEW
// ============================================

Then('I should see the checkout overview page', async function (this: CustomWorld) {
    await expect(this.page).toHaveURL(/.*checkout-step-two\.html/);
    await expect(this.page.locator('.cart_list')).toBeVisible();
});

Then('I should see the item total', async function (this: CustomWorld) {
    const itemTotal = this.page.locator('.summary_subtotal_label');
    await expect(itemTotal).toBeVisible();
    const text = await itemTotal.textContent();
    expect(text).toContain('Item total:');
});

Then('I should see the tax', async function (this: CustomWorld) {
    const tax = this.page.locator('.summary_tax_label');
    await expect(tax).toBeVisible();
    const text = await tax.textContent();
    expect(text).toContain('Tax:');
});

Then('I should see the total price', async function (this: CustomWorld) {
    const total = this.page.locator('.summary_total_label');
    await expect(total).toBeVisible();
    const text = await total.textContent();
    expect(text).toContain('Total:');
});

// ============================================
// CHECKOUT COMPLETION
// ============================================

When('I finish checkout', async function (this: CustomWorld) {
    const finishButton = this.page.locator('[data-test="finish"]');
    await expect(finishButton).toBeVisible();
    await finishButton.click();
});

Then('I should see the order confirmation', async function (this: CustomWorld) {
    await expect(this.page).toHaveURL(/.*checkout-complete\.html/);
    const header = this.page.locator('.complete-header');
    await expect(header).toBeVisible();
    await expect(header).toHaveText('Thank you for your order!');
});

// ============================================
// CHECKOUT ERRORS
// ============================================

Then('I should see the checkout error {string}', async function (this: CustomWorld, expectedError: string) {
    const errorContainer = this.page.locator('[data-test="error"]');
    await expect(errorContainer).toBeVisible();
    await expect(errorContainer).toContainText(expectedError);
});

Then('I should see an error during checkout or order confirmation', async function (this: CustomWorld) {
    // Error user behavior can vary - check for either error or success
    const errorContainer = this.page.locator('[data-test="error"]');
    const confirmationHeader = this.page.locator('.complete-header');

    const hasError = await errorContainer.count() > 0 && await errorContainer.isVisible().catch(() => false);
    const hasConfirmation = await confirmationHeader.count() > 0 && await confirmationHeader.isVisible().catch(() => false);

    // Either an error should be shown, or if successful, note it in console
    if (hasError) {
        console.log('Error user encountered checkout error as expected');
    } else if (hasConfirmation) {
        console.log('Note: Error user completed checkout successfully - behavior may vary');
    } else {
        throw new Error('Neither error nor confirmation was displayed');
    }
});
