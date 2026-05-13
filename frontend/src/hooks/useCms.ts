import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';

// Fetch all CMS content as key-value map
export const useCms = () =>
  useQuery({
    queryKey: ['cms'],
    queryFn: async () => {
      const res = await api.get('/cms');
      return res.data.data.content as Record<string, string>;
    },
    staleTime: 5 * 60 * 1000, // cache 5 min
  });

// Fetch active coupons for display on homepage banners
export const useActiveCoupons = () =>
  useQuery({
    queryKey: ['coupons', 'active-display'],
    queryFn: async () => {
      // Use public validate endpoint indirectly — fetch all via admin
      // For homepage display we use a public endpoint
      const res = await api.get('/coupons/public');
      return res.data.data.coupons as Array<{
        _id: string;
        code: string;
        description: string;
        discountType: 'percentage' | 'flat';
        discountValue: number;
        maxDiscountAmount?: number;
        minOrderAmount: number;
        validUntil: string;
      }>;
    },
    staleTime: 10 * 60 * 1000,
  });
