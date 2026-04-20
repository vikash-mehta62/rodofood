'use client';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone, Clock, CheckCircle, Loader2, Navigation, Tag, ShieldCheck, Star } from 'lucide-react';
import { useOrderById, useRateOrder } from '@/hooks/useOrders';
import { formatCurrency } from '@/lib/utils';
import type { Restaurant } from '@/types';
import { useState } from 'react';

const STEPS = [
  { key: 'pending',   label: 'Placed',    emoji: '📋' },
  { key: 'confirmed', label: 'Confirmed', emoji: '✅' },
  { key: 'preparing', label: 'Preparing', emoji: '👨‍🍳' },
  { key: 'ready',     label: 'Ready',     emoji: '🎉' },
];

const STATUS_CFG: Record<string, { label: string; text: string; bg: string }> = {
  pending:   { label: 'Order Placed',   text: 'text-amber-700',   bg: 'bg-amber-50 border-amber-200' },
  confirmed: { label: 'Confirmed',      text: 'text-blue-700',    bg: 'bg-blue-50 border-blue-200' },
  preparing: { label: 'Preparing',      text: 'text-orange-700',  bg: 'bg-orange-50 border-orange-200' },
  ready:     { label: 'Ready to Pick',  text: 'text-emerald-700', bg: 'bg-emerald-50 border-emerald-200' },
  completed: { label: 'Completed',      text: 'text-gray-600',    bg: 'bg-gray-50 border-gray-200' },
  cancelled: { label: 'Cancelled',      text: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
  rejected:  { label: 'Rejected',       text: 'text-red-600',     bg: 'bg-red-50 border-red-200' },
};

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: order, isLoading } = useOrderById(id);
  const rateOrder = useRateOrder(id);

  const [selectedStars, setSelectedStars] = useState(0);
  const [hoveredStars, setHoveredStars] = useState(0);
  const [comment, setComment] = useState('');
  const [ratingDone, setRatingDone] = useState(false);

  const handleRate = async () => {
    if (!selectedStars) return;
    await rateOrder.mutateAsync({ stars: selectedStars, comment });
    setRatingDone(true);
  };

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-screen bg-[#F5F6FA]">
      <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
    </div>
  );

  if (!order) return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-3 px-4">
      <div className="text-4xl">📦</div>
      <p className="font-bold text-gray-700">Order not found</p>
      <Link href="/orders"><button className="text-sm text-orange-500 font-bold">← Back to Orders</button></Link>
    </div>
  );

  const restaurant = order.restaurant as Restaurant;
  const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.pending;
  const currentStep = STEPS.findIndex(s => s.key === order.status);
  const isCancelled = ['cancelled', 'rejected'].includes(order.status);
  const isCompleted = order.status === 'completed';

  return (
    <div className="min-h-screen bg-[#F5F6FA] pb-10">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 h-14 flex items-center gap-3">
          <button onClick={() => router.back()}
            className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center hover:bg-gray-200 transition-colors">
            <ArrowLeft className="w-4 h-4 text-gray-700" />
          </button>
          <div className="flex-1">
            <p className="font-extrabold text-gray-900 text-sm">Order #{order.orderNumber}</p>
            <p className="text-xs text-gray-400">{new Date(order.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
          </div>
          <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${cfg.bg} ${cfg.text}`}>
            {cfg.label}
          </span>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-4">

        {/* Progress tracker */}
        {!isCancelled && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-5">Order Progress</p>
            <div className="relative">
              {/* Track line */}
              <div className="absolute top-5 left-5 right-5 h-0.5 bg-gray-100" />
              <div className="absolute top-5 left-5 h-0.5 bg-orange-400 transition-all duration-500"
                style={{ width: isCompleted ? 'calc(100% - 40px)' : currentStep > 0 ? `${(currentStep / (STEPS.length - 1)) * 100}%` : '0%' }} />

              <div className="relative flex justify-between">
                {STEPS.map((step, i) => {
                  const done = isCompleted || i < currentStep;
                  const active = !isCompleted && i === currentStep;
                  return (
                    <div key={step.key} className="flex flex-col items-center gap-2">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg border-2 transition-all ${
                        done    ? 'bg-orange-500 border-orange-500 shadow-md shadow-orange-200' :
                        active  ? 'bg-white border-orange-400 shadow-md shadow-orange-100 scale-110' :
                                  'bg-white border-gray-200'
                      }`}>
                        {done ? <CheckCircle className="w-5 h-5 text-white" /> : <span className={active ? '' : 'opacity-40'}>{step.emoji}</span>}
                      </div>
                      <span className={`text-[10px] font-bold ${done || active ? 'text-gray-800' : 'text-gray-400'}`}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Status message */}
            {!isCompleted && currentStep >= 0 && (
              <div className={`mt-5 rounded-xl px-4 py-3 border ${cfg.bg}`}>
                <p className={`text-xs font-bold ${cfg.text}`}>
                  {order.status === 'pending'   && '⏳ Waiting for restaurant to confirm your order...'}
                  {order.status === 'confirmed' && '✅ Restaurant confirmed! They will start cooking soon.'}
                  {order.status === 'preparing' && '👨‍🍳 Your food is being prepared right now!'}
                  {order.status === 'ready'     && '🎉 Your food is ready! Head to the restaurant.'}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Cancelled/Rejected */}
        {isCancelled && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
            <p className="text-sm font-bold text-red-700 mb-1">
              {order.status === 'rejected' ? '❌ Order Rejected' : '❌ Order Cancelled'}
            </p>
            {(order as any).rejectionReason && (
              <p className="text-xs text-red-600">{(order as any).rejectionReason}</p>
            )}
          </div>
        )}

        {/* Restaurant info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Restaurant</p>
          <p className="font-extrabold text-gray-900 text-base mb-1">{restaurant?.name}</p>
          {restaurant?.address?.city && (
            <p className="text-xs text-gray-500 flex items-center gap-1.5 mb-4">
              <MapPin className="w-3.5 h-3.5 text-gray-400" />
              {[restaurant.address.street, restaurant.address.city].filter(Boolean).join(', ')}
            </p>
          )}
          <div className="flex gap-2 flex-wrap">
            {restaurant?.phone && (
              <a href={`tel:${restaurant.phone}`}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-orange-600 border border-orange-200 bg-orange-50 hover:bg-orange-100 px-3 py-2 rounded-xl transition-colors">
                <Phone className="w-3.5 h-3.5" /> Call Restaurant
              </a>
            )}
            {restaurant?.location && (
              <a href={`https://maps.google.com/?q=${restaurant.location.coordinates[1]},${restaurant.location.coordinates[0]}`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 border border-blue-200 bg-blue-50 hover:bg-blue-100 px-3 py-2 rounded-xl transition-colors">
                <Navigation className="w-3.5 h-3.5" /> Navigate
              </a>
            )}
          </div>
        </div>

        {/* ETA */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
          <div className="w-11 h-11 bg-orange-50 rounded-xl flex items-center justify-center flex-shrink-0">
            <Clock className="w-5 h-5 text-orange-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Your Arrival Time</p>
            <p className="font-extrabold text-gray-900 text-base">
              {new Date(order.customerETA).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
            <p className="text-xs text-gray-400">{order.orderType === 'dine-in' ? '🍽️ Dine-in' : '🥡 Takeaway'}</p>
          </div>
        </div>

        {/* Order items */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Order Items</p>
          <div className="space-y-3">
            {order.items.map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-sm border-2 flex-shrink-0 flex items-center justify-center ${item.foodType === 'veg' ? 'border-emerald-600' : 'border-red-600'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${item.foodType === 'veg' ? 'bg-emerald-600' : 'bg-red-600'}`} />
                </div>
                <span className="flex-1 text-sm text-gray-800 font-medium">{item.name}</span>
                <span className="text-xs text-gray-500 font-medium">×{item.quantity}</span>
                <span className="text-sm font-bold text-gray-900 w-16 text-right">{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>

          {/* Bill */}
          <div className="mt-4 pt-4 border-t border-dashed border-gray-200 space-y-2">
            <div className="flex justify-between text-sm text-gray-500">
              <span>Item Total</span><span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-emerald-600">
                <span className="flex items-center gap-1"><Tag className="w-3 h-3" /> Discount</span>
                <span>− {formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-gray-500">
              <span>GST ({order.gstRate}%)</span><span>{formatCurrency(order.gstAmount)}</span>
            </div>
            <div className="flex justify-between font-extrabold text-gray-900 pt-2 border-t border-gray-100">
              <span>Total Paid</span>
              <span className="text-orange-500 text-base">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>

          {order.discount > 0 && (
            <div className="mt-3 bg-emerald-50 border border-emerald-200 rounded-xl px-3 py-2 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <p className="text-xs font-bold text-emerald-700">You saved {formatCurrency(order.discount)} on this order!</p>
            </div>
          )}
        </div>

        {/* Payment method */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3">
          <span className="text-2xl">
            {order.paymentMethod === 'cash' ? '💵' : order.paymentMethod === 'upi_at_restaurant' ? '📱' : '💳'}
          </span>
          <div>
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-0.5">Payment</p>
            <p className="text-sm font-bold text-gray-900">
              {order.paymentMethod === 'cash' ? 'Cash at Restaurant' :
               order.paymentMethod === 'upi_at_restaurant' ? 'UPI at Restaurant' : 'Online Payment'}
            </p>
          </div>
          <span className={`ml-auto text-xs font-bold px-2.5 py-1 rounded-full border ${
            order.paymentStatus === 'paid' ? 'text-emerald-700 bg-emerald-50 border-emerald-200' : 'text-amber-700 bg-amber-50 border-amber-200'
          }`}>
            {order.paymentStatus === 'paid' ? '✓ Paid' : 'Pending'}
          </span>
        </div>

        {/* Rating section — only for completed orders */}
        {isCompleted && (
          <div className="bg-white rounded-2xl border border-gray-100 p-5">
            {(order as any).rating?.stars || ratingDone ? (
              /* Already rated */
              <div className="text-center py-2">
                <p className="text-2xl mb-2">🎉</p>
                <p className="font-extrabold text-gray-900 text-sm mb-1">Thanks for your feedback!</p>
                <div className="flex justify-center gap-1 mb-1">
                  {[1,2,3,4,5].map(s => (
                    <Star key={s} className={`w-5 h-5 ${s <= ((order as any).rating?.stars || selectedStars) ? 'fill-amber-400 text-amber-400' : 'text-gray-200'}`} />
                  ))}
                </div>
                {(order as any).rating?.comment && (
                  <p className="text-xs text-gray-500 italic mt-1">"{(order as any).rating.comment}"</p>
                )}
              </div>
            ) : (
              /* Rate now */
              <>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-4">Rate your experience</p>
                <p className="text-sm text-gray-600 mb-4">How was your food from <span className="font-bold text-gray-900">{restaurant?.name}</span>?</p>

                {/* Stars */}
                <div className="flex justify-center gap-2 mb-5">
                  {[1,2,3,4,5].map(s => (
                    <button key={s} type="button"
                      onMouseEnter={() => setHoveredStars(s)}
                      onMouseLeave={() => setHoveredStars(0)}
                      onClick={() => setSelectedStars(s)}
                      className="transition-transform hover:scale-125 active:scale-110">
                      <Star className={`w-9 h-9 transition-colors ${
                        s <= (hoveredStars || selectedStars)
                          ? 'fill-amber-400 text-amber-400'
                          : 'text-gray-200'
                      }`} />
                    </button>
                  ))}
                </div>

                {/* Star label */}
                {selectedStars > 0 && (
                  <p className="text-center text-sm font-bold text-amber-600 mb-4">
                    {['', 'Poor 😞', 'Fair 😐', 'Good 🙂', 'Great 😊', 'Excellent 🤩'][selectedStars]}
                  </p>
                )}

                {/* Comment */}
                <textarea
                  placeholder="Share details about your experience (optional)"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  maxLength={300}
                  rows={3}
                  className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl text-sm outline-none focus:border-orange-400 transition-colors resize-none bg-gray-50 mb-4"
                />

                <button
                  onClick={handleRate}
                  disabled={!selectedStars || rateOrder.isPending}
                  className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 bg-gradient-to-r from-orange-500 to-orange-400 shadow-md shadow-orange-200 disabled:shadow-none disabled:bg-none disabled:bg-gray-300">
                  {rateOrder.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : '⭐ Submit Rating'}
                </button>

                {rateOrder.isError && (
                  <p className="text-red-500 text-xs text-center mt-2">
                    {(rateOrder.error as any)?.response?.data?.message || 'Failed to submit. Try again.'}
                  </p>
                )}
              </>
            )}
          </div>
        )}

        {/* Reorder */}
        {isCompleted && (
          <Link href={`/restaurants/${typeof restaurant === 'object' ? restaurant._id : ''}`}>
            <button className="w-full py-3.5 rounded-2xl text-sm font-bold text-white bg-gradient-to-r from-orange-500 to-orange-400 shadow-lg shadow-orange-200 hover:shadow-orange-300 transition-all">
              Reorder from {restaurant?.name} →
            </button>
          </Link>
        )}
      </div>
    </div>
  );
}
