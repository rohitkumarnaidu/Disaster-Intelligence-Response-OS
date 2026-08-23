const { chromium } = require('playwright');
const fs = require('fs');

async function run() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  try {
    const page = await context.newPage();
    
    console.log("Navigating to app...");
    await page.goto('http://localhost:5173');
    
    console.log("Logging in as Admin...");
    await page.fill('input[type="email"]', 'admin@draxelyra.local');
    await page.fill('input[type="password"]', 'demo123');
    await page.click('button[type="submit"]');

    console.log("Waiting for Command Center to load...");
    await page.waitForSelector('text=Command Center', { timeout: 10000 });
    
    if (!fs.existsSync('screenshots')) { fs.mkdirSync('screenshots'); }
    await page.screenshot({ path: 'screenshots/1_command_center.png' });

    console.log("Navigating to DEMO INCIDENT...");
    await page.goto('http://localhost:5173/demo');
    await page.waitForSelector('text=Demo replay', { timeout: 10000 });
    
    console.log("Triggering Demo Load...");
    await page.click('text=Reset');
    await page.waitForTimeout(1000);
    await page.click('text=Play replay');
    await page.waitForTimeout(2000);
    await page.screenshot({ path: 'screenshots/2_demo_loaded.png' });

    console.log("Testing API RBAC...");
    const viewerContext = await browser.newContext();
    const viewerPage = await viewerContext.newPage();
    
    console.log("Logging in as Field Responder...");
    await viewerPage.goto('http://localhost:5173');
    await viewerPage.fill('input[type="email"]', 'field@draxelyra.local');
    await viewerPage.fill('input[type="password"]', 'demo123');
    await viewerPage.click('button[type="submit"]');
    await viewerPage.waitForSelector('text=Command Center', { timeout: 10000 });
    
    console.log("Field Responder attempting unauthorized action...");
    const response = await viewerPage.evaluate(async () => {
      const res = await fetch('/api/demo/load', { method: 'POST' });
      return res.status;
    });
    
    console.log("Field Responder /api/demo/load status:", response);
    if (response === 403) {
      console.log("RBAC TEST PASSED: Field Responder got 403 Forbidden");
    } else {
      console.error("RBAC TEST FAILED: Expected 403, got", response);
      process.exit(1);
    }
    
    await viewerContext.close();

  } catch (err) {
    console.error("Test failed:", err);
    process.exit(1);
  } finally {
    await browser.close();
  }
}

run().then(() => console.log("Tests completed"));
