'use client';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { MapPin, ArrowRight, Star, Clock, ChevronRight, ShoppingBag, Utensils, Search, Tag, Zap, X, Calendar, Loader2 } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRoutes, useRestaurantsByRoute } from '@/hooks/useRestaurants';
import { useMyOrders } from '@/hooks/useOrders';
import { useActiveCoupons } from '@/hooks/useCms';
import { useTripStore } from '@/store/tripStore';
import BottomNav from '@/components/shared/BottomNav';
import RestaurantCard from '@/components/customer/RestaurantCard';
import CartButton from '@/components/customer/CartButton';
import NotificationBell from '@/components/customer/NotificationBell';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { formatCurrency } from '@/lib/utils';
import { resolveImage } from '@/lib/config';
import type { Restaurant } from '@/types';

const GREETING = () => {
  const h = new Date().getHours();
  if (h < 12) return { text: 'Good Morning', emoji: '☀️' };
  if (h < 17) return { text: 'Good Afternoon', emoji: '🌤️' };
  return { text: 'Good Evening', emoji: '🌙' };
};

const FOOD_CATEGORIES = [
  { emoji: '🍛', label: 'Thali' },
  { emoji: '🥣', label: 'Poha' },
  { emoji: '🍲', label: 'Dal Baati' },
  { emoji: '🥟', label: 'Kachori' },
  { emoji: '🫖', label: 'Chai' },
  { emoji: '🍚', label: 'Biryani' },
  { emoji: '🥗', label: 'Snacks' },
  { emoji: '🥛', label: 'Lassi' },
];

// Fallback offers if no coupons in DB
const FALLBACK_OFFERS = [
  { bg: 'linear-gradient(135deg,#FF6B35,#FF3D00)', emoji: '🎉', title: 'Pre-Order & Save', sub: 'Order before you arrive', code: '' },
  { bg: 'linear-gradient(135deg,#1D4ED8,#1E3A8A)', emoji: '🛣️', title: 'Highway Fresh Food', sub: 'Ready when you arrive', code: '' },
];

const OFFER_GRADIENTS = [
  'linear-gradient(135deg,#FF6B35,#FF3D00)',
  'linear-gradient(135deg,#F59E0B,#D97706)',
  'linear-gradient(135deg,#1D4ED8,#1E3A8A)',
  'linear-gradient(135deg,#7C3AED,#5B21B6)',
  'linear-gradient(135deg,#059669,#047857)',
];
const OFFER_EMOJIS = ['🎉', '🍛', '🌙', '⚡', '🎁'];

const STATUS_CFG: Record<string, { label: string; color: string; dot: string }> = {
  pending:   { label: 'Order Placed',   color: 'text-yellow-600 bg-yellow-50 border-yellow-200', dot: 'bg-yellow-400' },
  confirmed: { label: 'Confirmed',      color: 'text-blue-600 bg-blue-50 border-blue-200',       dot: 'bg-blue-400' },
  preparing: { label: 'Being Prepared', color: 'text-orange-600 bg-orange-50 border-orange-200', dot: 'bg-orange-400 animate-pulse' },
  ready:     { label: 'Ready to Pick',  color: 'text-green-600 bg-green-50 border-green-200',    dot: 'bg-green-400 animate-pulse' },
  completed: { label: 'Completed',      color: 'text-slate-600 bg-slate-50 border-slate-200',    dot: 'bg-slate-400' },
  cancelled: { label: 'Cancelled',      color: 'text-red-600 bg-red-50 border-red-200',          dot: 'bg-red-400' },
};

