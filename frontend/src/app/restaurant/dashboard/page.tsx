'use client';
import { useState } from 'react';
import { TrendingUp, ShoppingBag, DollarSign, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useRestaurantOrders, useUpdateOrderStatus, useRestaurantEarnings } from '@/hooks/useOrders';
import OrderStatusBadge from '@/components/shared/OrderStatusBadge';
import OrderAlert from '@/components/restaurant/OrderAlert';
import { formatCurrency } from '@/lib/utils';
import type { Order } from '@/types';

export default function RestaurantDashboard() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'live' | 'history'>('live');

  const { data: restaurant } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn: async () => (await api.get('/restaurants/owner/me')).data.data.restaurant,
  });

  const { data: liveOrders, isLoading } = useRestaurantOrders(
    activeTab === 'live' ? { status: 'pending,confirmed,preparing' } : {}
  );

  const { data: earnings } = useRestaurantEarnings();
  const updateStatus = useUpdateOrderStatus();

  const toggleStatus = useMutation({
    mutationFn: () => api.patch('/restaurants/owner/toggle-status'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-restaurant'] }),
  });

  return (
    <div className="min-h-screen bg-background">
      <OrderAlert />

      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 pt-12 pb-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold">{restaurant?.name || 'Restaurant'}</h1>
            <p className="text-sm opacity-80">Dashboard</p>
          </div>
          <button
            onClick={() => toggleStatus.mutate()}
            className="flex items-center gap-2 bg-white/20 rounded-xl px-3 py-2"
          >
            {restaurant?.isOpen ? (
              <><ToggleRight className="w-6 h-6 text-green-300" /><span className="text-sm font-medium">Open</span></>
            ) : (
              <><ToggleLeft className="w-6 h-6 text-red-300" /><span className="text-sm font-medium">Closed</span></>
            )}
          </button>
        </div>
      </div>

      {/* Earnings Cards */}
      <div className="px-4 py-4 grid grid-cols-3 gap-3">
        {[
          { label: "Today's Orders", value: earnings?.today?.count || 0, icon: ShoppingBag },
          { label: "Today's Revenue", value: formatCurrency(earnings?.today?.total || 0), icon: DollarSign },
          { label: 'This Month', value: formatCurrency(earnings?.thisMonth?.total || 0), icon: TrendingUp },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-card border rounded-xl p-3 text-center">
            <Icon className="w-5 h-5 text-primary mx-auto mb-1" />
            <p className="font-bold text-sm">{value}</p>
            <p className="text-[10px] text-muted-foreground">{label}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex border-b px-4">
        {(['live', 'history'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`flex-1 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab ? 'border-primary text-primary' : 'border-transparent text-muted-foreground'
            }`}
          >
            {tab === 'live' ? '🔴 Live Orders' : '📋 History'}
          </button>
        ))}
      </div>

      {/* Orders */}
      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        ) : liveOrders?.length ? (
          liveOrders.map((order: Order) => (
            <div key={order._id} className="bg-card border rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="font-bold text-sm">#{order.orderNumber}</p>
                <OrderStatusBadge status={order.status} />
              </div>
              <p className="text-xs text-muted-foreground mb-1">
                {order.items.length} items • {formatCurrency(order.totalAmount)}
              </p>
              <p className="text-xs text-muted-foreground mb-3">
                Arrival: {new Date(order.customerETA).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
              </p>

              {/* Items */}
              <div className="bg-muted rounded-lg p-2 mb-3 space-y-1">
                {order.items.map((item, i) => (
                  <p key={i} className="text-xs">{item.name} × {item.quantity}</p>
                ))}
              </div>

              {/* Actions */}
              {order.status === 'confirmed' && (
                <button
                  onClick={() => updateStatus.mutate({ id: order._id, status: 'preparing' })}
                  className="w-full bg-orange-500 text-white rounded-lg py-2 text-sm font-medium"
                >
                  Start Preparing
                </button>
              )}
              {order.status === 'preparing' && (
                <button
                  onClick={() => updateStatus.mutate({ id: order._id, status: 'ready' })}
                  className="w-full bg-green-500 text-white rounded-lg py-2 text-sm font-medium"
                >
                  Mark as Ready
                </button>
              )}
            </div>
          ))
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <ShoppingBag className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No {activeTab === 'live' ? 'active' : ''} orders</p>
          </div>
        )}
      </div>
    </div>
  );
}
