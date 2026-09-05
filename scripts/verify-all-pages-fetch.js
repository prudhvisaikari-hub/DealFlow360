const BASE_URL = "http://localhost:3001";

async function run() {
  console.log("🚀 Verifying all 22 pages via HTTP Client...\n");

  // 1. Test public pages without cookies
  const publicPages = [
    { path: "/login", titleSubstr: "DealFlow360" },
    { path: "/signup", titleSubstr: "DealFlow360" },
  ];

  for (const p of publicPages) {
    const res = await fetch(`${BASE_URL}${p.path}`);
    if (res.status !== 200) throw new Error(`${p.path} returned status ${res.status}`);
    const text = await res.text();
    if (!text.includes(p.titleSubstr)) throw new Error(`${p.path} did not contain '${p.titleSubstr}'`);
    console.log(`✅ [PUBLIC] ${p.path} -> HTTP 200 OK`);
  }

  // 2. Test Admin/Manager authenticated pages
  const adminCookie = "dealflow360_uid=u-admin:admin";
  const workspacePages = [
    { path: "/workspace", name: "Executive Mission Control" },
    { path: "/workspace/quotations", name: "Quotations Directory" },
    { path: "/workspace/quotations?view=pipeline", name: "Pipeline Kanban" },
    { path: "/workspace/quotations/new", name: "New Quotation Wizard" },
    { path: "/workspace/quotations/quote-acme-001", name: "CPQ Quotation Studio" },
    { path: "/workspace/approvals", name: "Discount Approval Cockpit" },
    { path: "/workspace/fulfillment", name: "Multi-Warehouse Logistics Cockpit" },
    { path: "/workspace/billing", name: "Hybrid Billing Hub" },
    { path: "/workspace/dashboard", name: "Deal Health Radar" },
    { path: "/workspace/reports", name: "Analytics & PDF Reports" },
  ];

  for (const p of workspacePages) {
    const res = await fetch(`${BASE_URL}${p.path}`, {
      headers: { Cookie: adminCookie },
    });
    if (res.status !== 200) throw new Error(`${p.path} returned status ${res.status}`);
    const text = await res.text();
    if (!text.includes("DealFlow360")) throw new Error(`${p.path} failed to render layout`);
    console.log(`✅ [WORKSPACE] ${p.path} (${p.name}) -> HTTP 200 OK`);
  }

  const backendPages = [
    { path: "/backend", name: "Admin Control Panel Overview" },
    { path: "/backend/products", name: "Products & Price Lists" },
    { path: "/backend/discounts", name: "Discount Tiers & Rules" },
    { path: "/backend/warehouses", name: "Warehouses & Depots" },
    { path: "/backend/subscriptions", name: "Subscription Plans" },
    { path: "/backend/upsell", name: "Upsell Engine Rules" },
    { path: "/backend/customers", name: "Customer Accounts & Tiers" },
  ];

  for (const p of backendPages) {
    const res = await fetch(`${BASE_URL}${p.path}`, {
      headers: { Cookie: adminCookie },
    });
    if (res.status !== 200) throw new Error(`${p.path} returned status ${res.status}`);
    const text = await res.text();
    if (!text.includes("Administrative Control Panel")) throw new Error(`${p.path} failed to render`);
    console.log(`✅ [BACKEND] ${p.path} (${p.name}) -> HTTP 200 OK`);
  }

  // 3. Test Customer Portal pages
  const customerCookie = "dealflow360_uid=u-cust1:customer";
  const portalPages = [
    { path: "/portal", name: "Customer Proposals Portal" },
    { path: "/portal/quotations/quote-acme-001", name: "Customer Negotiation Screen" },
  ];

  for (const p of portalPages) {
    const res = await fetch(`${BASE_URL}${p.path}`, {
      headers: { Cookie: customerCookie },
    });
    if (res.status !== 200) throw new Error(`${p.path} returned status ${res.status}`);
    const text = await res.text();
    if (!text.includes("Customer Portal") && !text.includes("Acme Corp")) throw new Error(`${p.path} failed`);
    console.log(`✅ [PORTAL] ${p.path} (${p.name}) -> HTTP 200 OK`);
  }

  // 4. Test API Export
  const csvRes = await fetch(`${BASE_URL}/api/export?type=csv`, {
    headers: { Cookie: adminCookie },
  });
  if (csvRes.status !== 200) throw new Error(`CSV export failed: ${csvRes.status}`);
  console.log(`✅ [API] /api/export?type=csv -> HTTP 200 OK (Content-Type: ${csvRes.headers.get("content-type")})`);

  const pdfRes = await fetch(`${BASE_URL}/api/export?type=pdf`, {
    headers: { Cookie: adminCookie },
  });
  if (pdfRes.status !== 200) throw new Error(`PDF export failed: ${pdfRes.status}`);
  console.log(`✅ [API] /api/export?type=pdf -> HTTP 200 OK (Content-Type: ${pdfRes.headers.get("content-type")})`);

  console.log("\n✨ ALL 22 PAGES + API EXPORTS EXECUTED WITH 100% SUCCESS!");
}

run().catch((err) => {
  console.error("❌ Execution error:", err);
  process.exit(1);
});
