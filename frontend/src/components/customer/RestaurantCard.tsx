'use client';
import Link from 'next/link';
import { Star, Clock, MapPin, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Restaurant } from '@/types';
import { resolveImage } from '@/lib/config';

const FOOD_BADGE = {
  veg:       { cls: 'border-green-600 text-green-700 bg-green-50/95',    icon: '🟢', label: 'Veg' },
  'non-veg': { cls: 'border-red-500 text-red-600 bg-red-50/95',          icon: '🔴', label: 'Non-Veg' },
  both:      { cls: 'border-yellow-500 text-yellow-700 bg-yellow-50/95', icon: '🟡', label: 'Veg+' },
};

export default function RestaurantCard({ restaurant }: { restaurant: Restaurant }) {
  const isPassed = restaurant.position === 'passed';
  const isAhead  = restaurant.position === 'ahead';
  const ft = FOOD_BADGE[restaurant.foodType] ?? FOOD_BADGE.both;
  const imgSrc = resolveImage(restaurant.coverImage);

  return (
    <Link href={`/restaurants/${restaurant._id}`}>
      <div className={cn(
        'group bg-white rounded-2xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 active:scale-[0.97]',
        isPassed && 'opacity-50 grayscale'
      )}>
        {/* Image */}
        <div className="relative bg-gradient-to-br from-orange-50 to-amber-50" style={{ paddingTop: '62%' }}>
          <div className="absolute inset-0">
            {imgSrc
              ? <img src={imgSrc} alt={restaurant.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
              : <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🍽️</div>
            }
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
          </div>

          {/* Open/Closed */}
          <div className={cn(
            'absolute top-2 right-2 text-[9px] font-black px-2 py-0.5 rounded-full',
            restaurant.isOpen ? 'bg-emerald-500 text-white' : 'bg-black/60 text-white/80'
          )}>
            {restaurant.isOpen ? '● OPEN' : '● CLOSED'}
          </div>

          {/* Ahead badge */}
          {isAhead && (
            <div className="absolute top-2 left-2">
              <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-orange-500 text-white flex items-center gap-0.5">
                <Zap className="w-2 h-2" />Pre-order
              </span>
            </div>
          )}

          {/* Bottom: rating + distance */}
          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between">
            <div className="flex items-center gap-0.5 bg-white/95 rounded-md px-1.5 py-0.5 shadow-sm">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-[11px] font-black text-gray-900">{restaurant.rating.toFixed(1)}</span>
              {restaurant.totalRatings > 0 && (
                <span className="text-[9px] text-gray-400">({restaurant.totalRatings})</span>
              )}
            </div>
            {restaurant.distanceKm != null && (
              <div className="flex items-center gap-0.5 bg-white/95 rounded-md px-1.5 py-0.5 shadow-sm">
                <MapPin className="w-2.5 h-2.5 text-blue-500" />
                <span className="text-[10px] font-black text-gray-800">{restaurant.distanceKm}km</span>
              </div>
            )}
          </div>
        </div>

        {/* Info */}
        <div className="p-2.5">
          <h3 className="font-extrabold text-gray-900 text-xs leading-snug line-clamp-1 mb-0.5">
            {restaurant.name}
          </h3>

          {restaurant.cuisines?.length > 0 && (
            <p className="text-[10px] text-gray-400 truncate mb-1.5">
              {restaurant.cuisines.slice(0, 2).join(' · ')}
            </p>
          )}

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-[10px] text-gray-500">
              <Clock className="w-3 h-3 text-orange-400" />
              <span className="font-bold text-gray-700">{restaurant.avgPrepTimeMinutes}</span>min
            </div>
            <span className={cn(
              'text-[9px] font-black px-1.5 py-0.5 rounded-full border',
              ft.cls
            )}>
              {ft.icon} {ft.label}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
