'use client';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import {
  MapPin, Clock, Zap, ShieldCheck, Smartphone,
  Star, ArrowRight, Truck, Utensils,
  Navigation, CheckCircle, Tag, Gift, Percent, Flame
} from 'lucide-react';

/* ─────────────────── DATA ─────────────────── */

const OFFERS = [
  {
    id: 1,
    tag: '🔥 HOT DEAL',
    tagColor: 'bg-red-500',
    title: 'FREE Delivery',
    subtitle: 'On Your First 3 Orders',
    desc: 'Create a new account and enjoy completely free delivery on your first three orders. No minimum order required!',
    code: 'RODO3FREE',
    savings: 'Save ₹60',
    savingsColor: 'bg-green-500',
    gradient: 'linear-gradient(135deg,#FF6B35 0%,#FF3D00 100%)',
    emoji: '🚚',
    expiry: 'Valid till 31 March',
  },
  {
    id: 2,
    tag: '⚡ LIMITED',
    tagColor: 'bg-yellow-500',
    title: '20% OFF',
    subtitle: 'Lunch Special',
    desc: 'Order between 12 PM and 3 PM and get a flat 20% discount on your entire order. Highway lunch has never been this affordable!',
    code: 'LUNCH20',
    savings: 'Up to ₹80 Off',
    savingsColor: 'bg-yellow-500',
    gradient: 'linear-gradient(135deg,#F59E0B 0%,#D97706 100%)',
    emoji: '🍛',
    expiry: 'Available daily',
  },
  {
    id: 3,
    tag: '👨‍👩‍👧 FAMILY',
    tagColor: 'bg-purple-500',
    title: 'Family Pack',
    subtitle: '4 Items = Extra 15% Off',
    desc: 'Order 4 or more items together and get an extra 15% discount. Perfect for family road trips — everyone eats, everyone saves!',
    code: 'FAMILY15',
    savings: '15% Extra',
    savingsColor: 'bg-purple-500',
    gradient: 'linear-gradient(135deg,#8B5CF6 0%,#6D28D9 100%)',
    emoji: '👨‍👩‍👧‍👦',
    expiry: 'Weekends only',
  },
  {
    id: 4,
    tag: '🌙 NIGHT OWL',
    tagColor: 'bg-blue-600',
    title: 'Late Night Deal',
    subtitle: '10 PM – 2 AM',
    desc: 'Travelling late at night? Order after 10 PM and get a flat ₹50 off your order. A special treat for night drivers on the highway!',
    code: 'NIGHT50',
    savings: 'Flat ₹50 Off',
    savingsColor: 'bg-blue-600',
    gradient: 'linear-gradient(135deg,#1D4ED8 0%,#1E3A8A 100%)',
    emoji: '🌙',
    expiry: '10 PM – 2 AM',
  },
];

const POPULAR_DISHES = [
  { name: 'Dal Baati Churma', restaurant: 'Sehore Highway Treat', price: 149, originalPrice: 199, rating: 4.9, orders: '2.1k', emoji: '🍲', tag: 'Bestseller', tagColor: 'bg-orange-500' },
  { name: 'Poha + Jalebi Combo', restaurant: 'Midway Delite, Ashta', price: 79, originalPrice: 99, rating: 4.8, orders: '1.8k', emoji: '🥣', tag: 'Most Loved', tagColor: 'bg-pink-500' },
  { name: 'Full Thali', restaurant: 'Dewas Dhaba', price: 199, originalPrice: 249, rating: 4.7, orders: '1.5k', emoji: '🍽️', tag: 'Value Pick', tagColor: 'bg-green-500' },
  { name: 'Samosa + Chai', restaurant: 'Obaidullaganj Stop', price: 39, originalPrice: 49, rating: 4.6, orders: '3.2k', emoji: '🫖', tag: 'Quick Bite', tagColor: 'bg-blue-500' },
  { name: 'Kachori Sabzi', restaurant: 'Sehore Highway Treat', price: 89, originalPrice: 119, rating: 4.8, orders: '1.2k', emoji: '🥟', tag: 'Chef Special', tagColor: 'bg-purple-500' },
  { name: 'Lassi (500ml)', restaurant: 'Dewas Dhaba', price: 59, originalPrice: 79, rating: 4.9, orders: '2.8k', emoji: '🥛', tag: 'Refreshing', tagColor: 'bg-cyan-500' },
];

