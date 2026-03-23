'use client';
import Image from 'next/image';
import Link from 'next/link';
import { Star, MapPin, Clock, ChevronRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn, formatDistance } from '@/lib/utils';
import type { Restaurant } from '@/types';

interface Props {
  restaurant: Restaurant;
}

export default function RestaurantCard({ restaurant }: Props) {
  const isAhead = restaurant.position === 'ahead';
  const isPassed = restaurant.position === 'passed';

  return (
    <Link href={`/restaurant/${restaurant._id}`}>
      <div
        className={cn(
          'flex gap-3 p-3 rounded-xl border bg-card transition-all hover:shadow-md active:scale-[0.98]',
          isPassed && 'opacity-50 grayscale'
        )}
      >
        {/* Image */}
        <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 bg-muted">
          {restaurant.coverImage ? (
            <Image src={restaurant.coverImage} alt={restaurant.name} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
          )}
          {/* Open/Closed badge */}
          <div
            className={cn(
              'absolute bottom-1 left-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full',
              restaurant.isOpen ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'
            )}
          >
            {restaurant.isOpen ? 'OPEN' : 'CLOSED'}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-sm truncate">{restaurant.name}</h3>
            <ChevronRight className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
          </div>

          {/* Food type + Rating */}
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={restaurant.foodType === 'veg' ? 'veg' : 'nonveg'} className="text-[10px] px-1.5 py-0">
              {restaurant.foodType === 'veg' ? '🟢 Veg' : restaurant.foodType === 'non-veg' ? '🔴 Non-Veg' : '🟡 Both'}
            </Badge>
            <div className="flex items-center gap-0.5 text-xs text-amber-500">
              <Star className="w-3 h-3 fill-amber-500" />
              <span className="font-medium text-foreground">{restaurant.rating.toFixed(1)}</span>
            </div>
          </div>

          {/* Distance + ETA */}
          <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
            {restaurant.distanceKm !== null && restaurant.distanceKm !== undefined && (
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {formatDistance(restaurant.distanceKm)}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              ~{restaurant.avgPrepTimeMinutes} min prep
            </span>
          </div>

          {/* Position indicator */}
          {restaurant.position && (
            <div className={cn('mt-1.5 text-[10px] font-medium', isAhead ? 'text-green-600' : 'text-gray-400')}>
              {isAhead ? '▲ Ahead on your route' : '▼ Already passed'}
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
