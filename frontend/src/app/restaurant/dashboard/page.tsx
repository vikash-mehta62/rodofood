'use client';
import { useState } from 'react';
import {
  TrendingUp, ShoppingBag, DollarSign, Loader2,
  ChefHat, Clock, CheckCircle, XCircle,
  Bell, UtensilsCrossed, ArrowRight, BarChart3
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useRestaurantOrders, useUpdateOrderStatus, useRestaurantEarnings } from '@/hooks/useOrders';
import OrderAlert from '@/components/restaurant/OrderAlert';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';
import type { Order } from '@/types';

const STATUS_CFG: Record<string, { label: string; icon: React.ElementType; color: string; dot: string }> = {
  pending:   { label: 'New Order',  icon: Bell,         color: 'text-yellow-700 bg-yellow-50 border-yellow-200', dot: 'bg-yellow-400 animate-pulse' },
  confirmed: { label: 'Confirmed',  icon: CheckCircle,  color: 'text-blue-700 bg-blue-50 border-blue-200',       dot: 'bg-blue-400' },
  preparing: { label: 'Preparing',  icon: ChefHat,      color: 'text-orange-700 bg-orange-50 border-orange-200', dot: 'bg-orange-400 animate-pulse' },
  ready:     { label: 'Ready',      icon: CheckCircle,  color: 'text-green-700 bg-green-50 border-green-200',    dot: 'bg-green-400 animate-pulse' },
  completed: { label: 'Completed',  icon: CheckCircle,  color: 'text-slate-600 bg-slate-50 border-slate-200',    dot: 'bg-slate-300' },
  cancelled: { label: 'Cancelled',  icon: XCircle,      color: 'text-red-600 bg-red-50 border-red-200',          dot: 'bg-red-400' },
};

const NEXT_ACTION: Record<string, { label: string; status: string; bg: string }> = {
  pending:   { label: 'Accept Order',  status: 'confirmed', bg: 'linear-gradient(135deg,#3B82F6,#2563EB)' },
  confirmed: { label: 'Start Cooking', status: 'preparing', bg: 'linear-gradient(135deg,#FF6B35,#FF8C42)' },
  preparing: { label: 'Mark Ready',    status: 'ready',     bg: 'linear-gradient(135deg,#22C55E,#16A34A)' },
};

