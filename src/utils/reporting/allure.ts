import { test } from '@playwright/test';

/**
 * Allure annotation utilities for Playwright tests.
 * These helpers add metadata to tests that Allure will display in reports.
 */
export const allure = {
    /**
     * Add an epic annotation (high-level feature group)
     */
    epic: (name: string) => test.info().annotations.push({ type: 'epic', description: name }),

    /**
     * Add a feature annotation
     */
    feature: (name: string) => test.info().annotations.push({ type: 'feature', description: name }),

    /**
     * Add a story annotation (user story)
     */
    story: (name: string) => test.info().annotations.push({ type: 'story', description: name }),

    /**
     * Add severity level annotation
     */
    severity: (level: 'blocker' | 'critical' | 'normal' | 'minor' | 'trivial') =>
        test.info().annotations.push({ type: 'severity', description: level }),

    /**
     * Add an owner annotation
     */
    owner: (name: string) => test.info().annotations.push({ type: 'owner', description: name }),

    /**
     * Add a link annotation
     */
    link: (url: string, name?: string) =>
        test.info().annotations.push({ type: 'link', description: `${name || url}|${url}` }),

    /**
     * Add an issue link annotation
     */
    issue: (id: string) =>
        test.info().annotations.push({ type: 'issue', description: id }),

    /**
     * Add a test case ID annotation
     */
    testId: (id: string) =>
        test.info().annotations.push({ type: 'tms', description: id }),

    /**
     * Add a description to the test
     */
    description: (text: string) =>
        test.info().annotations.push({ type: 'description', description: text }),

    /**
     * Add a tag to the test
     */
    tag: (name: string) =>
        test.info().annotations.push({ type: 'tag', description: name }),
};
