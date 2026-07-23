'use client';
import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Tag, Clock, Loader2, Plus, Minus, ChevronRight, ShieldCheck, Info, Zap, Timer } from 'lucide-react';
import Link from 'next/link';
import { useCartStore } from '@/store/cartStore';
import { usePlaceOrder } from '@/hooks/useOrders';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/axios';
import { useQuery } from '@tanstack/react-query';

// Razorpay window type
declare global {
  interface Window {
    Razorpay: new (options: Record<string, unknown>) => { open(): void };
  }
}

const ETA_OPTIONS = [
  { label: 'Immediately', value: 0,  desc: 'I\'m already here', emoji: '⚡', color: 'from-orange-500 to-red-500' },
  { label: '30 min',      value: 30, desc: 'Arriving soon',     emoji: '🚗', color: 'from-blue-500 to-blue-400' },
  { label: '45 min',      value: 45, desc: 'Standard',          emoji: '🛣️', color: 'from-violet-500 to-violet-400' },
];

const PAYMENT_OPTIONS = [
  { value: 'cash', label: 'Cash at Restaurant', emoji: '💵', desc: 'Pay when you arrive' },
  { value: 'upi_at_restaurant', label: 'UPI at Restaurant', emoji: '📱', desc: 'Scan & pay on arrival' },
  { value: 'online', label: 'Pay Online', emoji: '💳', desc: 'Razorpay / Card / UPI' },
] as const;

