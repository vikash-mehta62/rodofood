'use client';
import Link from 'next/link';
import { ShoppingBag, ChevronRight, Loader2 } from 'lucide-react';
import { useMyOrders } from '@/hooks/useOrders';
import OrderStatusBadge from '@/components/shared/OrderStatusBadge';
import BottomNav from '@/components/shared/BottomNav';
import { formatCurrency } from '@/lib/utils';
import type { Restaurant } from '@/types';

export default function OrdersPage() {
  const { data: orders, isLoading } = useMyOrders();

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-12 pb-4">
        <h1 className="text-xl font-bold">My Orders</h1>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : orders?.length ? (
        <div className="px-4 space-y-3">
          {orders.map((order) => {
            const restaurant = order.restaurant as Restaurant;
            return (
              <Link key={order._id} href={`/orders/${order._id}`}>
                <div className="bg-card border rounded-xl p-4 flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <p className="font-semibold text-sm">{restaurant?.name || 'Restaurant'}</p>
                      <OrderStatusBadge status={order.status} />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {order.items.length} item{order.items.length > 1 ? 's' : ''} •{' '}
                      {formatCurrency(order.totalAmount)}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      #{order.orderNumber} • {new Date(order.createdAt).toLocaleDateString('en-IN')}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground ml-2" />
                </div>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <ShoppingBag className="w-16 h-16 text-muted-foreground/30" />
          <p className="text-muted-foreground">No orders yet</p>
          <Link href="/trip">
            <span className="text-primary text-sm font-medium">Start ordering →</span>
          </Link>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
