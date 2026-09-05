const { chromium } = require('playwright');

async function debug() {
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();

  // Login as Aditya
  await page.goto('http://localhost:3001/login');
  await page.fill('input[name="email"]', 'aditya@dealflow360.com');
  await page.fill('input[name="password"]', 'demo123');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');

  // Create new draft quote
  await page.goto('http://localhost:3001/workspace/quotations/new');
  await page.selectOption('select[name="customerId"]', { label: 'Acme Corp — Gold' });
  await page.click('button:has-text("Create Quotation")');
  await page.waitForLoadState('networkidle');

  console.log('Current URL after create quote:', page.url());

  // Check select options
  const options = await page.$$eval('select[name="productId"] option', opts => opts.map(o => ({ value: o.value, text: o.text })));
  console.log('Product options:', options);

  // Add Laptop
  await page.selectOption('select[name="productId"]', 'prod-laptop');
  await page.fill('input[name="quantity"]', '2');
  await page.fill('input[name="discountPercent"]', '5');
  console.log('Submitting Add Line form for laptop...');
  await page.click('button:has-text("+ Add Line")');
  await page.waitForLoadState('networkidle');

  console.log('Page body after laptop add:');
  const bodyText = await page.innerText('body');
  console.log(bodyText);

  await browser.close();
}

debug();
