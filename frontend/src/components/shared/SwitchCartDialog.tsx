'use client';
import { ShoppingCart } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';

export default function SwitchCartDialog() {
  const { pendingSwitch, restaurantName, confirmSwitch, cancelSwitch } = useCartStore();

  if (!pendingSwitch) return null;

  return (
    <div className="fixed inset-0 z-[999] flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(4px)', background: 'rgba(0,0,0,0.6)' }}>
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden animate-bounce-in">
        <div className="p-6 text-center">
          <div className="w-14 h-14 bg-orange-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-7 h-7 text-orange-500" />
          </div>
          <h3 className="font-black text-slate-900 text-base mb-2">Start a new cart?</h3>
          <p className="text-slate-500 text-xs font-medium leading-relaxed">
            Your cart has items from{' '}
            <span className="font-black text-orange-500">{restaurantName}</span>.
            <br />
            Adding from{' '}
            <span className="font-black text-slate-900">{pendingSwitch.restaurantName}</span>{' '}
            will clear your current cart.
          </p>
        </div>
        <div className="flex border-t border-slate-100">
          <button onClick={cancelSwitch}
            className="flex-1 py-4 text-sm font-black text-slate-500 hover:bg-slate-50 transition-colors border-r border-slate-100">
            Keep Cart
          </button>
          <button onClick={confirmSwitch}
            className="flex-1 py-4 text-sm font-black text-orange-500 hover:bg-orange-50 transition-colors">
            Start Fresh
          </button>
        </div>
      </div>
    </div>
  );
}
