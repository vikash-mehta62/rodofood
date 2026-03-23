'use client';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import OrderStatusBadge from '@/components/shared/OrderStatusBadge';
import { formatCurrency } from '@/lib/utils';
import type { Order, OrderStatus } from '@/types';

const STATUS_FILTERS: { label: string; value: string }[] = [
  { label: 'All', value: '' },
  { label: 'Pending', value: 'pending' },
  { label: 'Preparing', value: 'preparing' },
  { label: 'Ready', value: 'ready' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function AdminOrdersPage() {
  const [status, setStatus] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-orders', status],
    queryFn: async () => (await api.get('/orders', { params: { status: status || undefined, limit: 50 } })).data,
    refetchInterval: 30000,
  });

  const orders: Order[] = data?.data || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-12 pb-4 border-b">
        <h1 className="text-xl font-bold mb-4">All Orders</h1>
        <div className="flex gap-2 overflow-x-auto pb-1">
          {STATUS_FILTERS.map(({ label, value }) => (
            <button
              key={value}
              onClick={() => setStatus(value)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                status === value ? 'bg-primary text-primary-foreground border-primary' : 'border-input'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : orders.map((order) => (
          <div key={order._id} className="bg-card border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="font-bold text-sm">#{order.orderNumber}</p>
              <OrderStatusBadge status={order.status as OrderStatus} />
            </div>
            <p className="text-xs text-muted-foreground">
              {(order.restaurant as any)?.name} • {formatCurrency(order.totalAmount)}
            </p>
            <p className="text-xs text-muted-foreground">
              Customer: {(order.customer as any)?.phone}
            </p>
            <p className="text-xs text-muted-foreground">
              {new Date(order.createdAt).toLocaleString('en-IN')}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
