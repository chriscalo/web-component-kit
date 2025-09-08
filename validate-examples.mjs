import { chromium } from 'playwright';

async function validateExamples() {
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const page = await browser.newPage();
  
  const logs = [];
  page.on('console', msg => {
    const text = msg.text();
    console.log('BROWSER LOG:', text);
    logs.push(text);
  });
  
  page.on('pageerror', error => {
    console.log('BROWSER ERROR:', error.message);
  });
  
  try {
    await page.goto('http://localhost:3000/test-fixes.html', { waitUntil: 'networkidle' });
    await page.waitForTimeout(1000);
    
    console.log('\n=== Validation Results ===');
    const hasErrors = logs.some(log => log.includes('Error') || log.includes('error'));
    const hasTestResults = logs.some(log => log.includes('Testing fixed examples'));
    
    if (!hasErrors && hasTestResults) {
      console.log('✅ All examples appear to be working correctly!');
      return true;
    } else {
      console.log('❌ Some issues detected in examples');
      return false;
    }
  } catch (error) {
    console.log('Failed to test:', error.message);
    return false;
  } finally {
    await browser.close();
  }
}

validateExamples();
