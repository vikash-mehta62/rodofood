'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  MapPin, Clock, Zap, ShieldCheck, Smartphone,
  Star, ArrowRight, Truck, Utensils, Navigation,
  CheckCircle, Gift, Percent, ChevronRight, Play
} from 'lucide-react';
import { API_URL, BASE_URL, resolveImage } from '@/lib/config';
import { translations, type Lang } from '@/lib/i18n';

const API = API_URL;
const BASE = BASE_URL;

function useLandingData() {
  return useQuery({
    queryKey: ['landing-data'],
    queryFn: async () => {
      const routesRes = await fetch(`${API}/routes`).catch(() => null);
      if (!routesRes?.ok) return { route: null, restaurants: [], stops: [], coupons: [] };
      const routesData = await routesRes.json();
      const routes: any[] = routesData?.data?.routes ?? routesData?.data ?? [];
      if (!routes.length) return { route: null, restaurants: [], stops: [], coupons: [] };
      const route = routes[0];
      const stops = (route.waypoints ?? [])
        .sort((a: any, b: any) => a.order - b.order)
        .map((w: any, idx: number, arr: any[]) => ({
          name: w.name,
          isCity: idx === 0 || idx === arr.length - 1,
          emoji: idx === 0 || idx === arr.length - 1 ? '🏙️' : idx % 2 === 0 ? '🛣️' : '🍽️',
        }));
      const params = new URLSearchParams({ routeId: route._id, fromCity: route.fromCity ?? '', toCity: route.toCity ?? '' });
      const [restRes, couponRes] = await Promise.all([
        fetch(`${API}/restaurants/by-route?${params}`).catch(() => null),
        fetch(`${API}/coupons/public`).catch(() => null),
      ]);
      const restData = restRes?.ok ? await restRes.json() : null;
      const couponData = couponRes?.ok ? await couponRes.json() : null;
      return {
        route,
        restaurants: (restData?.data?.restaurants ?? []).slice(0, 6) as any[],
        stops,
        coupons: (couponData?.data?.coupons ?? []) as any[],
      };
    },
    staleTime: 5 * 60 * 1000,
    retry: false,
  });
}

const FOOD_BADGE: Record<string, { label: string; cls: string; dot: string }> = {
  veg:       { label: 'Pure Veg',      cls: 'text-emerald-700 bg-emerald-50 border-emerald-200', dot: 'bg-emerald-500' },
  'non-veg': { label: 'Non-Veg',       cls: 'text-rose-700 bg-rose-50 border-rose-200',          dot: 'bg-rose-500' },
  both:      { label: 'Veg & Non-Veg', cls: 'text-amber-700 bg-amber-50 border-amber-200',       dot: 'bg-amber-500' },
};

const OFFER_GRADIENTS = [
  'from-orange-600 via-orange-500 to-red-500',
  'from-amber-500 via-yellow-500 to-amber-400',
  'from-violet-600 via-purple-600 to-indigo-600',
  'from-blue-700 via-blue-600 to-indigo-600',
  'from-emerald-600 via-emerald-500 to-teal-500',
];
const OFFER_EMOJIS = ['🎉', '🍛', '👨‍👩‍👧‍👦', '🌙', '⚡'];
const OFFER_TAG_BG = ['bg-red-500', 'bg-amber-600', 'bg-violet-500', 'bg-blue-600', 'bg-emerald-600'];

