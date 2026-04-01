'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';

export default function RootPage() {
  const router = useRouter();
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user) {
      if (user.role === 'admin') router.replace('/admin/dashboard');
      else if (user.role === 'restaurant') router.replace('/restaurant/dashboard');
      else router.replace('/home');
    } else {
      router.replace('/landing');
    }
  }, [isAuthenticated, user, router]);

  // Blank while redirecting
  return null;
}
