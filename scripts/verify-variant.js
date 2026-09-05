const { chromium } = require('playwright');

async function testVariant() {
  console.log('--- Testing Product Variant Selector ---');
  const browser = await chromium.launch({ channel: 'msedge', headless: true });
  const page = await browser.newPage();

  await page.goto('http://localhost:3001/login');
  await page.fill('input[name="email"]', 'aditya@dealflow360.com');
  await page.fill('input[name="password"]', 'demo123');
  await page.click('button[type="submit"]');
  await page.waitForLoadState('networkidle');

  await page.goto('http://localhost:3001/workspace/quotations/new');
  await page.selectOption('select[name="customerId"]', { label: 'Acme Corp — Gold' });
  await page.click('button:has-text("Create Quotation")');
  await page.waitForLoadState('networkidle');

  // Select Laptop
  await page.selectOption('select[name="productId"]', 'prod-laptop');
  await page.waitForTimeout(300);

  // Check if variant select is visible
  const variantSelect = await page.$('select[name="variantId"]');
  console.log('Variant select visible:', !!variantSelect);

  if (variantSelect) {
    const options = await variantSelect.$$eval('option', opts => opts.map(o => o.text));
    console.log('Variant options:', options);

    // Select the upgrade
    await variantSelect.selectOption({ index: 1 });
    await page.fill('input[name="quantity"]', '1');
    await page.click('button:has-text("+ Add Line")');
    await page.waitForTimeout(1000);
    await page.reload();
    await page.waitForLoadState('networkidle');

    const body = await page.innerText('body');
    const hasVariantText = body.includes('RAM: 32GB Upgrade');
    console.log('Line item shows variant label (RAM: 32GB Upgrade):', hasVariantText);
    const hasUpgradedPrice = body.includes('1314.00'); // 1164 + 150 = 1314
    console.log('Line item list price includes $150 upgrade ($1314.00):', hasUpgradedPrice);

    const passed = hasVariantText && hasUpgradedPrice;
    console.log('Variant verification result:', passed ? 'PASS' : 'FAIL');
    await browser.close();
    process.exit(passed ? 0 : 1);
  } else {
    console.log('FAIL: Variant select was not found');
    await browser.close();
    process.exit(1);
  }
}

testVariant();
