// src/lib/fetcher.ts
import { z } from 'zod';
const Product = z.object({ id: z.string(), title: z.string(), priceMinor: z.number() });
export async function fetchProduct(id: string) {
  const res = await fetch(`${process.env.NEXT_PUBLIC_API_BASE}/products/${id}`);
  if (!res.ok) throw new Error('Bad response');
  const data = await res.json();
  return Product.parse(data);
}
