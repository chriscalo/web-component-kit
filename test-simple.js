import { chromium } from "playwright";

async function runTests() {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  
  // Capture console messages
  const messages = [];
  page.on("console", msg => {
    console.log(msg.text());
    messages.push(msg.text());
  });
  
  page.on("pageerror", error => {
    console.error("Page error:", error.message);
  });
  
  console.log("Loading index.test.html...");
  await page.goto("http://localhost:3000/index.test.html");
  await page.waitForTimeout(2000);
  
  console.log("\nLoading ui-icon.test.html...");
  await page.goto("http://localhost:3000/ui-icon.test.html");
  await page.waitForTimeout(2000);
  
  console.log("\nLoading examples.html...");
  await page.goto("http://localhost:3000/examples.html");
  await page.waitForTimeout(2000);
  
  await browser.close();
}

runTests().catch(console.error);