const ROUTE_STOPS = [
  { name: 'Bhopal', km: '0 km', emoji: '🏙️' },
  { name: 'Obaidullaganj', km: '35 km', emoji: '🍽️' },
  { name: 'Sehore', km: '70 km', emoji: '🛣️' },
  { name: 'Ashta', km: '105 km', emoji: '🍽️' },
  { name: 'Dewas', km: '145 km', emoji: '🛣️' },
  { name: 'Indore', km: '195 km', emoji: '🏙️' },
];

const FEATURES = [
  { icon: <Clock className="w-6 h-6" />, color: 'bg-orange-100 text-orange-600', title: 'Zero Wait Time', desc: 'We track your GPS and have your food ready the moment you arrive. Not a single second wasted.' },
  { icon: <ShieldCheck className="w-6 h-6" />, color: 'bg-emerald-100 text-emerald-600', title: 'Verified Restaurants', desc: 'Every restaurant goes through a hygiene audit. Only the best quality makes it to your plate.' },
  { icon: <Zap className="w-6 h-6" />, color: 'bg-yellow-100 text-yellow-600', title: 'Instant Pre-Order', desc: 'Place your order while you drive. Booking confirmed in under 2 minutes — completely hassle-free.' },
  { icon: <MapPin className="w-6 h-6" />, color: 'bg-blue-100 text-blue-600', title: 'Live Route Tracking', desc: 'Restaurants are suggested based on your real-time location and ETA. Smart, simple, seamless.' },
  { icon: <Smartphone className="w-6 h-6" />, color: 'bg-purple-100 text-purple-600', title: 'Easy Payments', desc: 'Pay via UPI, card, or cash at the restaurant. No fumbling for change on the highway.' },
  { icon: <Truck className="w-6 h-6" />, color: 'bg-rose-100 text-rose-600', title: 'Family Friendly', desc: 'Options for kids and adults alike. Order for the whole family in one go — one stop, everyone happy.' },
];

const STEPS = [
  { num: '01', title: 'Set Your Route', desc: 'Select your highway route — Bhopal to Indore or any other supported corridor.', emoji: '🗺️' },
  { num: '02', title: 'Pick a Restaurant', desc: 'Browse top-rated restaurants along your route and explore their menus.', emoji: '🍛' },
  { num: '03', title: 'Pre-Order Your Meal', desc: 'Place your order and the kitchen starts cooking based on your ETA.', emoji: '📱' },
  { num: '04', title: 'Arrive & Eat!', desc: 'Pull up to the restaurant and your fresh, hot meal is already waiting for you.', emoji: '🎉' },
];

const TESTIMONIALS = [
  { name: 'Rahul Sharma', city: 'Bhopal', rating: 5, text: 'Absolutely brilliant! My food was ready at Sehore by the time I arrived from Bhopal. Did not wait even a minute.' },
  { name: 'Priya Verma', city: 'Indore', rating: 5, text: 'Made our family road trip so much better. Fresh food for the kids, no long stops. Highly recommend!' },
  { name: 'Amit Patel', city: 'Dewas', rating: 5, text: 'I drive trucks daily and use this every day. Saves both time and money. Best app for highway travellers!' },
];

/* ─────────────────── COMPONENT ─────────────────── */

