const { chromium } = require('playwright');

const BASE_URL = 'http://localhost:3001';

async function testAuthHardening() {
  console.log('=== Starting Auth Hardening & Route Guard Verification ===\n');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];
  function record(name, pass, msg) {
    results.push({ name, pass, msg });
    console.log(`[${pass ? 'PASS' : 'FAIL'}] ${name}: ${msg}`);
  }

  // 1. Unauthenticated route access
  console.log('--- 1. Testing Unauthenticated Route Guards ---');
  await page.goto(`${BASE_URL}/workspace`);
  await page.waitForLoadState('networkidle');
  record('Unauthenticated /workspace Guard', page.url().includes('/login'), `Redirected to ${page.url()}`);

  await page.goto(`${BASE_URL}/backend`);
  await page.waitForLoadState('networkidle');
  record('Unauthenticated /backend Guard', page.url().includes('/login'), `Redirected to ${page.url()}`);

  await page.goto(`${BASE_URL}/portal`);
  await page.waitForLoadState('networkidle');
  record('Unauthenticated /portal Guard', page.url().includes('/login'), `Redirected to ${page.url()}`);

  // 2. Invalid password rejection
  console.log('\n--- 2. Testing Invalid Password Rejection ---');
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', 'aditya@dealflow360.com');
  await page.fill('input[name="password"]', 'wrongpass456');
  await Promise.all([
    page.waitForURL('**/login?error=1'),
    page.click('button[type="submit"]')
  ]);
  record('Invalid Password Rejection', page.url().includes('error=1'), `Failed login redirected to ${page.url()}`);

  // 3. Valid login with bcrypt verification
  console.log('\n--- 3. Testing Bcrypt Authenticated Login ---');
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', 'aditya@dealflow360.com');
  await page.fill('input[name="password"]', 'demo123');
  await Promise.all([
    page.waitForURL('**/workspace**'),
    page.click('button[type="submit"]')
  ]);
  record('Bcrypt Login Success', page.url().includes('/workspace'), `Authenticated and redirected to ${page.url()}`);

  // Check cookie format has role
  const cookies = await context.cookies();
  const authCookie = cookies.find(c => c.name === 'dealflow360_uid');
  const decodedVal = authCookie ? decodeURIComponent(authCookie.value) : '';
  const hasRoleInCookie = decodedVal.includes(':sales_rep');
  record('Session Cookie Role Encoding', hasRoleInCookie, `Cookie value: ${decodedVal}`);

  // 4. Sales Rep route guards
  console.log('\n--- 4. Testing Sales Rep Route Restrictions ---');
  // Attempt /backend (should redirect back to /workspace)
  await page.goto(`${BASE_URL}/backend`);
  await page.waitForLoadState('networkidle');
  record('Rep Blocked from /backend', page.url().includes('/workspace'), `Rep redirected to ${page.url()}`);

  // Attempt /portal (should redirect back to /workspace)
  await page.goto(`${BASE_URL}/portal`);
  await page.waitForLoadState('networkidle');
  record('Rep Blocked from /portal', page.url().includes('/workspace'), `Rep redirected to ${page.url()}`);

  // 5. Customer route guards
  console.log('\n--- 5. Testing Customer Route Restrictions ---');
  // Clear rep session
  await context.clearCookies();
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', 'buyer@acme.com');
  await page.fill('input[name="password"]', 'demo123');
  await Promise.all([
    page.waitForURL('**/portal**'),
    page.click('button[type="submit"]')
  ]);
  record('Customer Login Redirect to /portal', page.url().includes('/portal'), `Customer redirected to ${page.url()}`);

  // Attempt /workspace (should redirect back to /portal)
  await page.goto(`${BASE_URL}/workspace`);
  await page.waitForLoadState('networkidle');
  record('Customer Blocked from /workspace', page.url().includes('/portal'), `Customer redirected to ${page.url()}`);

  // Attempt /backend (should redirect back to /portal)
  await page.goto(`${BASE_URL}/backend`);
  await page.waitForLoadState('networkidle');
  record('Customer Blocked from /backend', page.url().includes('/portal'), `Customer redirected to ${page.url()}`);

  // 6. Logout
  console.log('\n--- 6. Testing Logout ---');
  await page.goto(`${BASE_URL}/portal`);
  const logoutForm = await page.$('form[action*="logoutAction"], form:has(button:has-text("Sign Out")), form:has(button:has-text("Close Workspace"))');
  if (logoutForm) {
    const logoutBtn = await logoutForm.$('button');
    await Promise.all([
      page.waitForURL('**/login'),
      logoutBtn.click()
    ]);
    record('Logout Action', page.url().includes('/login'), `Logged out and redirected to ${page.url()}`);
  } else {
    // Navigate to /workspace with rep to test workspace logout button
    await context.clearCookies();
    await page.goto(`${BASE_URL}/login`);
    await page.fill('input[name="email"]', 'aditya@dealflow360.com');
    await page.fill('input[name="password"]', 'demo123');
    await Promise.all([
      page.waitForURL('**/workspace'),
      page.click('button[type="submit"]')
    ]);
    const wsLogout = await page.$('form button:has-text("Sign out"), form button:has-text("Sign Out")');
    if (wsLogout) {
      await Promise.all([
        page.waitForURL('**/login'),
        wsLogout.click()
      ]);
      record('Logout Action', page.url().includes('/login'), `Logged out and redirected to ${page.url()}`);
    }
  }

  await browser.close();

  console.log('\n================ SUMMARY ================');
  const passed = results.filter(r => r.pass).length;
  console.log(`TOTAL: ${passed}/${results.length} PASSED.`);
  process.exit(passed === results.length ? 0 : 1);
}

testAuthHardening();
