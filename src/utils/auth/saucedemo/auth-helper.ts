import { Page, errors } from '@playwright/test';
import * as path from 'path';
import * as fs from 'fs';
import { USERS } from '@config/saucedemo/users';

export async function performLogin(page: Page, role: string, savePath: string) {
    const user = USERS[role as keyof typeof USERS];
    if (!user) {
        throw new Error(`User role "${role}" not found in configuration.`);
    }

    const MAX_RETRIES = 3;
    let attempt = 0;
    let loginSuccess = false;

    console.log(`[${new Date().toISOString()}] [PID:${process.pid}] [${role}] AuthHelper: Starting login for user: ${user.username} (Max retries: ${MAX_RETRIES})`);

    while (attempt < MAX_RETRIES && !loginSuccess) {
        attempt++;
        try {
            if (attempt > 1) {
                console.log(`[${new Date().toISOString()}] [PID:${process.pid}] [${role}] AuthHelper: Retry attempt ${attempt}/${MAX_RETRIES}...`);
            }

            // Navigate and Login
            await page.goto('https://www.saucedemo.com/');
            await page.fill('#user-name', user.username);
            await page.fill('#password', user.password);
            await page.click('#login-button');

            // Validation (wait for expected URL)
            try {
                await page.waitForURL(/.*\/inventory\.html/, { timeout: 5000 });
            } catch (waitError) {
                // If Timeout, check if it's because of an application error (e.g. Locked Out)
                try {
                    const errorElement = page.locator('[data-test="error"]');
                    if (await errorElement.isVisible({ timeout: 1000 })) {
                        const errorText = await errorElement.textContent();
                        console.error(`[${new Date().toISOString()}] [PID:${process.pid}] [${role}] ⛔ AuthHelper: Login Failed: ${errorText}`);
                        throw new Error(`Application Login Error: ${errorText}`); // Non-retryable
                    }
                } catch (e) {
                    // Ignore errors checking for error element
                }
                throw waitError; // Re-throw original timeout to main catch block
            }

            loginSuccess = true;
            console.log(`[${new Date().toISOString()}] [PID:${process.pid}] [${role}] AuthHelper: Login successful on attempt ${attempt}`);

        } catch (error) {
            let isRetryable = false;

            if (error instanceof errors.TimeoutError) {
                console.warn(`[${new Date().toISOString()}] [PID:${process.pid}] [${role}] ⚠️ AuthHelper: Timeout detected (Attempt ${attempt}): ${error.message}`);
                isRetryable = true;
            } else if (error instanceof Error) {
                // Check for network/connection errors
                const msg = error.message;
                if (msg.includes('ECONNRESET') ||
                    msg.includes('ETIMEDOUT') ||
                    msg.includes('net::ERR_') ||
                    msg.includes('Navigation failed') ||
                    msg.includes('Target closed')) {

                    console.warn(`[${new Date().toISOString()}] [PID:${process.pid}] [${role}] ⚠️ AuthHelper: Network/Connection error detected (Attempt ${attempt}): ${msg}`);
                    isRetryable = true;
                }
            }

            // If it's explicitly non-retryable (application error)
            if (String(error).includes('Application Login Error')) {
                isRetryable = false;
            }

            if (!isRetryable || attempt === MAX_RETRIES) {
                console.error(`[${new Date().toISOString()}] [PID:${process.pid}] [${role}] ❌ AuthHelper: Login failed permanently after ${attempt} attempts.`);
                throw error;
            }

            // Wait a bit before retrying (backoff)
            await page.waitForTimeout(2000);
        }
    }

    // Ensure directory exists
    const dir = path.dirname(savePath);
    if (!fs.existsSync(dir)) {
        console.log(`[${new Date().toISOString()}] [PID:${process.pid}] [${role}] AuthHelper: Creating auth directory: ${dir}`);
        fs.mkdirSync(dir, { recursive: true });
    }

    // Save storage state nicely using atomic write
    const tempPath = `${savePath}.tmp`;
    const saveStartTime = Date.now();
    console.log(`[${new Date().toISOString()}] [PID:${process.pid}] [${role}] AuthHelper: Writing session to temporary file ${tempPath}...`);

    // Write to temp file first
    await page.context().storageState({ path: tempPath });

    // Verify file was written and has content
    if (!fs.existsSync(tempPath) || fs.statSync(tempPath).size === 0) {
        throw new Error(`Failed to save auth state: File ${tempPath} is missing or empty`);
    }

    // Atomic rename to final path
    fs.renameSync(tempPath, savePath);

    const saveDuration = Date.now() - saveStartTime;
    console.log(`[${new Date().toISOString()}] [PID:${process.pid}] [${role}] AuthHelper: Session file saved atomically to ${savePath} (took ${saveDuration}ms)`);
}
