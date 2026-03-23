'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Tag, Clock, Trash2, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useCartStore } from '@/store/cartStore';
import { usePlaceOrder } from '@/hooks/useOrders';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/axios';

const ETA_OPTIONS = [
  { label: '30 min', value: 30 },
  { label: '45 min', value: 45 },
  { label: '1 hour', value: 60 },
];

export default function CartPage() {
  const router = useRouter();
  const cart = useCartStore();
  const placeOrder = usePlaceOrder();

  const [couponInput, setCouponInput] = useState('');
  const [couponLoading, setCouponLoading] = useState(false);
  const [couponError, setCouponError] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'upi_at_restaurant' | 'online'>('cash');

  const subtotal = cart.getSubtotal();
  const gstRate = 5;
  const gstAmount = Math.round(((subtotal - cart.discount) * gstRate) / 100 * 100) / 100;
  const total = subtotal - cart.discount + gstAmount;

  const handleApplyCoupon = async () => {
    if (!couponInput) return;
    setCouponLoading(true);
    setCouponError('');
    try {
      const res = await api.post('/coupons/validate', {
        code: couponInput,
        orderAmount: subtotal,
        restaurantId: cart.restaurantId,
      });
      cart.applyCoupon(couponInput, res.data.data.discount);
    } catch (err: any) {
      setCouponError(err.response?.data?.message || 'Invalid coupon');
    } finally {
      setCouponLoading(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!cart.customerETA || !cart.restaurantId) return;

    const orderData = {
      restaurantId: cart.restaurantId,
      items: cart.items.map((i) => ({ menuItemId: i.menuItem._id, quantity: i.quantity })),
      orderType: cart.orderType,
      paymentMethod,
      customerETA: cart.customerETA,
      etaMinutes: cart.etaMinutes,
      couponCode: cart.couponCode || undefined,
    };

    try {
      const res = await placeOrder.mutateAsync(orderData);
      cart.clearCart();
      router.push(`/orders/${res.data.data.order._id}`);
    } catch (err) {
      console.error(err);
    }
  };

  if (cart.items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-4 px-4">
        <span className="text-6xl">🛒</span>
        <h2 className="text-xl font-bold">Your cart is empty</h2>
        <Link href="/trip">
          <Button>Find Restaurants</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b">
        <Link href={`/restaurant/${cart.restaurantId}`}>
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <h1 className="font-bold text-lg">Your Cart</h1>
        <span className="text-sm text-muted-foreground ml-auto">{cart.restaurantName}</span>
      </div>

      <div className="px-4 space-y-4 py-4">
        {/* Items */}
        <div className="bg-card rounded-xl border p-4 space-y-3">
          {cart.items.map(({ menuItem, quantity }) => (
            <div key={menuItem._id} className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm font-medium">{menuItem.name}</p>
                <p className="text-xs text-muted-foreground">
                  {formatCurrency(menuItem.discountedPrice || menuItem.price)} × {quantity}
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-sm">
                  {formatCurrency((menuItem.discountedPrice || menuItem.price) * quantity)}
                </span>
                <button onClick={() => cart.removeItem(menuItem._id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Order Type */}
        <div className="bg-card rounded-xl border p-4">
          <p className="font-semibold text-sm mb-3">Order Type</p>
          <div className="flex gap-2">
            {(['takeaway', 'dine-in'] as const).map((type) => (
              <button
                key={type}
                onClick={() => cart.setOrderType(type)}
                className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-colors ${
                  cart.orderType === type
                    ? 'bg-primary text-primary-foreground border-primary'
                    : 'border-input'
                }`}
              >
                {type === 'takeaway' ? '🥡 Takeaway' : '🍽️ Dine-in'}
              </button>
            ))}
          </div>
        </div>

        {/* ETA Selection */}
        <div className="bg-card rounded-xl border p-4">
          <p className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Clock className="w-4 h-4" /> When will you arrive?
          </p>
          <div className="flex gap-2 flex-wrap">
            {ETA_OPTIONS.map(({ label, value }) => {
              const eta = new Date(Date.now() + value * 60 * 1000).toISOString();
              return (
                <button
                  key={value}
                  onClick={() => cart.setETA(value, eta)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors ${
                    cart.etaMinutes === value
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-input'
                  }`}
                >
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Coupon */}
        <div className="bg-card rounded-xl border p-4">
          <p className="font-semibold text-sm mb-3 flex items-center gap-2">
            <Tag className="w-4 h-4" /> Apply Coupon
          </p>
          {cart.couponCode ? (
            <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-lg px-3 py-2">
              <span className="text-green-700 font-medium text-sm">{cart.couponCode} applied</span>
              <button onClick={cart.removeCoupon} className="text-xs text-destructive">Remove</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <Input
                placeholder="Enter coupon code"
                value={couponInput}
                onChange={(e) => setCouponInput(e.target.value.toUpperCase())}
                className="flex-1"
              />
              <Button variant="outline" onClick={handleApplyCoupon} disabled={couponLoading}>
                {couponLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Apply'}
              </Button>
            </div>
          )}
          {couponError && <p className="text-destructive text-xs mt-1">{couponError}</p>}
        </div>

        {/* Payment Method */}
        <div className="bg-card rounded-xl border p-4">
          <p className="font-semibold text-sm mb-3">Payment Method</p>
          <div className="space-y-2">
            {[
              { value: 'cash', label: '💵 Cash at Restaurant' },
              { value: 'upi_at_restaurant', label: '📱 UPI at Restaurant' },
              { value: 'online', label: '💳 Pay Online (PhonePe)' },
            ].map(({ value, label }) => (
              <button
                key={value}
                onClick={() => setPaymentMethod(value as typeof paymentMethod)}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm border transition-colors ${
                  paymentMethod === value ? 'bg-primary/10 border-primary text-primary' : 'border-input'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Bill Summary */}
        <div className="bg-card rounded-xl border p-4 space-y-2">
          <p className="font-bold text-sm mb-3">Bill Summary</p>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatCurrency(subtotal)}</span>
          </div>
          {cart.discount > 0 && (
            <div className="flex justify-between text-sm text-green-600">
              <span>Coupon Discount</span>
              <span>- {formatCurrency(cart.discount)}</span>
            </div>
          )}
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">GST ({gstRate}%)</span>
            <span>{formatCurrency(gstAmount)}</span>
          </div>
          <div className="flex justify-between font-bold border-t pt-2 mt-2">
            <span>Total</span>
            <span className="text-primary">{formatCurrency(total)}</span>
          </div>
        </div>
      </div>

      {/* Place Order Button */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t">
        <Button
          className="w-full h-12 text-base"
          onClick={handlePlaceOrder}
          disabled={!cart.customerETA || placeOrder.isPending}
        >
          {placeOrder.isPending ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            `Place Order • ${formatCurrency(total)}`
          )}
        </Button>
        {!cart.customerETA && (
          <p className="text-xs text-center text-muted-foreground mt-1">Please select your arrival time</p>
        )}
      </div>
    </div>
  );
}
