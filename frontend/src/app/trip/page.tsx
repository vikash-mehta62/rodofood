'use client';
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeftRight, MapPin, Navigation, Loader2, Search, X, Star, Clock, Zap, ChevronDown, AlertCircle } from 'lucide-react';
import { useRoutes, useRestaurantsByRoute } from '@/hooks/useRestaurants';
import { useTripStore } from '@/store/tripStore';
import BottomNav from '@/components/shared/BottomNav';
import CartButton from '@/components/customer/CartButton';
import Link from 'next/link';
import { resolveImage } from '@/lib/config';
import type { Restaurant } from '@/types';

type SortKey = 'default' | 'rating' | 'distance' | 'prepTime';
type FoodFilter = 'all' | 'veg' | 'non-veg';
type LocState = 'idle' | 'requesting' | 'granted' | 'denied' | 'unavailable';

const CHIPS = [
  { id: 'open',    label: '● Open Now',  type: 'toggle' },
  { id: 'veg',     label: '🟢 Pure Veg', type: 'food' },
  { id: 'non-veg', label: '🔴 Non-Veg',  type: 'food' },
  { id: 'rating',  label: '⭐ Top Rated', type: 'sort' },
  { id: 'distance',label: '📍 Nearest',  type: 'sort' },
  { id: 'prepTime',label: '⚡ Fastest',  type: 'sort' },
];

