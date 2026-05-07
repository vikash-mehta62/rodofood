import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

// ── Customer ──────────────────────────────────────────────────────────────────
export const useCustomerLogin = () => {
  const { setAuth } = useAuthStore();
  const router = useRouter();
  return useMutation({
    mutationFn: (data: { phone: string; password: string }) =>
      api.post('/customer/login', data),
    onSuccess: (res) => {
      const { token, user } = res.data.data;
      setAuth(user, token);
      router.push('/home');
    },
  });
};

export const useCustomerRegister = () => {
  const { setAuth } = useAuthStore();
  const router = useRouter();
  return useMutation({
    mutationFn: (data: { name: string; phone: string; password: string; email?: string }) =>
      api.post('/customer/register', data),
    onSuccess: (res) => {
      const { token, user } = res.data.data;
      setAuth(user, token);
      router.push('/home');
    },
  });
};

// ── Restaurant ────────────────────────────────────────────────────────────────
export const useRestaurantLogin = () => {
  const { setAuth } = useAuthStore();
  const router = useRouter();
  return useMutation({
    mutationFn: (data: { phone: string; password: string }) =>
      api.post('/restaurant/login', data),
    onSuccess: (res) => {
      const { token, user } = res.data.data;
      setAuth(user, token);
      router.push('/restaurant/dashboard');
    },
  });
};

export const useRestaurantRegister = () => {
  const { setAuth } = useAuthStore();
  const router = useRouter();
  return useMutation({
    mutationFn: (data: { name: string; phone: string; password: string; email?: string }) =>
      api.post('/restaurant/register', data),
    onSuccess: (res) => {
      const { token, user } = res.data.data;
      setAuth(user, token);
      router.push('/restaurant/dashboard');
    },
  });
};

// ── Admin ─────────────────────────────────────────────────────────────────────
export const useAdminLogin = () => {
  const { setAuth } = useAuthStore();
  const router = useRouter();
  return useMutation({
    mutationFn: (data: { phone: string; password: string }) =>
      api.post('/admin-auth/login', data),
    onSuccess: (res) => {
      const { token, user } = res.data.data;
      setAuth(user, token);
      router.push('/admin/dashboard');
    },
  });
};

// ── Profile ───────────────────────────────────────────────────────────────────
export const useUpdateProfile = () => {
  const { updateUser } = useAuthStore();
  return useMutation({
    mutationFn: (data: { name: string; email?: string; role?: string }) =>
      api.put('/customer/profile', data),
    onSuccess: (res) => updateUser(res.data.data.user as User),
  });
};

// Legacy — kept for any remaining references
export const useSendOtp = () =>
  useMutation({ mutationFn: (phone: string) => api.post('/auth/send-otp', { phone }) });

export const useVerifyOtp = () => {
  const { setAuth } = useAuthStore();
  const router = useRouter();
  return useMutation({
    mutationFn: (d: { phone: string; otp: string; intendedRole?: string }) =>
      api.post('/auth/verify-otp', { phone: d.phone, otp: d.otp }),
    onSuccess: (res) => {
      const { token, user } = res.data.data;
      setAuth(user, token);
      const role = user.role;
      if (role === 'admin') router.push('/admin/dashboard');
      else if (role === 'restaurant') router.push('/restaurant/dashboard');
      else router.push('/home');
    },
  });
};
