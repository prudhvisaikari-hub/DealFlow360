import { NextRequest, NextResponse } from "next/server";
import { PDFDocument, rgb, StandardFonts } from "pdf-lib";
import { readDB } from "@/lib/db";

function withinPeriod(dateStr: string, period?: string | null): boolean {
  if (!period || period === "all") return true;
  const date = new Date(dateStr);
  const now = new Date();
  const days = period === "today" ? 1 : period === "week" ? 7 : period === "month" ? 30 : 3650;
  return (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24) <= days;
}

interface ReportRow {
  customer: string;
  rep: string;
  status: string;
  created: string;
  value: number;
  risk: number;
}

async function buildProfessionalPdf(rows: ReportRow[]): Promise<Uint8Array> {
  const pdfDoc = await PDFDocument.create();
  const fontBold = await pdfDoc.embedFont(StandardFonts.HelveticaBold);
  const fontRegular = await pdfDoc.embedFont(StandardFonts.Helvetica);

  const PAGE_WIDTH = 612;
  const PAGE_HEIGHT = 792;
  const MARGIN_LEFT = 40;
  const MARGIN_RIGHT = 40;
  const USABLE_WIDTH = PAGE_WIDTH - MARGIN_LEFT - MARGIN_RIGHT;

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
  let y = PAGE_HEIGHT - 45;

  const totalValue = rows.reduce((sum, r) => sum + r.value, 0);

  // Helper to draw header on first page
  function drawReportHeader() {
    // Title
    page.drawText("DealFlow360", {
      x: MARGIN_LEFT,
      y,
      size: 20,
      font: fontBold,
      color: rgb(0.09, 0.22, 0.44), // Brand navy
    });
    page.drawText("Sales & Quotations Report", {
      x: MARGIN_LEFT + 130,
      y: y + 2,
      size: 14,
      font: fontRegular,
      color: rgb(0.3, 0.35, 0.45),
    });
    y -= 18;

    // Subtitle & Date
    const genDate = new Date().toISOString().slice(0, 19).replace("T", " ") + " UTC";
    page.drawText(`Generated on: ${genDate}`, {
      x: MARGIN_LEFT,
      y,
      size: 9,
      font: fontRegular,
      color: rgb(0.45, 0.5, 0.55),
    });
    y -= 25;

    // Summary metrics bar
    page.drawRectangle({
      x: MARGIN_LEFT,
      y: y - 28,
      width: USABLE_WIDTH,
      height: 38,
      color: rgb(0.95, 0.97, 1.0),
      borderColor: rgb(0.82, 0.88, 0.96),
      borderWidth: 1,
    });

    page.drawText("Total Quotations:", { x: MARGIN_LEFT + 15, y: y - 10, size: 9, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });
    page.drawText(String(rows.length), { x: MARGIN_LEFT + 95, y: y - 10, size: 10, font: fontBold, color: rgb(0.1, 0.15, 0.2) });

    page.drawText("Total Order Value:", { x: MARGIN_LEFT + 160, y: y - 10, size: 9, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });
    page.drawText(`$${totalValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, {
      x: MARGIN_LEFT + 250,
      y: y - 10,
      size: 10,
      font: fontBold,
      color: rgb(0.1, 0.55, 0.35),
    });

    page.drawText("Avg Deal Size:", { x: MARGIN_LEFT + 370, y: y - 10, size: 9, font: fontRegular, color: rgb(0.4, 0.45, 0.5) });
    const avg = rows.length > 0 ? totalValue / rows.length : 0;
    page.drawText(`$${avg.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, {
      x: MARGIN_LEFT + 440,
      y: y - 10,
      size: 10,
      font: fontBold,
      color: rgb(0.1, 0.15, 0.2),
    });

    y -= 45;
  }

  // Column definitions
  const cols = [
    { label: "Customer", x: MARGIN_LEFT + 8, width: 135 },
    { label: "Sales Rep", x: MARGIN_LEFT + 145, width: 95 },
    { label: "Status", x: MARGIN_LEFT + 245, width: 95 },
    { label: "Date", x: MARGIN_LEFT + 345, width: 65 },
    { label: "Value", x: MARGIN_LEFT + 415, width: 70 },
    { label: "Risk", x: MARGIN_LEFT + 490, width: 35 },
  ];

  function drawTableHeader() {
    page.drawRectangle({
      x: MARGIN_LEFT,
      y: y - 15,
      width: USABLE_WIDTH,
      height: 22,
      color: rgb(0.92, 0.94, 0.97),
      borderColor: rgb(0.8, 0.85, 0.9),
      borderWidth: 1,
    });

    for (const c of cols) {
      page.drawText(c.label, {
        x: c.x,
        y: y - 9,
        size: 9,
        font: fontBold,
        color: rgb(0.2, 0.25, 0.35),
      });
    }
    y -= 22;
  }

  drawReportHeader();
  drawTableHeader();

  const ROW_HEIGHT = 20;

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];

    // Check pagination
    if (y < 60) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT]);
      y = PAGE_HEIGHT - 45;
      page.drawText("DealFlow360 — Sales Report (Continued)", {
        x: MARGIN_LEFT,
        y,
        size: 10,
        font: fontBold,
        color: rgb(0.3, 0.35, 0.45),
      });
      y -= 20;
      drawTableHeader();
    }

    // Row background (alternating)
    if (i % 2 === 1) {
      page.drawRectangle({
        x: MARGIN_LEFT,
        y: y - 13,
        width: USABLE_WIDTH,
        height: ROW_HEIGHT,
        color: rgb(0.97, 0.98, 0.99),
      });
    }

    // Bottom subtle divider
    page.drawLine({
      start: { x: MARGIN_LEFT, y: y - 13 },
      end: { x: MARGIN_LEFT + USABLE_WIDTH, y: y - 13 },
      thickness: 0.5,
      color: rgb(0.88, 0.9, 0.92),
    });

    // Row texts
    const sanitize = (text: string, maxLen = 22) => (text.length > maxLen ? text.slice(0, maxLen - 1) + "…" : text);
    page.drawText(sanitize(row.customer, 20), { x: cols[0].x, y: y - 7, size: 8.5, font: fontRegular, color: rgb(0.15, 0.15, 0.15) });
    page.drawText(sanitize(row.rep, 16), { x: cols[1].x, y: y - 7, size: 8.5, font: fontRegular, color: rgb(0.3, 0.3, 0.3) });
    page.drawText(sanitize(row.status.replace(/_/g, " "), 15), { x: cols[2].x, y: y - 7, size: 8, font: fontRegular, color: rgb(0.2, 0.3, 0.5) });
    page.drawText(row.created, { x: cols[3].x, y: y - 7, size: 8, font: fontRegular, color: rgb(0.4, 0.4, 0.4) });
    page.drawText(`$${row.value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, {
      x: cols[4].x,
      y: y - 7,
      size: 8.5,
      font: fontBold,
      color: rgb(0.1, 0.15, 0.2),
    });
    page.drawText(String(row.risk), {
      x: cols[5].x,
      y: y - 7,
      size: 8.5,
      font: fontRegular,
      color: row.risk > 0 ? rgb(0.85, 0.35, 0.05) : rgb(0.45, 0.5, 0.55),
    });

    y -= ROW_HEIGHT;
  }

  // Add page numbers on all pages
  const totalPages = pdfDoc.getPageCount();
  const pages = pdfDoc.getPages();
  for (let i = 0; i < totalPages; i++) {
    const p = pages[i];
    p.drawText(`Page ${i + 1} of ${totalPages} · DealFlow360 Confidential`, {
      x: MARGIN_LEFT,
      y: 25,
      size: 7.5,
      font: fontRegular,
      color: rgb(0.6, 0.65, 0.7),
    });
  }

  return await pdfDoc.save();
}

export async function GET(req: NextRequest) {
  const db = readDB();
  const sp = req.nextUrl.searchParams;
  const format = sp.get("format") ?? "csv";
  const repId = sp.get("repId");
  const status = sp.get("status");
  const category = sp.get("category");
  const period = sp.get("period");

  const filtered = db.quotations.filter((q) => {
    if (repId && q.repId !== repId) return false;
    if (status && q.status !== status) return false;
    if (category && !q.lines.some((l) => db.products.find((p) => p.id === l.productId)?.category === category)) return false;
    if (!withinPeriod(q.createdAt, period)) return false;
    return true;
  });

  const rows: ReportRow[] = filtered.map((q) => {
    const customer = db.customers.find((c) => c.id === q.customerId);
    const rep = db.users.find((u) => u.id === q.repId);
    const value = q.lines.reduce((s, l) => s + l.listPrice * l.quantity * (1 - l.discountPercent / 100), 0);
    return {
      customer: customer?.name ?? "",
      rep: rep?.name ?? "",
      status: q.status,
      created: q.createdAt.slice(0, 10),
      value: Math.round(value * 100) / 100,
      risk: q.blendedRiskScore,
    };
  });

  if (format === "pdf") {
    const pdfBytes = await buildProfessionalPdf(rows);
    return new NextResponse(Buffer.from(pdfBytes), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": 'attachment; filename="dealflow360-report.pdf"',
      },
    });
  }

  const header = "Customer,Rep,Status,Created,Value,RiskScore";
  const csv = [header, ...rows.map((r) => `${r.customer},${r.rep},${r.status},${r.created},${r.value},${r.risk}`)].join("\n");
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv",
      "Content-Disposition": 'attachment; filename="dealflow360-report.csv"',
    },
  });
}
