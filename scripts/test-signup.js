const { chromium } = require('playwright');

async function testSignup() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext();
  const page = await ctx.newPage();

  console.log('Navigating to signup...');
  await page.goto('http://localhost:3001/signup');
  console.log('Current URL:', page.url());

  const testEmail = `test-${Date.now()}@dealflow360.com`;
  console.log('Registering user:', testEmail);
  await page.fill('input[name="name"]', 'Maya Chen');
  await page.fill('input[name="email"]', testEmail);
  await page.fill('input[name="password"]', 'demo123');

  await Promise.all([
    page.waitForURL('**/workspace**'),
    page.click('button[type="submit"]')
  ]);

  console.log('Navigated to:', page.url());
  const cookies = await ctx.cookies();
  const authCookie = cookies.find(c => c.name === 'dealflow360_uid');
  console.log('Session Cookie:', decodeURIComponent(authCookie?.value || ''));

  await browser.close();
  console.log('SIGNUP TEST PASSED!');
}

testSignup().catch(console.error);
