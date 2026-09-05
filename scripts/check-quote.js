const { chromium } = require('playwright');
(async () => {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();
  await page.goto('http://localhost:3001/login');
  await page.fill('input[name="email"]', 'aditya@dealflow360.com');
  await page.fill('input[name="password"]', 'demo123');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');
  await page.goto('http://localhost:3001/workspace/quotations/034eec19-6b27-4e84-914e-daf81cf6245a');
  await page.waitForLoadState('networkidle');
  const body = await page.innerText('body');
  console.log('HAS LAPTOP:', body.includes('ProBook Laptop 14"'));
  console.log('HAS UPSELL:', body.includes('Upsell & Cross-sell'));
  console.log('HAS 27" MONITOR:', body.includes('27" 4K Monitor'));
  console.log('ORDER TOTAL:', body.match(/Order Total[\s\S]*?\$([0-9,.]+)/)?.[1]);
  await browser.close();
})();
