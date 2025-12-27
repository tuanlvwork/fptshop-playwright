const { chromium } = require('@playwright/test');
const path = require('path');

(async () => {
    console.log('Starting report screenshot capture...');
    const browser = await chromium.launch();
    const page = await browser.newPage();

    const reportPath = path.join(__dirname, '../../cucumber-report/index.html');
    const fileUrl = `file://${reportPath}`;

    console.log(`Navigating to ${fileUrl}`);
    await page.goto(fileUrl);

    // Wait for the report to be fully loaded
    await page.waitForLoadState('networkidle');

    // Set a reasonable viewport to capture the summary clearly
    await page.setViewportSize({ width: 1280, height: 1024 });

    const screenshotPath = path.join(__dirname, '../../cucumber-report/cucumber-report-summary.png');

    // Capture the screenshot
    await page.screenshot({ path: screenshotPath, fullPage: false });

    console.log(`Screenshot saved to ${screenshotPath}`);
    await browser.close();
})();
