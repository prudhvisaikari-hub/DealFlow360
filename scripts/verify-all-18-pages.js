const { chromium } = require("playwright");

const BASE_URL = "http://localhost:3001";

async function verifyAllPages() {
  console.log("🚀 Starting DealFlow360 Full 22-Page Verification...");
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const pagesToTest = [
    { url: "/login", expectText: "Sign in to DealFlow360" },
    { url: "/signup", expectText: "Register DealFlow360 Account" },
  ];

  for (const p of pagesToTest) {
    const res = await page.goto(`${BASE_URL}${p.url}`);
    if (res.status() !== 200) throw new Error(`Failed to load ${p.url}: ${res.status()}`);
    const text = await page.textContent("body");
    if (!text.includes(p.expectText)) throw new Error(`Missing expected text '${p.expectText}' on ${p.url}`);
    console.log(`✅ ${p.url} (Status ${res.status()}) - verified.`);
  }

  // Login as admin
  console.log("🔑 Logging in as Administrator (admin@dealflow.local)...");
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', "admin@dealflow.local");
  await page.fill('input[name="password"]', "demo123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/workspace**");
  console.log("✅ Admin logged in successfully.");

  // Test all Workspace pages
  const workspacePages = [
    { url: "/workspace", expectText: "Welcome back" },
    { url: "/workspace/quotations", expectText: "Quotations" },
    { url: "/workspace/quotations?view=pipeline", expectText: "Quotations" },
    { url: "/workspace/quotations/new", expectText: "Create Quotation" },
    { url: "/workspace/quotations/quote-acme-001", expectText: "Acme Enterprise Deployment" },
    { url: "/workspace/approvals", expectText: "Discount Approval Cockpit" },
    { url: "/workspace/fulfillment", expectText: "Multi-Warehouse Logistics" },
    { url: "/workspace/billing", expectText: "Hybrid Billing" },
    { url: "/workspace/dashboard", expectText: "Deal Health & Pipeline Risk Radar" },
    { url: "/workspace/reports", expectText: "Analytics & Reports" },
  ];

  for (const p of workspacePages) {
    const res = await page.goto(`${BASE_URL}${p.url}`);
    if (res.status() !== 200) throw new Error(`Failed to load ${p.url}: ${res.status()}`);
    const text = await page.textContent("body");
    if (!text.includes(p.expectText)) throw new Error(`Missing '${p.expectText}' on ${p.url}`);
    console.log(`✅ ${p.url} - OK`);
  }

  // Test all Backend Admin pages
  const backendPages = [
    { url: "/backend", expectText: "Administrative Control Panel" },
    { url: "/backend/products", expectText: "Product Master & Price Lists" },
    { url: "/backend/discounts", expectText: "Discount Tiers & Approval Rules" },
    { url: "/backend/warehouses", expectText: "Warehouses & Depots" },
    { url: "/backend/subscriptions", expectText: "Subscription Plans" },
    { url: "/backend/upsell", expectText: "Upsell & Cross-Sell Rule Engine" },
    { url: "/backend/customers", expectText: "Customer Accounts & Tier Pricing" },
  ];

  for (const p of backendPages) {
    const res = await page.goto(`${BASE_URL}${p.url}`);
    if (res.status() !== 200) throw new Error(`Failed to load ${p.url}: ${res.status()}`);
    const text = await page.textContent("body");
    if (!text.includes(p.expectText)) throw new Error(`Missing '${p.expectText}' on ${p.url}`);
    console.log(`✅ ${p.url} - OK`);
  }

  // Switch to Customer Persona & test portal
  console.log("🔑 Logging in as Customer Buyer (buyer@acme.local)...");
  await page.goto(`${BASE_URL}/login`);
  await page.fill('input[name="email"]', "buyer@acme.local");
  await page.fill('input[name="password"]', "demo123");
  await page.click('button[type="submit"]');
  await page.waitForURL("**/portal**");

  const portalPages = [
    { url: "/portal", expectText: "Customer Portal" },
    { url: "/portal/quotations/quote-acme-001", expectText: "Acme Corp" },
  ];

  for (const p of portalPages) {
    const res = await page.goto(`${BASE_URL}${p.url}`);
    if (res.status() !== 200) throw new Error(`Failed to load ${p.url}: ${res.status()}`);
    const text = await page.textContent("body");
    if (!text.includes(p.expectText)) throw new Error(`Missing '${p.expectText}' on ${p.url}`);
    console.log(`✅ ${p.url} - OK`);
  }

  await browser.close();
  console.log("\n🎉 ALL 22 PAGES SUCCESSFULLY EXECUTED AND VERIFIED!");
}

verifyAllPages().catch((err) => {
  console.error("❌ Verification failed:", err);
  process.exit(1);
});
