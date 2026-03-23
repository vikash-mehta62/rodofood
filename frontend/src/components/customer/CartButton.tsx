'use client';
import Link from 'next/link';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/lib/utils';

export default function CartButton() {
  const { items, getSubtotal, getItemCount, restaurantName } = useCartStore();
  const count = getItemCount();

  if (count === 0) return null;

  return (
    <Link href="/cart">
      <div className="fixed bottom-20 left-4 right-4 z-50 bg-primary text-primary-foreground rounded-xl p-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-2">
          <div className="bg-white/20 rounded-lg px-2 py-1 text-sm font-bold">{count}</div>
          <span className="text-sm font-medium truncate max-w-[140px]">{restaurantName}</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-bold">{formatCurrency(getSubtotal())}</span>
          <ShoppingCart className="w-5 h-5" />
        </div>
      </div>
    </Link>
  );
}
