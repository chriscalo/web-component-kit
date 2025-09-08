import { chromium } from 'playwright';

async function testAPI() {
  // Try to install browser first if not installed
  try {
    const browser = await chromium.launch({ headless: true });
    const page = await browser.newPage();
    
    const logs = [];
    page.on('console', msg => {
      logs.push(msg.text());
      console.log('BROWSER:', msg.text());
    });
    
    await page.goto('http://localhost:3000/test-api.html');
    await page.waitForTimeout(2000); // Wait for scripts to execute
    
    await browser.close();
    
    return logs;
  } catch (error) {
    console.log('Browser test failed:', error.message);
    return null;
  }
}

testAPI();