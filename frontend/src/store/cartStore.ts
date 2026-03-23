import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { CartItem, MenuItem } from '@/types';

interface CartStore {
  restaurantId: string | null;
  restaurantName: string | null;
  items: CartItem[];
  orderType: 'dine-in' | 'takeaway';
  etaMinutes: number | null;
  customerETA: string | null;
  couponCode: string | null;
  discount: number;

  addItem: (item: MenuItem, restaurantId: string, restaurantName: string) => void;
  removeItem: (menuItemId: string) => void;
  updateQuantity: (menuItemId: string, quantity: number) => void;
  setOrderType: (type: 'dine-in' | 'takeaway') => void;
  setETA: (minutes: number | null, eta: string | null) => void;
  applyCoupon: (code: string, discount: number) => void;
  removeCoupon: () => void;
  clearCart: () => void;

  // Computed
  getSubtotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      restaurantId: null,
      restaurantName: null,
      items: [],
      orderType: 'takeaway',
      etaMinutes: null,
      customerETA: null,
      couponCode: null,
      discount: 0,

      addItem: (menuItem, restaurantId, restaurantName) => {
        const state = get();

        // If adding from a different restaurant, clear cart first
        if (state.restaurantId && state.restaurantId !== restaurantId) {
          set({
            restaurantId,
            restaurantName,
            items: [{ menuItem, quantity: 1 }],
            couponCode: null,
            discount: 0,
          });
          return;
        }

        const existing = state.items.find((i) => i.menuItem._id === menuItem._id);
        if (existing) {
          set({
            items: state.items.map((i) =>
              i.menuItem._id === menuItem._id ? { ...i, quantity: i.quantity + 1 } : i
            ),
          });
        } else {
          set({
            restaurantId,
            restaurantName,
            items: [...state.items, { menuItem, quantity: 1 }],
          });
        }
      },

      removeItem: (menuItemId) =>
        set((state) => ({
          items: state.items.filter((i) => i.menuItem._id !== menuItemId),
          ...(state.items.length === 1 ? { restaurantId: null, restaurantName: null } : {}),
        })),

      updateQuantity: (menuItemId, quantity) => {
        if (quantity <= 0) {
          get().removeItem(menuItemId);
          return;
        }
        set((state) => ({
          items: state.items.map((i) =>
            i.menuItem._id === menuItemId ? { ...i, quantity } : i
          ),
        }));
      },

      setOrderType: (type) => set({ orderType: type }),
      setETA: (minutes, eta) => set({ etaMinutes: minutes, customerETA: eta }),
      applyCoupon: (code, discount) => set({ couponCode: code, discount }),
      removeCoupon: () => set({ couponCode: null, discount: 0 }),

      clearCart: () =>
        set({
          restaurantId: null,
          restaurantName: null,
          items: [],
          orderType: 'takeaway',
          etaMinutes: null,
          customerETA: null,
          couponCode: null,
          discount: 0,
        }),

      getSubtotal: () =>
        get().items.reduce(
          (sum, i) => sum + (i.menuItem.discountedPrice || i.menuItem.price) * i.quantity,
          0
        ),

      getItemCount: () => get().items.reduce((sum, i) => sum + i.quantity, 0),
    }),
    { name: 'rf_cart' }
  )
);
