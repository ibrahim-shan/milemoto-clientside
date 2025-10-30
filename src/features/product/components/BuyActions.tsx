// src/features/product/components/BuyActions.tsx
'use client';

import { useState } from 'react';

import { Button } from '@/ui/Button';
import { Quantity } from '@/ui/Quantity';

type Props = {
  stock: number;
  slug: string; // minimal serializable info
};

export function BuyActions({ stock, slug }: Props) {
  const [qty, setQty] = useState(1);

  const addToCart = () => {
    // TODO: integrate your cart store here
    console.log('add to cart', { slug, qty });
  };

  const buyNow = () => {
    // TODO: direct checkout or cart + navigate
    console.log('buy now', { slug, qty });
  };

  return (
    <div className="mt-6">
      <label className="text-foreground/80 mb-2 block text-xs font-semibold">Quantity</label>
      <div className="flex items-center gap-4">
        <Quantity
          value={qty}
          onChange={setQty}
          min={1}
          max={stock}
        />
        <div className="text-xs">
          <p className="font-semibold">Only {stock} items left!</p>
          <p className="text-foreground/70">Don’t miss it</p>
        </div>
      </div>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button
          variant="solid"
          size="lg"
          fullWidth
          className="sm:w-auto"
          onClick={buyNow}
        >
          Buy Now
        </Button>
        <Button
          variant="outline"
          size="lg"
          fullWidth
          className="border-primary text-primary hover:bg-primary/10 sm:w-auto"
          onClick={addToCart}
        >
          Add to Cart
        </Button>
      </div>
    </div>
  );
}
