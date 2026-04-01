'use client';
import { useState, useEffect, useCallback } from 'react';
import {
  ArrowUpDown, MapPin, Navigation, Loader2,
  Search, X, ChevronDown, AlertCircle, RefreshCw
} from 'lucide-react';
import { useRoutes, useRestaurantsByRoute } from '@/hooks/useRestaurants';
import { useTripStore } from '@/store/tripStore';
import RestaurantCard from '@/components/customer/RestaurantCard';
import BottomNav from '@/components/shared/BottomNav';
import CartButton from '@/components/customer/CartButton';
import type { Restaurant } from '@/types';

type SortKey = 'default' | 'rating' | 'distance' | 'prepTime';
type FoodFilter = 'all' | 'veg' | 'non-veg' | 'both';
type LocationState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

const FOOD_FILTERS: { key: FoodFilter; label: string; icon: string; active: string }[] = [
  { key: 'all',     label: 'All',        icon: '🍽️', active: 'border-orange-400 text-orange-600 bg-orange-50' },
  { key: 'veg',     label: 'Pure Veg',   icon: '🟢', active: 'border-emerald-500 text-emerald-700 bg-emerald-50' },
  { key: 'non-veg', label: 'Non-Veg',    icon: '🔴', active: 'border-red-400 text-red-600 bg-red-50' },
  { key: 'both',    label: 'Veg & More', icon: '🟡', active: 'border-amber-400 text-amber-700 bg-amber-50' },
];

const SORT_OPTIONS: { key: SortKey; label: string; icon: string }[] = [
  { key: 'default',  label: 'Relevance', icon: '✨' },
  { key: 'rating',   label: 'Top Rated', icon: '⭐' },
  { key: 'distance', label: 'Nearest',   icon: '📍' },
  { key: 'prepTime', label: 'Fastest',   icon: '⚡' },
];

