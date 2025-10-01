import { test, expect } from '@playwright/test';

test.describe('Web Component Kit - UI Icon Tests', () => {
  test('loads and runs all modular tests from ui-icon.test.html', async ({ page }) => {
    // Navigate to the test page
    await page.goto('/ui-icon.test.html');

    // Wait for all tests to load
    await page.waitForFunction(() => window.testsReady === true, { timeout: 10000 });

    // Get all tests from the page
    const testCount = await page.evaluate(() => window.tests.length);
    console.log(`Found ${testCount} UI icon tests to run`);

    // Run each test individually for better reporting
    const tests = await page.evaluate(() => window.tests);

    for (const testInfo of tests) {
      await test.step(testInfo.name, async () => {
        const result = await page.evaluate(async (testName) => {
          const testObj = window.tests.find(t => t.name === testName);
          try {
            await testObj.run();
            return { success: true };
          } catch (error) {
            return {
              success: false,
              error: error.message,
              stack: error.stack
            };
          }
        }, testInfo.name);

        if (!result.success) {
          throw new Error(result.error);
        }
      });
    }

    // Verify we ran a reasonable number of tests
    expect(testCount).toBeGreaterThan(0);
  });
});