export default function CartPage() {
  const router = useRouter();
  const cart = useCartStore();
  const placeOrder = usePlaceOrder();
  
  // Fetch actual restaurant settings (e.g. gstRate)
  const { data: restaurantData } = useQuery({
    queryKey: ['restaurant-cart-info', cart.restaurantId],
    queryFn: async () => {
      if (!cart.restaurantId) return null;
      return (await api.get(`/restaurants/${cart.restaurantId}`)).data.data.restaurant;
    },
    enabled: !!cart.restaurantId,
  });

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [couponSuccess, setCouponSuccess] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi_at_restaurant' | 'online'>('cash');
  const [showCouponInput, setShowCouponInput] = useState(false);
  const [customTime, setCustomTime] = useState('');
  const [selectedEta, setSelectedEta] = useState<number | null>(null);
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [paymentError, setPaymentError] = useState('');

  const subtotal = cart.getSubtotal();
  const gstRate = restaurantData?.gstRate !== undefined ? restaurantData.gstRate : 5;
  const gstAmount = Math.round(((subtotal - cart.discount) * gstRate) / 100 * 100) / 100;
  const total = subtotal - cart.discount + gstAmount;

  const allowPayAtStore = restaurantData?.allowPayAtStore ?? true;
  const availablePaymentOptions = PAYMENT_OPTIONS.filter(opt => allowPayAtStore || opt.value === 'online');

  useEffect(() => {
    if (!allowPayAtStore && paymentMethod !== 'online') {
      setPaymentMethod('online');
    }
  }, [allowPayAtStore, paymentMethod]);

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCouponLoading(true); setCouponError(''); setCouponSuccess('');
    try {
      const res = await api.post('/coupons/validate', { code: couponInput, orderAmount: subtotal, restaurantId: cart.restaurantId });
      cart.applyCoupon(couponInput, res.data.data.discount);
      setCouponSuccess(`Saved ${formatCurrency(res.data.data.discount)}!`);
      setShowCouponInput(false);
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Invalid coupon code');
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = useCallback(async () => {
    if (!cart.customerETA || !cart.restaurantId) return;
    setPaymentLoading(true);
    setPaymentError('');

    // Read token fresh — avoids stale closure issues with OrderOptions defined inside CartPage
    const getAuthToken = () =>
      localStorage.getItem('rf_token') ||
      (() => { try { return JSON.parse(localStorage.getItem('rf_auth') || '{}')?.state?.token ?? null; } catch { return null; } })();

    try {
      // ── Cash / UPI — create order directly ───────────────────────────────
      if (paymentMethod !== 'online') {
        const res = await placeOrder.mutateAsync({
          restaurantId: cart.restaurantId,
          items: cart.items.map(i => ({ menuItemId: i.menuItem._id, quantity: i.quantity })),
          orderType: cart.orderType,
          paymentMethod,
          customerETA: cart.customerETA,
          ...(cart.etaMinutes != null ? { etaMinutes: cart.etaMinutes } : {}),
          couponCode: cart.couponCode || undefined,
        });
        cart.clearCart();
        router.push(`/orders/${res.data.data.order._id}`);
        return;
      }

      // ── Online — Razorpay first, order created only after payment ─────────
      const tok = getAuthToken();
      const headers = tok ? { Authorization: `Bearer ${tok}` } : {};

      // Step 1: validate cart on backend + get price snapshot (no Razorpay call yet)
      const initiateRes = await api.post('/payments/initiate', {
        restaurantId: cart.restaurantId,
        items: cart.items.map(i => ({ menuItemId: i.menuItem._id, quantity: i.quantity })),
        orderType: cart.orderType,
        customerETA: cart.customerETA,
        ...(cart.etaMinutes != null ? { etaMinutes: cart.etaMinutes } : {}),
        couponCode: cart.couponCode || undefined,
      }, { headers });

      const { amount, keyId, snapshot } = initiateRes.data.data;

      // Step 2: wait for Razorpay script (loaded in <head> via layout)
      let waited = 0;
      while (!window.Razorpay && waited < 8000) {
        await new Promise(r => setTimeout(r, 100));
        waited += 100;
      }
      if (!window.Razorpay) {
        setPaymentError('Payment gateway failed to load. Please refresh and try again.');
        return;
      }

      // Step 3: open Razorpay checkout modal (no pre-created order_id needed)
      const paymentResponse = await new Promise<{
        razorpay_order_id: string;
        razorpay_payment_id: string;
        razorpay_signature: string;
      } | null>((resolve) => {
        const rzp = new window.Razorpay({
          key: keyId,
          amount,
          currency: 'INR',
          name: 'Rodofood',
          description: 'Highway Food Pre-Order',
          image: '/logo.jpeg',
          handler: (response: {
            razorpay_order_id: string;
            razorpay_payment_id: string;
            razorpay_signature: string;
          }) => resolve(response),
          prefill: {},
          theme: { color: '#FF6B35' },
          modal: { ondismiss: () => resolve(null) },
        });
        rzp.open();
      });

      // Step 4: user dismissed without paying — stay on cart
      if (!paymentResponse) {
        setPaymentError('Payment cancelled. Your cart is still saved.');
        return;
      }
      // Validate payment_id format (must start with 'pay_')
      if (!paymentResponse.razorpay_payment_id?.startsWith('pay_')) {
        setPaymentError('Invalid payment response. Please try again.');
        return;
      }

      // Step 5: create order in DB after payment
      const verifyRes = await api.post('/payments/verify', {
        razorpay_payment_id: paymentResponse.razorpay_payment_id,
        snapshot,
      }, { headers });

      cart.clearCart();
      router.push(`/orders/${verifyRes.data.data.order._id}`);

    } catch (err: any) {
      setPaymentError(err?.response?.data?.message || 'Something went wrong. Please try again.');
    } finally {
      setPaymentLoading(false);
    }
  }, [cart, paymentMethod, placeOrder, router]);

  const isLoading = placeOrder.isPending || paymentLoading;

  /* ── Empty state ── */
  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4 bg-gray-50">
        <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center text-4xl">🛒</div>
        <h2 className="text-lg font-extrabold text-gray-900">Your cart is empty</h2>
        <p className="text-gray-400 text-sm text-center">Add items from a restaurant to get started</p>
        <Link href="/trip">
          <button className="text-white font-bold px-6 py-2.5 rounded-xl text-sm bg-gradient-to-r from-orange-500 to-orange-400 shadow-md shadow-orange-200">
            Find Restaurants
          </button>
        </Link>
      </div>
    );
  }

  /* ── Shared sidebar/bottom content ── */
  const OrderOptions = () => (
    <div className="space-y-3">

      {/* Order Type */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider mb-3">Order Type</p>
        <div className="grid grid-cols-2 gap-2">
          {(['takeaway', 'dine-in'] as const).map(type => (
            <button key={type} onClick={() => cart.setOrderType(type)}
              className={`py-2.5 rounded-xl text-xs font-bold border-2 transition-all ${cart.orderType === type ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-gray-200 text-gray-500 bg-white hover:border-gray-300'}`}>
              {type === 'takeaway' ? '🥡 Takeaway' : '🍽️ Dine-in'}
            </button>
          ))}
        </div>
      </div>

      {/* ETA (Hidden for Dine-in orders) */}
      {cart.orderType !== 'dine-in' && (
        <div className="bg-white rounded-xl border border-gray-100 p-4">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-orange-500" />
            <p className="font-bold text-gray-800 text-sm uppercase tracking-wider">Arrival Time</p>
          </div>
          <p className="text-[11px] text-gray-400 mb-4">Kitchen cooks based on your ETA</p>

          <div className="grid grid-cols-2 gap-2.5">
            {ETA_OPTIONS.map(({ label, value, desc, emoji, color }) => {
              const isSelected = selectedEta === value;
              return (
                <button key={value}
                  onClick={() => {
                    setSelectedEta(value);
                    if (value !== -1) {
                      const mins = value === 0 ? 1 : value;
                      const eta = new Date(Date.now() + mins * 60 * 1000).toISOString();
                      cart.setETA(value, eta);
                      setCustomTime('');
                    } else {
                      // Custom time selected — clear previous ETA until user picks a time
                      cart.setETA(null, null);
                    }
                  }}
                  className={`relative flex flex-col items-start p-3.5 rounded-2xl border-2 transition-all text-left overflow-hidden ${
                    isSelected
                      ? 'border-orange-400 bg-orange-50 shadow-md shadow-orange-100'
                      : 'border-gray-200 bg-white hover:border-gray-300 hover:bg-gray-50'
                  }`}>
                  {/* Selected indicator */}
                  {isSelected && (
                    <div className={`absolute top-0 right-0 w-6 h-6 bg-gradient-to-br ${color} rounded-bl-xl flex items-center justify-center`}>
                      <div className="w-2 h-2 rounded-full bg-white" />
                    </div>
                  )}
                  <span className="text-xl mb-2">{emoji}</span>
                  <p className={`text-sm font-extrabold ${isSelected ? 'text-orange-600' : 'text-gray-800'}`}>{label}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{desc}</p>
                </button>
              );
            })}
          </div>

          {/* Custom time picker */}
          {selectedEta === -1 && (
            <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <p className="text-xs font-bold text-emerald-700 mb-2 flex items-center gap-1.5">
                <Timer className="w-3.5 h-3.5" /> Set your arrival time
              </p>
              <input
                type="time"
                value={customTime}
                onChange={e => {
                  setCustomTime(e.target.value);
                  if (e.target.value) {
                    const [h, m] = e.target.value.split(':').map(Number);
                    const now = new Date();
                    const eta = new Date(now.getFullYear(), now.getMonth(), now.getDate(), h, m);
                    if (eta < now) eta.setDate(eta.getDate() + 1);
                    const diffMins = Math.round((eta.getTime() - now.getTime()) / 60000);
                    cart.setETA(diffMins, eta.toISOString());
                  }
                }}
                className="w-full h-11 px-4 border-2 border-emerald-300 rounded-xl text-sm font-bold text-gray-800 outline-none focus:border-emerald-500 bg-white transition-colors"
              />
              {customTime && (cart.etaMinutes ?? 0) > 0 && (
                <p className="text-[11px] text-emerald-600 font-semibold mt-1.5">
                  ✓ Arriving in ~{cart.etaMinutes} min
                </p>
              )}
            </div>
          )}

          {/* Selected ETA summary */}
          {cart.customerETA && selectedEta !== -1 && (
            <div className="mt-3 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-xl px-3 py-2">
              <Zap className="w-3.5 h-3.5 text-orange-500 flex-shrink-0" />
              <p className="text-xs font-bold text-orange-700">
                {selectedEta === 0
                  ? 'Order will be ready immediately'
                  : `Arriving at ${new Date(cart.customerETA).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}`}
              </p>
            </div>
          )}
        </div>
      )}

      {/* Coupon */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        {cart.couponCode ? (
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center">
                <Tag className="w-3.5 h-3.5 text-emerald-600" />
              </div>
              <div>
                <p className="text-xs font-bold text-emerald-700">{cart.couponCode} applied</p>
                <p className="text-[10px] text-emerald-600">{couponSuccess || `Saving ${formatCurrency(cart.discount)}`}</p>
              </div>
            </div>
            <button onClick={() => { cart.removeCoupon(); setCouponSuccess(''); }}
              className="text-[11px] font-semibold text-red-500 hover:text-red-600">Remove</button>
          </div>
        ) : (
          <>
            <button onClick={() => setShowCouponInput(!showCouponInput)}
              className="w-full flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Tag className="w-3.5 h-3.5 text-orange-500" />
                </div>
                <span className="text-xs font-bold text-gray-700">Apply Coupon</span>
              </div>
              <ChevronRight className={`w-3.5 h-3.5 text-gray-400 transition-transform ${showCouponInput ? 'rotate-90' : ''}`} />
            </button>
            {showCouponInput && (
              <div className="mt-3 flex gap-2">
                <input value={couponInput} onChange={e => setCouponInput(e.target.value.toUpperCase())}
                  placeholder="Enter code"
                  className="flex-1 px-3 py-2 border-2 border-gray-200 rounded-xl text-xs font-medium outline-none focus:border-orange-400 transition-colors uppercase" />
                <button onClick={handleApplyCoupon} disabled={couponLoading}
                  className="px-4 py-2 rounded-xl text-white text-xs font-bold bg-gradient-to-r from-orange-500 to-orange-400 disabled:opacity-60">
                  {couponLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Apply'}
                </button>
              </div>
            )}
            {couponError && <p className="text-red-500 text-[11px] font-medium mt-2">{couponError}</p>}
          </>
        )}
      </div>

      {/* Payment */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider mb-3">Payment Method</p>
        <div className="space-y-2">
          {availablePaymentOptions.map(({ value, label, emoji, desc }) => (
            <button key={value} onClick={() => setPaymentMethod(value)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border-2 transition-all text-left ${paymentMethod === value ? 'border-orange-400 bg-orange-50' : 'border-gray-200 bg-white hover:border-gray-300'}`}>
              <span className="text-lg flex-shrink-0">{emoji}</span>
              <div className="flex-1">
                <p className={`text-xs font-bold ${paymentMethod === value ? 'text-orange-600' : 'text-gray-700'}`}>{label}</p>
                <p className="text-[10px] text-gray-400">{desc}</p>
              </div>
              {paymentMethod === value && <div className="w-3.5 h-3.5 rounded-full bg-orange-500 flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {/* Bill Summary */}
      <div className="bg-white rounded-xl border border-gray-100 p-4">
        <p className="font-semibold text-gray-700 text-xs uppercase tracking-wider mb-4">Bill Summary</p>
        <div className="space-y-2.5">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Item Total</span>
            <span className="font-bold text-gray-900">{formatCurrency(subtotal)}</span>
          </div>
          {cart.discount > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-emerald-600 flex items-center gap-1"><Tag className="w-3 h-3" /> Coupon Discount</span>
              <span className="font-bold text-emerald-600">− {formatCurrency(cart.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-gray-500 flex items-center gap-1">GST ({gstRate}%) <Info className="w-3 h-3 text-gray-300" /></span>
            <span className="font-bold text-gray-900">{formatCurrency(gstAmount)}</span>
          </div>
          <div className="border-t border-dashed border-gray-200 pt-2.5 flex justify-between">
            <span className="font-extrabold text-gray-900">To Pay</span>
            <span className="font-extrabold text-orange-500 text-base">{formatCurrency(total)}</span>
          </div>
        </div>
        {cart.discount > 0 && (
          <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <p className="text-xs font-bold text-emerald-700">You saved {formatCurrency(cart.discount)} on this order!</p>
          </div>
        )}
      </div>

      {/* Place Order — desktop only (inside sidebar) */}
      <div className="hidden lg:block">
        {!cart.customerETA && (
          <p className="text-xs text-center text-orange-500 font-semibold mb-2">⚠️ Please select your arrival time above</p>
        )}
        {paymentError && (
          <p className="text-xs text-center text-red-500 font-semibold mb-2">⚠️ {paymentError}</p>
        )}
        <button onClick={handlePlaceOrder} disabled={!cart.customerETA || isLoading}
          className="w-full h-12 text-white font-extrabold text-sm rounded-xl flex items-center justify-between px-5 transition-all active:scale-[0.98] disabled:opacity-50 bg-gradient-to-r from-orange-500 to-orange-400 shadow-lg shadow-orange-200 hover:shadow-orange-300 disabled:shadow-none">
          {isLoading ? (
            <div className="flex items-center gap-2 mx-auto">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{paymentMethod === 'online' ? 'Processing...' : 'Placing Order...'}</span>
            </div>
          ) : (
            <>
              <span>{cart.getItemCount()} items</span>
              <span>{paymentMethod === 'online' ? 'Pay Now' : 'Place Order'}</span>
              <span>{formatCurrency(total)}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ── HEADER ── */}
      <div className="sticky top-0 z-30 bg-white border-b border-gray-100 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-4">
          <button onClick={() => router.back()} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </button>
          <div className="flex-1">
            <h1 className="font-extrabold text-gray-900 text-base">Your Cart</h1>
            {cart.restaurantName && <p className="text-xs text-gray-400">{cart.restaurantName}</p>}
          </div>
          <span className="text-xs font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2.5 py-1 rounded-full">
            {cart.getItemCount()} items
          </span>
        </div>
      </div>

      {/* ── MAIN CONTENT ── */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
        {/* Desktop: 2-col grid | Mobile: stacked */}
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_380px] gap-6">

          {/* LEFT — Cart items */}
          <div className="space-y-3">
            <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
              <div className="px-5 py-4 border-b border-gray-50">
                <h2 className="font-extrabold text-gray-900 text-sm">Order Items</h2>
              </div>
              <div className="divide-y divide-gray-50">
                {cart.items.map((item) => (
                  <div key={item.menuItem._id} className="flex items-center gap-4 px-5 py-4">
                    {/* Veg/non-veg dot */}
                    <div className={`w-4 h-4 rounded-sm border-2 flex items-center justify-center flex-shrink-0 ${item.menuItem.foodType === 'veg' ? 'border-emerald-600' : 'border-red-600'}`}>
                      <div className={`w-2 h-2 rounded-full ${item.menuItem.foodType === 'veg' ? 'bg-emerald-600' : 'bg-red-600'}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-gray-900 text-sm truncate">{item.menuItem.name}</p>
                      <p className="text-xs text-gray-400 mt-0.5">{formatCurrency(item.menuItem.price)} each</p>
                    </div>
                    {/* Qty controls */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => cart.removeItem(item.menuItem._id)}
                        className="w-7 h-7 rounded-lg bg-orange-50 border border-orange-200 flex items-center justify-center hover:bg-orange-100 transition-colors">
                        <Minus className="w-3 h-3 text-orange-600" />
                      </button>
                      <span className="w-6 text-center font-extrabold text-gray-900 text-sm">{item.quantity}</span>
                      <button onClick={() => cart.addItem(item.menuItem, cart.restaurantId!, cart.restaurantName!)}
                        className="w-7 h-7 rounded-lg bg-orange-500 flex items-center justify-center hover:bg-orange-600 transition-colors">
                        <Plus className="w-3 h-3 text-white" />
                      </button>
                    </div>
                    <span className="font-extrabold text-gray-900 text-sm w-16 text-right flex-shrink-0">
                      {formatCurrency(item.menuItem.price * item.quantity)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Add more items */}
            <Link href={cart.restaurantId ? `/restaurants/${cart.restaurantId}` : '/trip'}>
              <div className="bg-white rounded-xl border-2 border-dashed border-orange-200 p-4 text-center hover:border-orange-400 hover:bg-orange-50 transition-all cursor-pointer">
                <p className="text-sm font-bold text-orange-500">+ Add more items</p>
              </div>
            </Link>

            {/* Mobile: options below items */}
            <div className="lg:hidden">
              <OrderOptions />
            </div>
          </div>

          {/* RIGHT — Options sidebar (desktop only) */}
          <div className="hidden lg:block">
            <OrderOptions />
          </div>
        </div>
      </div>

      {/* ── MOBILE PLACE ORDER — fixed bottom ── */}
      <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 shadow-2xl">
        {!cart.customerETA && (
          <p className="text-xs text-center text-orange-500 font-semibold mb-2">⚠️ Please select your arrival time above</p>
        )}
        {paymentError && (
          <p className="text-xs text-center text-red-500 font-semibold mb-2">⚠️ {paymentError}</p>
        )}
        <button onClick={handlePlaceOrder} disabled={!cart.customerETA || isLoading}
          className="w-full h-13 text-white font-extrabold text-sm rounded-xl flex items-center justify-between px-5 py-3.5 transition-all active:scale-[0.98] disabled:opacity-50 bg-gradient-to-r from-orange-500 to-orange-400 shadow-lg shadow-orange-200 disabled:shadow-none">
          {isLoading ? (
            <div className="flex items-center gap-2 mx-auto">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>{paymentMethod === 'online' ? 'Processing...' : 'Placing Order...'}</span>
            </div>
          ) : (
            <>
              <span>{cart.getItemCount()} items</span>
              <span>{paymentMethod === 'online' ? 'Pay Now' : 'Place Order'}</span>
              <span>{formatCurrency(total)}</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}