export default function TripPage() {
  const {
    selectedRoute, fromCity, toCity, userLocation,
    setRoute, setFromCity, setToCity, setUserLocation, swapCities,
  } = useTripStore();

  const { data: routes } = useRoutes();
  const [sort, setSort] = useState<SortKey>('default');
  const [foodFilter, setFoodFilter] = useState<FoodFilter>('all');
  const [openOnly, setOpenOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [locState, setLocState] = useState<LocationState>('idle');

  useEffect(() => {
    if (routes?.length && !selectedRoute) {
      const r = routes[0];
      setRoute(r); setFromCity(r.fromCity); setToCity(r.toCity);
    }
  }, [routes]);

  useEffect(() => {
    if (userLocation) setLocState('granted');
  }, []);

  const { data, isLoading, refetch } = useRestaurantsByRoute({
    routeId: selectedRoute?._id || '',
    fromCity, toCity,
    userLat: userLocation?.lat,
    userLng: userLocation?.lng,
  });

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) { setLocState('unavailable'); return; }
    setLocState('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocState('granted');
        setTimeout(() => refetch(), 150);
      },
      (err) => {
        setLocState(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable');
      },
      { timeout: 10000, maximumAge: 60000 }
    );
  }, [setUserLocation, refetch]);

  const waypoints = selectedRoute?.waypoints || [];
  let restaurants: Restaurant[] = data?.restaurants || [];
  if (foodFilter !== 'all') restaurants = restaurants.filter(r => r.foodType === foodFilter);
  if (openOnly) restaurants = restaurants.filter(r => r.isOpen);
  if (search) restaurants = restaurants.filter(r =>
    r.name.toLowerCase().includes(search.toLowerCase()) ||
    r.cuisines?.some(c => c.toLowerCase().includes(search.toLowerCase()))
  );
  if (sort === 'rating')   restaurants = [...restaurants].sort((a, b) => b.rating - a.rating);
  if (sort === 'distance') restaurants = [...restaurants].sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  if (sort === 'prepTime') restaurants = [...restaurants].sort((a, b) => a.avgPrepTimeMinutes - b.avgPrepTimeMinutes);

  const aheadCount = restaurants.filter(r => r.position === 'ahead').length;
  const totalAll   = data?.restaurants?.length ?? 0;
  const hasFilters = foodFilter !== 'all' || openOnly || !!search || sort !== 'default';

  return (
    <div className="min-h-screen bg-[#F5F6FA] pb-24">

      {/* ── STICKY HEADER ── */}
      <div className="sticky top-0 z-30 bg-[#0C0F1A] shadow-2xl">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-12 pb-5">

          <div className="flex items-center justify-between mb-4">
            <h1 className="text-white font-extrabold text-xl">Find Food on Route</h1>
            {/* Location pill */}
            <button
              onClick={locState === 'denied' ? undefined : requestLocation}
              disabled={locState === 'requesting'}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                locState === 'granted'    ? 'border-emerald-400/50 text-emerald-300 bg-emerald-500/10' :
                locState === 'denied'     ? 'border-red-400/50 text-red-300 bg-red-500/10 cursor-default' :
                locState === 'requesting' ? 'border-amber-400/50 text-amber-300 bg-amber-500/10' :
                'border-white/15 text-white/60 bg-white/5 hover:bg-white/10'
              }`}>
              {locState === 'requesting' ? <><Loader2 className="w-3 h-3 animate-spin" /> Locating...</> :
               locState === 'granted'    ? <><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> Location On</> :
               locState === 'denied'     ? <><AlertCircle className="w-3 h-3" /> Location Denied</> :
               <><Navigation className="w-3 h-3" /> Use My Location</>}
            </button>
          </div>

          {/* Route selector */}
          {routes && routes.length > 1 && (
            <div className="relative mb-3">
              <select
                className="w-full rounded-xl px-4 py-2.5 text-sm font-semibold border border-white/10 text-white bg-white/10 outline-none appearance-none pr-8"
                value={selectedRoute?._id || ''}
                onChange={e => {
                  const r = routes.find(r => r._id === e.target.value);
                  if (r) { setRoute(r); setFromCity(r.fromCity); setToCity(r.toCity); }
                }}>
                {routes.map(r => <option key={r._id} value={r._id} className="text-black bg-white">{r.name}</option>)}
              </select>
              <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40 pointer-events-none" />
            </div>
          )}

          {/* From / To */}
          <div className="bg-white rounded-2xl p-4 mb-3">
            <div className="flex items-center gap-3">
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div className="w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-emerald-100" />
                <div className="w-0.5 h-5 bg-gray-200" />
                <div className="w-3 h-3 rounded-full bg-red-500 ring-2 ring-red-100" />
              </div>
              <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-0 sm:gap-6">
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">From</p>
                  <select value={fromCity} onChange={e => setFromCity(e.target.value)}
                    className="w-full text-sm font-bold text-gray-900 bg-transparent outline-none">
                    {waypoints.map(w => <option key={w.order} value={w.name}>{w.name}</option>)}
                  </select>
                </div>
                <div className="sm:hidden border-t border-gray-100 my-2" />
                <div>
                  <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-0.5">To</p>
                  <select value={toCity} onChange={e => setToCity(e.target.value)}
                    className="w-full text-sm font-bold text-gray-900 bg-transparent outline-none">
                    {waypoints.map(w => <option key={w.order} value={w.name}>{w.name}</option>)}
                  </select>
                </div>
              </div>
              <button onClick={swapCities}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-orange-50 border border-gray-200 hover:border-orange-200 flex items-center justify-center flex-shrink-0 transition-colors">
                <ArrowUpDown className="w-4 h-4 text-gray-600" />
              </button>
            </div>
          </div>

          <button onClick={() => refetch()} disabled={!fromCity || !toCity || isLoading}
            className="w-full py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-orange-400 shadow-lg shadow-orange-500/30 hover:shadow-orange-500/50 disabled:opacity-50 transition-all flex items-center justify-center gap-2">
            {isLoading
              ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching...</>
              : <><Search className="w-4 h-4" /> Search Restaurants</>}
          </button>
        </div>
      </div>

      {/* ── LOCATION DENIED BANNER ── */}
      {locState === 'denied' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-4">
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-amber-800">Location access denied</p>
              <p className="text-xs text-amber-600 mt-0.5">
                To see distances and sort by nearest, allow location in your browser settings → Site permissions → Location → Allow.
              </p>
            </div>
            <button onClick={() => { setLocState('idle'); requestLocation(); }}
              className="flex-shrink-0 flex items-center gap-1.5 text-xs font-bold text-amber-700 bg-amber-100 hover:bg-amber-200 px-3 py-1.5 rounded-lg transition-colors">
              <RefreshCw className="w-3 h-3" /> Retry
            </button>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-5">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            <p className="text-gray-400 text-sm">Finding restaurants on your route...</p>
          </div>

        ) : data ? (
          /* Desktop: sidebar + results | Mobile: stacked */
          <div className="grid grid-cols-1 lg:grid-cols-[260px_1fr] gap-6">

            {/* ── SIDEBAR (desktop) ── */}
            <div className="hidden lg:block">
              <div className="sticky top-[200px] space-y-3">

                {/* Search */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Search</p>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                    <input value={search} onChange={e => setSearch(e.target.value)}
                      placeholder="Restaurant or cuisine..."
                      className="w-full pl-8 pr-7 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-orange-400 transition-colors bg-gray-50" />
                    {search && <button onClick={() => setSearch('')} className="absolute right-2.5 top-1/2 -translate-y-1/2"><X className="w-3 h-3 text-gray-400" /></button>}
                  </div>
                </div>

                {/* Food Type */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Food Type</p>
                  <div className="space-y-1.5">
                    {FOOD_FILTERS.map(f => (
                      <button key={f.key} onClick={() => setFoodFilter(f.key)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-xs font-bold transition-all text-left ${foodFilter === f.key ? f.active : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'}`}>
                        <span className="text-sm">{f.icon}</span>
                        <span className="flex-1">{f.label}</span>
                        {foodFilter === f.key && <span className="w-1.5 h-1.5 rounded-full bg-current" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Sort */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2.5">Sort By</p>
                  <div className="space-y-1.5">
                    {SORT_OPTIONS.map(s => (
                      <button key={s.key} onClick={() => setSort(s.key)}
                        className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl border-2 text-xs font-bold transition-all text-left ${sort === s.key ? 'border-orange-400 text-orange-600 bg-orange-50' : 'border-gray-200 text-gray-600 bg-white hover:border-gray-300'}`}>
                        <span>{s.icon}</span>
                        <span className="flex-1">{s.label}</span>
                        {sort === s.key && <span className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Open Now */}
                <div className="bg-white rounded-2xl border border-gray-100 p-4">
                  <button onClick={() => setOpenOnly(!openOnly)}
                    className="w-full flex items-center justify-between">
                    <span className="flex items-center gap-2 text-xs font-bold text-gray-700">
                      <span className={`w-2 h-2 rounded-full ${openOnly ? 'bg-emerald-500 animate-pulse' : 'bg-gray-300'}`} />
                      Open Now Only
                    </span>
                    <div className={`w-9 h-5 rounded-full transition-colors relative ${openOnly ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                      <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${openOnly ? 'translate-x-4' : 'translate-x-0.5'}`} />
                    </div>
                  </button>
                </div>

                {/* Clear */}
                {hasFilters && (
                  <button onClick={() => { setFoodFilter('all'); setSort('default'); setOpenOnly(false); setSearch(''); }}
                    className="w-full flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-bold text-red-500 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors">
                    <X className="w-3 h-3" /> Clear All Filters
                  </button>
                )}

                {/* Location prompt */}
                {locState !== 'granted' && locState !== 'denied' && (
                  <div className="bg-blue-50 border border-blue-100 rounded-2xl p-4">
                    <p className="text-xs font-bold text-blue-700 mb-1">📍 Enable Location</p>
                    <p className="text-xs text-blue-500 mb-3 leading-relaxed">See how far each restaurant is from you and sort by nearest.</p>
                    <button onClick={requestLocation} disabled={locState === 'requesting'}
                      className="w-full py-2 rounded-xl text-xs font-bold text-white bg-blue-500 hover:bg-blue-600 transition-colors flex items-center justify-center gap-1.5 disabled:opacity-60">
                      {locState === 'requesting' ? <><Loader2 className="w-3 h-3 animate-spin" /> Locating...</> : <><Navigation className="w-3 h-3" /> Allow Location</>}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* ── RESULTS ── */}
            <div>
              {/* Mobile filters */}
              <div className="lg:hidden space-y-2.5 mb-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Search restaurants or cuisines..."
                    className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 bg-white transition-colors" />
                  {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
                </div>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
                  {FOOD_FILTERS.map(f => (
                    <button key={f.key} onClick={() => setFoodFilter(f.key)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${foodFilter === f.key ? f.active : 'border-gray-200 text-gray-600 bg-white'}`}>
                      {f.icon} {f.label}
                    </button>
                  ))}
                  <button onClick={() => setOpenOnly(!openOnly)}
                    className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${openOnly ? 'border-emerald-400 text-emerald-700 bg-emerald-50' : 'border-gray-200 text-gray-600 bg-white'}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${openOnly ? 'bg-emerald-500' : 'bg-gray-300'}`} /> Open Now
                  </button>
                </div>
                <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-0.5">
                  {SORT_OPTIONS.map(s => (
                    <button key={s.key} onClick={() => setSort(s.key)}
                      className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold border-2 transition-all ${sort === s.key ? 'border-orange-400 text-orange-600 bg-orange-50' : 'border-gray-200 text-gray-600 bg-white'}`}>
                      {s.icon} {s.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Mobile location prompt */}
              {locState !== 'granted' && locState !== 'denied' && restaurants.length > 0 && (
                <div className="lg:hidden mb-4 bg-blue-50 border border-blue-100 rounded-xl p-3 flex items-center gap-3">
                  <Navigation className="w-4 h-4 text-blue-500 flex-shrink-0" />
                  <p className="text-xs text-blue-600 flex-1">Enable location to see distances & sort by nearest</p>
                  <button onClick={requestLocation} disabled={locState === 'requesting'}
                    className="flex-shrink-0 text-xs font-bold text-white bg-blue-500 px-3 py-1.5 rounded-lg disabled:opacity-60">
                    {locState === 'requesting' ? '...' : 'Allow'}
                  </button>
                </div>
              )}

              {/* Results count */}
              <div className="flex items-center justify-between mb-3">
                <div>
                  <p className="font-extrabold text-gray-900 text-sm">
                    {restaurants.length} restaurant{restaurants.length !== 1 ? 's' : ''}
                    {hasFilters && totalAll > restaurants.length && <span className="text-gray-400 font-normal"> of {totalAll}</span>}
                    {aheadCount > 0 && userLocation && <span className="text-emerald-600"> · {aheadCount} ahead</span>}
                  </p>
                  {data.route?.name && (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                      <MapPin className="w-3 h-3" /> {data.route.name}
                      {userLocation && <span className="text-emerald-500 ml-1">· 📍 Distance shown</span>}
                    </p>
                  )}
                </div>
                {hasFilters && (
                  <button onClick={() => { setFoodFilter('all'); setSort('default'); setOpenOnly(false); setSearch(''); }}
                    className="lg:hidden text-xs font-bold text-red-500 flex items-center gap-1 border border-red-200 bg-red-50 px-2.5 py-1.5 rounded-lg">
                    <X className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>

              {/* Cards grid */}
              {restaurants.length > 0 ? (
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {restaurants.map(r => <RestaurantCard key={r._id} restaurant={r} />)}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-100">
                  <div className="text-4xl mb-3">🔍</div>
                  <p className="font-bold text-gray-600 text-sm mb-1">No restaurants match your filters</p>
                  <p className="text-gray-400 text-xs mb-4">Try changing food type or removing filters</p>
                  <button onClick={() => { setFoodFilter('all'); setSort('default'); setOpenOnly(false); setSearch(''); }}
                    className="text-sm font-bold text-orange-500 border border-orange-200 bg-orange-50 px-4 py-2 rounded-xl hover:bg-orange-100 transition-colors">
                    Clear Filters
                  </button>
                </div>
              )}
            </div>
          </div>

        ) : (
          /* Initial state */
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center text-4xl mb-5">🛣️</div>
            <p className="font-extrabold text-gray-800 text-lg mb-2">Ready to find food?</p>
            <p className="text-gray-400 text-sm mb-6 max-w-xs">Select your route above and tap Search to see restaurants along the way.</p>
            {locState !== 'granted' && locState !== 'denied' && (
              <button onClick={requestLocation} disabled={locState === 'requesting'}
                className="inline-flex items-center gap-2 text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-orange-400 px-5 py-2.5 rounded-xl shadow-md shadow-orange-200 hover:shadow-orange-300 transition-all disabled:opacity-60">
                {locState === 'requesting'
                  ? <><Loader2 className="w-4 h-4 animate-spin" /> Locating...</>
                  : <><Navigation className="w-4 h-4" /> Allow Location for Better Results</>}
              </button>
            )}
          </div>
        )}
      </div>

      <CartButton />
      <BottomNav />
    </div>
  );
}
