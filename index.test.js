import { test, describe } from 'node:test';
import { chromium } from 'playwright';
import { createServer } from 'node:http';
import { readFileSync } from 'node:fs';
import { join, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import assert from 'node:assert';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe('Web Component Kit Tests', async () => {
  let server;
  let browser;
  let page;
  
  // Start local server
  server = createServer((req, res) => {
    let filePath = req.url === '/' ? 'index.html' : req.url.slice(1);
    filePath = filePath.split('?')[0];
    
    const fullPath = join(__dirname, filePath);
    const ext = extname(fullPath);
    const contentType = ext === '.js' ? 'application/javascript' : 
                      ext === '.html' ? 'text/html' : 
                      ext === '.css' ? 'text/css' :
                      'text/plain';
    
    try {
      const content = readFileSync(fullPath);
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    } catch (err) {
      res.writeHead(404);
      res.end('Not found');
    }
  });

  const port = await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      resolve(server.address().port);
    });
  });
  
  // Launch browser in headless mode
  browser = await chromium.launch({ headless: true });
  
  // Cleanup function
  const cleanup = async () => {
    if (page) await page.close();
    if (browser) await browser.close();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
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
  
  // Final cleanup
  test('cleanup', async () => {
    await cleanup();
  });
});