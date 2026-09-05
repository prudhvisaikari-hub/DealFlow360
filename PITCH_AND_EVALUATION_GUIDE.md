# DealFlow360 — Hackathon Pitch & Evaluation Guide

> **"From a static quote form to an autonomous, self-governing sales operations engine."**

---

## 1. Executive Summary

Most CPQ and sales tools operate as simple digital forms: a rep types in a quote, confirms it, and generates a PDF invoice. In real B2B enterprises, deals are far messier:
- Reps quietly discount across scattered lines, eroding company margins without triggering single-line alarms.
- Stock is fragmented across regional warehouses, leading to expensive split freight costs.
- Orders bundle one-time hardware with recurring SaaS subscriptions, leading to messy manual billing spreadsheets.
- Buyers negotiate over endless unstructured email threads.
- Sales leadership only finds out a critical enterprise deal is stalled after it has already gone cold.

**DealFlow360** solves this by turning the quotation into a living, intelligent operational contract that enforces governance, recalculates inventory in real time, and unifies buyer and seller in a single collaborative portal.

---

## 2. Why DealFlow360 Stands Out to Evaluators

### 1. Pure, Testable Business Logic
- The business logic is **100% decoupled** from the UI and Next.js in `lib/logic/*`.
- **46 Vitest automated unit and integration tests** prove the mathematics behind blended risk scoring, greedy warehouse allocation, and dynamic proration.
- Nothing is hardcoded or scripted for a demo; every calculation runs live against the relational data store.

### 2. Autonomous Governance & The Blended Risk Score
- Standard tools check each product line in isolation. DealFlow360 computes a **Blended Risk Score**:
  $$\text{Blended Score} = \sum \left( \frac{\text{Line Net Value}}{\text{Order Total}} \times \text{Over Points} \right) + \text{Multi-Line Spread Factor}$$
- A severe violation on one low-value line is caught, but equally, a rep giving away 2–3% on multiple lines across the cart cannot slip under the radar.
- If a customer counters a discount in the portal, the engine **automatically re-enters the approval loop** instead of blindly accepting changes.

### 3. Intelligent Multi-Warehouse Fulfillment
- Hardware lines are fulfilled using a **greedy cost-minimizing algorithm**:
  1. Identifies single warehouses with full stock availability to prevent split shipments.
  2. Falls back to multi-warehouse splitting weighted by shipping freight cost factors.
  3. Automatically provisions backorders when stock is deficient, with 1-click consolidation once replenishment arrives.

### 4. Hybrid Billing & Proration Math
- Unifies one-time hardware line invoices and recurring subscription cycles on a single quote.
- Mid-cycle subscription changes dynamically calculate daily rate proration based on the calendar cycle.
- Cancellation respects the plan's strict governance policy (full, prorated, or non-refundable).

### 5. Enterprise Design & Experience
- Built with Google Inter typography, glassmorphic headers, real-time KPI cockpits, pulsing status badges, and 1-click demo persona quick-switching.
- Production-grade binary PDF generation via `pdf-lib`.
- Full route security enforced via Next.js Edge Middleware and salted `bcrypt` password hashing.

---

## 3. Evaluator Quick-Start

1. **Access the Application:** Open [http://localhost:3001](http://localhost:3001) (or [http://localhost:3001/login](http://localhost:3001/login)).
2. **Instant Demo Accounts (Password: `demo123`):**
   - **Sales Rep:** `aditya@dealflow360.com` (Builds quotes, upsells, requests approvals)
   - **Sales Manager:** `karan@dealflow360.com` (1st-tier approvals, deal health monitoring)
   - **Finance:** `ritu@dealflow360.com` (2nd-tier approvals, fulfillment review, billing)
   - **Customer:** `buyer@acme.com` (Negotiates quotes, counters discounts, confirms orders)
   - **Administrator:** `priya@dealflow360.com` (Configures products, discount tiers, warehouses)
3. **Run Test Suite:**
   ```bash
   npm test
   ```
4. **Run Production Build:**
   ```bash
   npm run build
   ```

---

## 4. Documentation Index

- **Walkthrough & Visual Screenshots:** See [`walkthrough.md`](file:///C:/Users/prudh/.gemini/antigravity-ide/brain/a1640ffd-31a7-473b-ada6-e85126fcba8f/walkthrough.md)
- **Architecture Diagram & Live Demo Script:** See [`ARCHITECTURE_AND_DEMO_GUIDE.md`](./ARCHITECTURE_AND_DEMO_GUIDE.md)
- **Technical Architecture & Verified Specs:** See [`README.md`](./README.md)