function RestaurantRow({ r }: { r: Restaurant }) {
  const img = resolveImage(r.coverImage);
  const isAhead = r.position === 'ahead';
  const isPassed = r.position === 'passed';
  return (
    <Link href={`/restaurants/${r._id}`}>
      <div className={`flex gap-3 bg-white rounded-2xl p-3 border border-gray-100 shadow-sm active:scale-[0.98] transition-all hover:shadow-md hover:border-orange-100 ${isPassed ? 'opacity-50' : ''}`}>
        {/* Image */}
        <div className="relative w-24 h-24 rounded-xl overflow-hidden flex-shrink-0 bg-orange-50">
          {img
            ? <img src={img} alt={r.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center text-3xl opacity-20">🍽️</div>
          }
          {/* Open badge */}
          <div className={`absolute bottom-1 left-1 text-[9px] font-black px-1.5 py-0.5 rounded-full ${r.isOpen ? 'bg-emerald-500 text-white' : 'bg-black/60 text-white/80'}`}>
            {r.isOpen ? '● Open' : '● Closed'}
          </div>
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0 py-0.5">
          <div className="flex items-start justify-between gap-1 mb-0.5">
            <h3 className="font-extrabold text-gray-900 text-sm leading-snug line-clamp-1">{r.name}</h3>
            {isAhead && (
              <span className="flex-shrink-0 text-[9px] font-black bg-orange-500 text-white px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                <Zap className="w-2 h-2" />Ahead
              </span>
            )}
          </div>

          {r.cuisines?.length > 0 && (
            <p className="text-[11px] text-gray-400 truncate mb-1.5">{r.cuisines.slice(0, 3).join(' · ')}</p>
          )}

          {/* Stats row */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-0.5">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-xs font-black text-gray-800">{r.rating.toFixed(1)}</span>
              {r.totalRatings > 0 && <span className="text-[10px] text-gray-400 ml-0.5">({r.totalRatings})</span>}
            </div>
            <div className="w-1 h-1 rounded-full bg-gray-200" />
            <div className="flex items-center gap-0.5 text-[11px] text-gray-500">
              <Clock className="w-3 h-3 text-orange-400" />
              <span className="font-bold text-gray-700">{r.avgPrepTimeMinutes}</span>min
            </div>
            {r.distanceKm != null && (
              <>
                <div className="w-1 h-1 rounded-full bg-gray-200" />
                <div className="flex items-center gap-0.5 text-[11px] text-gray-500">
                  <MapPin className="w-3 h-3 text-blue-400" />
                  <span className="font-bold text-gray-700">{r.distanceKm}km</span>
                </div>
              </>
            )}
          </div>

          {/* Address */}
          {r.address?.city && (
            <p className="text-[10px] text-gray-400 mt-1.5 truncate">{[r.address.street, r.address.city].filter(Boolean).join(', ')}</p>
          )}
        </div>
      </div>
    </Link>
  );
}

export default function TripPage() {
  const { selectedRoute, fromCity, toCity, userLocation, setRoute, setFromCity, setToCity, setUserLocation, swapCities } = useTripStore();
  const { data: routes } = useRoutes();
  const [sort, setSort] = useState<SortKey>('default');
  const [foodFilter, setFoodFilter] = useState<FoodFilter>('all');
  const [openOnly, setOpenOnly] = useState(false);
  const [search, setSearch] = useState('');
  const [locState, setLocState] = useState<LocState>('idle');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    if (routes?.length && !selectedRoute) {
      const r = routes[0]; setRoute(r); setFromCity(r.fromCity); setToCity(r.toCity);
    }
  }, [routes]);

  useEffect(() => {
    if (selectedRoute) {
      if (!fromCity) setFromCity(selectedRoute.fromCity);
      if (!toCity) setToCity(selectedRoute.toCity);
    }
  }, [selectedRoute]);

  useEffect(() => { if (userLocation) setLocState('granted'); }, []);

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
      pos => { setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocState('granted'); setTimeout(() => refetch(), 150); },
      err => setLocState(err.code === err.PERMISSION_DENIED ? 'denied' : 'unavailable'),
      { timeout: 10000, maximumAge: 60000 }
    );
  }, [setUserLocation, refetch]);

  const waypoints = selectedRoute?.waypoints || [];
  const cityOptions = waypoints.length > 0
    ? waypoints.map(w => w.name)
    : selectedRoute ? [selectedRoute.fromCity, selectedRoute.toCity].filter(Boolean) : [];

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
  const hasFilters = foodFilter !== 'all' || openOnly || sort !== 'default' || !!search;

  const toggleChip = (id: string) => {
    if (id === 'open')     setOpenOnly(v => !v);
    else if (id === 'veg') setFoodFilter(foodFilter === 'veg' ? 'all' : 'veg');
    else if (id === 'non-veg') setFoodFilter(foodFilter === 'non-veg' ? 'all' : 'non-veg');
    else if (id === 'rating')   setSort(sort === 'rating' ? 'default' : 'rating');
    else if (id === 'distance') setSort(sort === 'distance' ? 'default' : 'distance');
    else if (id === 'prepTime') setSort(sort === 'prepTime' ? 'default' : 'prepTime');
  };

  const isChipActive = (id: string) => {
    if (id === 'open') return openOnly;
    if (id === 'veg') return foodFilter === 'veg';
    if (id === 'non-veg') return foodFilter === 'non-veg';
    if (id === 'rating') return sort === 'rating';
    if (id === 'distance') return sort === 'distance';
    if (id === 'prepTime') return sort === 'prepTime';
    return false;
  };

  return (
    <div className="min-h-screen pb-24" style={{ background: '#F0F2F5' }}>

      {/* ══ HEADER ══ */}
      <div>
        {/* Dark top bar */}
        <div className="px-4 pt-4 pb-3" style={{ background: 'linear-gradient(160deg,#0D1117 0%,#1a1a2e 60%,#16213e 100%)' }}>

          {/* Route name + location btn */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-orange-500/20 flex items-center justify-center">
                <span className="text-sm">🛣️</span>
              </div>
              <div>
                <p className="text-white font-extrabold text-base leading-none">Highway Food</p>
                <p className="text-white/40 text-[10px] mt-0.5">
                  {data?.route?.name || selectedRoute?.name || 'Select your route'}
                </p>
              </div>
            </div>
            <button onClick={locState === 'denied' ? undefined : requestLocation} disabled={locState === 'requesting'}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-bold border transition-all ${
                locState === 'granted'    ? 'border-emerald-500/30 text-emerald-400 bg-emerald-500/10' :
                locState === 'denied'     ? 'border-red-500/30 text-red-400 bg-red-500/10 cursor-default' :
                locState === 'requesting' ? 'border-amber-500/30 text-amber-400 bg-amber-500/10' :
                'border-white/15 text-white/50 bg-white/5 hover:bg-white/10'
              }`}>
              {locState === 'requesting' ? <Loader2 className="w-3 h-3 animate-spin" /> :
               locState === 'granted'    ? <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" /> :
               <Navigation className="w-3 h-3" />}
              {locState === 'granted' ? 'GPS On' : locState === 'denied' ? 'Denied' : locState === 'requesting' ? 'Locating' : 'Location'}
            </button>
          </div>

          {/* Route selector pills (multiple routes) */}
          {routes && routes.length > 1 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-3 pb-0.5">
              {routes.map(r => (
                <button key={r._id} onClick={() => { setRoute(r); setFromCity(r.fromCity); setToCity(r.toCity); }}
                  className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-bold border transition-all ${
                    selectedRoute?._id === r._id
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'border-white/15 text-white/50 bg-white/5 hover:bg-white/10'
                  }`}>
                  {r.fromCity} → {r.toCity}
                </button>
              ))}
            </div>
          )}

          {/* From / To card */}
          <div className="bg-white rounded-2xl overflow-hidden shadow-xl">
            <div className="flex items-stretch">
              {/* From */}
              <div className="flex-1 px-4 py-3 border-r border-gray-100">
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">From</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 flex-shrink-0" />
                  <select value={fromCity} onChange={e => setFromCity(e.target.value)}
                    className="flex-1 text-sm font-extrabold text-gray-900 bg-transparent outline-none cursor-pointer min-w-0">
                    {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Swap */}
              <button onClick={swapCities}
                className="px-3 flex items-center justify-center bg-gray-50 hover:bg-orange-50 transition-colors border-r border-gray-100">
                <ArrowLeftRight className="w-4 h-4 text-orange-500" />
              </button>

              {/* To */}
              <div className="flex-1 px-4 py-3">
                <p className="text-[9px] text-gray-400 font-black uppercase tracking-widest mb-1">To</p>
                <div className="flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 flex-shrink-0" />
                  <select value={toCity} onChange={e => setToCity(e.target.value)}
                    className="flex-1 text-sm font-extrabold text-gray-900 bg-transparent outline-none cursor-pointer min-w-0">
                    {cityOptions.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Search button */}
            <button onClick={() => refetch()} disabled={!fromCity || !toCity || isLoading}
              className="w-full py-3 text-sm font-extrabold text-white flex items-center justify-center gap-2 disabled:opacity-50 transition-all"
              style={{ background: 'linear-gradient(90deg,#FF6B35,#FF8C42)' }}>
              {isLoading
                ? <><Loader2 className="w-4 h-4 animate-spin" />Searching...</>
                : <><Search className="w-4 h-4" />Search Restaurants</>}
            </button>
          </div>
        </div>
      </div>

      {/* Filter chips — scrolls with page, not sticky */}
      {data && (
        <div className="bg-white border-b border-gray-100 shadow-sm">            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide px-4 py-2.5">
              {/* Search toggle */}
              <button onClick={() => setShowSearch(v => !v)}
                className={`flex-shrink-0 flex items-center gap-1.5 h-8 px-3 rounded-full text-xs font-bold border transition-all ${showSearch || search ? 'border-orange-400 text-orange-600 bg-orange-50' : 'border-gray-200 text-gray-500 bg-gray-50'}`}>
                <Search className="w-3 h-3" />Search
              </button>

              {CHIPS.map(chip => (
                <button key={chip.id} onClick={() => toggleChip(chip.id)}
                  className={`flex-shrink-0 h-8 px-3 rounded-full text-xs font-bold border transition-all ${
                    isChipActive(chip.id)
                      ? 'border-orange-400 text-orange-600 bg-orange-50'
                      : 'border-gray-200 text-gray-500 bg-gray-50 hover:border-gray-300'
                  }`}>
                  {chip.label}
                </button>
              ))}

              {hasFilters && (
                <button onClick={() => { setFoodFilter('all'); setSort('default'); setOpenOnly(false); setSearch(''); setShowSearch(false); }}
                  className="flex-shrink-0 flex items-center gap-1 h-8 px-3 rounded-full text-xs font-bold border border-red-200 text-red-500 bg-red-50">
                  <X className="w-3 h-3" />Clear
                </button>
              )}
            </div>

            {/* Search input */}
            {showSearch && (
              <div className="px-4 pb-3">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input autoFocus value={search} onChange={e => setSearch(e.target.value)}
                    placeholder="Restaurant name or cuisine..."
                    className="w-full pl-9 pr-8 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 bg-gray-50 focus:bg-white transition-colors" />
                  {search && <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X className="w-4 h-4 text-gray-400" /></button>}
                </div>
              </div>
            )}
          </div>
        )}

      {/* ══ CONTENT ══ */}
      <div className="px-4 pt-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="relative">
              <div className="w-16 h-16 rounded-2xl bg-white shadow-lg flex items-center justify-center">
                <span className="text-3xl">🛣️</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-orange-500 rounded-full flex items-center justify-center">
                <Loader2 className="w-3.5 h-3.5 text-white animate-spin" />
              </div>
            </div>
            <p className="text-gray-500 text-sm font-medium">Finding restaurants on your route...</p>
          </div>

        ) : data ? (
          <>
            {/* Stats bar */}
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-extrabold text-gray-900 text-base">
                  {restaurants.length} {restaurants.length === 1 ? 'Restaurant' : 'Restaurants'}
                </p>
                <p className="text-xs text-gray-400 mt-0.5">
                  {data.route?.name}
                  {aheadCount > 0 && userLocation && (
                    <span className="text-emerald-600 font-semibold ml-1.5">· {aheadCount} ahead of you ⚡</span>
                  )}
                </p>
              </div>
              {locState !== 'granted' && locState !== 'denied' && (
                <button onClick={requestLocation} disabled={locState === 'requesting'}
                  className="flex items-center gap-1.5 text-xs font-bold text-blue-600 bg-blue-50 border border-blue-200 px-3 py-1.5 rounded-xl disabled:opacity-60">
                  <Navigation className="w-3 h-3" />
                  {locState === 'requesting' ? 'Locating...' : 'Enable GPS'}
                </button>
              )}
            </div>

            {/* Restaurant list */}
            {restaurants.length > 0 ? (
              <div className="space-y-3">
                {restaurants.map(r => <RestaurantRow key={r._id} r={r} />)}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-2xl border border-gray-100">
                <div className="text-4xl mb-3">🔍</div>
                <p className="font-bold text-gray-700 text-sm mb-1">No restaurants match</p>
                <p className="text-gray-400 text-xs mb-4">Try removing some filters</p>
                <button onClick={() => { setFoodFilter('all'); setSort('default'); setOpenOnly(false); setSearch(''); }}
                  className="text-sm font-bold text-orange-500 border border-orange-200 bg-orange-50 px-4 py-2 rounded-xl">
                  Clear Filters
                </button>
              </div>
            )}
          </>

        ) : (
          /* Empty state */
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl mb-6 shadow-2xl"
              style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
              🛣️
            </div>
            <p className="font-extrabold text-gray-900 text-xl mb-2">Plan your highway meal</p>
            <p className="text-gray-400 text-sm max-w-xs leading-relaxed mb-8">
              Select your route, set your cities, and find restaurants ready to serve you on arrival.
            </p>
            {locState !== 'granted' && locState !== 'denied' && (
              <button onClick={requestLocation} disabled={locState === 'requesting'}
                className="inline-flex items-center gap-2 text-sm font-bold text-white px-6 py-3 rounded-2xl shadow-lg transition-all disabled:opacity-60"
                style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)', boxShadow: '0 6px 24px rgba(255,107,53,0.4)' }}>
                {locState === 'requesting'
                  ? <><Loader2 className="w-4 h-4 animate-spin" />Locating...</>
                  : <><Navigation className="w-4 h-4" />Enable Location for Better Results</>}
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
