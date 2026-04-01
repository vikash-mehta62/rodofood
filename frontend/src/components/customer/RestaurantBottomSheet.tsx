'use client';
import { useState, useEffect, useRef } from 'react';
import { X, Star, Clock, MapPin, Info, Flame, Plus, Minus, ChevronRight, ShoppingCart } from 'lucide-react';
import { useRestaurant, useMenu } from '@/hooks/useRestaurants';
import { useCartStore } from '@/store/cartStore';
import { formatCurrency } from '@/lib/utils';
import type { MenuItem } from '@/types';
import Link from 'next/link';
import { resolveImage } from '@/lib/config';

function MenuCard({ item, restaurantId, restaurantName }: {
  item: MenuItem; restaurantId: string; restaurantName: string;
}) {
  const { items, addItem, updateQuantity } = useCartStore();
  const cartItem = items.find(i => i.menuItem._id === item._id);
  const qty = cartItem?.quantity || 0;
  const imgSrc = resolveImage(item.image);
  const disc = item.discountedPrice ? Math.round((1 - item.discountedPrice / item.price) * 100) : 0;

  const handleAdd = () => {
    addItem(item, restaurantId, restaurantName);
  };

  return (
    <div className="flex gap-3 py-3.5 border-b border-slate-100 last:border-0">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-1.5 mb-1">
          <span className={`w-3.5 h-3.5 rounded-sm border-2 flex items-center justify-center flex-shrink-0 ${
            item.foodType === 'veg' ? 'border-green-600' : item.foodType === 'egg' ? 'border-yellow-500' : 'border-red-600'
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              item.foodType === 'veg' ? 'bg-green-600' : item.foodType === 'egg' ? 'bg-yellow-500' : 'bg-red-600'
            }`} />
          </span>
          {item.isPopular && (
            <span className="flex items-center gap-0.5 text-[9px] font-black text-orange-500 uppercase">
              <Flame className="w-2.5 h-2.5" /> Bestseller
            </span>
          )}
        </div>
        <p className="font-black text-slate-900 text-sm leading-tight mb-0.5">{item.name}</p>
        {item.description && (
          <p className="text-[11px] text-slate-400 font-medium leading-relaxed line-clamp-2 mb-1.5">{item.description}</p>
        )}
        <div className="flex items-center gap-1.5">
          <span className="font-black text-slate-900 text-sm">{formatCurrency(item.discountedPrice || item.price)}</span>
          {item.discountedPrice && (
            <>
              <span className="text-[11px] text-slate-400 line-through">{formatCurrency(item.price)}</span>
              <span className="text-[9px] font-black text-green-600 bg-green-50 px-1 py-0.5 rounded">{disc}% off</span>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-col items-center gap-1.5 flex-shrink-0 w-20">
        <div className="w-20 h-16 rounded-xl overflow-hidden bg-gradient-to-br from-orange-50 to-amber-50">
          {imgSrc
            ? <img src={imgSrc} alt={item.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-xl">🍽️</div>
          }
        </div>
        {!item.isAvailable ? (
          <span className="text-[9px] text-slate-400 font-bold">Not Available</span>
        ) : qty === 0 ? (
          <button onClick={handleAdd}
            className="w-full text-[11px] font-black py-1 rounded-lg border-2 border-orange-500 text-orange-500 hover:bg-orange-500 hover:text-white transition-all">
            ADD
          </button>
        ) : (
          <div className="flex items-center justify-between w-full rounded-lg px-1.5 py-1"
            style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
            <button onClick={() => updateQuantity(item._id, qty - 1)} className="text-white">
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-[11px] font-black text-white">{qty}</span>
            <button onClick={handleAdd} className="text-white">
              <Plus className="w-3 h-3" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

interface Props {
  restaurantId: string;
  onClose: () => void;
}

export default function RestaurantBottomSheet({ restaurantId, onClose }: Props) {
  const { data: restaurant, isLoading: rLoading } = useRestaurant(restaurantId);
  const { data: menu, isLoading: mLoading } = useMenu(restaurantId);
  const [activeCategory, setActiveCategory] = useState('');
  const { items, getItemCount, getSubtotal, restaurantName: cartRestName } = useCartStore();
  const sheetRef = useRef<HTMLDivElement>(null);

  const categories = menu ? Object.keys(menu) : [];
  const currentCat = activeCategory || categories[0] || '';
  const coverSrc = resolveImage(restaurant?.coverImage);

  const cartCount = getItemCount();
  const cartTotal = getSubtotal();

  // Close on backdrop click
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/50 z-40" onClick={onClose} style={{ backdropFilter: 'blur(2px)' }} />

      {/* Bottom Sheet */}
      <div ref={sheetRef}
        className="fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-2xl flex flex-col"
        style={{ maxHeight: '92vh', animation: 'slideUp 0.3s ease-out' }}>

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 flex-shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Close */}
        <button onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors z-10">
          <X className="w-4 h-4 text-slate-600" />
        </button>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto">

          {rLoading ? (
            <div className="flex justify-center py-16">
              <div className="w-6 h-6 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
          ) : restaurant ? (
            <>
              {/* Cover */}
              <div className="relative h-40 overflow-hidden" style={{ background: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)' }}>
                {coverSrc
                  ? <img src={coverSrc} alt={restaurant.name} className="w-full h-full object-cover" />
                  : <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">🍽️</div>
                }
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-3 left-4 right-4">
                  <h2 className="text-lg font-black text-white leading-tight">{restaurant.name}</h2>
                  {restaurant.cuisines?.length > 0 && (
                    <p className="text-white/70 text-xs font-medium">{restaurant.cuisines.join(' · ')}</p>
                  )}
                </div>
              </div>

              {/* Info strip */}
              <div className="px-4 py-3 border-b border-slate-100 flex items-center gap-3 flex-wrap">
                <div className="flex items-center gap-1 bg-green-50 border border-green-200 rounded-lg px-2 py-1">
                  <Star className="w-3 h-3 fill-green-600 text-green-600" />
                  <span className="text-xs font-black text-green-700">{restaurant.rating.toFixed(1)}</span>
                  {restaurant.totalRatings > 0 && <span className="text-[10px] text-green-600/60">({restaurant.totalRatings})</span>}
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                  <Clock className="w-3 h-3 text-orange-400" />
                  {restaurant.avgPrepTimeMinutes} min prep
                </div>
                <div className="flex items-center gap-1 text-xs text-slate-500 font-medium">
                  <MapPin className="w-3 h-3 text-slate-400" />
                  {restaurant.address.city}
                </div>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-lg border ${
                  restaurant.isOpen ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'
                }`}>
                  {restaurant.isOpen ? '● OPEN' : '● CLOSED'}
                </span>
                <Link href={`/restaurants/${restaurant._id}`} onClick={onClose}
                  className="ml-auto flex items-center gap-1 text-xs font-black text-orange-500">
                  Full Page <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              {/* Description */}
              {restaurant.description && (
                <div className="px-4 py-2.5 border-b border-slate-50 flex items-start gap-2">
                  <Info className="w-3.5 h-3.5 text-slate-400 flex-shrink-0 mt-0.5" />
                  <p className="text-xs text-slate-500 font-medium leading-relaxed">{restaurant.description}</p>
                </div>
              )}

              {/* Category tabs */}
              {categories.length > 0 && (
                <div className="sticky top-0 bg-white border-b border-slate-100 z-10">
                  <div className="flex overflow-x-auto scrollbar-hide px-4">
                    {categories.map(cat => (
                      <button key={cat} onClick={() => setActiveCategory(cat)}
                        className={`flex-shrink-0 px-3 py-3 text-xs font-black border-b-2 transition-colors whitespace-nowrap ${
                          currentCat === cat ? 'border-orange-500 text-orange-500' : 'border-transparent text-slate-400'
                        }`}>
                        {cat}
                        <span className="ml-1 text-[9px] text-slate-300">{menu?.[cat]?.length}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Menu items */}
              <div className="px-4 pb-4">
                {mLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="w-5 h-5 border-2 border-orange-500 border-t-transparent rounded-full animate-spin" />
                  </div>
                ) : menu && currentCat ? (
                  <>
                    <div className="flex items-center justify-between py-3">
                      <p className="font-black text-slate-900 text-sm">{currentCat}</p>
                      <span className="text-[10px] text-slate-400 font-medium">{menu[currentCat]?.length} items</span>
                    </div>
                    {menu[currentCat]?.map(item => (
                      <MenuCard key={item._id} item={item}
                        restaurantId={restaurant._id} restaurantName={restaurant.name} />
                    ))}
                  </>
                ) : (
                  <div className="text-center py-10 text-slate-400 text-sm font-bold">No menu items</div>
                )}
              </div>
            </>
          ) : null}
        </div>

        {/* Cart bar — sticky bottom */}
        {cartCount > 0 && (
          <div className="flex-shrink-0 px-4 pb-6 pt-3 border-t border-slate-100 bg-white">
            <Link href="/cart" onClick={onClose}>
              <div className="flex items-center justify-between text-white font-black px-5 py-3.5 rounded-2xl shadow-lg"
                style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                <div className="flex items-center gap-2">
                  <div className="bg-white/20 rounded-lg px-2 py-0.5 text-sm">{cartCount}</div>
                  <span className="text-sm">{cartRestName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm">{formatCurrency(cartTotal)}</span>
                  <ShoppingCart className="w-4 h-4" />
                </div>
              </div>
            </Link>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideUp {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
      `}</style>
    </>
  );
}
