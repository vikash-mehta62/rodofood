'use client';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, MapPin, Phone, Clock, Loader2 } from 'lucide-react';
import { useOrderById } from '@/hooks/useOrders';
import OrderStatusBadge from '@/components/shared/OrderStatusBadge';
import { formatCurrency } from '@/lib/utils';
import type { Restaurant } from '@/types';

const STATUS_STEPS = ['pending', 'confirmed', 'preparing', 'ready', 'completed'];

export default function OrderDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: order, isLoading } = useOrderById(id);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!order) return <div className="p-4">Order not found</div>;

  const restaurant = order.restaurant as Restaurant;
  const currentStep = STATUS_STEPS.indexOf(order.status);

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header */}
      <div className="flex items-center gap-3 px-4 pt-12 pb-4 border-b">
        <Link href="/orders">
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="font-bold">Order #{order.orderNumber}</h1>
          <p className="text-xs text-muted-foreground">
            {new Date(order.createdAt).toLocaleString('en-IN')}
          </p>
        </div>
        <div className="ml-auto">
          <OrderStatusBadge status={order.status} />
        </div>
      </div>

      <div className="px-4 py-4 space-y-4">
        {/* Progress Tracker */}
        {!['cancelled', 'rejected'].includes(order.status) && (
          <div className="bg-card border rounded-xl p-4">
            <p className="font-semibold text-sm mb-4">Order Progress</p>
            <div className="flex items-center justify-between">
              {STATUS_STEPS.slice(0, -1).map((step, i) => (
                <div key={step} className="flex items-center flex-1">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 ${
                    i <= currentStep ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                  }`}>
                    {i < currentStep ? '✓' : i + 1}
                  </div>
                  {i < STATUS_STEPS.length - 2 && (
                    <div className={`flex-1 h-0.5 mx-1 ${i < currentStep ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between mt-2">
              {['Sent', 'Confirmed', 'Preparing', 'Ready'].map((label) => (
                <span key={label} className="text-[10px] text-muted-foreground text-center flex-1">{label}</span>
              ))}
            </div>
          </div>
        )}

        {/* Restaurant Info */}
        <div className="bg-card border rounded-xl p-4">
          <p className="font-semibold text-sm mb-2">{restaurant?.name}</p>
          <p className="text-xs text-muted-foreground flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {restaurant?.address?.city}
          </p>
          <div className="flex gap-2 mt-3">
            {restaurant?.phone && (
              <a href={`tel:${restaurant.phone}`} className="flex items-center gap-1 text-xs text-primary border border-primary rounded-lg px-3 py-1.5">
                <Phone className="w-3 h-3" /> Call Restaurant
              </a>
            )}
            {restaurant?.location && (
              <a
                href={`https://maps.google.com/?q=${restaurant.location.coordinates[1]},${restaurant.location.coordinates[0]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary border border-primary rounded-lg px-3 py-1.5"
              >
                <MapPin className="w-3 h-3" /> Navigate
              </a>
            )}
          </div>
        </div>

        {/* Order Items */}
        <div className="bg-card border rounded-xl p-4">
          <p className="font-semibold text-sm mb-3">Order Items</p>
          <div className="space-y-2">
            {order.items.map((item, i) => (
              <div key={i} className="flex justify-between text-sm">
                <span>{item.name} × {item.quantity}</span>
                <span>{formatCurrency(item.price * item.quantity)}</span>
              </div>
            ))}
          </div>
          <div className="border-t mt-3 pt-3 space-y-1">
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>Subtotal</span><span>{formatCurrency(order.subtotal)}</span>
            </div>
            {order.discount > 0 && (
              <div className="flex justify-between text-sm text-green-600">
                <span>Discount</span><span>- {formatCurrency(order.discount)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm text-muted-foreground">
              <span>GST ({order.gstRate}%)</span><span>{formatCurrency(order.gstAmount)}</span>
            </div>
            <div className="flex justify-between font-bold border-t pt-2">
              <span>Total</span><span className="text-primary">{formatCurrency(order.totalAmount)}</span>
            </div>
          </div>
        </div>

        {/* ETA */}
        <div className="bg-card border rounded-xl p-4 flex items-center gap-3">
          <Clock className="w-5 h-5 text-primary" />
          <div>
            <p className="text-sm font-medium">Your Arrival Time</p>
            <p className="text-xs text-muted-foreground">
              {new Date(order.customerETA).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
        </div>

        {/* Rejection reason */}
        {order.status === 'rejected' && order.rejectionReason && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-sm font-medium text-red-700">Order Rejected</p>
            <p className="text-xs text-red-600 mt-1">{order.rejectionReason}</p>
          </div>
        )}
      </div>
    </div>
  );
}
