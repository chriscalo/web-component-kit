import { test, describe } from "node:test";
import { chromium } from "playwright";
import { createServer } from "node:http";
import { readFileSync } from "node:fs";
import { join, extname } from "node:path";
import { fileURLToPath } from "node:url";
import { dirname } from "node:path";
import assert from "node:assert";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

describe("Web Component Kit Tests", () => {
  let server;
  let browser;
  let page;
  let port;
  
  test("setup server and browser", async () => {
    // Start local server
    server = createServer((req, res) => {
      let filePath = req.url === "/" ? "index.html" : req.url.slice(1);
      filePath = filePath.split("?")[0];
      
      const fullPath = join(__dirname, filePath);
      const ext = extname(fullPath);
      const contentType = ext === ".js" ? "application/javascript" : 
                        ext === ".html" ? "text/html" : 
                        ext === ".css" ? "text/css" :
                        "text/plain";
      
      try {
        const content = readFileSync(fullPath);
        res.writeHead(200, { "Content-Type": contentType });
        res.end(content);
      } catch (err) {
        res.writeHead(404);
        res.end("Not found");
      }
    });

    port = await new Promise((resolve) => {
      server.listen(0, "127.0.0.1", () => {
        resolve(server.address().port);
      });
    });
    
    // Launch browser in headless mode
    browser = await chromium.launch({ headless: true });
  });
  
  test("run core library tests from index.test.html", async () => {
    const testUrl = `http://localhost:${port}/index.test.html`;
    page = await browser.newPage();
    
    const consoleMessages = [];
    page.on("console", msg => {
      const text = msg.text();
      consoleMessages.push(text);
      console.log(text);
    });
    
    await page.goto(testUrl);
    await page.waitForTimeout(1000);
    
    // Extract test results from console
    const testResults = [];
    for (const message of consoleMessages) {
      if (message.startsWith("✅")) {
        const name = message.replace("✅ ", "");
        testResults.push({ name, status: "pass" });
      } else if (message.startsWith("❌")) {
        const parts = message.split(":");
        const name = parts[0].replace("❌ ", "");
        const error = parts.slice(1).join(":").trim();
        testResults.push({ name, status: "fail", error });
      }
    }
    
    // Check that all tests passed
    const failedTests = testResults.filter(r => r.status === "fail");
    if (failedTests.length > 0) {
      const errorMessages = failedTests.map(t => `${t.name}: ${t.error}`).join("\n");
      throw new Error(`${failedTests.length} tests failed:\n${errorMessages}`);
    }
    
    assert.ok(testResults.length > 0, "Should have test results");
    
    await page.close();
  });
  
  test("run UI icon component tests from ui-icon.test.html", async () => {
    const testUrl = `http://localhost:${port}/ui-icon.test.html`;
    page = await browser.newPage();
    
    const consoleMessages = [];
    page.on("console", msg => {
      const text = msg.text();
      consoleMessages.push(text);
      console.log(text);
    });
    
    await page.goto(testUrl);
    await page.waitForTimeout(1000);
    
    // Extract test results from console
    const testResults = [];
    for (const message of consoleMessages) {
      if (message.startsWith("✅")) {
        const name = message.replace("✅ ", "");
        testResults.push({ name, status: "pass" });
      } else if (message.startsWith("❌")) {
        const parts = message.split(":");
        const name = parts[0].replace("❌ ", "");
        const error = parts.slice(1).join(":").trim();
        testResults.push({ name, status: "fail", error });
      }
    }
    
    // Check that all tests passed
    const failedTests = testResults.filter(r => r.status === "fail");
    if (failedTests.length > 0) {
      const errorMessages = failedTests.map(t => `${t.name}: ${t.error}`).join("\n");
      throw new Error(`${failedTests.length} tests failed:\n${errorMessages}`);
    }
    
    assert.ok(testResults.length > 0, "Should have test results");
    
    await page.close();
  });
  
  test("cleanup", async () => {
    if (browser) await browser.close();
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });
});