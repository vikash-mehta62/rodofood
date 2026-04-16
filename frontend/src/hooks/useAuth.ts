import { useMutation } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import type { User } from '@/types';

export const useSendOtp = () =>
  useMutation({
    mutationFn: (phone: string) => api.post('/auth/send-otp', { phone }),
  });

export const useVerifyOtp = () => {
  const { setAuth } = useAuthStore();
  const router = useRouter();

  return useMutation({
    mutationFn: ({ phone, otp, intendedRole }: { phone: string; otp: string; intendedRole?: string }) =>
      api.post('/auth/verify-otp', { phone, otp, role: intendedRole }),
    onSuccess: (res, variables) => {
      const { token, user, isNewUser } = res.data.data;
      setAuth(user, token);

      if (isNewUser) {
        // New user — go to setup to fill name/email (role already set in backend)
        router.push('/profile/setup');
      } else {
        // Existing user trying restaurant tab but is customer → let them upgrade via setup
        if (variables.intendedRole === 'restaurant' && user.role === 'customer') {
          router.push('/profile/setup?role=restaurant');
          return;
        }
        const role = user.role;
        if (role === 'admin') router.push('/admin/dashboard');
        else if (role === 'restaurant') router.push('/restaurant/dashboard');
        else router.push('/home');
      }
    },
  });
};

export const useUpdateProfile = () => {
  const { updateUser } = useAuthStore();
  return useMutation({
    mutationFn: (data: { name: string; email?: string; role?: string }) => api.put('/auth/profile', data),
    onSuccess: (res) => updateUser(res.data.data.user as User),
  });
};