export default function RestaurantDashboard() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');

  const { data: restaurant } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn: async () => (await api.get('/restaurants/owner/me')).data.data.restaurant,
  });

  const { data: liveOrders, isLoading: ordersLoading } = useRestaurantOrders(
    activeTab === 'live' ? { status: 'pending,confirmed,preparing,ready' } : {}
  );

  const { data: earnings } = useRestaurantEarnings();
  const updateStatus = useUpdateOrderStatus();

  const pendingCount = liveOrders?.filter((o: Order) => o.status === 'pending').length || 0;
  const preparingCount = liveOrders?.filter((o: Order) => o.status === 'preparing').length || 0;

  return (
    <div className="p-6 space-y-6 min-h-screen" style={{ background: '#F1F5F9' }}>
      <OrderAlert />

      {/* ── PAGE TITLE ── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Dashboard</h1>
          <p className="text-slate-400 text-sm font-medium mt-0.5">
            {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="flex items-center gap-2 bg-yellow-50 border border-yellow-200 rounded-2xl px-4 py-2">
            <Bell className="w-4 h-4 text-yellow-600 animate-bounce" />
            <span className="text-yellow-700 text-sm font-black">{pendingCount} new order{pendingCount > 1 ? 's' : ''}!</span>
          </div>
        )}
      </div>

      {/* ── STATS GRID ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Today's Orders",
            value: earnings?.today?.count ?? '—',
            sub: `${preparingCount} preparing`,
            icon: ShoppingBag,
            gradient: 'linear-gradient(135deg,#FF6B35,#FF8C42)',
            light: 'bg-orange-50',
          },
          {
            label: "Today's Revenue",
            value: earnings?.today?.total ? formatCurrency(earnings.today.total) : '₹0',
            sub: 'Collected today',
            icon: DollarSign,
            gradient: 'linear-gradient(135deg,#22C55E,#16A34A)',
            light: 'bg-green-50',
          },
          {
            label: 'This Month',
            value: earnings?.thisMonth?.total ? formatCurrency(earnings.thisMonth.total) : '₹0',
            sub: `${earnings?.thisMonth?.count ?? 0} orders`,
            icon: TrendingUp,
            gradient: 'linear-gradient(135deg,#3B82F6,#2563EB)',
            light: 'bg-blue-50',
          },
          {
            label: 'Avg Prep Time',
            value: `${restaurant?.avgPrepTime || 20} min`,
            sub: 'Per order',
            icon: Clock,
            gradient: 'linear-gradient(135deg,#8B5CF6,#7C3AED)',
            light: 'bg-purple-50',
          },
        ].map(({ label, value, sub, icon: Icon, gradient, light }) => (
          <div key={label} className="bg-white rounded-2xl p-5 shadow-sm border border-slate-100 hover:shadow-md transition-all">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-10 h-10 rounded-xl ${light} flex items-center justify-center`}>
                <Icon className="w-5 h-5" style={{ color: gradient.includes('FF6B35') ? '#FF6B35' : gradient.includes('22C55E') ? '#22C55E' : gradient.includes('3B82F6') ? '#3B82F6' : '#8B5CF6' }} />
              </div>
              <div className="w-2 h-2 rounded-full bg-green-400" />
            </div>
            <p className="text-2xl font-black text-slate-900">{value}</p>
            <p className="text-xs font-bold text-slate-400 mt-0.5">{label}</p>
            <p className="text-[10px] text-slate-300 font-medium mt-1">{sub}</p>
          </div>
        ))}
      </div>

      {/* ── QUICK ACTIONS ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link href="/restaurant/menu">
          <div className="bg-white rounded-2xl p-5 border border-slate-100 hover:shadow-md hover:border-orange-200 transition-all cursor-pointer flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
              style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
              <UtensilsCrossed className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-black text-slate-900">Manage Menu</p>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Add, edit or remove menu items</p>
            </div>
            <ArrowRight className="w-5 h-5 text-slate-300" />
          </div>
        </Link>
        <div className="bg-white rounded-2xl p-5 border border-slate-100 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#3B82F6,#2563EB)' }}>
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div>
            <p className="font-black text-slate-900">Restaurant Status</p>
            <p className="text-xs font-medium mt-0.5">
              <span className={`font-black ${restaurant?.isOpen ? 'text-green-600' : 'text-red-500'}`}>
                {restaurant?.isOpen ? '🟢 Currently Open' : '🔴 Currently Closed'}
              </span>
              <span className="text-slate-400"> — toggle from sidebar</span>
            </p>
          </div>
        </div>
      </div>

      {/* ── ORDERS SECTION ── */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        {/* Tab header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <h2 className="font-black text-slate-900 text-base">Orders</h2>
          <div className="flex gap-1 bg-slate-100 rounded-xl p-1">
            {(['live', 'history'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-1.5 rounded-lg text-xs font-black transition-all ${
                  activeTab === tab ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'
                }`}
              >
                {tab === 'live' ? `🔴 Live${pendingCount > 0 ? ` (${pendingCount})` : ''}` : '📋 History'}
              </button>
            ))}
          </div>
        </div>

        {/* Orders */}
        <div className="divide-y divide-slate-50">
          {ordersLoading ? (
            <div className="flex justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : liveOrders?.length ? (
            liveOrders.map((order: Order) => {
              const cfg = STATUS_CFG[order.status] || STATUS_CFG.pending;
              const next = NEXT_ACTION[order.status];
              const StatusIcon = cfg.icon;

              return (
                <div key={order._id} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-4">
                    {/* Status dot */}
                    <div className="flex flex-col items-center gap-1 pt-1 flex-shrink-0">
                      <div className={`w-3 h-3 rounded-full ${cfg.dot}`} />
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                        <div className="flex items-center gap-2">
                          <p className="font-black text-slate-900 text-sm">#{order.orderNumber}</p>
                          <span className={`flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-full border ${cfg.color}`}>
                            <StatusIcon className="w-2.5 h-2.5" />
                            {cfg.label}
                          </span>
                        </div>
                        <p className="font-black text-slate-900 text-sm">{formatCurrency(order.totalAmount)}</p>
                      </div>

                      {/* Items */}
                      <div className="flex flex-wrap gap-1.5 mb-3">
                        {order.items.map((item, i) => (
                          <span key={i} className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-lg">
                            {item.name} ×{item.quantity}
                          </span>
                        ))}
                      </div>

                      {/* Footer */}
                      <div className="flex items-center justify-between gap-3 flex-wrap">
                        <div className="flex items-center gap-1.5 text-xs text-slate-400 font-medium">
                          <Clock className="w-3.5 h-3.5 text-orange-400" />
                          Arrives at{' '}
                          <span className="font-black text-slate-700">
                            {new Date(order.customerETA).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        {next && (
                          <button
                            onClick={() => updateStatus.mutate({ id: order._id, status: next.status })}
                            disabled={updateStatus.isPending}
                            className="flex items-center gap-1.5 text-white text-xs font-black px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-60"
                            style={{ background: next.bg }}
                          >
                            {updateStatus.isPending
                              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              : <><span>{next.label}</span><ArrowRight className="w-3.5 h-3.5" /></>
                            }
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="text-center py-16">
              <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <ShoppingBag className="w-7 h-7 text-slate-300" />
              </div>
              <p className="font-black text-slate-400">No {activeTab === 'live' ? 'active' : ''} orders</p>
              <p className="text-slate-300 text-sm font-medium mt-1">
                {activeTab === 'live' ? 'New orders will appear here automatically' : 'Completed orders will show here'}
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
