import { When, Then, Given } from '@cucumber/cucumber';
import { CustomWorld } from '@support/custom-world';
import { expect } from '@playwright/test';

// ============================================
// SIDEBAR MENU ACTIONS
// ============================================

When('I open the sidebar menu', async function (this: CustomWorld) {
    const menuButton = this.page.locator('#react-burger-menu-btn');
    await expect(menuButton).toBeVisible();
    await menuButton.click();
    // Wait for menu to open
    await expect(this.page.locator('.bm-menu-wrap')).toBeVisible();
});

When('I close the sidebar menu', async function (this: CustomWorld) {
    const closeButton = this.page.locator('#react-burger-cross-btn');
    await expect(closeButton).toBeVisible();
    await closeButton.click();
});

When('I click on {string} menu option', async function (this: CustomWorld, menuOption: string) {
    let menuItemId: string;

    switch (menuOption) {
        case 'All Items':
            menuItemId = 'inventory_sidebar_link';
            break;
        case 'About':
            menuItemId = 'about_sidebar_link';
            break;
        case 'Logout':
            menuItemId = 'logout_sidebar_link';
            break;
        case 'Reset App State':
            menuItemId = 'reset_sidebar_link';
            break;
        default:
            throw new Error(`Unknown menu option: ${menuOption}`);
    }

    const menuItem = this.page.locator(`#${menuItemId}`);
    await expect(menuItem).toBeVisible();
    await menuItem.click();

    // Wait for action to complete
    await this.page.waitForTimeout(500);
});

// ============================================
// SIDEBAR MENU ASSERTIONS
// ============================================

Then('I should see the menu items', async function (this: CustomWorld) {
    await expect(this.page.locator('#inventory_sidebar_link')).toBeVisible();
    await expect(this.page.locator('#about_sidebar_link')).toBeVisible();
    await expect(this.page.locator('#logout_sidebar_link')).toBeVisible();
    await expect(this.page.locator('#reset_sidebar_link')).toBeVisible();
});

Then('the sidebar menu should not be visible', async function (this: CustomWorld) {
    // Check that menu is hidden (has aria-hidden or is not visible)
    const menuWrap = this.page.locator('.bm-menu-wrap');
    await expect(menuWrap).toHaveAttribute('aria-hidden', 'true');
});

// ============================================
// EXTERNAL NAVIGATION
// ============================================

Then('I should be on the Sauce Labs website', async function (this: CustomWorld) {
    // About link navigates to external site
    await expect(this.page).toHaveURL(/.*saucelabs\.com.*/);
});

Then('I should be on the {string}', async function (this: CustomWorld, expectedResult: string) {
    switch (expectedResult) {
        case 'inventory page':
            await expect(this.page).toHaveURL(/.*inventory\.html/);
            await expect(this.page.locator('.inventory_list')).toBeVisible();
            break;
        case 'Sauce Labs website':
            await expect(this.page).toHaveURL(/.*saucelabs\.com.*/);
            break;
        case 'login page':
            await expect(this.page).toHaveURL('https://www.saucedemo.com/');
            await expect(this.page.locator('#login-button')).toBeVisible();
            break;
        default:
            throw new Error(`Unknown expected result: ${expectedResult}`);
    }
});
