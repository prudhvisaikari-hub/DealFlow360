const { chromium } = require('playwright');

async function main() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  console.log('Navigating to login...');
  await page.goto('http://localhost:3001/login');

  console.log('Submitting login form for aditya...');
  await page.fill('input[name="email"]', 'aditya@dealflow360.com');
  await page.fill('input[name="password"]', 'demo123');
  
  await Promise.all([
    page.waitForURL('**/workspace**', { timeout: 10000 }).catch(e => console.log('Navigation wait error:', e.message)),
    page.click('button[type="submit"]')
  ]);

  console.log('Current URL:', page.url());
  const cookies = await ctx.cookies();
  console.log('Cookies:', cookies.map(c => ({ name: c.name, value: c.value })));

  await browser.close();
}

main().catch(console.error);
