'use client';
import { useState } from 'react';
import { Loader2, ShoppingBag, Search, Clock, Phone, Eye, X, MapPin } from 'lucide-react';
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
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

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
                    <button onClick={() => setSelectedOrder(order)} className="ml-4 flex items-center justify-center w-8 h-8 rounded-xl bg-orange-50 text-orange-600 hover:bg-orange-100 transition-colors">
                      <Eye className="w-4 h-4" />
                    </button>
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

      {/* Order Details Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm" onClick={() => setSelectedOrder(null)}>
          <div className="bg-white rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="sticky top-0 bg-white/80 backdrop-blur-md px-6 py-4 border-b border-slate-100 flex items-center justify-between z-10">
              <h2 className="text-lg font-black text-slate-900">Order #{selectedOrder.orderNumber}</h2>
              <button onClick={() => setSelectedOrder(null)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>
            
            <div className="p-6 space-y-6">
              {/* Order Info */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Status</p>
                  <span className={`text-xs font-black px-2.5 py-1 rounded-full border ${STATUS_CFG[selectedOrder.status]?.color || STATUS_CFG.pending.color}`}>
                    {STATUS_CFG[selectedOrder.status]?.label || 'Pending'}
                  </span>
                </div>
                <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Type</p>
                  <p className="font-black text-slate-800 text-sm capitalize">{selectedOrder.orderType?.replace('-', ' ')}</p>
                </div>
              </div>

              {/* Items */}
              <div>
                <h3 className="font-black text-slate-900 text-sm mb-3">Order Items</h3>
                <div className="space-y-3">
                  {selectedOrder.items.map((item: any, idx: number) => (
                    <div key={idx} className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className={`w-4 h-4 mt-0.5 rounded flex items-center justify-center border ${item.menuItem?.isVeg !== false ? 'border-green-500' : 'border-red-500'}`}>
                          <div className={`w-2 h-2 rounded-full ${item.menuItem?.isVeg !== false ? 'bg-green-500' : 'bg-red-500'}`} />
                        </div>
                        <div>
                          <p className="font-bold text-slate-800 text-sm">{item.menuItem?.name || 'Unknown Item'}</p>
                          <p className="text-xs text-slate-500 font-medium">Qty: {item.quantity} × {formatCurrency(item.price)}</p>
                        </div>
                      </div>
                      <p className="font-black text-slate-900 text-sm">{formatCurrency(item.price * item.quantity)}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Summary */}
              <div className="bg-orange-50/50 rounded-2xl p-5 border border-orange-100 space-y-2">
                <div className="flex justify-between text-sm font-bold text-slate-600">
                  <span>Subtotal</span>
                  <span>{formatCurrency(selectedOrder.totalAmount - (selectedOrder.platformFee || 5))}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-600">
                  <span>Platform Fee</span>
                  <span>{formatCurrency(selectedOrder.platformFee || 5)}</span>
                </div>
                {(selectedOrder.discountAmount ?? 0) > 0 && (
                  <div className="flex justify-between text-sm font-bold text-green-600">
                    <span>Discount</span>
                    <span>-{formatCurrency(selectedOrder.discountAmount ?? 0)}</span>
                  </div>
                )}
                <div className="pt-2 mt-2 border-t border-orange-200 flex justify-between text-base font-black text-slate-900">
                  <span>Total Amount</span>
                  <span>{formatCurrency(selectedOrder.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
