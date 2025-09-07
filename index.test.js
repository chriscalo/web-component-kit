import { test, describe } from 'node:test';
import { chromium } from 'playwright';
import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Web Component Kit Tests', async () => {
  let server;
  let browser;
  let page;
  const port = 3001;
  
  // Start the HTTP server
  server = spawn('npx', ['http-server', '-p', port.toString()], {
    cwd: __dirname,
    stdio: 'pipe'
  });
  
  // Wait for server to be ready
  await new Promise((resolve) => {
    server.stdout.on('data', (data) => {
      if (data.toString().includes('Available on:')) {
        resolve();
      }
    });
    setTimeout(resolve, 2000);
  });
  
  // Launch browser
  browser = await chromium.launch();
  
  // Cleanup function
  const cleanup = async () => {
    if (page) await page.close();
    if (browser) await browser.close();
    if (server) {
      server.kill();
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  };
  
  // Register cleanup
  process.on('exit', cleanup);
  process.on('SIGINT', cleanup);
  
  async function runTestsFromHTML(htmlFile) {
    const testUrl = `http://localhost:${port}/${htmlFile}`;
    page = await browser.newPage();
    
    const consoleMessages = [];
    page.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      console.log(text);
    });
    
    await page.goto(testUrl);
    await page.waitForTimeout(1000);
    
    // Extract test results from console
    const testResults = extractTestResults(consoleMessages);
    
    // Create tests from results
    for (const result of testResults) {
      test(result.name, () => {
        if (result.status === 'fail') {
          throw new Error(result.error || 'Test failed');
        }
      });
    }
  }
  
  function extractTestResults(messages) {
    const results = [];
    
    for (const message of messages) {
      if (message.startsWith('✅')) {
        const name = message.replace('✅ ', '');
        results.push({ name, status: 'pass' });
      } else if (message.startsWith('❌')) {
        const parts = message.split(':');
        const name = parts[0].replace('❌ ', '');
        const error = parts.slice(1).join(':').trim();
        results.push({ name, status: 'fail', error });
      }
    }
    
    return results;
  }
  
  describe('Core Library Tests from index.test.html', () => {
    test('should run all core tests', async () => {
      await runTestsFromHTML('index.test.html');
    });
  });
  
  describe('UI Icon Component Tests from ui-icon.test.html', () => {
    test('should run all icon component tests', async () => {
      await runTestsFromHTML('ui-icon.test.html');
    });
  });
  
  describe('Examples Page', () => {
    test('should load examples page without errors', async () => {
      const testUrl = `http://localhost:${port}/examples.html`;
      const testPage = await browser.newPage();
      
      let hasErrors = false;
      testPage.on('pageerror', error => {
        console.error('Page error:', error);
        hasErrors = true;
      });
      
      const response = await testPage.goto(testUrl);
      assert.strictEqual(response.status(), 200);
      
      // Wait for examples to render
      await testPage.waitForTimeout(1000);
      
      // Check that examples are present
      const counterExample = await testPage.$('#counter-example');
      assert.ok(counterExample, 'Counter example should exist');
      
      const bindingExample = await testPage.$('#binding-example');
      assert.ok(bindingExample, 'Binding example should exist');
      
      const todoExample = await testPage.$('#todo-example');
      assert.ok(todoExample, 'Todo example should exist');
      
      assert.strictEqual(hasErrors, false, 'No page errors should occur');
      
      await testPage.close();
    });
  });
});