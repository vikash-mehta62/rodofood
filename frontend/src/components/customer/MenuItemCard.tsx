'use client';
import { Plus, Minus, Flame } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/lib/utils';
import type { MenuItem } from '@/types';
import { resolveImage } from '@/lib/config';

export default function MenuItemCard({ item, restaurantId, restaurantName }: {
  item: MenuItem; restaurantId: string; restaurantName: string;
}) {
  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find(i => i.menuItem._id === item._id);
  const qty = cartItem?.quantity || 0;
  const imgSrc = resolveImage(item.image);
  const disc = item.discountedPrice ? Math.round((1 - item.discountedPrice / item.price) * 100) : 0;

  return (
    <div className="flex gap-4 py-4 border-b border-slate-100 last:border-0">
      {/* Left: info */}
      <div className="flex-1 min-w-0">
        {/* Veg/Non-veg dot */}
        <div className="flex items-center gap-2 mb-1.5">
          <span className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center flex-shrink-0 ${
            item.foodType === 'veg' ? 'border-green-600' : item.foodType === 'egg' ? 'border-yellow-500' : 'border-red-600'
          }`}>
            <span className={`w-2 h-2 rounded-full ${
              item.foodType === 'veg' ? 'bg-green-600' : item.foodType === 'egg' ? 'bg-yellow-500' : 'bg-red-600'
            }`} />
          </span>
          {item.isPopular && (
            <span className="flex items-center gap-0.5 text-[10px] font-black text-orange-500 uppercase tracking-wider">
              <Flame className="w-3 h-3" /> Bestseller
            </span>
          )}
          {item.tags?.includes('Spicy') && (
            <span className="text-[10px] font-black text-red-500">🌶 Spicy</span>
          )}
        </div>

        <h4 className="font-black text-slate-900 text-sm leading-tight mb-1">{item.name}</h4>

        {item.description && (
          <p className="text-xs text-slate-400 font-medium leading-relaxed line-clamp-2 mb-2">{item.description}</p>
        )}

        <div className="flex items-center gap-2">
          <span className="font-black text-slate-900 text-base">
            {formatCurrency(item.discountedPrice || item.price)}
          </span>
          {item.discountedPrice && (
            <>
              <span className="text-xs text-slate-400 line-through font-medium">{formatCurrency(item.price)}</span>
              <span className="text-[10px] font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded-md">{disc}% off</span>
            </>
          )}
        </div>
      </div>

      {/* Right: image + add */}
      <div className="flex flex-col items-center gap-2 flex-shrink-0 w-24">
        <div className="relative w-24 h-20 rounded-xl overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50">
          {imgSrc
            ? <img src={imgSrc} alt={item.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
          }
        </div>

        {!item.isAvailable ? (
          <span className="text-[10px] text-slate-400 font-bold">Not Available</span>
        ) : qty === 0 ? (
          <button
            onClick={() => addItem(item, restaurantId, restaurantName)}
            className="w-full text-xs font-black py-1.5 rounded-xl border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-all"
          >
            ADD
          </button>
        ) : (
          <div className="flex items-center gap-2 w-full justify-between rounded-xl px-2 py-1.5"
            style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
            <button onClick={() => updateQuantity(item._id, qty - 1)} className="text-white">
              <Minus className="w-3.5 h-3.5" />
            </button>
            <span className="text-xs font-black text-white">{qty}</span>
            <button onClick={() => addItem(item, restaurantId, restaurantName)} className="text-white">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