// Restaurant card — responsive grid card, click goes to restaurant page
function RestaurantGridCard({ restaurant }: { restaurant: Restaurant }) {
  const isPassed = restaurant.position === 'passed';
  const isAhead  = restaurant.position === 'ahead';
  const imgSrc   = resolveImage(restaurant.coverImage);

  return (
    <Link href={`/restaurants/${restaurant._id}`}>
      <div className={`bg-white rounded-2xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-lg hover:border-orange-200 hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full flex flex-col ${isPassed ? 'opacity-50 grayscale' : ''}`}>
        {/* Cover */}
        <div className="relative overflow-hidden bg-orange-50 flex-shrink-0" style={{ paddingTop: '56%' }}>
          <div className="absolute inset-0">
            {imgSrc
              ? <img src={imgSrc} alt={restaurant.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🍽️</div>
            }
            <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-transparent to-transparent" />
          </div>
          {/* Food type badge */}
          <div className="absolute top-2 left-2">
            <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded border backdrop-blur-sm ${
              restaurant.foodType === 'veg'     ? 'border-green-600 text-green-700 bg-green-50' :
              restaurant.foodType === 'non-veg' ? 'border-red-500 text-red-600 bg-red-50' :
                                                  'border-yellow-500 text-yellow-700 bg-yellow-50'
            }`}>
              {restaurant.foodType === 'veg' ? '🟢 Veg' : restaurant.foodType === 'non-veg' ? '🔴 Non-Veg' : '🟡 Both'}
            </span>
          </div>
          {/* Open/Closed */}
          <div className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${restaurant.isOpen ? 'bg-emerald-500 text-white' : 'bg-slate-700/90 text-white'}`}>
            {restaurant.isOpen ? '● OPEN' : '● CLOSED'}
          </div>
          {/* Rating */}
          <div className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-white/95 rounded px-1.5 py-0.5 shadow-sm">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-bold text-slate-800">{restaurant.rating.toFixed(1)}</span>
          </div>
          {/* Distance */}
          {restaurant.distanceKm != null && (
            <div className="absolute bottom-2 right-2 flex items-center gap-0.5 bg-white/95 rounded px-1.5 py-0.5 shadow-sm">
              <MapPin className="w-2.5 h-2.5 text-blue-500" />
              <span className="text-[9px] font-bold text-slate-700">{restaurant.distanceKm} km</span>
            </div>
          )}
          {/* Ahead badge */}
          {isAhead && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2">
              <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-orange-500 text-white flex items-center gap-0.5">
                <Zap className="w-2.5 h-2.5" /> Ahead
              </span>
            </div>
          )}
        </div>
        {/* Info */}
        <div className="p-2.5 flex flex-col flex-1">
          <h3 className="font-bold text-slate-900 text-xs leading-snug mb-0.5 line-clamp-1">{restaurant.name}</h3>
          {restaurant.cuisines?.length > 0 && (
            <p className="text-[10px] text-slate-400 mb-1 truncate">{restaurant.cuisines.join(' · ')}</p>
          )}
          <div className="flex items-center gap-2 text-[10px] text-slate-500 mt-auto">
            <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5 text-orange-400" />{restaurant.avgPrepTimeMinutes}m</span>
            <span className="truncate text-slate-400">{restaurant.address?.city}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function HomeContent() {
  const { user } = useAuthStore();
  const { data: routes } = useRoutes();
  const { data: orders } = useMyOrders();
  const { data: liveCoupons } = useActiveCoupons();
  const { selectedRoute, fromCity, toCity, setRoute, setFromCity, setToCity } = useTripStore();
  const [offerIdx, setOfferIdx] = useState(0);
  const [filterVeg, setFilterVeg] = useState(false);
  const [filterOpen, setFilterOpen] = useState(false);
  const [userLoc, setUserLoc] = useState<{ lat: number; lng: number } | null>(null);
  const greeting = GREETING();

  const searchParams = useSearchParams();
  const [scannedStop, setScannedStop] = useState<{
    fromCity: string;
    stopNumber?: string;
    stopDuration?: string;
    stopTime?: string;
  } | null>(null);

  const [liveTimeStr, setLiveTimeStr] = useState('');
  const [liveTimeMinutes, setLiveTimeMinutes] = useState(0);

  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setLiveTimeMinutes(d.getHours() * 60 + d.getMinutes());
      let hours = d.getHours();
      const mins = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      setLiveTimeStr(`${String(hours).padStart(2, '0')}:${mins} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  const parseTimeToMinutes = (timeStr: string): number => {
    if (!timeStr) return 0;
    const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
    if (!match) return 0;
    const [_, hoursStr, minutesStr, meridiemRaw] = match;
    let hours = parseInt(hoursStr, 10);
    const minutes = parseInt(minutesStr, 10);
    const meridiem = meridiemRaw.toUpperCase();

    if (meridiem === 'PM' && hours !== 12) hours += 12;
    if (meridiem === 'AM' && hours === 12) hours = 0;

    return hours * 60 + minutes;
  };

  const { data: routeTimelineData } = useQuery({
    queryKey: ['route-timeline', selectedRoute?._id],
    queryFn: async () => {
      if (!selectedRoute?._id) return null;
      return (await api.get(`/qrs/route/${selectedRoute._id}`)).data.data.qrs;
    },
    enabled: !!selectedRoute?._id,
  });
  const timelineStops = routeTimelineData || [];

  // Build offers from live DB coupons, fallback to static if none
  const offers = liveCoupons?.length
    ? liveCoupons.map((c, i) => ({
        bg: OFFER_GRADIENTS[i % OFFER_GRADIENTS.length],
        emoji: OFFER_EMOJIS[i % OFFER_EMOJIS.length],
        title: c.discountType === 'percentage'
          ? `${c.discountValue}% OFF`
          : `₹${c.discountValue} Off`,
        sub: c.description || (c.minOrderAmount > 0 ? `Min order ₹${c.minOrderAmount}` : 'No minimum order'),
        code: c.code,
      }))
    : FALLBACK_OFFERS;

  useEffect(() => {
    if (!routes?.length) return;

    const routeIdParam = searchParams.get('routeId');
    const fromCityParam = searchParams.get('fromCity');
    const toCityParam = searchParams.get('toCity');
    const stopNumParam = searchParams.get('stopNumber');
    const stopDurParam = searchParams.get('stopDuration');
    const stopTimeParam = searchParams.get('stopTime');

    if (routeIdParam) {
      const matchedRoute = routes.find(r => r._id === routeIdParam);
      if (matchedRoute) {
        setRoute(matchedRoute);
        const resolvedFrom = fromCityParam || matchedRoute.fromCity;
        const resolvedTo = toCityParam || matchedRoute.toCity;
        setFromCity(resolvedFrom);
        setToCity(resolvedTo);

        if (fromCityParam) {
          setScannedStop({
            fromCity: resolvedFrom,
            stopNumber: stopNumParam || undefined,
            stopDuration: stopDurParam || undefined,
            stopTime: stopTimeParam || undefined,
          });
        }
        return;
      }
    }

    if (!selectedRoute) {
      setRoute(routes[0]); setFromCity(routes[0].fromCity); setToCity(routes[0].toCity);
    }
  }, [routes, searchParams]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => setUserLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => {}
      );
    }
  }, []);

  // Auto-rotate offer banner
  useEffect(() => {
    if (!offers.length) return;
    const t = setInterval(() => setOfferIdx(i => (i + 1) % offers.length), 4000);
    return () => clearInterval(t);
  }, [offers.length]);

  const activeRoute = selectedRoute || routes?.[0];
  const activeFrom = fromCity || activeRoute?.fromCity || '';
  const activeTo = toCity || activeRoute?.toCity || '';

  const { data: routeData, isLoading: restaurantsLoading } = useRestaurantsByRoute({
    routeId: activeRoute?._id || '',
    fromCity: activeFrom,
    toCity: activeTo,
    userLat: userLoc?.lat,
    userLng: userLoc?.lng,
  });

  let restaurants = routeData?.restaurants || [];
  if (filterVeg) restaurants = restaurants.filter(r => r.foodType === 'veg');
  if (filterOpen) restaurants = restaurants.filter(r => r.isOpen);
  // Sort by distance when GPS is available, otherwise keep default order
  if (userLoc) {
    restaurants = [...restaurants].sort((a, b) => (a.distanceKm ?? 9999) - (b.distanceKm ?? 9999));
  }
  const displayRestaurants = restaurants;

  const activeOrder = orders?.find(o => ['pending', 'confirmed', 'preparing', 'ready'].includes(o.status));
  const recentOrders = orders?.slice(0, 3) || [];

  return (
    <div className="min-h-screen pb-28" style={{ background: '#F8FAFC' }}>

      {/* ── HEADER ── */}
      <div className="relative overflow-hidden px-4 pt-14 pb-5"
        style={{ background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,107,53,0.5) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-slate-400 text-xs font-medium">{greeting.emoji} {greeting.text}</p>
              <h1 className="text-xl font-black text-white mt-0.5">{user?.name?.split(' ')[0] || 'Traveler'}!</h1>
              {activeFrom && activeTo && (
                <p className="text-slate-400 text-[11px] font-medium mt-0.5 flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-orange-400" />{activeFrom} → {activeTo}
                  {userLoc && <span className="text-green-400 ml-1">· 📍 Location On</span>}
                </p>
              )}
            </div>
            <Link href="/profile">
              <div className="w-11 h-11 rounded-2xl flex items-center justify-center text-white font-black text-base shadow-lg border-2 border-white/20"
                style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                {(user?.name?.[0] || 'U').toUpperCase()}
              </div>
            </Link>
            <NotificationBell />
          </div>

          {/* Search */}
          <Link href="/trip">
            <div className="flex items-center gap-3 bg-white rounded-2xl px-4 py-3 mb-3 shadow-sm">
              <Search className="w-4 h-4 text-slate-400 flex-shrink-0" />
              <span className="text-slate-400 text-sm font-medium flex-1">Search restaurants on your route...</span>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                <ArrowRight className="w-3.5 h-3.5 text-white" />
              </div>
            </div>
          </Link>

          {/* Route pills */}
          {routes && routes.length > 0 && (
            <div className="flex gap-2 overflow-x-auto scrollbar-hide">
              {routes.map(route => (
                <button key={route._id}
                  onClick={() => { setRoute(route); setFromCity(route.fromCity); setToCity(route.toCity); }}
                  className={`flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border transition-all ${
                    activeRoute?._id === route._id ? 'text-white border-orange-400' : 'border-white/20 text-slate-400 bg-white/5'
                  }`}
                  style={activeRoute?._id === route._id ? { background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' } : {}}>
                  <MapPin className="w-3 h-3" />{route.fromCity} → {route.toCity}
                </button>
              ))}
            </div>
          )}

          {/* Active order */}
          {activeOrder && (
            <Link href={`/orders/${activeOrder._id}`}>
              <div className="mt-3 rounded-2xl p-3 flex items-center gap-3 border border-orange-500/30"
                style={{ background: 'rgba(255,107,53,0.15)' }}>
                <div className="w-8 h-8 rounded-xl bg-orange-500 flex items-center justify-center flex-shrink-0 animate-pulse">
                  <Utensils className="w-4 h-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-xs font-black">Active Order #{activeOrder.orderNumber}</p>
                  <p className="text-orange-300 text-[10px] font-medium">{STATUS_CFG[activeOrder.status]?.label} — Tap to track</p>
                </div>
                <ChevronRight className="w-4 h-4 text-orange-300 flex-shrink-0" />
              </div>
            </Link>
          )}
        </div>
      </div>

      <div className="px-4 py-4 space-y-5">

        {scannedStop && (
          <div className="bg-gradient-to-r from-orange-500 to-amber-500 rounded-2xl p-4 shadow-lg text-white relative overflow-hidden">
            <div className="absolute inset-0 opacity-[0.08]"
              style={{ backgroundImage: 'radial-gradient(circle, #fff 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
            <div className="relative z-10 flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="bg-white/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                    📍 Scanned stop
                  </span>
                  {scannedStop.stopNumber && (
                    <span className="bg-amber-950/20 text-white text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-wider">
                      Stop #{scannedStop.stopNumber}
                    </span>
                  )}
                </div>
                <h3 className="text-base font-black mt-1">You are at {scannedStop.fromCity}</h3>
                <div className="flex items-center gap-4 mt-2 text-xs font-bold text-white/90 flex-wrap">
                  {scannedStop.stopDuration && (
                    <p className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-white" /> Stops for: {scannedStop.stopDuration}
                    </p>
                  )}
                  {scannedStop.stopTime && (
                    <p className="flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-white" /> Arrival Time: {scannedStop.stopTime}
                    </p>
                  )}
                </div>
                <p className="text-[10px] font-semibold text-white/70 mt-2">
                  Order from the restaurants below. Food will be delivered directly to your seat at this stop!
                </p>
              </div>
              <button onClick={() => setScannedStop(null)}
                className="w-7 h-7 rounded-full bg-white/10 flex items-center justify-center hover:bg-white/20 transition-colors flex-shrink-0">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
          </div>
        )}

        {timelineStops.length > 0 && (
          <div className="bg-white rounded-3xl p-5 border border-slate-100 shadow-xl space-y-4 relative overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-50 flex-wrap gap-2">
              <div>
                <span className="bg-orange-50 text-orange-600 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-orange-100 flex items-center gap-1">
                  🛣️ Live Trip Timeline
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                <Clock className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                <span>Live Time: {liveTimeStr}</span>
              </div>
            </div>

            {/* Timeline Tree */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
              {timelineStops.map((stop: any) => {
                const stopMinutes = parseTimeToMinutes(stop.stopTime);
                const isPassed = stopMinutes <= liveTimeMinutes;
                const rest = stop.restaurant;

                if (!rest) return null;

                return (
                  <div key={stop._id} className="relative group">
                    {/* Circle Indicator */}
                    <span className={`absolute -left-[22px] top-1.5 w-3 h-3 rounded-full border-2 bg-white z-10 transition-all ${
                      isPassed 
                        ? 'border-red-450 scale-95 shadow-[0_0_8px_rgba(239,68,68,0.2)]' 
                        : 'border-green-500 scale-110 shadow-[0_0_12px_rgba(34,197,94,0.4)]'
                    }`}>
                      {!isPassed && <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />}
                    </span>

                    {/* Content Block */}
                    <div className={`p-3.5 rounded-2xl border transition-all ${
                      isPassed 
                        ? 'bg-slate-50/50 border-slate-100 opacity-60' 
                        : 'bg-white border-slate-100 shadow-sm hover:border-orange-200 hover:shadow-md'
                    }`}>
                      <div className="flex items-start justify-between gap-3 flex-wrap">
                        <div className="flex-1 min-w-[150px]">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                              Stop #{stop.stopNumber}
                            </span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md ${
                              isPassed 
                                ? 'bg-red-50 text-red-650 border border-red-100' 
                                : 'bg-green-50 text-green-700 border border-green-100'
                            }`}>
                              {isPassed ? '● Passed' : '● Upcoming'}
                            </span>
                          </div>
                          <h4 className={`text-xs font-black mt-1 ${isPassed ? 'text-slate-550 line-through' : 'text-slate-900'}`}>
                            {stop.waypoint} Stop
                          </h4>
                          
                          <div className="flex items-center gap-3 mt-1.5 text-[10px] text-slate-500 font-bold flex-wrap">
                            <span className="flex items-center gap-0.5"><Clock className="w-3 h-3" /> Arrive: {stop.stopTime}</span>
                            {stop.stopDuration && (
                              <span className="flex items-center gap-0.5"><Calendar className="w-3 h-3" /> Stops: {stop.stopDuration}</span>
                            )}
                          </div>
                        </div>

                        {/* Restaurant Selector */}
                        <div className="flex-shrink-0">
                          {isPassed ? (
                            <span className="text-[10px] font-black text-slate-400 bg-slate-100 px-3 py-2 rounded-xl block border border-slate-200">
                              Order Closed
                            </span>
                          ) : (
                            <Link href={`/restaurants/${rest._id}?routeId=${selectedRoute?._id}&fromCity=${stop.waypoint}&stopNumber=${stop.stopNumber}&stopTime=${stop.stopTime}&stopDuration=${stop.stopDuration}`}>
                              <span className="text-[10px] font-black text-white px-3.5 py-2 rounded-xl block shadow-sm hover:opacity-90 transition-opacity cursor-pointer text-center"
                                style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                                Order from {rest.name}
                              </span>
                            </Link>
                          )}
                        </div>
                      </div>

                      {/* Small Restaurant details snippet */}
                      {!isPassed && (
                        <div className="mt-3 pt-3 border-t border-slate-50 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg overflow-hidden bg-slate-50 flex-shrink-0">
                            <img src={resolveImage(rest.coverImage) || undefined} alt={rest.name} className="w-full h-full object-cover" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black text-slate-800 truncate">{rest.name}</p>
                            <p className="text-[9px] text-slate-400 font-medium truncate">{rest.cuisines?.join(', ')}</p>
                          </div>
                          <div className="flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded text-[9px] font-black text-green-700">
                            ★ {rest.rating?.toFixed(1)}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ── OFFER BANNER (rotating, from DB coupons) ── */}
        <div className="relative overflow-hidden rounded-2xl shadow-lg" style={{ background: offers[offerIdx]?.bg }}>
          <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          <div className="relative z-10 p-4 flex items-center justify-between">
            <div>
              <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-0.5">Limited Offer</p>
              <p className="text-white font-black text-lg leading-tight">{offers[offerIdx]?.title}</p>
              <p className="text-white/70 text-xs font-medium mt-0.5">{offers[offerIdx]?.sub}</p>
              {offers[offerIdx]?.code && (
                <div className="mt-2 inline-flex items-center gap-1.5 bg-white/20 rounded-lg px-2.5 py-1">
                  <Tag className="w-3 h-3 text-white" />
                  <span className="text-white text-xs font-black tracking-wider">{offers[offerIdx].code}</span>
                </div>
              )}
            </div>
            <span className="text-5xl flex-shrink-0">{offers[offerIdx]?.emoji}</span>
          </div>
          {/* Dots */}
          <div className="flex justify-center gap-1.5 pb-3">
            {offers.map((_, i) => (
              <button key={i} onClick={() => setOfferIdx(i)}
                className={`rounded-full transition-all ${i === offerIdx ? 'w-4 h-1.5 bg-white' : 'w-1.5 h-1.5 bg-white/40'}`} />
            ))}
          </div>
        </div>

        {/* ── WHAT'S ON YOUR MIND (Zomato-style) ── */}
        <div>
          <h2 className="font-black text-slate-900 text-base mb-3">What&apos;s on your mind?</h2>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-1">
            {FOOD_CATEGORIES.map(({ emoji, label }) => (
              <Link key={label} href="/trip">
                <div className="flex-shrink-0 flex flex-col items-center gap-1.5 cursor-pointer group">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl bg-white border border-slate-100 shadow-sm group-hover:shadow-md group-hover:border-orange-200 transition-all">
                    {emoji}
                  </div>
                  <span className="text-[10px] font-black text-slate-600 text-center">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── RESTAURANTS ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="font-black text-slate-900 text-base">Restaurants on Route</h2>
              {activeRoute && (
                <p className="text-xs text-slate-400 font-medium mt-0.5">
                  {activeFrom} → {activeTo}{activeRoute.totalDistanceKm ? ` · ${activeRoute.totalDistanceKm} km` : ''}
                </p>
              )}
            </div>
            <Link href="/trip">
              <span className="text-xs text-orange-500 font-black flex items-center gap-1">See All <ArrowRight className="w-3 h-3" /></span>
            </Link>
          </div>

          {/* Filter chips */}
          <div className="flex gap-2 mb-4">
            <button onClick={() => setFilterVeg(!filterVeg)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border transition-all ${filterVeg ? 'bg-green-500 text-white border-green-500' : 'bg-white border-slate-200 text-slate-500'}`}>
              🟢 Pure Veg
            </button>
            <button onClick={() => setFilterOpen(!filterOpen)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border transition-all ${filterOpen ? 'bg-green-500 text-white border-green-500' : 'bg-white border-slate-200 text-slate-500'}`}>
              ● Open Now
            </button>
            <Link href="/trip">
              <button className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black border bg-white border-slate-200 text-slate-500">
                <Zap className="w-3 h-3" /> Sort
              </button>
            </Link>
          </div>

          {restaurantsLoading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
              {[1,2,3,4,5,6,7,8,9,10].map(i => (
                <div key={i} className="bg-white rounded-2xl overflow-hidden border border-slate-100 animate-pulse">
                  <div className="w-full bg-slate-100" style={{ paddingTop: '56%' }} />
                  <div className="p-2.5 space-y-1.5">
                    <div className="h-3 bg-slate-100 rounded w-3/4" />
                    <div className="h-2.5 bg-slate-100 rounded w-1/2" />
                  </div>
                </div>
              ))}
            </div>
          ) : displayRestaurants.length > 0 ? (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {displayRestaurants.map(r => (
                  <RestaurantGridCard key={r._id} restaurant={r} />
                ))}
              </div>
              {displayRestaurants.length < restaurants.length && (
                <Link href="/trip">
                  <div className="mt-3 bg-white border-2 border-dashed border-orange-200 rounded-2xl p-4 text-center hover:border-orange-400 transition-colors">
                    <p className="font-black text-orange-500 text-sm">+{restaurants.length - 8} more restaurants →</p>
                  </div>
                </Link>
              )}
            </>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-100 p-8 text-center">
              <div className="text-4xl mb-3">🛣️</div>
              <p className="font-black text-slate-400 text-sm">No restaurants found</p>
              <p className="text-slate-300 text-xs font-medium mt-1">
                {filterVeg || filterOpen ? 'Try removing filters' : 'Select a route to see restaurants'}
              </p>
              <Link href="/trip">
                <button className="mt-4 text-white text-xs font-black px-5 py-2.5 rounded-xl"
                  style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                  Browse Routes
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* ── RECENT ORDERS ── */}
        {recentOrders.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-black text-slate-900 text-base">Recent Orders</h2>
              <Link href="/orders">
                <span className="text-xs text-orange-500 font-black flex items-center gap-1">View All <ArrowRight className="w-3 h-3" /></span>
              </Link>
            </div>
            <div className="space-y-2.5">
              {recentOrders.map(order => {
                const cfg = STATUS_CFG[order.status] || STATUS_CFG.pending;
                const restaurantName = typeof order.restaurant === 'object' ? (order.restaurant as any)?.name : null;
                return (
                  <Link key={order._id} href={`/orders/${order._id}`}>
                    <div className="bg-white border border-slate-100 rounded-2xl p-4 hover:shadow-md transition-all flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                        <ShoppingBag className="w-5 h-5 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-sm font-black text-slate-900 truncate">{restaurantName || `Order #${order.orderNumber}`}</p>
                          <span className={`flex-shrink-0 text-[10px] font-black px-2 py-0.5 rounded-full border flex items-center gap-1 ${cfg.color}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 font-medium mt-0.5">
                          {order.items.length} item{order.items.length > 1 ? 's' : ''} · {formatCurrency(order.totalAmount)}
                        </p>
                      </div>
                      <ChevronRight className="w-4 h-4 text-slate-300 flex-shrink-0" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {/* ── PLAN TRIP CTA ── */}
        <Link href="/trip">
          <div className="rounded-3xl p-5 flex items-center justify-between shadow-xl hover:shadow-2xl transition-all active:scale-[0.98]"
            style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)', boxShadow: '0 8px 32px rgba(255,107,53,0.35)' }}>
            <div>
              <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1">Plan Ahead</p>
              <p className="text-white font-black text-xl leading-tight">Find Food on Route</p>
              <p className="text-white/70 text-xs mt-1.5 flex items-center gap-1">
                <MapPin className="w-3 h-3" />Filter · Sort · Pre-order
              </p>
            </div>
            <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center flex-shrink-0">
              <span className="text-4xl">🛣️</span>
            </div>
          </div>
        </Link>

      </div>

      <CartButton />
      <BottomNav />
    </div>
  );
}

export default function HomePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    }>
      <HomeContent />
    </Suspense>
  );
}
