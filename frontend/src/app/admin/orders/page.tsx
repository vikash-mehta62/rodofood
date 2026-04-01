'use client';
import { useState } from 'react';
import { Loader2, ShoppingBag, Search, Clock, Phone } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { formatCurrency } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const STATUS_CFG: Record<string, { label: string; color: string }> = {
  pending:   { label: 'Pending',   color: 'text-yellow-700 bg-yellow-50 border-yellow-200' },
  confirmed: { label: 'Confirmed', color: 'text-blue-700 bg-blue-50 border-blue-200' },
  preparing: { label: 'Preparing', color: 'text-orange-700 bg-orange-50 border-orange-200' },
  ready:     { label: 'Ready',     color: 'text-green-700 bg-green-50 border-green-200' },
  completed: { label: 'Completed', color: 'text-slate-600 bg-slate-50 border-slate-200' },
  cancelled: { label: 'Cancelled', color: 'text-red-600 bg-red-50 border-red-200' },
  rejected:  { label: 'Rejected',  color: 'text-red-600 bg-red-50 border-red-200' },
};

const FILTERS = ['All','pending','confirmed','preparing','ready','completed','cancelled'];

export default function AdminOrdersPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status],
    queryFn: async () => (await api.get('/orders', { params: { status: status || undefined, limit: 100 } })).data,
    refetchInterval: 30000,
  });

  const orders: Order[] = (data?.data || []).filter((o: Order) =>
    !search || o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    (o.customer as any)?.phone?.includes(search)
  );

  return (
    <div className="p-4 sm:p-6 min-h-screen" style={{ background: '#F1F5F9' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">All Orders</h1>
          <p className="text-slate-400 text-sm font-medium mt-0.5">{orders.length} orders</p>
        </div>
      </div>

      {/* Search */}
      <div className="relative mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by order # or phone..."
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 transition-colors" />
      </div>

      {/* Status filter */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-5 pb-1">
        {FILTERS.map(f => (
          <button key={f} onClick={() => setStatus(f === 'All' ? '' : f)}
            className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-black border transition-all capitalize ${(f === 'All' ? status === '' : status === f) ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-500'}`}
            style={(f === 'All' ? status === '' : status === f) ? { background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' } : {}}>
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : orders.length ? (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="divide-y divide-slate-50">
            {orders.map(order => {
              const cfg = STATUS_CFG[order.status] || STATUS_CFG.pending;
              const restaurantName = (order.restaurant as any)?.name;
              const customerPhone = (order.customer as any)?.phone;
              return (
                <div key={order._id} className="px-5 py-4 hover:bg-slate-50/50 transition-colors">
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0">
                      <ShoppingBag className="w-4 h-4 text-orange-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2 mb-1 flex-wrap">
                        <p className="font-black text-slate-900 text-sm">#{order.orderNumber}</p>
                        <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${cfg.color}`}>{cfg.label}</span>
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium flex-wrap">
                        {restaurantName && <span className="font-bold text-slate-600">{restaurantName}</span>}
                        {customerPhone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />+91 {customerPhone}</span>}
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{new Date(order.createdAt).toLocaleString('en-IN', { day:'2-digit', month:'short', hour:'2-digit', minute:'2-digit' })}</span>
                      </div>
                      <div className="flex items-center justify-between mt-1.5">
                        <p className="text-[11px] text-slate-400 font-medium">{order.items.length} item{order.items.length > 1 ? 's' : ''} · {order.paymentMethod?.replace(/_/g,' ')}</p>
                        <p className="font-black text-slate-900 text-sm">{formatCurrency(order.totalAmount)}</p>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
          <ShoppingBag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="font-black text-slate-400">No orders found</p>
        </div>
      )}
    </div>
  );
}
