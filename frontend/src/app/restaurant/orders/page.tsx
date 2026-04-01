'use client';
import { useState } from 'react';
import {
  Loader2, ShoppingBag, Clock, CheckCircle,
  XCircle, Bell, ChefHat, ArrowRight, Search, Filter
} from 'lucide-react';
import { useRestaurantOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import { formatCurrency } from '@/lib/utils';
import type { Order } from '@/types';

type Tab = 'pending' | 'active' | 'completed' | 'all';

const STATUS_CFG: Record<string, { label: string; icon: React.ElementType; color: string; dot: string }> = {
  pending:   { label: 'New Order',  icon: Bell,        color: 'text-yellow-700 bg-yellow-50 border-yellow-200', dot: 'bg-yellow-400 animate-pulse' },
  confirmed: { label: 'Confirmed',  icon: CheckCircle, color: 'text-blue-700 bg-blue-50 border-blue-200',       dot: 'bg-blue-400' },
  preparing: { label: 'Preparing',  icon: ChefHat,     color: 'text-orange-700 bg-orange-50 border-orange-200', dot: 'bg-orange-400 animate-pulse' },
  ready:     { label: 'Ready',      icon: CheckCircle, color: 'text-green-700 bg-green-50 border-green-200',    dot: 'bg-green-400 animate-pulse' },
  completed: { label: 'Completed',  icon: CheckCircle, color: 'text-slate-600 bg-slate-50 border-slate-200',    dot: 'bg-slate-300' },
  cancelled: { label: 'Cancelled',  icon: XCircle,     color: 'text-red-600 bg-red-50 border-red-200',          dot: 'bg-red-400' },
  rejected:  { label: 'Rejected',   icon: XCircle,     color: 'text-red-600 bg-red-50 border-red-200',          dot: 'bg-red-400' },
};

const NEXT_ACTION: Record<string, { label: string; status: string; bg: string }> = {
  pending:   { label: 'Accept',       status: 'confirmed', bg: 'linear-gradient(135deg,#3B82F6,#2563EB)' },
  confirmed: { label: 'Start Cooking', status: 'preparing', bg: 'linear-gradient(135deg,#FF6B35,#FF8C42)' },
  preparing: { label: 'Mark Ready',   status: 'ready',     bg: 'linear-gradient(135deg,#22C55E,#16A34A)' },
};

const TABS: { key: Tab; label: string; statuses: string[] }[] = [
  { key: 'pending',   label: 'New',       statuses: ['pending'] },
  { key: 'active',    label: 'Active',    statuses: ['confirmed', 'preparing', 'ready'] },
  { key: 'completed', label: 'Completed', statuses: ['completed', 'cancelled', 'rejected'] },
  { key: 'all',       label: 'All',       statuses: [] },
];

export default function RestaurantOrdersPage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [search, setSearch] = useState('');

  const statusParam = tab === 'all' ? undefined
    : tab === 'pending' ? 'pending'
    : tab === 'active' ? 'confirmed,preparing,ready'
    : 'completed,cancelled,rejected';

  const { data: orders, isLoading } = useRestaurantOrders(
    statusParam ? { status: statusParam } : {}
  );
  const updateStatus = useUpdateOrderStatus();

  const tabCfg = TABS.find(t => t.key === tab)!;
  const pendingCount = orders?.filter((o: Order) => o.status === 'pending').length || 0;

  const filtered = (orders || []).filter((o: Order) =>
    !search || o.orderNumber.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 min-h-screen" style={{ background: '#F1F5F9' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Orders</h1>
          <p className="text-slate-400 text-sm font-medium mt-0.5">
            {pendingCount > 0
              ? <span className="text-yellow-600 font-black">{pendingCount} new order{pendingCount > 1 ? 's' : ''} waiting!</span>
              : 'Manage all your orders'}
          </p>
        </div>
        {pendingCount > 0 && (
          <div className="w-10 h-10 bg-yellow-400 rounded-2xl flex items-center justify-center animate-bounce">
            <Bell className="w-5 h-5 text-yellow-900" />
          </div>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Search by order number..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 transition-colors" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-100 rounded-2xl p-1 mb-5 shadow-sm">
        {TABS.map(t => {
          const count = t.key === 'pending' ? pendingCount : undefined;
          return (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all relative ${tab === t.key ? 'text-white shadow-sm' : 'text-slate-400'}`}
              style={tab === t.key ? { background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' } : {}}>
              {t.label}
              {count !== undefined && count > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Orders */}
      {isLoading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
        </div>
      ) : filtered.length ? (
        <div className="space-y-3">
          {filtered.map((order: Order) => {
            const cfg = STATUS_CFG[order.status] || STATUS_CFG.pending;
            const next = NEXT_ACTION[order.status];
            const StatusIcon = cfg.icon;

            return (
              <div key={order._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all">

                {/* Order header */}
                <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-slate-50">
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${cfg.dot}`} />
                    <div>
                      <p className="font-black text-slate-900 text-sm">#{order.orderNumber}</p>
                      <p className="text-[10px] text-slate-400 font-medium">
                        {new Date(order.createdAt).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border ${cfg.color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {cfg.label}
                    </span>
                    <span className="font-black text-slate-900 text-sm">{formatCurrency(order.totalAmount)}</span>
                  </div>
                </div>

                {/* Items */}
                <div className="px-4 py-3 bg-slate-50/40">
                  <div className="flex flex-wrap gap-1.5">
                    {order.items.map((item, i) => (
                      <span key={i} className="text-[10px] font-bold bg-white border border-slate-200 text-slate-600 px-2 py-0.5 rounded-lg">
                        {item.name} ×{item.quantity}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Footer */}
                <div className="px-4 py-3 flex items-center justify-between gap-3 flex-wrap">
                  <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 text-orange-400" />
                      ETA: <span className="font-black text-slate-700">
                        {new Date(order.customerETA).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </span>
                    <span className="capitalize">{order.paymentMethod?.replace(/_/g, ' ')}</span>
                  </div>

                  {next && (
                    <button
                      onClick={() => updateStatus.mutate({ id: order._id, status: next.status })}
                      disabled={updateStatus.isPending}
                      className="flex items-center gap-1.5 text-white text-xs font-black px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-60 flex-shrink-0"
                      style={{ background: next.bg }}>
                      {updateStatus.isPending
                        ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        : <><span>{next.label}</span><ArrowRight className="w-3.5 h-3.5" /></>
                      }
                    </button>
                  )}

                  {/* Reject option for pending */}
                  {order.status === 'pending' && (
                    <button
                      onClick={() => updateStatus.mutate({ id: order._id, status: 'rejected', rejectionReason: 'Restaurant busy' })}
                      disabled={updateStatus.isPending}
                      className="flex items-center gap-1 text-red-500 text-xs font-black px-3 py-2 rounded-xl bg-red-50 border border-red-200 transition-all active:scale-95">
                      <XCircle className="w-3.5 h-3.5" /> Reject
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <div className="w-14 h-14 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-3">
            <ShoppingBag className="w-7 h-7 text-slate-300" />
          </div>
          <p className="font-black text-slate-400">No {tab !== 'all' ? tabCfg.label.toLowerCase() : ''} orders</p>
          <p className="text-slate-300 text-sm font-medium mt-1">
            {tab === 'pending' ? 'New orders will appear here' : 'Orders will show here'}
          </p>
        </div>
      )}
    </div>
  );
}
