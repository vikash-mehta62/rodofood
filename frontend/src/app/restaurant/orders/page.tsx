'use client';
import { useState } from 'react';
import {
  Loader2, ShoppingBag, Clock, CheckCircle,
  XCircle, Bell, ChefHat, ArrowRight, Search,
  AlertTriangle, Upload, X, RefreshCw, ChevronRight,
  MapPin, Phone, CreditCard, Tag, IndianRupee, History
} from 'lucide-react';
import { useRestaurantOrders, useUpdateOrderStatus } from '@/hooks/useOrders';
import { formatCurrency } from '@/lib/utils';
import api from '@/lib/axios';
import type { Order } from '@/types';

type Tab = 'pending' | 'active' | 'completed' | 'all';

const STATUS_CFG: Record<string, { label: string; icon: React.ElementType; color: string; dot: string; bg: string }> = {
  pending:   { label: 'New Order',  icon: Bell,        color: 'text-yellow-700 bg-yellow-50 border-yellow-200', dot: 'bg-yellow-400 animate-pulse', bg: '#F59E0B' },
  confirmed: { label: 'Confirmed',  icon: CheckCircle, color: 'text-blue-700 bg-blue-50 border-blue-200',       dot: 'bg-blue-400',                  bg: '#3B82F6' },
  preparing: { label: 'Preparing',  icon: ChefHat,     color: 'text-orange-700 bg-orange-50 border-orange-200', dot: 'bg-orange-400 animate-pulse',  bg: '#FF6B35' },
  ready:     { label: 'Ready',      icon: CheckCircle, color: 'text-green-700 bg-green-50 border-green-200',    dot: 'bg-green-400 animate-pulse',   bg: '#22C55E' },
  completed: { label: 'Completed',  icon: CheckCircle, color: 'text-slate-600 bg-slate-50 border-slate-200',    dot: 'bg-slate-300',                 bg: '#64748B' },
  cancelled: { label: 'Cancelled',  icon: XCircle,     color: 'text-red-600 bg-red-50 border-red-200',          dot: 'bg-red-400',                   bg: '#EF4444' },
  rejected:  { label: 'Rejected',   icon: XCircle,     color: 'text-red-600 bg-red-50 border-red-200',          dot: 'bg-red-400',                   bg: '#EF4444' },
};

const NEXT_ACTION: Record<string, { label: string; status: string; bg: string }> = {
  pending:   { label: 'Accept',        status: 'confirmed', bg: 'linear-gradient(135deg,#3B82F6,#2563EB)' },
  confirmed: { label: 'Start Cooking', status: 'preparing', bg: 'linear-gradient(135deg,#FF6B35,#FF8C42)' },
  preparing: { label: 'Mark Ready',    status: 'ready',     bg: 'linear-gradient(135deg,#22C55E,#16A34A)' },
  ready:     { label: 'Complete',      status: 'completed', bg: 'linear-gradient(135deg,#059669,#047857)' },
};

const CANCEL_REASONS = [
  'Restaurant is too busy',
  'Item(s) unavailable',
  'Kitchen closed early',
  'Customer did not arrive',
  'Incorrect order details',
  'Other',
];

const TABS: { key: Tab; label: string }[] = [
  { key: 'pending',   label: 'New' },
  { key: 'active',    label: 'Active' },
  { key: 'completed', label: 'Done' },
  { key: 'all',       label: 'All' },
];

interface CancelModal {
  orderId: string; orderNumber: string;
  status: 'cancelled' | 'rejected';
  paymentMethod: string; paymentStatus: string;
}

