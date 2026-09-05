"use client";

import { useState } from "react";
import { Product } from "@/lib/types";

interface AddLineFormProps {
  products: Product[];
  action: (formData: FormData) => Promise<void>;
}

export function AddLineForm({ products, action }: AddLineFormProps) {
  const [selectedProductId, setSelectedProductId] = useState<string>(products[0]?.id ?? "");

  const currentProduct = products.find((p) => p.id === selectedProductId);
  const variants = currentProduct?.variants ?? [];

  return (
    <form action={action} className="grid grid-cols-4 gap-2 items-end border-t pt-4">
      <div className={variants.length > 0 ? "col-span-1" : "col-span-2"}>
        <label className="label">Product</label>
        <select
          name="productId"
          className="input"
          value={selectedProductId}
          onChange={(e) => setSelectedProductId(e.target.value)}
          required
        >
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} ({p.category})
            </option>
          ))}
        </select>
      </div>

      {variants.length > 0 && (
        <div className="col-span-1">
          <label className="label">Variant</label>
          <select name="variantId" className="input text-xs py-2">
            <option value="">Standard / Base</option>
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.attribute}: {v.value} (+${v.extraPrice})
              </option>
            ))}
          </select>
        </div>
      )}

      <div>
        <label className="label">Qty</label>
        <input name="quantity" type="number" min={1} defaultValue={1} className="input" />
      </div>

      <div>
        <label className="label">Discount %</label>
        <input name="discountPercent" type="number" step="0.5" min={0} defaultValue={0} className="input" />
      </div>

      <div className="col-span-4">
        <button type="submit" className="btn btn-secondary w-full">
          + Add Line
        </button>
      </div>
    </form>
  );
}
