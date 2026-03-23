'use client';
import { useEffect, useRef, useState } from 'react';
import { Bell, Check, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useUpdateOrderStatus } from '@/hooks/useOrders';
import { getSocket } from '@/hooks/useSocket';
import { useAuthStore } from '@/store/authStore';

interface NewOrderAlert {
  orderId: string;
  orderNumber: string;
  totalAmount: number;
  itemCount: number;
}

export default function OrderAlert() {
  const [alerts, setAlerts] = useState<NewOrderAlert[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const updateStatus = useUpdateOrderStatus();
  const { user } = useAuthStore();

  useEffect(() => {
    // Create audio context for alert sound
    const playAlert = () => {
      try {
        const ctx = new AudioContext();
        const oscillator = ctx.createOscillator();
        const gainNode = ctx.createGain();
        oscillator.connect(gainNode);
        gainNode.connect(ctx.destination);
        oscillator.frequency.value = 880;
        oscillator.type = 'sine';
        gainNode.gain.setValueAtTime(0.3, ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
        oscillator.start(ctx.currentTime);
        oscillator.stop(ctx.currentTime + 0.5);
      } catch (e) {}
    };

    const socket = getSocket();
    if (!socket) return;

    socket.on('new_order', (data: NewOrderAlert) => {
      setAlerts((prev) => [...prev, data]);
      // Start continuous alert sound
      playAlert();
      intervalRef.current = setInterval(playAlert, 3000);
    });

    return () => {
      socket.off('new_order');
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  // Stop sound when all alerts are handled
  useEffect(() => {
    if (alerts.length === 0 && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, [alerts]);

  const handleAction = async (orderId: string, status: 'confirmed' | 'rejected') => {
    await updateStatus.mutateAsync({ id: orderId, status });
    setAlerts((prev) => prev.filter((a) => a.orderId !== orderId));
  };

  if (alerts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm w-full">
      {alerts.map((alert) => (
        <div key={alert.orderId} className="bg-white border-2 border-primary rounded-xl p-4 shadow-xl animate-bounce">
          <div className="flex items-center gap-2 mb-3">
            <Bell className="w-5 h-5 text-primary animate-pulse" />
            <p className="font-bold text-sm">New Order #{alert.orderNumber}</p>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            {alert.itemCount} item{alert.itemCount > 1 ? 's' : ''} • ₹{alert.totalAmount}
          </p>
          <div className="flex gap-2">
            <Button
              size="sm"
              className="flex-1 bg-green-500 hover:bg-green-600"
              onClick={() => handleAction(alert.orderId, 'confirmed')}
            >
              <Check className="w-4 h-4 mr-1" /> Accept
            </Button>
            <Button
              size="sm"
              variant="destructive"
              className="flex-1"
              onClick={() => handleAction(alert.orderId, 'rejected')}
            >
              <X className="w-4 h-4 mr-1" /> Reject
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
}
