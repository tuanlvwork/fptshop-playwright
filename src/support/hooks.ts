import { Before, After, BeforeAll, AfterAll, setDefaultTimeout, Status } from '@cucumber/cucumber';
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

After(async function (this: CustomWorld, scenario) {
    if (scenario.result?.status === Status.FAILED) {
        const screenshot = await this.page.screenshot({ fullPage: true, type: 'jpeg', quality: 80 });
        this.attach(screenshot, 'image/jpeg');
    }
    await this.page.close();
    await this.context.close();
});