export default function LandingPage() {
  const [activeStop, setActiveStop] = useState(0);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [countdown, setCountdown] = useState({ h: 5, m: 42, s: 17 });

  useEffect(() => {
    const t = setInterval(() => {
      setCountdown(prev => {
        let { h, m, s } = prev;
        s--;
        if (s < 0) { s = 59; m--; }
        if (m < 0) { m = 59; h--; }
        if (h < 0) { h = 23; m = 59; s = 59; }
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
    <div className="min-h-screen bg-[#F8FAFC] text-slate-900 antialiased" style={{ overflowX: 'hidden' }}>

      {/* ── MARQUEE TICKER ── */}
      <div className="fixed top-0 left-0 right-0 z-[200] h-8 flex items-center overflow-hidden"
        style={{ background: 'linear-gradient(90deg,#FF6B35,#FF3D00)' }}>
        <div className="flex whitespace-nowrap text-white text-xs font-bold uppercase tracking-wider"
          style={{ animation: 'marquee 28s linear infinite', willChange: 'transform' }}>
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="flex items-center gap-10 px-6">
              <span>🚚 FREE Delivery — Code: RODO3FREE</span>
              <span>⚡ Lunch 20% OFF — Code: LUNCH20</span>
              <span>🌙 Night Deal ₹50 Off — Code: NIGHT50</span>
              <span>👨‍👩‍👧 Family Pack 15% Off — Code: FAMILY15</span>
            </span>
          ))}
        </div>
      </div>

      {/* ── NAV ── */}
      <nav className="fixed top-8 left-0 right-0 z-[100] bg-white/80 backdrop-blur-md border-b border-slate-200/60">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
              <span className="text-lg">🛣️</span>
            </div>
            <span className="font-black text-xl text-slate-900">Rodo<span className="text-orange-500">food</span></span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-[13px] font-semibold text-slate-500">
            <a href="#offers" className="hover:text-orange-500 transition-colors">Offers</a>
            <a href="#dishes" className="hover:text-orange-500 transition-colors">Popular Dishes</a>
            <a href="#how" className="hover:text-orange-500 transition-colors">How it Works</a>
            <a href="#route" className="hover:text-orange-500 transition-colors">Route</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="hidden sm:block text-[13px] font-bold text-slate-600 hover:text-orange-500 transition-colors">Login</Link>
            <Link href="/login">
              <button className="text-white text-[13px] font-bold px-5 py-2.5 rounded-full shadow-lg transition-all hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                Get Started →
              </button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── HERO ── */}
      <section className="relative pt-40 pb-0" style={{ background: 'linear-gradient(160deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)', overflow: 'hidden' }}>
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,107,53,0.4) 1px, transparent 1px)', backgroundSize: '28px 28px' }} />
        <div className="absolute bottom-0 left-0 right-0 h-24 opacity-30">
          <div className="w-full h-full bg-gray-700 relative overflow-hidden">
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-2 h-full" style={{ background: 'repeating-linear-gradient(to bottom,#FF6B35 0,#FF6B35 30px,transparent 30px,transparent 60px)', animation: 'road-move 1s linear infinite' }} />
            </div>
          </div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 text-center pb-32 pt-4">
          <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-8 border border-orange-500/30" style={{ background: 'rgba(255,107,53,0.15)' }}>
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            <span className="text-xs font-bold text-orange-300 uppercase tracking-widest">🔴 Live — Bhopal ↔ Indore Highway</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white mb-6 leading-[1.05] tracking-tight">
            Never go hungry<br />
            <span style={{ background: 'linear-gradient(135deg,#FF6B35,#FFA500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              on the highway! 🍽️
            </span>
          </h1>

          <p className="text-base sm:text-lg text-slate-300 max-w-2xl mx-auto mb-6 leading-relaxed font-medium">
            Pre-order your meal while you drive. By the time you arrive at the restaurant,
            your hot, fresh food is already on the table.
            <br className="hidden sm:block" />
            <span className="text-orange-400 font-bold">No more 40-minute waits at highway dhabas.</span>
          </p>

          {/* Hero offer pill */}
          <div className="inline-flex items-center gap-3 rounded-2xl px-5 py-3 mb-10 border border-green-400/30" style={{ background: 'rgba(34,197,94,0.15)' }}>
            <span className="text-2xl">🎁</span>
            <div className="text-left">
              <p className="text-green-300 font-black text-sm">FREE Delivery on your first 3 orders!</p>
              <p className="text-green-400/70 text-xs font-medium">Use code: <span className="font-black text-green-300">RODO3FREE</span> — Limited time offer</p>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Link href="/login">
              <button className="w-full sm:w-auto text-white font-bold px-8 py-4 rounded-2xl text-base shadow-2xl transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
                style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)', boxShadow: '0 8px 32px rgba(255,107,53,0.4)' }}>
                <Utensils className="w-5 h-5" />
                Order Now
                <ArrowRight className="w-5 h-5" />
              </button>
            </Link>
            <a href="#offers">
              <button className="w-full sm:w-auto font-bold px-8 py-4 rounded-2xl text-base transition-all hover:scale-105 border border-white/20 text-white flex items-center justify-center gap-2"
                style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(10px)' }}>
                <Tag className="w-5 h-5 text-orange-400" />
                View Offers 🎉
              </button>
            </a>
          </div>

          <div className="grid grid-cols-3 gap-4 max-w-lg mx-auto">
            {[{ val: '1,200+', label: 'Daily Orders' }, { val: '4.8★', label: 'Avg Rating' }, { val: '15 min', label: 'Wait Saved' }].map((s) => (
              <div key={s.label} className="rounded-2xl p-4 text-center border border-white/10" style={{ background: 'rgba(255,255,255,0.07)', backdropFilter: 'blur(10px)' }}>
                <p className="text-xl sm:text-2xl font-black text-white">{s.val}</p>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FREE DELIVERY BANNER ── */}
      <section className="py-6 px-4 sm:px-6" style={{ background: 'linear-gradient(135deg,#16a34a,#15803d)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0">🚚</div>
            <div>
              <p className="text-white font-black text-lg sm:text-xl">FREE Delivery on Your First 3 Orders!</p>
              <p className="text-green-200 text-sm font-medium">Sign up today — zero delivery charges on your first three orders. Pure savings!</p>
            </div>
          </div>
          <div className="flex items-center gap-4 flex-shrink-0">
            <div className="text-center">
              <p className="text-white/70 text-xs font-bold uppercase tracking-wider mb-1">Offer Expires In</p>
              <div className="flex gap-2">
                {[{ v: pad(countdown.h), l: 'HRS' }, { v: pad(countdown.m), l: 'MIN' }, { v: pad(countdown.s), l: 'SEC' }].map(({ v, l }) => (
                  <div key={l} className="bg-white/20 rounded-xl px-3 py-2 text-center min-w-[48px]">
                    <p className="text-white font-black text-xl leading-none">{v}</p>
                    <p className="text-green-200 text-[9px] font-bold mt-0.5">{l}</p>
                  </div>
                ))}
              </div>
            </div>
            <Link href="/login">
              <button className="bg-white text-green-700 font-black px-6 py-3 rounded-2xl text-sm hover:scale-105 transition-all shadow-lg">
                Claim Now →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── SPECIAL OFFERS ── */}
      <section id="offers" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-4 py-1.5 rounded-full inline-flex items-center gap-2">
              <Percent className="w-3 h-3" /> Special Offers
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-4 mb-3">
              Today&apos;s Best<br />
              <span className="text-orange-500">Deals &amp; Discounts! 🎊</span>
            </h2>
            <p className="text-slate-500 font-medium max-w-md mx-auto">Copy a code, place your order, and save money. It really is that simple.</p>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            {OFFERS.map((offer) => (
              <div key={offer.id} className="relative rounded-3xl overflow-hidden shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1">
                <div className="absolute inset-0" style={{ background: offer.gradient }} />
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,255,255,0.4) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />

                <div className="relative z-10 p-6 sm:p-7">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black text-white px-2.5 py-1 rounded-full ${offer.tagColor}`}>{offer.tag}</span>
                      <span className={`text-[10px] font-black text-white px-2.5 py-1 rounded-full ${offer.savingsColor}`}>{offer.savings}</span>
                    </div>
                    <span className="text-4xl flex-shrink-0 ml-2">{offer.emoji}</span>
                  </div>

                  <h3 className="text-2xl sm:text-3xl font-black text-white mb-1">{offer.title}</h3>
                  <p className="text-white/80 font-bold text-sm mb-3">{offer.subtitle}</p>
                  <p className="text-white/70 text-sm leading-relaxed mb-5">{offer.desc}</p>

                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex rounded-xl overflow-hidden border-2 border-white/30 flex-1 min-w-0">
                      <div className="flex-1 px-4 py-2.5 bg-white/10 min-w-0">
                        <p className="text-[10px] text-white/60 font-bold uppercase tracking-wider">Coupon Code</p>
                        <p className="text-white font-black text-base tracking-widest truncate">{offer.code}</p>
                      </div>
                      <button
                        onClick={() => copyCode(offer.code)}
                        className="px-4 py-2.5 bg-white/20 hover:bg-white/30 transition-colors flex-shrink-0 border-l border-white/20"
                      >
                        <p className="text-white font-black text-xs whitespace-nowrap">
                          {copiedCode === offer.code ? '✓ Copied!' : 'Copy'}
                        </p>
                      </button>
                    </div>
                    <div className="text-white/60 text-xs font-medium flex-shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {offer.expiry}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Refer strip */}
          <div className="mt-8 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 border-2 border-dashed border-orange-200"
            style={{ background: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)' }}>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-orange-500 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0">🎁</div>
              <div>
                <p className="font-black text-slate-900 text-base">Refer a Friend — Get ₹100 Cashback!</p>
                <p className="text-slate-500 text-sm font-medium">Invite a friend and you both get ₹100 credited to your account. Win-win!</p>
              </div>
            </div>
            <Link href="/login">
              <button className="flex-shrink-0 text-white font-black px-6 py-3 rounded-2xl text-sm hover:scale-105 transition-all"
                style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                Refer Now →
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── POPULAR DISHES ── */}
      <section id="dishes" className="py-20 px-4 sm:px-6" style={{ background: '#F8FAFC' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-4 py-1.5 rounded-full inline-flex items-center gap-2">
              <Flame className="w-3 h-3" /> Trending Now
            </span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-4 mb-3">
              Most Popular Dishes<br />
              <span className="text-orange-500">on the Highway 🔥</span>
            </h2>
            <p className="text-slate-500 font-medium">Ordered by thousands of travellers — you have to try these!</p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {POPULAR_DISHES.map((dish, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-3xl overflow-hidden hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="h-28 flex items-center justify-center relative overflow-hidden"
                  style={{ background: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)' }}>
                  <span className="text-7xl">{dish.emoji}</span>
                  <span className={`absolute top-3 left-3 text-[10px] font-black text-white px-2.5 py-1 rounded-full ${dish.tagColor}`}>
                    {dish.tag}
                  </span>
                  <div className="absolute top-3 right-3 bg-white rounded-xl px-2.5 py-1 flex items-center gap-1 shadow-sm">
                    <Star className="w-3 h-3 fill-orange-400 text-orange-400" />
                    <span className="text-xs font-black text-slate-800">{dish.rating}</span>
                  </div>
                </div>

                <div className="p-5">
                  <h3 className="font-black text-slate-900 text-base mb-1">{dish.name}</h3>
                  <p className="text-xs text-slate-400 font-medium mb-3 flex items-center gap-1">
                    <MapPin className="w-3 h-3 flex-shrink-0" /> {dish.restaurant}
                  </p>
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-baseline gap-2">
                      <span className="text-xl font-black text-orange-500">₹{dish.price}</span>
                      <span className="text-sm text-slate-400 line-through font-medium">₹{dish.originalPrice}</span>
                      <span className="text-xs font-black text-green-600 bg-green-50 px-1.5 py-0.5 rounded-lg">
                        {Math.round((1 - dish.price / dish.originalPrice) * 100)}% off
                      </span>
                    </div>
                    <span className="text-xs text-slate-400 font-medium">{dish.orders} orders</span>
                  </div>
                  <Link href="/login">
                    <button className="w-full mt-4 py-2.5 rounded-2xl text-sm font-black text-white transition-all hover:scale-[1.02] active:scale-95"
                      style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                      Pre-Order Now →
                    </button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── HOW IT WORKS ── */}
      <section id="how" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-4 py-1.5 rounded-full">Simple Process</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-4 mb-3">
              Ready in Just<br />
              <span className="text-orange-500">4 Simple Steps!</span>
            </h2>
            <p className="text-slate-500 font-medium max-w-md mx-auto">So easy you can do it while driving.</p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STEPS.map((step, i) => (
              <div key={i} className="bg-white border-2 border-slate-100 rounded-3xl p-6 text-center transition-all duration-300 hover:border-orange-200 hover:shadow-xl hover:-translate-y-1">
                <div className="text-4xl mb-4">{step.emoji}</div>
                <div className="text-xs font-black text-orange-500 mb-2 tracking-widest">{step.num}</div>
                <h3 className="text-base font-black text-slate-900 mb-2">{step.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FEATURES ── */}
      <section id="features" className="py-20 px-4 sm:px-6" style={{ background: '#F8FAFC' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-4 py-1.5 rounded-full">Features</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-4 mb-3">
              Why Choose <span className="text-orange-500">Rodofood?</span>
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-3xl p-7 transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:border-orange-100">
                <div className={`w-12 h-12 ${f.color} rounded-2xl flex items-center justify-center mb-5`}>{f.icon}</div>
                <h3 className="text-base font-black text-slate-900 mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ROUTE MAP ── */}
      <section id="route" className="py-20 px-4 sm:px-6 bg-white">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-4 py-1.5 rounded-full">Route Coverage</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-4 mb-3">
              Bhopal ↔ Indore<br />
              <span className="text-orange-500">195 km, 6 Stops</span>
            </h2>
            <p className="text-slate-500 font-medium">Top-rated restaurants available at every stop along the route.</p>
          </div>
          <div className="relative rounded-3xl p-8 sm:p-12 overflow-hidden" style={{ background: 'linear-gradient(135deg,#1a1a2e,#0f3460)' }}>
            <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,107,53,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />

            {/* Desktop */}
            <div className="hidden md:flex items-center justify-between relative z-10">
              <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 mx-16" style={{ background: 'linear-gradient(to right,#FF6B35,#FF8C42,#FF6B35)' }} />
              {ROUTE_STOPS.map((stop, i) => (
                <button key={i} onClick={() => setActiveStop(i)} className="relative z-10 flex flex-col items-center gap-2 transition-all duration-200 hover:scale-110">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center text-2xl border-4 transition-all duration-200 ${activeStop === i ? 'border-orange-400 scale-110 shadow-lg' : 'border-white/20'}`}
                    style={{ background: activeStop === i ? 'linear-gradient(135deg,#FF6B35,#FF8C42)' : 'rgba(255,255,255,0.1)' }}>
                    {stop.emoji}
                  </div>
                  <span className={`text-xs font-black ${activeStop === i ? 'text-orange-400' : 'text-slate-400'}`}>{stop.name}</span>
                  <span className="text-[10px] text-slate-500 font-medium">{stop.km}</span>
                </button>
              ))}
            </div>

            {/* Mobile */}
            <div className="md:hidden space-y-4 relative z-10">
              {ROUTE_STOPS.map((stop, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl border-2 border-orange-500/40"
                      style={{ background: i === 0 || i === ROUTE_STOPS.length - 1 ? 'linear-gradient(135deg,#FF6B35,#FF8C42)' : 'rgba(255,255,255,0.1)' }}>
                      {stop.emoji}
                    </div>
                    {i < ROUTE_STOPS.length - 1 && <div className="w-0.5 h-6 bg-orange-500/30 mt-1" />}
                  </div>
                  <div>
                    <p className="text-sm font-black text-white">{stop.name}</p>
                    <p className="text-xs text-slate-400 font-medium">{stop.km}</p>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-10 grid grid-cols-3 gap-4 relative z-10">
              {[{ icon: <Utensils className="w-4 h-4" />, val: '12+', label: 'Restaurants' }, { icon: <Clock className="w-4 h-4" />, val: '~3.5 hrs', label: 'Drive Time' }, { icon: <CheckCircle className="w-4 h-4" />, val: '100%', label: 'Verified' }].map((s) => (
                <div key={s.label} className="rounded-2xl p-4 text-center border border-white/10" style={{ background: 'rgba(255,255,255,0.07)' }}>
                  <div className="flex justify-center text-orange-400 mb-1">{s.icon}</div>
                  <p className="text-lg font-black text-white">{s.val}</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── TESTIMONIALS ── */}
      <section id="reviews" className="py-20 px-4 sm:px-6" style={{ background: '#F8FAFC' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-xs font-black text-orange-500 uppercase tracking-widest bg-orange-50 px-4 py-1.5 rounded-full">Reviews</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 mt-4 mb-3">What Travellers Are Saying 🗣️</h2>
          </div>
          <div className="grid sm:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <div key={i} className="bg-white border border-slate-100 rounded-3xl p-7 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, j) => <Star key={j} className="w-4 h-4 fill-orange-400 text-orange-400" />)}
                </div>
                <p className="text-sm text-slate-600 leading-relaxed font-medium mb-5">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0" style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                    {t.name[0]}
                  </div>
                  <div>
                    <p className="text-sm font-black text-slate-900">{t.name}</p>
                    <p className="text-xs text-slate-400 font-medium">{t.city}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA BANNER ── */}
      <section className="py-20 px-4 sm:px-6 relative" style={{ background: 'linear-gradient(135deg,#1a1a2e,#0f3460)', overflow: 'hidden' }}>
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, rgba(255,107,53,0.5) 1px, transparent 1px)', backgroundSize: '24px 24px' }} />
        <div className="relative z-10 max-w-3xl mx-auto text-center">
          <div className="text-6xl mb-6">🚗💨</div>
          <h2 className="text-3xl sm:text-5xl font-black text-white mb-4 leading-tight">
            Got a trip coming up?<br />
            <span style={{ background: 'linear-gradient(135deg,#FF6B35,#FFA500)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Book your meal first!
            </span>
          </h2>
          <p className="text-slate-300 font-medium mb-4 text-base sm:text-lg">Bhopal to Indore or Indore to Bhopal — Rodofood has you covered both ways.</p>
          <div className="inline-flex items-center gap-2 rounded-xl px-4 py-2 mb-10 border border-green-400/30" style={{ background: 'rgba(34,197,94,0.15)' }}>
            <Gift className="w-4 h-4 text-green-400" />
            <span className="text-green-300 text-sm font-bold">Use code <span className="font-black">RODO3FREE</span> — FREE delivery on your first 3 orders!</span>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <button className="w-full sm:w-auto text-white font-black px-10 py-4 rounded-2xl text-base transition-all hover:scale-105 active:scale-95 shadow-2xl"
                style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)', boxShadow: '0 8px 32px rgba(255,107,53,0.4)' }}>
                Start Now 🚀
              </button>
            </Link>
            <Link href="/login">
              <button className="w-full sm:w-auto font-bold px-10 py-4 rounded-2xl text-base border border-white/20 text-white transition-all hover:scale-105"
                style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                Become a Restaurant Partner
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-slate-900 py-12 px-4 sm:px-6">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row justify-between items-start gap-10 mb-10">
            <div className="max-w-xs">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                  <span className="text-lg">🛣️</span>
                </div>
                <span className="font-black text-xl text-white">Rodo<span className="text-orange-500">food</span></span>
              </div>
              <p className="text-sm text-slate-400 leading-relaxed font-medium">Great food on the highway, every time. Pre-order your meal and never wait again.</p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-8 text-sm">
              <div>
                <p className="font-black text-white mb-3 uppercase tracking-wider text-xs">Platform</p>
                <div className="space-y-2">
                  {['Customer App', 'Restaurant Partner', 'Admin Panel'].map(l => (
                    <Link key={l} href="/login" className="block text-slate-400 hover:text-orange-400 transition-colors font-medium">{l}</Link>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-black text-white mb-3 uppercase tracking-wider text-xs">Active Offers</p>
                <div className="space-y-2">
                  {['RODO3FREE', 'LUNCH20', 'NIGHT50', 'FAMILY15'].map(c => (
                    <p key={c} className="text-slate-400 font-mono text-xs font-medium">{c}</p>
                  ))}
                </div>
              </div>
              <div>
                <p className="font-black text-white mb-3 uppercase tracking-wider text-xs">Company</p>
                <div className="space-y-2">
                  {['About Us', 'Contact', 'Privacy Policy'].map(l => (
                    <a key={l} href="#" className="block text-slate-400 hover:text-orange-400 transition-colors font-medium">{l}</a>
                  ))}
                </div>
              </div>
            </div>
          </div>
          <div className="border-t border-slate-800 pt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-xs text-slate-500 font-medium">© 2026 Rodofood. Made with ❤️ for Indian Highways.</p>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium">
              <Navigation className="w-3 h-3 text-orange-500" />
              <span>Bhopal ↔ Indore Highway</span>
            </div>
          </div>
        </div>
      </footer>

      <style jsx>{`
        @keyframes road-move {
          from { background-position: 0 0; }
          to { background-position: 0 60px; }
        }
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
      `}</style>
    </div>
  );
}
