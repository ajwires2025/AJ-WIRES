import { chromium } from "playwright";
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });

await page.goto("https://ajwires.com/accounts/login", { waitUntil: "networkidle" });
await page.fill('input[type="email"]', "abhisheksinghhthakur@gmail.com");
await page.fill('input[type="password"]', "ajwire@top1");
await page.click('button[type="submit"]');
await page.waitForURL("**/accounts/dashboard", { timeout: 15000 });

await page.goto("https://ajwires.com/accounts/stock-ledger", { waitUntil: "domcontentloaded" });
await page.waitForTimeout(8000);
await page.getByText("STOCKTEST Wire").click();
await page.waitForTimeout(1000);
await page.screenshot({ path: "check-stock-ledger.png", fullPage: true });

await browser.close();
console.log("done");
