import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { User } from '@/types';

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  setAuth: (user: User, token: string) => void;
  updateUser: (user: Partial<User>) => void;
  logout: () => void;
}

// Sync auth state to cookie so Next.js middleware can read it
const syncCookie = (state: { user: User | null; token: string | null; isAuthenticated: boolean }) => {
  if (typeof document === 'undefined') return;
  if (state.isAuthenticated && state.user) {
    // Full auth state cookie (for role-based routing)
    const val = encodeURIComponent(JSON.stringify({ state: { user: state.user, token: state.token, isAuthenticated: true } }));
    document.cookie = `rf_auth=${val}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
    // Simple token cookie (fallback for middleware)
    if (state.token) {
      document.cookie = `rf_token=${state.token}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
    }
  } else {
    document.cookie = 'rf_auth=; path=/; max-age=0; SameSite=Lax';
    document.cookie = 'rf_token=; path=/; max-age=0; SameSite=Lax';
  }
};

export const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        if (typeof window !== 'undefined') {
          localStorage.setItem('rf_token', token);
        }
        const newState = { user, token, isAuthenticated: true };
        set(newState);
        syncCookie(newState);
      },

      updateUser: (updates) =>
        set((state) => {
          const newUser = state.user ? { ...state.user, ...updates } : null;
          const newState = { user: newUser, token: state.token, isAuthenticated: state.isAuthenticated };
          syncCookie(newState);
          return { user: newUser };
        }),

      logout: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('rf_token');
        }
        const newState = { user: null, token: null, isAuthenticated: false };
        set(newState);
        syncCookie(newState);
      },
    }),
    {
      name: 'rf_auth',
      partialize: (state) => ({ user: state.user, token: state.token, isAuthenticated: state.isAuthenticated }),
      onRehydrateStorage: () => (state) => {
        // Sync cookie AND localStorage token after rehydration
        if (state) {
          syncCookie(state);
          // Restore rf_token in localStorage so axios interceptor can read it
          if (state.token && typeof window !== 'undefined') {
            localStorage.setItem('rf_token', state.token);
          }
        }
      },
    }
  )
);
