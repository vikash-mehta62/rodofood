'use client';
import Link from 'next/link';
import { ShoppingBag, ChevronRight, Loader2, Clock, MapPin } from 'lucide-react';
import { useMyOrders } from '@/hooks/useOrders';
import BottomNav from '@/components/shared/BottomNav';
import { formatCurrency } from '@/lib/utils';
import type { Restaurant } from '@/types';

const STATUS_CFG: Record<string, { label: string; dot: string; bar: string; text: string }> = {
  pending:   { label: 'Order Placed',   dot: 'bg-amber-400',              bar: 'bg-amber-400',   text: 'text-amber-700 bg-amber-50 border-amber-200' },
  confirmed: { label: 'Confirmed',      dot: 'bg-blue-400',               bar: 'bg-blue-400',    text: 'text-blue-700 bg-blue-50 border-blue-200' },
  preparing: { label: 'Preparing',      dot: 'bg-orange-400 animate-pulse', bar: 'bg-orange-400', text: 'text-orange-700 bg-orange-50 border-orange-200' },
  ready:     { label: 'Ready to Pick',  dot: 'bg-emerald-400 animate-pulse', bar: 'bg-emerald-400', text: 'text-emerald-700 bg-emerald-50 border-emerald-200' },
  completed: { label: 'Completed',      dot: 'bg-gray-400',               bar: 'bg-gray-300',    text: 'text-gray-600 bg-gray-50 border-gray-200' },
  cancelled: { label: 'Cancelled',      dot: 'bg-red-400',                bar: 'bg-red-300',     text: 'text-red-600 bg-red-50 border-red-200' },
  rejected:  { label: 'Rejected',       dot: 'bg-red-400',                bar: 'bg-red-300',     text: 'text-red-600 bg-red-50 border-red-200' },
};

const ACTIVE = new Set(['pending', 'confirmed', 'preparing', 'ready']);

export default function OrdersPage() {
  const { data: orders, isLoading } = useMyOrders();

  const active   = orders?.filter(o => ACTIVE.has(o.status)) ?? [];
  const past     = orders?.filter(o => !ACTIVE.has(o.status)) ?? [];

  return (
    <div className="min-h-screen bg-[#F5F6FA] pb-28">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 px-4 sm:px-6 pt-12 pb-4 sticky top-0 z-10 shadow-sm">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-xl font-extrabold text-gray-900">My Orders</h1>
          {!isLoading && orders?.length ? (
            <p className="text-xs text-gray-400 mt-0.5">{orders.length} order{orders.length !== 1 ? 's' : ''} total</p>
          ) : null}
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 sm:px-6 py-5 space-y-6">

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="w-7 h-7 animate-spin text-orange-500" />
            <p className="text-gray-400 text-sm">Loading orders...</p>
          </div>

        ) : !orders?.length ? (
          <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-2xl flex items-center justify-center">
              <ShoppingBag className="w-9 h-9 text-orange-300" />
            </div>
            <div>
              <p className="font-extrabold text-gray-800 text-base mb-1">No orders yet</p>
              <p className="text-gray-400 text-sm">Find a restaurant on your route and place your first order.</p>
            </div>
            <Link href="/trip">
              <button className="text-white font-bold px-6 py-2.5 rounded-xl text-sm bg-gradient-to-r from-orange-500 to-orange-400 shadow-md shadow-orange-200 hover:shadow-orange-300 transition-all">
                Find Restaurants →
              </button>
            </Link>
          </div>

        ) : (
          <>
            {/* Active orders */}
            {active.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Active Orders</p>
                <div className="space-y-3">
                  {active.map(order => {
                    const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.pending;
                    const restaurant = order.restaurant as Restaurant;
                    return (
                      <Link key={order._id} href={`/orders/${order._id}`}>
                        <div className="bg-white border border-orange-200 rounded-2xl p-4 hover:shadow-lg hover:shadow-orange-100 transition-all">
                          <div className="flex items-start justify-between gap-3 mb-3">
                            <div className="flex-1 min-w-0">
                              <p className="font-extrabold text-gray-900 text-sm truncate">{restaurant?.name || 'Restaurant'}</p>
                              <p className="text-xs text-gray-400 mt-0.5">#{order.orderNumber}</p>
                            </div>
                            <span className={`flex-shrink-0 inline-flex items-center gap-1.5 text-[10px] font-bold px-2.5 py-1 rounded-full border ${cfg.text}`}>
                              <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                            </span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span>{order.items.length} item{order.items.length !== 1 ? 's' : ''} · {formatCurrency(order.totalAmount)}</span>
                            <span className="flex items-center gap-1 text-orange-500 font-bold">Track Order <ChevronRight className="w-3 h-3" /></span>
                          </div>
                          {/* Progress bar */}
                          <div className="mt-3 h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className={`h-full rounded-full transition-all ${cfg.bar}`}
                              style={{ width: `${(['pending','confirmed','preparing','ready'].indexOf(order.status) + 1) * 25}%` }} />
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Past orders */}
            {past.length > 0 && (
              <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Past Orders</p>
                <div className="space-y-2.5">
                  {past.map(order => {
                    const cfg = STATUS_CFG[order.status] ?? STATUS_CFG.completed;
                    const restaurant = order.restaurant as Restaurant;
                    return (
                      <Link key={order._id} href={`/orders/${order._id}`}>
                        <div className="bg-white border border-gray-100 rounded-2xl p-4 hover:shadow-md hover:border-gray-200 transition-all flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <ShoppingBag className="w-5 h-5 text-gray-400" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between gap-2">
                              <p className="font-bold text-gray-900 text-sm truncate">{restaurant?.name || 'Restaurant'}</p>
                              <span className={`flex-shrink-0 inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border ${cfg.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />{cfg.label}
                              </span>
                            </div>
                            <p className="text-xs text-gray-400 mt-0.5">
                              {order.items.length} item{order.items.length !== 1 ? 's' : ''} · {formatCurrency(order.totalAmount)} · {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                            </p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
