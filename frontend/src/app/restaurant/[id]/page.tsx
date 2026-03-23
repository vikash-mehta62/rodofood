'use client';
import { useState } from 'react';
import Image from 'next/image';
import { useParams } from 'next/navigation';
import { ArrowLeft, Star, Clock, MapPin, Phone } from 'lucide-react';
import Link from 'next/link';
import { useRestaurant, useMenu } from '@/hooks/useRestaurants';
import MenuItemCard from '@/components/customer/MenuItemCard';
import CartButton from '@/components/customer/CartButton';
import { Badge } from '@/components/ui/badge';
import { Loader2 } from 'lucide-react';

export default function RestaurantPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: restaurant, isLoading: rLoading } = useRestaurant(id);
  const { data: menu, isLoading: mLoading } = useMenu(id);
  const [activeCategory, setActiveCategory] = useState<string>('');

  const categories = menu ? Object.keys(menu) : [];
  const currentCategory = activeCategory || categories[0] || '';

  if (rLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!restaurant) return <div className="p-4">Restaurant not found</div>;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Cover Image */}
      <div className="relative h-52 bg-muted">
        {restaurant.coverImage ? (
          <Image src={restaurant.coverImage} alt={restaurant.name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-6xl bg-orange-50">🍽️</div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

        {/* Back button */}
        <Link href="/trip" className="absolute top-12 left-4 bg-white/90 rounded-full p-2">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Status badge */}
        <div className={`absolute top-12 right-4 px-3 py-1 rounded-full text-xs font-bold ${restaurant.isOpen ? 'bg-green-500 text-white' : 'bg-gray-500 text-white'}`}>
          {restaurant.isOpen ? 'OPEN' : 'CLOSED'}
        </div>
      </div>

      {/* Restaurant Info */}
      <div className="px-4 py-4 border-b">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold">{restaurant.name}</h1>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant={restaurant.foodType === 'veg' ? 'veg' : 'nonveg'}>
                {restaurant.foodType === 'veg' ? '🟢 Pure Veg' : restaurant.foodType === 'non-veg' ? '🔴 Non-Veg' : '🟡 Veg & Non-Veg'}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-green-50 border border-green-200 rounded-lg px-2 py-1">
            <Star className="w-4 h-4 fill-green-600 text-green-600" />
            <span className="font-bold text-green-700">{restaurant.rating.toFixed(1)}</span>
          </div>
        </div>

        <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            {restaurant.avgPrepTimeMinutes} min prep
          </span>
          <span className="flex items-center gap-1">
            <MapPin className="w-4 h-4" />
            {restaurant.address.city}
          </span>
          <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1 text-primary">
            <Phone className="w-4 h-4" />
            Call
          </a>
        </div>

        {restaurant.description && (
          <p className="text-sm text-muted-foreground mt-2">{restaurant.description}</p>
        )}
      </div>

      {/* Category Tabs */}
      {categories.length > 0 && (
        <div className="sticky top-0 z-10 bg-background border-b">
          <div className="flex gap-0 overflow-x-auto scrollbar-hide px-4">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`flex-shrink-0 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                  currentCategory === cat
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="px-4">
        {mLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : menu && currentCategory ? (
          <div>
            <h2 className="font-bold text-base py-3">{currentCategory}</h2>
            {menu[currentCategory]?.map((item) => (
              <MenuItemCard
                key={item._id}
                item={item}
                restaurantId={restaurant._id}
                restaurantName={restaurant.name}
              />
            ))}
          </div>
        ) : (
          <p className="text-center py-8 text-muted-foreground">No menu items available</p>
        )}
      </div>

      <CartButton />
    </div>
  );
}
