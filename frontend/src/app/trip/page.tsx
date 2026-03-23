'use client';
import { useState, useEffect } from 'react';
import { ArrowUpDown, MapPin, Navigation, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useRoutes, useRestaurantsByRoute } from '@/hooks/useRestaurants';
import { useTripStore } from '@/store/tripStore';
import RestaurantCard from '@/components/customer/RestaurantCard';
import BottomNav from '@/components/shared/BottomNav';
import CartButton from '@/components/customer/CartButton';

export default function TripPage() {
  const { selectedRoute, fromCity, toCity, userLocation, setRoute, setFromCity, setToCity, setUserLocation, swapCities } = useTripStore();
  const { data: routes, isLoading: routesLoading } = useRoutes();

  const { data, isLoading: restaurantsLoading, refetch } = useRestaurantsByRoute({
    routeId: selectedRoute?._id || '',
    fromCity,
    toCity,
    userLat: userLocation?.lat,
    userLng: userLocation?.lng,
  });

  const handleGetLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => console.error(err)
    );
  };

  // Auto-select first route
  useEffect(() => {
    if (routes?.length && !selectedRoute) {
      setRoute(routes[0]);
      setFromCity(routes[0].fromCity);
      setToCity(routes[0].toCity);
    }
  }, [routes]);

  const waypoints = selectedRoute?.waypoints || [];

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-12 pb-6">
        <h1 className="text-xl font-bold mb-4">Plan Your Trip</h1>

        {/* Route selector */}
        {routes && routes.length > 1 && (
          <select
            className="w-full bg-white/20 text-white rounded-lg px-3 py-2 text-sm mb-3 border border-white/30"
            value={selectedRoute?._id || ''}
            onChange={(e) => {
              const r = routes.find((r) => r._id === e.target.value);
              if (r) { setRoute(r); setFromCity(r.fromCity); setToCity(r.toCity); }
            }}
          >
            {routes.map((r) => (
              <option key={r._id} value={r._id} className="text-black">{r.name}</option>
            ))}
          </select>
        )}

        {/* From / To */}
        <div className="bg-white rounded-xl p-3 text-foreground">
          <div className="flex items-center gap-3">
            <div className="flex flex-col items-center gap-1">
              <div className="w-3 h-3 rounded-full bg-green-500" />
              <div className="w-0.5 h-6 bg-gray-300" />
              <div className="w-3 h-3 rounded-full bg-red-500" />
            </div>
            <div className="flex-1 space-y-2">
              <select
                className="w-full text-sm font-medium bg-transparent border-b pb-1 focus:outline-none"
                value={fromCity}
                onChange={(e) => setFromCity(e.target.value)}
              >
                {waypoints.map((w) => (
                  <option key={w.order} value={w.name}>{w.name}</option>
                ))}
              </select>
              <select
                className="w-full text-sm font-medium bg-transparent focus:outline-none"
                value={toCity}
                onChange={(e) => setToCity(e.target.value)}
              >
                {waypoints.map((w) => (
                  <option key={w.order} value={w.name}>{w.name}</option>
                ))}
              </select>
            </div>
            <button onClick={swapCities} className="p-2 rounded-full bg-muted">
              <ArrowUpDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Location + Search */}
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            className="bg-white/20 border-white/30 text-white hover:bg-white/30 flex-1"
            onClick={handleGetLocation}
          >
            <Navigation className="w-4 h-4 mr-1" />
            {userLocation ? 'Location Active' : 'Use My Location'}
          </Button>
          <Button
            size="sm"
            className="bg-white text-primary hover:bg-white/90 flex-1"
            onClick={() => refetch()}
            disabled={!fromCity || !toCity}
          >
            Find Restaurants
          </Button>
        </div>
      </div>

      {/* Restaurant List */}
      <div className="px-4 py-4">
        {restaurantsLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : data?.restaurants?.length ? (
          <>
            <p className="text-sm text-muted-foreground mb-3">
              {data.restaurants.length} restaurants on {data.route.name}
            </p>
            <div className="space-y-3">
              {data.restaurants.map((r) => (
                <RestaurantCard key={r._id} restaurant={r} />
              ))}
            </div>
          </>
        ) : data ? (
          <div className="text-center py-12 text-muted-foreground">
            <MapPin className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No restaurants found on this route segment</p>
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p className="text-sm">Select your route and tap "Find Restaurants"</p>
          </div>
        )}
      </div>

      <CartButton />
      <BottomNav />
    </div>
  );
}
