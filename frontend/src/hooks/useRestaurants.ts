import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Restaurant, Route } from '@/types';

export const useRoutes = () =>
  useQuery({
    queryKey: ['routes'],
    queryFn: async () => {
      const res = await api.get('/routes');
      return res.data.data.routes as Route[];
    },
  });

export const useRestaurantsByRoute = (params: {
  routeId: string;
  fromCity: string;
  toCity: string;
  userLat?: number;
  userLng?: number;
}) =>
  useQuery({
    queryKey: ['restaurants', 'by-route', params],
    queryFn: async () => {
      const res = await api.get('/restaurants/by-route', { params });
      return res.data.data as { route: Route; restaurants: Restaurant[] };
    },
    enabled: !!params.routeId && !!params.fromCity && !!params.toCity,
  });

export const useRestaurant = (id: string) =>
  useQuery({
    queryKey: ['restaurant', id],
    queryFn: async () => {
      const res = await api.get(`/restaurants/${id}`);
      return res.data.data.restaurant as Restaurant;
    },
    enabled: !!id,
  });

export const useMenu = (restaurantId: string) =>
  useQuery({
    queryKey: ['menu', restaurantId],
    queryFn: async () => {
      const res = await api.get(`/menu/${restaurantId}`);
      return res.data.data.menu as Record<string, import('@/types').MenuItem[]>;
    },
    enabled: !!restaurantId,
  });
