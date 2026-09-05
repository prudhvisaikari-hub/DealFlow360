const { chromium } = require('playwright');
const path = require('path');

const ARTIFACT_DIR = 'C:/Users/prudh/.gemini/antigravity-ide/brain/a1640ffd-31a7-473b-ada6-e85126fcba8f';

async function captureAll() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();

  console.log('Clearing cookies & capturing login...');
  await ctx.clearCookies();
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ui_login_preview.png') });

  console.log('Logging in...');
  await page.fill('input[name="email"]', 'aditya@dealflow360.com');
  await page.fill('input[name="password"]', 'demo123');
  await Promise.all([
    page.waitForURL('**/workspace**'),
    page.click('button[type="submit"]')
  ]);
  await page.waitForLoadState('networkidle');

  console.log('Capturing quotations workspace...');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ui_workspace_preview.png') });

  console.log('Capturing pipeline kanban...');
  await page.goto('http://localhost:3001/workspace/quotations?view=pipeline', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ui_pipeline_preview.png') });

  console.log('Capturing deal health dashboard...');
  await page.goto('http://localhost:3001/workspace/dashboard', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ui_dashboard_preview.png') });

  console.log('Capturing quotation detail builder...');
  await page.goto('http://localhost:3001/workspace/quotations/quote-acme-001', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ui_quote_detail_preview.png') });

  console.log('Capturing admin backend overview...');
  await page.goto('http://localhost:3001/backend', { waitUntil: 'networkidle' });
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ui_backend_preview.png') });

  // Customer Portal
  console.log('Capturing customer portal...');
  await ctx.clearCookies();
  await page.goto('http://localhost:3001/login', { waitUntil: 'networkidle' });
  await page.fill('input[name="email"]', 'buyer@acme.com');
  await page.fill('input[name="password"]', 'demo123');
  await Promise.all([
    page.waitForURL('**/portal**'),
    page.click('button[type="submit"]')
  ]);
  await page.waitForLoadState('networkidle');
  await page.screenshot({ path: path.join(ARTIFACT_DIR, 'ui_portal_preview.png') });

  await browser.close();
  console.log('ALL PREVIEW SCREENSHOTS CAPTURED SUCCESSFULLY!');
}

captureAll().catch(console.error);
