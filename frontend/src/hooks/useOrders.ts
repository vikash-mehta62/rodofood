import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Order } from '@/types';

export const useMyOrders = () =>
  useQuery({
    queryKey: ['orders', 'my'],
    queryFn: async () => {
      const res = await api.get('/orders/my');
      return res.data.data as Order[];
    },
  });

export const useOrderById = (id: string) =>
  useQuery({
    queryKey: ['order', id],
    queryFn: async () => {
      const res = await api.get(`/orders/my/${id}`);
      return res.data.data.order as Order;
    },
    enabled: !!id,
    refetchInterval: (data) => {
      // Poll every 10s if order is active
      const activeStatuses = ['pending', 'confirmed', 'preparing'];
      return data && activeStatuses.includes((data as Order).status) ? 10000 : false;
    },
  });

export const usePlaceOrder = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (orderData: unknown) => api.post('/orders', orderData),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['orders', 'my'] }),
  });
};

// Restaurant
export const useRestaurantOrders = (params?: { status?: string; date?: string }) =>
  useQuery({
    queryKey: ['restaurant-orders', params],
    queryFn: async () => {
      const res = await api.get('/orders/restaurant', { params });
      return res.data.data as Order[];
    },
    refetchInterval: 15000, // poll every 15s for new orders
  });

export const useUpdateOrderStatus = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status, rejectionReason }: { id: string; status: string; rejectionReason?: string }) =>
      api.patch(`/orders/restaurant/${id}/status`, { status, rejectionReason }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['restaurant-orders'] }),
  });
};

export const useRestaurantEarnings = () =>
  useQuery({
    queryKey: ['restaurant-earnings'],
    queryFn: async () => {
      const res = await api.get('/orders/restaurant/earnings');
      return res.data.data;
    },
  });
