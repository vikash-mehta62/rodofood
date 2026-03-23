'use client';
import Image from 'next/image';
import { Plus, Minus } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/lib/utils';
import type { MenuItem } from '@/types';

interface Props {
  item: MenuItem;
  restaurantId: string;
  restaurantName: string;
}

export default function MenuItemCard({ item, restaurantId, restaurantName }: Props) {
  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find((i) => i.menuItem._id === item._id);
  const quantity = cartItem?.quantity || 0;

  return (
    <div className="flex gap-3 py-3 border-b last:border-0">
      {/* Food type indicator */}
      <div className="flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`w-3 h-3 rounded-sm border-2 flex items-center justify-center ${item.foodType === 'veg' ? 'border-green-600' : 'border-red-600'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${item.foodType === 'veg' ? 'bg-green-600' : 'bg-red-600'}`} />
          </span>
          {item.isPopular && (
            <span className="text-[10px] text-orange-500 font-semibold">BESTSELLER</span>
          )}
        </div>
        <h4 className="font-medium text-sm">{item.name}</h4>
        {item.description && (
          <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="font-semibold text-sm">
            {formatCurrency(item.discountedPrice || item.price)}
          </span>
          {item.discountedPrice && (
            <span className="text-xs text-muted-foreground line-through">
              {formatCurrency(item.price)}
            </span>
          )}
        </div>
      </div>

      {/* Image + Add button */}
      <div className="flex flex-col items-center gap-2 flex-shrink-0">
        <div className="relative w-20 h-16 rounded-lg overflow-hidden bg-muted">
          {item.image ? (
            <Image src={item.image} alt={item.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
          )}
        </div>

        {!item.isAvailable ? (
          <span className="text-xs text-muted-foreground">Unavailable</span>
        ) : quantity === 0 ? (
          <button
            onClick={() => addItem(item, restaurantId, restaurantName)}
            className="bg-primary text-primary-foreground text-xs font-bold px-4 py-1.5 rounded-lg hover:bg-primary/90 transition-colors"
          >
            ADD
          </button>
        ) : (
          <div className="flex items-center gap-2 bg-primary text-primary-foreground rounded-lg px-2 py-1">
            <button onClick={() => updateQuantity(item._id, quantity - 1)}>
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-xs font-bold w-4 text-center">{quantity}</span>
            <button onClick={() => addItem(item, restaurantId, restaurantName)}>
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