function buildOffers(coupons: any[]) {
  if (!coupons?.length) return [];
  return coupons.map((c: any, i: number) => ({
    id: c._id,
    tag: c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} OFF`,
    title: c.discountType === 'percentage' ? `${c.discountValue}% OFF` : `₹${c.discountValue} Off`,
    subtitle: c.description || (c.minOrderAmount > 0 ? `Min order ₹${c.minOrderAmount}` : 'No minimum order'),
    desc: c.description || `Use code ${c.code} to save on your order.`,
    code: c.code,
    savings: c.discountType === 'percentage'
      ? (c.maxDiscountAmount ? `Up to ₹${c.maxDiscountAmount} Off` : `${c.discountValue}% Off`)
      : `Save ₹${c.discountValue}`,
    gradient: OFFER_GRADIENTS[i % OFFER_GRADIENTS.length],
    emoji: OFFER_EMOJIS[i % OFFER_EMOJIS.length],
    expiry: new Date(c.validUntil).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    tagBg: OFFER_TAG_BG[i % OFFER_TAG_BG.length],
    savingsBg: 'bg-emerald-500',
  }));
}

const TESTIMONIALS = [
  { name: 'Rahul Sharma', rating: 5, text: 'Absolutely brilliant! My food was ready by the time I arrived. Did not wait even a minute.' },
  { name: 'Priya Verma', rating: 5, text: 'Made our family road trip so much better. Fresh food for the kids, no long stops. Highly recommend!' },
  { name: 'Amit Patel', rating: 5, text: 'I drive long routes daily and use this every day. Saves both time and money. Best app for highway travellers!' },
];

/* ── Restaurant Card (compact grid style) ── */
function RestaurantCard({ r }: { r: any }) {
  const ft = FOOD_BADGE[r.foodType] ?? FOOD_BADGE.both;
  const imgSrc = resolveImage(r.coverImage);
  return (
    <Link href={`/restaurants/${r._id}`}>
      <div className="group bg-white rounded-2xl overflow-hidden border border-gray-100 hover:border-orange-200 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer h-full flex flex-col">
        <div className="relative overflow-hidden bg-orange-50 flex-shrink-0" style={{ paddingTop: '60%' }}>
          <div className="absolute inset-0">
            {imgSrc
              ? <img src={imgSrc} alt={r.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
              : <div className="w-full h-full flex items-center justify-center text-4xl opacity-20">🍽️</div>
            }
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          </div>
          <div className="absolute top-2 left-2">
            <span className={`inline-flex items-center gap-1 text-[9px] font-semibold px-1.5 py-0.5 rounded border ${ft.cls}`}>
              <span className={`w-1 h-1 rounded-full ${ft.dot}`} />{ft.label}
            </span>
          </div>
          <div className={`absolute top-2 right-2 text-[9px] font-bold px-2 py-0.5 rounded-full ${r.isOpen ? 'bg-emerald-500 text-white' : 'bg-gray-600 text-white'}`}>
            {r.isOpen ? '● OPEN' : '● CLOSED'}
          </div>
          <div className="absolute bottom-2 left-2 flex items-center gap-0.5 bg-white/95 backdrop-blur-sm rounded px-1.5 py-0.5 shadow-sm">
            <Star className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />
            <span className="text-[10px] font-bold text-gray-800">{r.rating?.toFixed(1)}</span>
          </div>
        </div>
        <div className="p-2.5 flex flex-col flex-1">
          <h3 className="font-bold text-gray-900 text-xs leading-snug mb-0.5 line-clamp-1">{r.name}</h3>
          {r.cuisines?.length > 0 && <p className="text-[10px] text-gray-400 mb-1 truncate">{r.cuisines.join(' · ')}</p>}
          <div className="flex items-center gap-2 text-[10px] text-gray-500 mt-auto">
            <span className="flex items-center gap-0.5"><Clock className="w-2.5 h-2.5 text-orange-400" />{r.avgPrepTimeMinutes}m</span>
            <span className="truncate text-gray-400">{r.address?.city}</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

/* ── Live Restaurants Section ── */
function LiveRestaurantsSection({ restaurants, isLoading }: { restaurants: any[]; isLoading: boolean }) {
  return (
    <section id="restaurants" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-widest bg-orange-100 px-3 py-1 rounded-full mb-3">
              <MapPin className="w-3 h-3" /> On the Route
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900">
              Restaurants on the <span className="text-orange-500">Highway 🛣️</span>
            </h2>
            <p className="text-gray-500 text-sm mt-1.5 max-w-md">Pre-order from verified restaurants. Your food will be ready when you arrive.</p>
          </div>
          <Link href="/login" className="flex-shrink-0">
            <button className="inline-flex items-center gap-2 text-sm font-bold text-orange-600 border border-orange-200 bg-orange-50 hover:bg-orange-100 px-4 py-2 rounded-xl transition-colors">
              View All <ChevronRight className="w-4 h-4" />
            </button>
          </Link>
        </div>
        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {[1,2,3,4,5,6,7,8,9,10].map(i => (
              <div key={i} className="bg-white rounded-2xl overflow-hidden border border-gray-100 animate-pulse">
                <div className="w-full bg-gray-100" style={{ paddingTop: '60%' }} />
                <div className="p-2.5 space-y-1.5">
                  <div className="h-3 bg-gray-100 rounded w-3/4" />
                  <div className="h-2.5 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        ) : !restaurants?.length ? (
          <div className="flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-gray-100">
            <span className="text-5xl mb-4">🍽️</span>
            <p className="text-gray-800 font-bold text-lg mb-1">No restaurants found</p>
            <p className="text-gray-400 text-sm max-w-xs">We&apos;re adding more restaurants soon. Check back later!</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {restaurants.map((r: any) => <RestaurantCard key={r._id} r={r} />)}
          </div>
        )}
      </div>
    </section>
  );
}

/* ── Navbar GPS — GPS only, no network fallback ── */
function NavLocation() {
  const [state, setState] = useState<'idle' | 'loading' | 'granted' | 'denied'>('idle');
  const request = () => {
    if (!navigator.geolocation) { setState('denied'); return; }
    setState('loading');
    navigator.geolocation.getCurrentPosition(
      () => setState('granted'),
      () => setState('denied'),
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };
  if (state === 'idle') return (
    <button onClick={request} className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-gray-500 hover:text-orange-500 border border-gray-200 hover:border-orange-300 px-3 py-1.5 rounded-lg transition-all">
      <Navigation className="w-3.5 h-3.5" /> Location
    </button>
  );
  if (state === 'loading') return (
    <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-amber-500 border border-amber-200 bg-amber-50 px-3 py-1.5 rounded-lg">
      <span className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" /> Locating...
    </div>
  );
  if (state === 'granted') return (
    <div className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-emerald-600 border border-emerald-200 bg-emerald-50 px-3 py-1.5 rounded-lg">
      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> GPS On
    </div>
  );
  return (
    <div title="GPS denied. Enable in browser settings." className="hidden md:flex items-center gap-1.5 text-xs font-semibold text-red-500 border border-red-200 bg-red-50 px-3 py-1.5 rounded-lg cursor-default">
      <Navigation className="w-3.5 h-3.5" /> GPS Denied
    </div>
  );
}

/* ─────────────────── MAIN PAGE ─────────────────── */
export default function LandingPage() {
  const { data: landingData, isLoading: dataLoading } = useLandingData();
  const route       = landingData?.route;
  const routeStops  = landingData?.stops ?? [];
  const restaurants = landingData?.restaurants ?? [];
  const coupons     = landingData?.coupons ?? [];
  const OFFERS      = buildOffers(coupons); // dynamic from DB
  const routeLabel  = route ? `${route.fromCity} ↔ ${route.toCity}` : 'Highway';
  const routeFrom   = route?.fromCity ?? '';
  const routeTo     = route?.toCity ?? '';
  const totalKm     = route?.totalDistanceKm ? `${route.totalDistanceKm} km` : '';
  const stopCount   = routeStops.length;

  const [activeStop, setActiveStop] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState({ h: 5, m: 42, s: 17 });
  const [lang, setLang] = useState<Lang>('en');
  const t = translations[lang];

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(prev => {
        let { h, m, s } = prev;
        s--; if (s < 0) { s = 59; m--; } if (m < 0) { m = 59; h--; } if (h < 0) { h = 23; m = 59; s = 59; }
        return { h, m, s };
      });
    }, 1000);
    return () => clearInterval(t);
  }, []);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };
  const pad = (n: number) => String(n).padStart(2, '0');

  return (
    <div className="min-h-screen bg-white text-gray-900 antialiased overflow-x-hidden">

      {/* TICKER */}
      <div className="fixed top-0 left-0 right-0 z-[200] h-8 flex items-center overflow-hidden bg-gradient-to-r from-orange-600 to-orange-500">
        <div className="flex whitespace-nowrap text-white text-[11px] font-semibold tracking-wide"
          style={{ animation: 'marquee 30s linear infinite' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="flex items-center gap-12 px-8">
              {OFFERS.length > 0
                ? OFFERS.map(o => <span key={o.code}>🎉 {o.title} — {o.code}</span>)
                : <span>🛣️ Pre-order highway food · Ready when you arrive</span>
              }
            </span>
          ))}
        </div>
      </div>

      {/* NAV */}
      <nav className="fixed top-8 left-0 right-0 z-[100] bg-white/95 backdrop-blur-xl border-b border-gray-100/80 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <img src="/logo.jpeg" alt="Rodofood" className="w-8 h-8 rounded-lg object-cover" style={{ objectFit: 'cover' }} />
            <div>
              <span className="font-extrabold text-lg text-gray-900">Rodo<span className="text-orange-500">food</span></span>
              <p className="text-[10px] text-gray-400 hidden lg:block">{t.tagline}</p>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-7 text-sm font-medium text-gray-500">
            {([[`#restaurants`, t.restaurants],[`#offers`, t.offers],[`#how`, t.howItWorks],[`#route`, t.route]] as [string,string][]).map(([href, label]) => (
              <a key={href} href={href} className="hover:text-orange-500 transition-colors">{label}</a>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <NavLocation />
            <button onClick={() => setLang(l => l === 'en' ? 'hi' : 'en')} className="hidden md:flex items-center gap-1 text-xs font-bold text-gray-500 hover:text-orange-500 border border-gray-200 hover:border-orange-300 px-3 py-1.5 rounded-lg transition-all">
              {lang === 'en' ? 'हिं' : 'EN'}
            </button>
            <Link href="/login" className="hidden sm:block text-sm font-semibold text-gray-600 hover:text-orange-500 transition-colors">{t.login}</Link>
            <Link href="/login">
              <button className="text-white text-sm font-bold px-5 py-2 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 shadow-md shadow-orange-200 hover:shadow-orange-300 hover:scale-105 active:scale-95 transition-all">
                {t.getStarted}
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="relative pt-32 pb-0 bg-[#0C0F1A] overflow-hidden min-h-[92vh] flex items-center">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-20 blur-[120px] pointer-events-none"
          style={{ background: 'radial-gradient(circle,#FF6B35 0%,transparent 65%)' }} />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] rounded-full opacity-10 blur-[100px] pointer-events-none"
          style={{ background: 'radial-gradient(circle,#6366f1 0%,transparent 65%)' }} />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-16">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">

            {/* LEFT */}
            <div className="text-center lg:text-left">
              <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 border border-orange-500/30 bg-orange-500/10">
                <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-orange-300 uppercase tracking-widest">
                  🔴 Live — {routeLabel}
                </span>
              </div>
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-[1.08] tracking-tight mb-6">
                {t.heroTitle1}<br />
                <span className="bg-gradient-to-r from-orange-400 via-amber-400 to-orange-300 bg-clip-text text-transparent">
                  {t.heroTitle2}
                </span>
              </h1>
              <p className="text-gray-400 text-base sm:text-lg leading-relaxed mb-8 max-w-lg mx-auto lg:mx-0">
                {t.heroSubtitle}{' '}
                <span className="text-orange-400 font-semibold">{t.noWaits}</span>
              </p>
              <div className="inline-flex items-center gap-3 rounded-xl px-4 py-3 mb-8 border border-emerald-500/30 bg-emerald-500/10">
                <span className="text-xl">🎉</span>
                <div className="text-left">
                  <p className="text-emerald-300 font-bold text-sm">{t.firstOffer}</p>
                  <p className="text-emerald-400/70 text-xs">Code: <span className="font-bold text-emerald-300">{OFFERS[0]?.code || 'PREORDER'}</span></p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start mb-10">
                <Link href="/login">
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 text-white font-bold px-7 py-3.5 rounded-xl text-sm bg-gradient-to-r from-orange-500 to-orange-400 shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 active:scale-95 transition-all">
                    <Utensils className="w-4 h-4" /> {t.orderNow} <ArrowRight className="w-4 h-4" />
                  </button>
                </Link>
                <a href="#how">
                  <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 font-semibold px-7 py-3.5 rounded-xl text-sm border border-white/10 text-white bg-white/5 hover:bg-white/10 transition-all">
                    <Play className="w-4 h-4 text-orange-400" /> {t.howItWorks}
                  </button>
                </a>
              </div>
              <div className="flex items-center gap-6 justify-center lg:justify-start">
                {[{ val: '1,200+', label: 'Daily Orders' }, { val: '4.8★', label: 'Avg Rating' }, { val: '15 min', label: 'Wait Saved' }].map(s => (
                  <div key={s.label} className="text-center lg:text-left">
                    <p className="text-xl font-extrabold text-white">{s.val}</p>
                    <p className="text-[10px] font-semibold text-gray-600 uppercase tracking-wider">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* RIGHT — order card */}
            <div className="relative flex justify-center lg:justify-end">
              <div className="relative w-full max-w-sm">
                <div className="absolute -top-4 -right-4 w-full h-full rounded-3xl bg-orange-500/20 border border-orange-500/20" />
                <div className="absolute -top-2 -right-2 w-full h-full rounded-3xl bg-orange-500/10 border border-orange-500/10" />
                <div className="relative bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 shadow-2xl">
                  <div className="flex items-center justify-between mb-5">
                    <div>
                      <p className="text-white font-extrabold text-base">Your Order</p>
                      <p className="text-gray-400 text-xs">Arriving in 12 min</p>
                    </div>
                    <div className="w-10 h-10 bg-emerald-500 rounded-xl flex items-center justify-center">
                      <CheckCircle className="w-5 h-5 text-white" />
                    </div>
                  </div>
                  {[
                    { name: 'Dal Makhani', price: '₹180', emoji: '🍛' },
                    { name: 'Butter Naan ×2', price: '₹80', emoji: '🫓' },
                    { name: 'Lassi', price: '₹60', emoji: '🥛' },
                  ].map(item => (
                    <div key={item.name} className="flex items-center gap-3 py-2.5 border-b border-white/10 last:border-0">
                      <span className="text-xl">{item.emoji}</span>
                      <span className="flex-1 text-sm text-white/80 font-medium">{item.name}</span>
                      <span className="text-sm font-bold text-orange-400">{item.price}</span>
                    </div>
                  ))}
                  <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between">
                    <span className="text-white/60 text-sm">Total</span>
                    <span className="text-white font-extrabold text-lg">₹320</span>
                  </div>
                  <div className="mt-4 bg-orange-500/20 border border-orange-500/30 rounded-xl px-4 py-2.5 flex items-center gap-2">
                    <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                    <span className="text-orange-300 text-xs font-semibold">Pre-order now — arrive & eat, no waiting!</span>
                  </div>
                </div>
                <div className="absolute -left-5 top-8 bg-white rounded-2xl px-3 py-2 shadow-xl flex items-center gap-2">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-xs font-extrabold text-gray-800">4.9 Rating</span>
                </div>
                <div className="absolute -right-5 bottom-8 bg-orange-500 rounded-2xl px-3 py-2 shadow-xl">
                  <p className="text-white text-xs font-extrabold">🚗 2 km away</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 h-12 overflow-hidden opacity-20">
          <div className="w-full h-full bg-gray-700 flex items-center justify-center">
            <div className="w-1.5 h-full" style={{ background: 'repeating-linear-gradient(to bottom,#FF6B35 0,#FF6B35 24px,transparent 24px,transparent 48px)', animation: 'road-move 0.8s linear infinite' }} />
          </div>
        </div>
      </section>

      {/* SOCIAL PROOF BAR */}
      <div className="bg-gray-950 border-y border-gray-800 py-4 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-sm text-gray-400">
          {[
            { icon: '✅', text: 'Verified Restaurants' },
            { icon: '⚡', text: 'Order in 2 Minutes' },
            { icon: '🔒', text: 'Secure Payments' },
            { icon: '🌟', text: '4.8 Avg Rating' },
            { icon: '🚗', text: '1,200+ Daily Orders' },
          ].map(item => (
            <span key={item.text} className="flex items-center gap-2 font-medium">
              <span>{item.icon}</span> {item.text}
            </span>
          ))}
        </div>
      </div>

      {/* LIVE RESTAURANTS — right after hero */}
      <LiveRestaurantsSection restaurants={restaurants} isLoading={dataLoading} />

      {/* FIRST ORDER OFFER BANNER */}
      <section className="py-5 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-orange-600 to-orange-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-xl flex items-center justify-center text-2xl flex-shrink-0">🎉</div>
            <div>
              <p className="text-white font-extrabold text-base sm:text-lg">₹50 Off on Your First Order!</p>
              <p className="text-orange-100 text-xs sm:text-sm">
                {OFFERS[0]
                  ? <>Use code <span className="font-bold">{OFFERS[0].code}</span> — {OFFERS[0].title} on your first pre-order.</>
                  : <>Sign up and start pre-ordering highway food today.</>
                }
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div>
              <p className="text-white/60 text-[10px] font-semibold uppercase tracking-wider mb-1 text-center">Offer Expires In</p>
              <div className="flex gap-1.5">
                {[{ v: pad(countdown.h), l: 'H' }, { v: pad(countdown.m), l: 'M' }, { v: pad(countdown.s), l: 'S' }].map(({ v, l }) => (
                  <div key={l} className="bg-white/20 rounded-lg px-2.5 py-1.5 text-center min-w-[40px]">
                    <p className="text-white font-extrabold text-lg leading-none">{v}</p>
                    <p className="text-orange-200 text-[9px] font-bold">{l}</p>
                  </div>
                ))}
              </div>
            </div>
            <Link href="/login">
              <button className="bg-white text-orange-600 font-extrabold px-5 py-2.5 rounded-xl text-sm hover:scale-105 transition-all shadow-lg">
                Claim Now →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section id="how" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-widest bg-orange-100 px-3 py-1 rounded-full mb-4">Simple Process</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">Ready in Just <span className="text-orange-500">4 Steps</span></h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">So easy you can do it while driving.</p>
          </div>
          <div className="relative">
            <div className="hidden lg:block absolute top-10 left-[12.5%] right-[12.5%] h-px bg-gradient-to-r from-orange-200 via-orange-400 to-orange-200" />
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-5 lg:gap-6">
              {[
                { num: '01', emoji: '🗺️', color: 'bg-orange-500', ring: 'ring-orange-200' },
                { num: '02', emoji: '🍛', color: 'bg-amber-500', ring: 'ring-amber-200' },
                { num: '03', emoji: '📱', color: 'bg-emerald-500', ring: 'ring-emerald-200' },
                { num: '04', emoji: '🎉', color: 'bg-blue-500', ring: 'ring-blue-200' },
              ].map((step, i) => (
                <div key={i} className="relative flex flex-col items-center text-center group">
                  <div className={`relative w-20 h-20 ${step.color} rounded-2xl flex items-center justify-center text-3xl mb-5 shadow-lg ring-4 ${step.ring} group-hover:scale-110 transition-transform duration-300`}>
                    {step.emoji}
                    <span className="absolute -top-2 -right-2 w-6 h-6 bg-white border-2 border-gray-100 rounded-full flex items-center justify-center text-[10px] font-extrabold text-gray-700 shadow-sm">{step.num}</span>
                  </div>
                  <h3 className="text-sm font-extrabold text-gray-900 mb-2">{t.steps[i]}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{t.stepDescs[i]}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FEATURES — Bento grid */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-widest bg-orange-100 px-3 py-1 rounded-full mb-4">Features</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">{t.whyChoose.replace('Rodofood', '')} <span className="text-orange-500">Rodofood?</span></h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="lg:col-span-2 bg-[#0C0F1A] rounded-2xl p-7 flex flex-col sm:flex-row gap-6 items-start border border-white/5 hover:border-orange-500/30 transition-colors group">
              <div className="w-14 h-14 bg-orange-500/20 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-orange-500/30 transition-colors">
                <Clock className="w-7 h-7 text-orange-400" />
              </div>
              <div>
                <h3 className="text-white font-extrabold text-lg mb-2">Zero Wait Time</h3>
                <p className="text-gray-400 text-sm leading-relaxed">We track your GPS and have your food ready the moment you arrive. Not a single second wasted on the highway. Your time is precious — we respect that.</p>
                <div className="mt-4 inline-flex items-center gap-2 bg-orange-500/10 border border-orange-500/20 rounded-lg px-3 py-1.5">
                  <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
                  <span className="text-orange-300 text-xs font-semibold">Live GPS Tracking</span>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-emerald-200 hover:shadow-lg transition-all group">
              <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-emerald-200 transition-colors">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
              </div>
              <h3 className="font-extrabold text-gray-900 text-sm mb-2">Verified Restaurants</h3>
              <p className="text-gray-500 text-xs leading-relaxed">Every restaurant passes a hygiene audit. Only the best quality makes it to your plate.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-amber-200 hover:shadow-lg transition-all group">
              <div className="w-11 h-11 bg-amber-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors">
                <Zap className="w-5 h-5 text-amber-600" />
              </div>
              <h3 className="font-extrabold text-gray-900 text-sm mb-2">Instant Pre-Order</h3>
              <p className="text-gray-500 text-xs leading-relaxed">Booking confirmed in under 2 minutes — completely hassle-free while you drive.</p>
            </div>
            <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all group">
              <div className="flex flex-col sm:flex-row gap-5 items-start">
                <div className="w-11 h-11 bg-blue-100 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:bg-blue-200 transition-colors">
                  <MapPin className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-extrabold text-gray-900 text-sm mb-2">Live Route Tracking</h3>
                  <p className="text-gray-500 text-xs leading-relaxed">Restaurants are suggested based on your real-time location and ETA. Smart, simple, seamless — the app knows where you are and what you need.</p>
                  <div className="mt-3 flex gap-2 flex-wrap">
                    {['GPS Aware', 'ETA Based', 'Auto Suggest'].map(tag => (
                      <span key={tag} className="text-[10px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">{tag}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-violet-200 hover:shadow-lg transition-all group">
              <div className="w-11 h-11 bg-violet-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-violet-200 transition-colors">
                <Smartphone className="w-5 h-5 text-violet-600" />
              </div>
              <h3 className="font-extrabold text-gray-900 text-sm mb-2">Easy Payments</h3>
              <p className="text-gray-500 text-xs leading-relaxed">Pay via UPI, card, or cash at the restaurant. No fumbling for change.</p>
            </div>
            <div className="bg-white rounded-2xl p-6 border border-gray-100 hover:border-rose-200 hover:shadow-lg transition-all group">
              <div className="w-11 h-11 bg-rose-100 rounded-xl flex items-center justify-center mb-4 group-hover:bg-rose-200 transition-colors">
                <Truck className="w-5 h-5 text-rose-600" />
              </div>
              <h3 className="font-extrabold text-gray-900 text-sm mb-2">Family Friendly</h3>
              <p className="text-gray-500 text-xs leading-relaxed">Options for kids and adults alike. Order for the whole family in one go.</p>
            </div>
          </div>
        </div>
      </section>

      {/* OFFERS — only show if coupons exist in DB */}
      {OFFERS.length > 0 && (
      <section id="offers" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-widest bg-orange-100 px-3 py-1 rounded-full mb-4">
              <Percent className="w-3 h-3" /> Special Offers
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3"><span className="text-orange-500">{t.todaysDeals}</span></h2>
            <p className="text-gray-500 text-sm max-w-sm mx-auto">Copy a code, place your order, save money.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {OFFERS.map(offer => (
              <div key={offer.id} className={`relative rounded-2xl overflow-hidden bg-gradient-to-br ${offer.gradient} hover:-translate-y-1 hover:shadow-2xl transition-all duration-300`}>
                <div className="absolute inset-0 opacity-[0.06]"
                  style={{ backgroundImage: 'radial-gradient(circle,rgba(255,255,255,0.8) 1px,transparent 1px)', backgroundSize: '18px 18px' }} />
                <div className="relative z-10 p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex flex-wrap gap-2">
                      <span className={`text-[10px] font-bold text-white px-2.5 py-1 rounded-full ${offer.tagBg}`}>{offer.tag}</span>
                      <span className={`text-[10px] font-bold text-white px-2.5 py-1 rounded-full ${offer.savingsBg}`}>{offer.savings}</span>
                    </div>
                    <span className="text-3xl ml-2 flex-shrink-0">{offer.emoji}</span>
                  </div>
                  <h3 className="text-2xl font-extrabold text-white mb-0.5">{offer.title}</h3>
                  <p className="text-white/75 font-semibold text-sm mb-3">{offer.subtitle}</p>
                  <p className="text-white/65 text-xs leading-relaxed mb-5">{offer.desc}</p>
                  <div className="flex items-center gap-3">
                    <div className="flex rounded-xl overflow-hidden border border-white/25 flex-1 min-w-0">
                      <div className="flex-1 px-3 py-2.5 bg-black/20 min-w-0">
                        <p className="text-[9px] text-white/50 font-semibold uppercase tracking-wider">Coupon Code</p>
                        <p className="text-white font-extrabold text-sm tracking-widest truncate">{offer.code}</p>
                      </div>
                      <button onClick={() => copyCode(offer.code)}
                        className="px-4 py-2.5 bg-white/20 hover:bg-white/30 transition-colors border-l border-white/20 flex-shrink-0">
                        <span className="text-white font-bold text-xs">{copiedCode === offer.code ? '✓ Done' : 'Copy'}</span>
                      </button>
                    </div>
                    <span className="text-white/50 text-[10px] flex-shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{offer.expiry}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      )} {/* end OFFERS conditional */}

      {/* ROUTE MAP */}
      <section id="route" className="py-20 px-4 sm:px-6 lg:px-8 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-widest bg-orange-100 px-3 py-1 rounded-full mb-4">Route Coverage</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">
              {routeFrom && routeTo
                ? <>{routeFrom} ↔ {routeTo} <span className="text-orange-500">{totalKm ? `· ${totalKm}` : ''}{stopCount ? ` · ${stopCount} Stops` : ''}</span></>
                : <span className="text-orange-500">Our Highway Routes</span>
              }
            </h2>
            <p className="text-gray-500 text-sm">Top-rated restaurants at every stop along the route.</p>
          </div>
          <div className="relative rounded-2xl p-8 sm:p-10 overflow-hidden bg-[#0C0F1A] border border-white/5">
            <div className="absolute inset-0 opacity-[0.04]"
              style={{ backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)', backgroundSize: '40px 40px' }} />
            {/* Desktop */}
            <div className="hidden md:block relative z-10">
              <div className="relative flex items-center justify-between">
                <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-0.5 bg-gradient-to-r from-orange-500 via-amber-400 to-orange-500 opacity-50 mx-10" />
                {routeStops.length > 0 ? routeStops.map((stop: any, i: number) => (
                  <button key={i} onClick={() => setActiveStop(i)}
                    className="relative z-10 flex flex-col items-center gap-2 group transition-all duration-200">
                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-2xl border-2 transition-all duration-300 ${activeStop === i ? 'border-orange-400 bg-gradient-to-br from-orange-500 to-orange-400 scale-110 shadow-lg shadow-orange-500/30' : 'border-white/10 bg-white/5 group-hover:border-orange-400/50 group-hover:scale-105'}`}>
                      {stop.emoji}
                    </div>
                    <span className={`text-xs font-bold transition-colors ${activeStop === i ? 'text-orange-400' : 'text-gray-500 group-hover:text-gray-300'}`}>{stop.name}</span>
                  </button>
                )) : (
                  <div className="w-full flex items-center justify-center py-8">
                    <p className="text-gray-500 text-sm">Loading route stops...</p>
                  </div>
                )}
              </div>
            </div>
            {/* Mobile */}
            <div className="md:hidden relative z-10">
              {routeStops.map((stop: any, i: number) => (
                <div key={i} className="flex items-stretch gap-4">
                  <div className="flex flex-col items-center">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border-2 flex-shrink-0 ${stop.isCity ? 'border-orange-400 bg-gradient-to-br from-orange-500 to-orange-400' : 'border-white/10 bg-white/5'}`}>
                      {stop.emoji}
                    </div>
                    {i < routeStops.length - 1 && <div className="w-0.5 flex-1 bg-orange-500/20 my-1 min-h-[24px]" />}
                  </div>
                  <div className="pb-4 pt-2">
                    <p className="text-sm font-bold text-white">{stop.name}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-8 grid grid-cols-3 gap-3 relative z-10">
              {[{ icon: <Utensils className="w-4 h-4" />, val: '12+', label: 'Restaurants' }, { icon: <Clock className="w-4 h-4" />, val: '~3.5 hrs', label: 'Drive Time' }, { icon: <CheckCircle className="w-4 h-4" />, val: '100%', label: 'Verified' }].map(s => (
                <div key={s.label} className="rounded-xl p-4 text-center border border-white/10 bg-white/5">
                  <div className="flex justify-center text-orange-400 mb-1.5">{s.icon}</div>
                  <p className="text-base font-extrabold text-white">{s.val}</p>
                  <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* TESTIMONIALS */}
      <section id="reviews" className="py-20 px-4 sm:px-6 lg:px-8 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 uppercase tracking-widest bg-orange-100 px-3 py-1 rounded-full mb-4">Reviews</span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 mb-3">{t.reviewsTitle}</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-gray-50 border border-gray-100 rounded-2xl p-6 hover:shadow-lg hover:border-orange-100 hover:-translate-y-1 transition-all duration-300">
                <div className="flex gap-0.5 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />)}
                </div>
                <p className="text-sm text-gray-600 leading-relaxed mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-white font-extrabold text-sm flex-shrink-0 bg-gradient-to-br from-orange-500 to-orange-400 shadow-md shadow-orange-200">
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{t.name}</p>
                    <p className="text-xs text-gray-400">Verified Customer</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BANNER */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 relative bg-[#0C0F1A] overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] rounded-full opacity-15 blur-[100px] pointer-events-none"
          style={{ background: 'radial-gradient(ellipse,#FF6B35 0%,transparent 70%)' }} />
        <div className="relative z-10 max-w-7xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <div className="text-5xl mb-5">🚗💨</div>
              <h2 className="text-3xl sm:text-4xl font-extrabold text-white mb-4 leading-tight">
                Got a trip coming up?<br />
                <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">Book your meal first!</span>
              </h2>
              <p className="text-gray-400 mb-6 text-base">
                {routeFrom && routeTo
                  ? `${routeFrom} to ${routeTo} or ${routeTo} to ${routeFrom} — Rodofood has you covered both ways.`
                  : 'Planning a highway trip? Rodofood has you covered every step of the way.'}
              </p>
              <div className="inline-flex items-center gap-2 rounded-xl px-4 py-2.5 mb-8 border border-emerald-500/30 bg-emerald-500/10">
                <Gift className="w-4 h-4 text-emerald-400" />
                <span className="text-emerald-300 text-sm">
                  {OFFERS[0]
                    ? <>Code <span className="font-extrabold">{OFFERS[0].code}</span> — {OFFERS[0].title} on your first order!</>
                    : <>Pre-order highway food · Ready when you arrive</>
                  }
                </span>
              </div>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/login">
                  <button className="w-full sm:w-auto text-white font-extrabold px-8 py-3.5 rounded-xl text-sm bg-gradient-to-r from-orange-500 to-orange-400 shadow-xl shadow-orange-500/30 hover:shadow-orange-500/50 hover:scale-105 transition-all">
                    Start Now 🚀
                  </button>
                </Link>
                <Link href="/login">
                  <button className="w-full sm:w-auto font-semibold px-8 py-3.5 rounded-xl text-sm border border-white/10 text-white bg-white/5 hover:bg-white/10 transition-all">
                    Become a Restaurant Partner
                  </button>
                </Link>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              {[
                { emoji: '🍽️', val: '50+', label: 'Restaurants', color: 'border-orange-500/20 bg-orange-500/10' },
                { emoji: '⭐', val: '4.8', label: 'Avg Rating', color: 'border-amber-500/20 bg-amber-500/10' },
                { emoji: '🚗', val: '1,200+', label: 'Daily Orders', color: 'border-emerald-500/20 bg-emerald-500/10' },
                { emoji: '⏱️', val: '15 min', label: 'Wait Saved', color: 'border-blue-500/20 bg-blue-500/10' },
              ].map(s => (
                <div key={s.label} className={`rounded-2xl p-5 border ${s.color} text-center`}>
                  <div className="text-3xl mb-2">{s.emoji}</div>
                  <p className="text-2xl font-extrabold text-white">{s.val}</p>
                  <p className="text-xs text-gray-500 font-semibold uppercase tracking-wider mt-0.5">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-gray-950 py-14 px-4 sm:px-6 lg:px-8 border-t border-gray-800">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div className="sm:col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2.5 mb-4">
                <img src="/logo.jpeg" alt="Rodofood" className="w-8 h-8 rounded-lg object-cover" style={{ objectFit: 'cover' }} />
                <span className="font-extrabold text-lg text-white">Rodo<span className="text-orange-500">food</span></span>
              </div>
              <span className="inline-block text-xs font-bold text-orange-500 bg-orange-50 border border-orange-200 px-3 py-1 rounded-full mb-3">🇮🇳 India&apos;s First Highway Food Network</span>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs">Great food on the highway, every time. Pre-order your meal and never wait again.</p>
            </div>
            <div>
              <p className="font-bold text-white mb-4 text-xs uppercase tracking-wider">Platform</p>
              <div className="space-y-2.5">
                <a href="https://play.google.com/store/apps/details?id=com.rodofood" target="_blank" rel="noopener noreferrer" className="block text-sm text-gray-500 hover:text-orange-400 transition-colors">Customer App ↗</a>
                <a href="/restaurant-register" className="block text-sm text-gray-500 hover:text-orange-400 transition-colors">{t.restaurantPartner}</a>
                <a href="/admin-login" className="block text-sm text-gray-500 hover:text-orange-400 transition-colors">Admin Panel</a>
              </div>
            </div>
            <div>
              <p className="font-bold text-white mb-4 text-xs uppercase tracking-wider">Active Offers</p>
              <div className="space-y-2.5">
                {OFFERS.length > 0
                  ? OFFERS.map(c => <p key={c.code} className="text-sm text-gray-500 font-mono">{c.code}</p>)
                  : <p className="text-sm text-gray-500">No active offers</p>
                }
              </div>
            </div>
            <div>
              <p className="font-bold text-white mb-4 text-xs uppercase tracking-wider">Company</p>
              <div className="space-y-2.5">
                {([
                  ['About Us',         '/pages/about'],
                  ['Contact',          '/pages/contact'],
                  [t.privacyPolicy,    '/pages/privacy'],
                  [t.termsConditions,  '/pages/terms'],
                  [t.refundPolicy,     '/pages/refund'],
                ] as [string, string][]).map(([label, href]) => (
                  <Link key={label} href={href} className="block text-sm text-gray-500 hover:text-orange-400 transition-colors">{label}</Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-3">
            <div>
              <p className="text-xs text-gray-600">© 2026 Rodofood · India&apos;s First Highway Food Network</p>
              <div className="flex flex-wrap gap-4 justify-center sm:justify-start mt-3">
                {([
                  [t.privacyPolicy,   '/pages/privacy'],
                  [t.termsConditions, '/pages/terms'],
                  [t.refundPolicy,    '/pages/refund'],
                ] as [string, string][]).map(([label, href]) => (
                  <Link key={label} href={href} className="text-xs text-gray-600 hover:text-orange-400 transition-colors">{label}</Link>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <Navigation className="w-3 h-3 text-orange-500" />
              <span>{routeLabel}</span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes road-move {
          from { background-position: 0 0; }
          to { background-position: 0 48px; }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
