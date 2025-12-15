import { setWorldConstructor, World } from '@cucumber/cucumber';
import { Browser, BrowserContext, Page } from '@playwright/test';

export class CustomWorld extends World {
    browser!: Browser;
    context!: BrowserContext;
    page!: Page;
    testMetadata: {
        startTime?: number;
        errors: string[];
        consoleLogs: string[];
    };

    constructor(options: any) {
        super(options);
        this.testMetadata = {
            errors: [],
            consoleLogs: []
        };
    }

    addError(error: string) {
        this.testMetadata.errors.push(`[${new Date().toISOString()}] ${error}`);
    }

    addConsoleLog(log: string) {
        this.testMetadata.consoleLogs.push(log);
    }
}

setWorldConstructor(CustomWorld);
