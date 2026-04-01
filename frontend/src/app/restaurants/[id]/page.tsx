'use client';
import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Star, Clock, MapPin, Phone, ChevronRight, Info, Utensils } from 'lucide-react';
import { useRestaurant, useMenu } from '@/hooks/useRestaurants';
import { resolveImage } from '@/lib/config';

export default function RestaurantPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: restaurant, isLoading: rLoading } = useRestaurant(id);
  const { data: menu, isLoading: mLoading } = useMenu(id);
  const [activeCategory, setActiveCategory] = useState('');

  const categories = menu ? Object.keys(menu) : [];
  const currentCat = activeCategory || categories[0] || '';
  const coverSrc = restaurant?.coverImage
    ? (restaurant.coverImage.startsWith('http') ? restaurant.coverImage : `${BASE}${restaurant.coverImage}`)
    : null;

  if (rLoading) return (
    <div className="flex justify-center items-center min-h-screen bg-white">
      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
    </div>
  );
  if (!restaurant) return <div className="p-6 text-center text-slate-400">Restaurant not found</div>;

  const totalItems = menu ? Object.values(menu).flat().length : 0;

  return (
    <div className="min-h-screen bg-white pb-32">

      {/* ── COVER ── */}
      <div className="relative h-56 sm:h-72 bg-gradient-to-br from-orange-50 to-amber-50 overflow-hidden">
        {coverSrc
          ? <img src={coverSrc} alt={restaurant.name} className="w-full h-full object-cover" />
          : <div className="w-full h-full flex items-center justify-center text-8xl opacity-20">🍽️</div>
        }
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />

        {/* Back */}
        <button onClick={() => router.back()}
          className="absolute top-12 left-4 w-9 h-9 bg-white/90 rounded-full flex items-center justify-center shadow-md">
          <ArrowLeft className="w-5 h-5 text-slate-800" />
        </button>

        {/* Status */}
        <div className={`absolute top-12 right-4 px-3 py-1 rounded-full text-xs font-black shadow-md ${
          restaurant.isOpen ? 'bg-green-500 text-white' : 'bg-slate-700 text-white'
        }`}>
          {restaurant.isOpen ? '● OPEN' : '● CLOSED'}
        </div>

        {/* Name on image */}
        <div className="absolute bottom-4 left-4 right-4">
          <h1 className="text-2xl font-black text-white leading-tight drop-shadow-lg">{restaurant.name}</h1>
          {restaurant.cuisines?.length > 0 && (
            <p className="text-white/70 text-sm font-medium mt-0.5">{restaurant.cuisines.join(', ')}</p>
          )}
        </div>
      </div>

      {/* ── INFO STRIP ── */}
      <div className="px-4 py-4 border-b border-slate-100">
        {/* Rating + stats row */}
        <div className="flex items-center gap-3 mb-3 flex-wrap">
          <div className="flex items-center gap-1.5 bg-green-50 border border-green-200 rounded-xl px-3 py-1.5">
            <Star className="w-4 h-4 fill-green-600 text-green-600" />
            <span className="font-black text-green-700 text-sm">{restaurant.rating.toFixed(1)}</span>
            {restaurant.totalRatings > 0 && (
              <span className="text-green-600/60 text-xs font-medium">({restaurant.totalRatings})</span>
            )}
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Clock className="w-4 h-4 text-orange-500" />
            <span className="font-black text-slate-700 text-sm">{restaurant.avgPrepTimeMinutes} min</span>
            <span className="text-slate-400 text-xs font-medium">prep</span>
          </div>
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5">
            <Utensils className="w-4 h-4 text-slate-400" />
            <span className="font-black text-slate-700 text-sm">{totalItems}</span>
            <span className="text-slate-400 text-xs font-medium">items</span>
          </div>
        </div>

        {/* Food type */}
        <div className="flex items-center gap-2 mb-3">
          <span className={`text-xs font-black px-2.5 py-1 rounded-lg border ${
            restaurant.foodType === 'veg'
              ? 'border-green-500 text-green-700 bg-green-50'
              : restaurant.foodType === 'non-veg'
              ? 'border-red-500 text-red-600 bg-red-50'
              : 'border-yellow-500 text-yellow-700 bg-yellow-50'
          }`}>
            {restaurant.foodType === 'veg' ? '🟢 Pure Veg' : restaurant.foodType === 'non-veg' ? '🔴 Non-Veg' : '🟡 Veg & Non-Veg'}
          </span>
        </div>

        {/* Address + phone */}
        <div className="space-y-1.5">
          <div className="flex items-start gap-2 text-sm text-slate-500 font-medium">
            <MapPin className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <span>
              {[restaurant.address.street, restaurant.address.city, restaurant.address.state, restaurant.address.pincode]
                .filter(Boolean).join(', ')}
            </span>
          </div>
          <a href={`tel:${restaurant.phone}`} className="flex items-center gap-2 text-sm text-orange-500 font-bold">
            <Phone className="w-4 h-4" />
            {restaurant.phone}
          </a>
        </div>

        {restaurant.description && (
          <div className="mt-3 flex items-start gap-2 text-sm text-slate-500 font-medium bg-slate-50 rounded-xl p-3">
            <Info className="w-4 h-4 text-slate-400 flex-shrink-0 mt-0.5" />
            <p>{restaurant.description}</p>
          </div>
        )}
      </div>

      {/* ── CATEGORY TABS ── */}
      {categories.length > 0 && (
        <div className="sticky top-0 z-20 bg-white border-b border-slate-100 shadow-sm">
          <div className="flex overflow-x-auto scrollbar-hide px-4 gap-0">
            {categories.map(cat => (
              <button key={cat} onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-3.5 text-sm font-black border-b-2 transition-colors whitespace-nowrap ${
                  currentCat === cat
                    ? 'border-orange-500 text-orange-500'
                    : 'border-transparent text-slate-400 hover:text-slate-700'
                }`}>
                {cat}
                <span className="ml-1.5 text-[10px] font-bold text-slate-300">
                  {menu?.[cat]?.length}
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── MENU ── */}
      <div className="px-4">
        {mLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
          </div>
        ) : menu && currentCat ? (
          <div>
            <div className="flex items-center justify-between py-4">
              <h2 className="font-black text-slate-900 text-base">{currentCat}</h2>
              <span className="text-xs text-slate-400 font-medium">{menu[currentCat]?.length} items</span>
            </div>
            {menu[currentCat]?.map(item => (
              <MenuItemCard key={item._id} item={item} restaurantId={restaurant._id} restaurantName={restaurant.name} />
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="text-5xl mb-3">🍽️</div>
            <p className="text-slate-400 font-bold">No menu items available</p>
          </div>
        )}
      </div>

      <CartButton />
    </div>
  );
}
