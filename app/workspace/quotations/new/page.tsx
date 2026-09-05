import { readDB } from "@/lib/db";
import { createQuotationAction } from "@/lib/actions";

export default function NewQuotationPage() {
  const db = readDB();
  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-xl font-bold text-gray-900 mb-4">New Quotation</h1>
      <form action={createQuotationAction} className="card p-6 space-y-4">
        <div>
          <label className="label">Customer</label>
          <select name="customerId" className="input" required>
            {db.customers.map((c) => (
              <option key={c.id} value={c.id}>{c.name} — {c.tier}</option>
            ))}
          </select>
        </div>
        <button type="submit" className="btn btn-primary w-full">Create Quotation</button>
      </form>
    </div>
  );
}