// ── Order Detail Drawer ──────────────────────────────────────────────────────
function OrderDetailDrawer({ order, onClose, onAction, updating }: {
  order: Order; onClose: () => void;
  onAction: (status: string) => void;
  updating: boolean;
}) {
  const cfg = STATUS_CFG[order.status] || STATUS_CFG.pending;
  const next = NEXT_ACTION[order.status];
  const isOnline = order.paymentMethod === 'online';
  const isPaid = order.paymentStatus === 'paid';
  const isRefunded = order.paymentStatus === 'refunded';
  const isCancelledOrRejected = ['cancelled', 'rejected'].includes(order.status);
  const customer = order.customer as any;
  const restaurant = order.restaurant as any;

  const paymentLabel: Record<string, string> = {
    cash: '💵 Cash at Restaurant',
    upi_at_restaurant: '📱 UPI at Restaurant',
    online: '💳 Online (Razorpay)',
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center" style={{ backdropFilter: 'blur(4px)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="bg-white rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg shadow-2xl max-h-[92vh] flex flex-col">

        {/* Drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden flex-shrink-0">
          <div className="w-10 h-1 bg-slate-200 rounded-full" />
        </div>

        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <p className="font-black text-slate-900 text-base">#{order.orderNumber}</p>
            <p className="text-xs text-slate-400">{new Date(order.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}</p>
          </div>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${cfg.color}`}>{cfg.label}</span>
            <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
              <X className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

        <div className="overflow-y-auto flex-1 px-5 py-4 space-y-4">

          {/* Payment & Refund Status */}
          <div className={`rounded-2xl p-4 border ${
            isRefunded ? 'bg-emerald-50 border-emerald-200' :
            isPaid && isOnline ? 'bg-blue-50 border-blue-200' :
            isCancelledOrRejected ? 'bg-red-50 border-red-200' :
            'bg-slate-50 border-slate-200'
          }`}>
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Payment</p>
              <span className={`text-xs font-black px-2.5 py-1 rounded-full ${
                isRefunded ? 'bg-emerald-500 text-white' :
                isPaid ? 'bg-blue-500 text-white' :
                'bg-slate-200 text-slate-600'
              }`}>
                {isRefunded ? '💰 Refunded' : isPaid ? '✅ Paid' : '⏳ Pending'}
              </span>
            </div>
            <p className="text-sm font-bold text-slate-800">{paymentLabel[order.paymentMethod] || order.paymentMethod}</p>
            {isRefunded && (order as any).refundId && (
              <p className="text-[10px] text-emerald-600 font-mono mt-1">Refund ID: {(order as any).refundId}</p>
            )}
            {isRefunded && (
              <p className="text-xs text-emerald-700 font-semibold mt-1">₹{order.totalAmount.toFixed(2)} refunded to customer (3–5 business days)</p>
            )}
          </div>

          {/* Rejection reason */}
          {(order as any).rejectionReason && (
            <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
              <p className="text-xs font-black text-red-500 uppercase tracking-wider mb-1">
                {order.status === 'rejected' ? 'Rejection Reason' : 'Cancellation Reason'}
              </p>
              <p className="text-sm text-red-700 font-medium">{(order as any).rejectionReason}</p>
            </div>
          )}

          {/* Items */}
          <div className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
            <div className="px-4 py-3 border-b border-slate-50">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider">Order Items</p>
            </div>
            <div className="divide-y divide-slate-50">
              {order.items.map((item, i) => (
                <div key={i} className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-sm ${item.foodType === 'veg' ? 'bg-emerald-500' : 'bg-red-500'}`} />
                    <span className="text-sm font-medium text-slate-800">{item.name}</span>
                    <span className="text-xs text-slate-400">×{item.quantity}</span>
                  </div>
                  <span className="text-sm font-bold text-slate-900">{formatCurrency(item.price * item.quantity)}</span>
                </div>
              ))}
            </div>
            {/* Bill */}
            <div className="px-4 py-3 bg-slate-50 space-y-1.5">
              <div className="flex justify-between text-xs text-slate-500">
                <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-xs text-emerald-600">
                  <span>Discount {order.couponCode ? `(${order.couponCode})` : ''}</span>
                  <span>− {formatCurrency(order.discount)}</span>
                </div>
              )}
              <div className="flex justify-between text-xs text-slate-500">
                <span>GST ({order.gstRate}%)</span><span>{formatCurrency(order.gstAmount)}</span>
              </div>
              <div className="flex justify-between font-black text-slate-900 pt-1 border-t border-slate-200">
                <span>Total</span><span className="text-orange-500">{formatCurrency(order.totalAmount)}</span>
              </div>
            </div>
          </div>

          {/* Order info */}
          <div className="bg-white border border-slate-100 rounded-2xl p-4 space-y-2.5">
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1">Order Info</p>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500">Type</span>
              <span className="font-bold text-slate-800">{order.orderType === 'dine-in' ? '🍽️ Dine-in' : '🥡 Takeaway'}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-slate-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5 text-orange-400" />Customer ETA</span>
              <span className="font-bold text-slate-800">
                {new Date(order.customerETA).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
            {customer?.name && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500">Customer</span>
                <span className="font-bold text-slate-800">{customer.name}</span>
              </div>
            )}
            {customer?.phone && (
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-500 flex items-center gap-1"><Phone className="w-3.5 h-3.5" />Phone</span>
                <a href={`tel:${customer.phone}`} className="font-bold text-blue-600">{customer.phone}</a>
              </div>
            )}
          </div>

          {/* Status History */}
          {order.statusHistory?.length > 0 && (
            <div className="bg-white border border-slate-100 rounded-2xl p-4">
              <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-3 flex items-center gap-1.5">
                <History className="w-3.5 h-3.5" /> Status History
              </p>
              <div className="space-y-2">
                {[...order.statusHistory].reverse().map((h: any, i: number) => {
                  const hcfg = STATUS_CFG[h.status] || STATUS_CFG.pending;
                  return (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${hcfg.dot.replace(' animate-pulse', '')}`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">{hcfg.label}</span>
                          <span className="text-[10px] text-slate-400">
                            {new Date(h.timestamp).toLocaleString('en-IN', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        {h.note && <p className="text-[10px] text-slate-400 mt-0.5">{h.note}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Action buttons */}
        {(next || ['pending', 'confirmed', 'preparing'].includes(order.status)) && (
          <div className="px-5 py-4 border-t border-slate-100 flex gap-2 flex-shrink-0">
            {['pending', 'confirmed', 'preparing'].includes(order.status) && (
              <button onClick={() => onAction(order.status === 'pending' ? 'reject' : 'cancel')}
                className="flex items-center gap-1.5 text-red-500 text-sm font-black px-4 py-3 rounded-2xl bg-red-50 border border-red-200 flex-shrink-0">
                <XCircle className="w-4 h-4" />
                {order.status === 'pending' ? 'Reject' : 'Cancel'}
              </button>
            )}
            {next && (
              <button onClick={() => onAction(next.status)} disabled={updating}
                className="flex-1 flex items-center justify-center gap-2 text-white text-sm font-black py-3 rounded-2xl disabled:opacity-60"
                style={{ background: next.bg }}>
                {updating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><span>{next.label}</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function RestaurantOrdersPage() {
  const [tab, setTab] = useState<Tab>('pending');
  const [search, setSearch] = useState('');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [cancelModal, setCancelModal] = useState<CancelModal | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [customReason, setCustomReason] = useState('');
  const [cancelImages, setCancelImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const statusParam = tab === 'all' ? undefined
    : tab === 'pending' ? 'pending'
    : tab === 'active' ? 'confirmed,preparing,ready'
    : 'completed,cancelled,rejected';

  const { data: orders, isLoading } = useRestaurantOrders(
    statusParam ? { status: statusParam } : {}
  );
  const updateStatus = useUpdateOrderStatus();

  const pendingCount = orders?.filter((o: Order) => o.status === 'pending').length || 0;
  const filtered = (orders || []).filter((o: Order) =>
    !search || o.orderNumber.toLowerCase().includes(search.toLowerCase())
  );

  const openCancelModal = (order: Order, status: 'cancelled' | 'rejected') => {
    setSelectedOrder(null); // close drawer first
    setCancelModal({ orderId: order._id, orderNumber: order.orderNumber, status, paymentMethod: order.paymentMethod, paymentStatus: order.paymentStatus });
    setCancelReason('');
    setCustomReason('');
    setCancelImages([]);
  };

  // Called from drawer action buttons
  const handleDrawerAction = (action: string) => {
    if (!selectedOrder) return;
    if (action === 'reject' || action === 'cancel') {
      openCancelModal(selectedOrder, action === 'reject' ? 'rejected' : 'cancelled');
    } else {
      updateStatus.mutate({ id: selectedOrder._id, status: action });
      setSelectedOrder(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingImage(true);
    try {
      const formData = new FormData();
      formData.append('image', file);
      const res = await api.post('/orders/upload-image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setCancelImages(prev => [...prev, res.data.data.url]);
    } catch {
      // fallback: use local preview URL
      const url = URL.createObjectURL(file);
      setCancelImages(prev => [...prev, url]);
    } finally {
      setUploadingImage(false);
    }
  };

  const handleCancelSubmit = async () => {
    if (!cancelModal) return;
    const reason = cancelReason === 'Other' ? customReason : cancelReason;
    if (!reason.trim()) return;
    setSubmitting(true);
    try {
      await updateStatus.mutateAsync({
        id: cancelModal.orderId,
        status: cancelModal.status,
        rejectionReason: reason,
        cancellationImages: cancelImages,
      } as any);
      setCancelModal(null);
    } finally {
      setSubmitting(false);
    }
  };

  const isOnlinePaid = cancelModal?.paymentMethod === 'online' && cancelModal?.paymentStatus === 'paid';

  return (
    <div className="p-4 sm:p-6 min-h-screen" style={{ background: '#F1F5F9' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Orders</h1>
          <p className="text-sm font-medium mt-0.5">
            {pendingCount > 0
              ? <span className="text-yellow-600 font-black">{pendingCount} new order{pendingCount > 1 ? 's' : ''} waiting!</span>
              : <span className="text-slate-400">Manage your orders</span>}
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
          className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm outline-none focus:border-orange-400 transition-colors" />
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-white border border-slate-100 rounded-2xl p-1 mb-5 shadow-sm">
        {TABS.map(t => (
          <button key={t.key} onClick={() => setTab(t.key)}
            className={`flex-1 py-2.5 rounded-xl text-xs font-black transition-all relative ${tab === t.key ? 'text-white shadow-sm' : 'text-slate-400'}`}
            style={tab === t.key ? { background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' } : {}}>
            {t.label}
            {t.key === 'pending' && pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                {pendingCount}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Orders list */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : filtered.length ? (
        <div className="space-y-3">
          {filtered.map((order: Order) => {
            const cfg = STATUS_CFG[order.status] || STATUS_CFG.pending;
            const next = NEXT_ACTION[order.status];
            const StatusIcon = cfg.icon;
            const isOnline = order.paymentMethod === 'online';
            const isPaid = order.paymentStatus === 'paid';
            const isRefunded = order.paymentStatus === 'refunded';

            return (
              <div key={order._id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-md transition-all cursor-pointer"
                onClick={() => setSelectedOrder(order)}>

                {/* Header */}
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
                  <div className="flex items-center gap-2 flex-wrap justify-end">
                    <span className={`flex items-center gap-1 text-[10px] font-black px-2.5 py-1 rounded-full border ${cfg.color}`}>
                      <StatusIcon className="w-3 h-3" />{cfg.label}
                    </span>
                    {isRefunded && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 border border-emerald-200">
                        💰 Refunded
                      </span>
                    )}
                    {isOnline && isPaid && !isRefunded && (
                      <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 border border-blue-200">
                        💳 Paid Online
                      </span>
                    )}
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
                  {(order as any).rejectionReason && (
                    <p className="text-[10px] text-red-500 font-medium mt-2 flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> {(order as any).rejectionReason}
                    </p>
                  )}
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

                  <div className="flex items-center gap-2">
                    {/* Cancel/Reject button */}
                    {['pending', 'confirmed', 'preparing'].includes(order.status) && (
                      <button onClick={e => { e.stopPropagation(); openCancelModal(order, order.status === 'pending' ? 'rejected' : 'cancelled'); }}
                        className="flex items-center gap-1 text-red-500 text-xs font-black px-3 py-2 rounded-xl bg-red-50 border border-red-200 transition-all active:scale-95">
                        <XCircle className="w-3.5 h-3.5" />
                        {order.status === 'pending' ? 'Reject' : 'Cancel'}
                      </button>
                    )}

                    {/* Next action button */}
                    {next && (
                      <button
                        onClick={e => { e.stopPropagation(); updateStatus.mutate({ id: order._id, status: next.status }); }}
                        disabled={updateStatus.isPending}
                        className="flex items-center gap-1.5 text-white text-xs font-black px-4 py-2 rounded-xl transition-all active:scale-95 disabled:opacity-60"
                        style={{ background: next.bg }}>
                        {updateStatus.isPending
                          ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          : <><span>{next.label}</span><ArrowRight className="w-3.5 h-3.5" /></>}
                      </button>
                    )}
                    <ChevronRight className="w-4 h-4 text-slate-300 ml-1" />
                  </div>
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
          <p className="font-black text-slate-400">No orders here</p>
          <p className="text-slate-300 text-sm font-medium mt-1">Orders will appear here</p>
        </div>
      )}

      {/* ── Order Detail Drawer ── */}
      {selectedOrder && (
        <OrderDetailDrawer
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onAction={handleDrawerAction}
          updating={updateStatus.isPending}
        />
      )}

      {/* ── Cancel/Reject Modal ── */}
      {cancelModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-end sm:items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl max-h-[90vh] flex flex-col">

            {/* Modal header */}
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-red-100 rounded-2xl flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-red-500" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base">
                    {cancelModal.status === 'rejected' ? 'Reject Order' : 'Cancel Order'}
                  </h3>
                  <p className="text-xs text-slate-400">#{cancelModal.orderNumber}</p>
                </div>
              </div>
              <button onClick={() => setCancelModal(null)} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">

              {/* Refund notice */}
              {isOnlinePaid && (
                <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
                  <RefreshCw className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-bold text-emerald-800">Auto-Refund will be initiated</p>
                    <p className="text-xs text-emerald-600 mt-0.5">
                      Since this order was paid online, a full refund will be automatically processed via Razorpay (3–5 business days).
                    </p>
                  </div>
                </div>
              )}

              {/* Reason selection */}
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Reason *</p>
                <div className="space-y-2">
                  {CANCEL_REASONS.map(reason => (
                    <button key={reason} onClick={() => setCancelReason(reason)}
                      className={`w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all ${cancelReason === reason ? 'border-red-400 bg-red-50 text-red-700 font-bold' : 'border-slate-200 text-slate-600 bg-white hover:border-slate-300'}`}>
                      {reason}
                    </button>
                  ))}
                </div>
                {cancelReason === 'Other' && (
                  <textarea
                    value={customReason}
                    onChange={e => setCustomReason(e.target.value)}
                    placeholder="Describe the reason..."
                    rows={3}
                    className="w-full mt-2 px-4 py-3 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-red-400 transition-colors resize-none"
                  />
                )}
              </div>

              {/* Image upload */}
              <div>
                <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">
                  Proof Images <span className="text-slate-300 font-normal">(optional, max 3)</span>
                </p>
                <div className="flex gap-2 flex-wrap">
                  {cancelImages.map((url, i) => (
                    <div key={i} className="relative w-20 h-20 rounded-xl overflow-hidden border border-slate-200">
                      <img src={url} alt="" className="w-full h-full object-cover" />
                      <button onClick={() => setCancelImages(prev => prev.filter((_, idx) => idx !== i))}
                        className="absolute top-1 right-1 w-5 h-5 bg-black/60 rounded-full flex items-center justify-center">
                        <X className="w-3 h-3 text-white" />
                      </button>
                    </div>
                  ))}
                  {cancelImages.length < 3 && (
                    <label className="w-20 h-20 rounded-xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:border-orange-400 hover:bg-orange-50 transition-colors">
                      {uploadingImage
                        ? <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                        : <><Upload className="w-5 h-5 text-slate-400" /><span className="text-[10px] text-slate-400 mt-1">Upload</span></>
                      }
                      <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={uploadingImage} />
                    </label>
                  )}
                </div>
              </div>
            </div>

            {/* Modal footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
              <button onClick={() => setCancelModal(null)} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-black text-sm">
                Keep Order
              </button>
              <button
                onClick={handleCancelSubmit}
                disabled={submitting || !cancelReason || (cancelReason === 'Other' && !customReason.trim())}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50">
                {submitting
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <>{cancelModal.status === 'rejected' ? 'Reject' : 'Cancel'} Order{isOnlinePaid ? ' & Refund' : ''}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
