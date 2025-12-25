import { Page } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { USERS } from '../../config/saucedemo/users';

export async function performLogin(page: Page, role: string, savePath: string) {
    const user = USERS[role as keyof typeof USERS];
    if (!user) {
        throw new Error(`User role "${role}" not found in configuration.`);
    }

    await page.goto('https://www.saucedemo.com/');
    await page.fill('#user-name', user.username);
    await page.fill('#password', user.password);
    await page.click('#login-button');

    // Validation
    await page.waitForURL(/.*\/inventory\.html/, { timeout: 10000 });

    // Ensure directory exists
    const dir = path.dirname(savePath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    // Save storage state
    await page.context().storageState({ path: savePath });
}
