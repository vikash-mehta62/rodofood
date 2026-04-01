'use client';
import Link from 'next/link';
import { Star, Clock, MapPin, ChevronRight, Zap, Utensils } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Restaurant } from '@/types';
import { resolveImage } from '@/lib/config';

const FOOD_BADGE = {
  veg:       { label: 'Pure Veg',      cls: 'border-green-600 text-green-700 bg-green-50',    icon: '🟢' },
  'non-veg': { label: 'Non-Veg',       cls: 'border-red-500 text-red-600 bg-red-50',          icon: '🔴' },
  both:      { label: 'Veg & Non-Veg', cls: 'border-yellow-500 text-yellow-700 bg-yellow-50', icon: '🟡' },
};

export default function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const isPassed = restaurant.position === 'passed';
  const isAhead  = restaurant.position === 'ahead';
  const ft = FOOD_BADGE[restaurant.foodType] ?? FOOD_BADGE.both;
  const imgSrc = resolveImage(restaurant.coverImage);

  const fullAddress = [restaurant.address?.street, restaurant.address?.city, restaurant.address?.state]
    .filter(Boolean).join(', ');

  return (
    <Link href={`/restaurants/${restaurant._id}`}>
      <div className={cn(
        'bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl transition-all duration-200 active:scale-[0.98]',
        isPassed && 'opacity-50 grayscale'
      )}>
        {/* Cover image */}
        <div className="relative h-44 overflow-hidden" style={{ background: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)' }}>
          {imgSrc
            ? <img src={imgSrc} alt={restaurant.name} className="w-full h-full object-cover" />
            : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-2 opacity-30">
                <span className="text-6xl">🍽️</span>
              </div>
            )
          }
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/5 to-transparent" />

          {/* Top badges */}
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            <span className={cn('text-[10px] font-black px-2 py-0.5 rounded-md border backdrop-blur-sm', ft.cls)}>
              {ft.icon} {ft.label}
            </span>
            {isAhead && (
              <span className="text-[10px] font-black px-2 py-0.5 rounded-md bg-orange-500 text-white flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5" /> Pre-order
              </span>
            )}
          </div>

          {/* Open/Closed */}
          <div className={cn(
            'absolute top-3 right-3 text-[10px] font-black px-2.5 py-1 rounded-full shadow-md',
            restaurant.isOpen ? 'bg-green-500 text-white' : 'bg-slate-700/90 text-white'
          )}>
            {restaurant.isOpen ? '● OPEN' : '● CLOSED'}
          </div>

          {/* Rating bottom-left */}
          <div className="absolute bottom-3 left-3 flex items-center gap-1 bg-white/95 rounded-lg px-2.5 py-1 shadow-sm">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-xs font-black text-slate-800">{restaurant.rating.toFixed(1)}</span>
            {restaurant.totalRatings > 0 && (
              <span className="text-[10px] text-slate-400 font-medium">({restaurant.totalRatings})</span>
            )}
          </div>

          {/* Distance bottom-right */}
          {restaurant.distanceKm != null && (
            <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-white/95 rounded-lg px-2.5 py-1 shadow-sm">
              <MapPin className="w-3 h-3 text-blue-500" />
              <span className="text-[10px] font-black text-slate-700">{restaurant.distanceKm} km</span>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-4">
          {/* Name row */}
          <div className="flex items-start justify-between gap-2 mb-1.5">
            <h3 className="font-black text-slate-900 text-base leading-tight">{restaurant.name}</h3>
            <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0 mt-0.5" />
          </div>

          {/* Cuisines */}
          {restaurant.cuisines?.length > 0 && (
            <p className="text-xs text-slate-400 font-medium mb-2 truncate">
              {restaurant.cuisines.join(' · ')}
            </p>
          )}

          {/* Address */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 font-medium mb-2.5">
            <MapPin className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
            <span className="truncate">{fullAddress || restaurant.address?.city}</span>
          </div>

          {/* Stats row */}
          <div className="flex items-center gap-0 border-t border-slate-50 pt-2.5">
            <div className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
              <Clock className="w-3.5 h-3.5 text-orange-400" />
              <span className="font-black text-slate-700">{restaurant.avgPrepTimeMinutes}</span> min
            </div>
            <div className="w-px h-4 bg-slate-100" />
            <div className="flex-1 flex items-center justify-center gap-1.5 text-xs text-slate-500 font-medium">
              <Utensils className="w-3.5 h-3.5 text-slate-400" />
              <span className="truncate">{restaurant.address?.city}</span>
            </div>
            {restaurant.position && (
              <>
                <div className="w-px h-4 bg-slate-100" />
                <div className={cn(
                  'flex-1 flex items-center justify-center gap-1 text-[10px] font-black',
                  isAhead ? 'text-green-600' : 'text-slate-400'
                )}>
                  {isAhead ? <><Zap className="w-3 h-3" />Ahead</> : <>▼ Passed</>}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
