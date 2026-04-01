'use client';
import { useEffect } from 'react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { useAuthStore } from '@/store/authStore';
import SwitchCartDialog from '@/components/shared/SwitchCartDialog';

function CookieSync() {
  const { user, token, isAuthenticated } = useAuthStore();
  useEffect(() => {
    if (isAuthenticated && user && token) {
      const val = encodeURIComponent(JSON.stringify({ state: { user, token, isAuthenticated: true } }));
      document.cookie = `rf_auth=${val}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
      document.cookie = `rf_token=${token}; path=/; max-age=${7 * 24 * 3600}; SameSite=Lax`;
    } else if (!isAuthenticated) {
      document.cookie = 'rf_auth=; path=/; max-age=0; SameSite=Lax';
      document.cookie = 'rf_token=; path=/; max-age=0; SameSite=Lax';
    }
  }, [isAuthenticated, user, token]);
  return null;
}

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <CookieSync />
      <SwitchCartDialog />
      {children}
    </QueryClientProvider>
  );
}
