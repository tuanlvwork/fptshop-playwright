import { Before, After, BeforeAll, AfterAll, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, Browser } from '@playwright/test';
import { CustomWorld } from './world';

setDefaultTimeout(60 * 1000);

let browser: Browser;

BeforeAll(async function () {
    browser = await chromium.launch({ headless: true });
});

AfterAll(async function () {
    await browser.close();
});

Before(async function (this: CustomWorld) {
    this.context = await browser.newContext({
        baseURL: 'http://fptshop.com.vn',
    });
    this.page = await this.context.newPage();
});

After(async function (this: CustomWorld) {
    await this.page.close();
    await this.context.close();
});
