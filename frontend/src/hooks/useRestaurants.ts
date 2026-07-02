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
      const res = await api.get('/restaurants/by-route', {
        params: {
          ...params,
          debug: process.env.NODE_ENV !== 'production' ? 'true' : undefined,
        },
      });
      if (process.env.NODE_ENV !== 'production' && res.data.data.debug) {
        console.groupCollapsed('[restaurants/by-route] visibility debug');
        console.log('Route:', res.data.data.debug.route);
        console.log('Counts:', res.data.data.debug.counts);
        console.table(
          res.data.data.debug.restaurants.map((restaurant: any) => ({
            name: restaurant.name,
            showing: restaurant.showing,
            reasons: restaurant.reasons.join(', ') || 'showing',
            active: restaurant.isActive,
            portal: restaurant.portalEnabled,
            open: restaurant.isOpen,
            matchedBy: restaurant.routeMatchedBy,
            waypoint: restaurant.routeWaypointOrder,
            closestWaypoint: restaurant.closestWaypoint,
            closestDistanceKm: restaurant.closestDistanceKm,
            city: restaurant.city,
          }))
        );
        console.groupEnd();
      }
      return res.data.data as { route: Route; restaurants: Restaurant[] };
    },
    enabled: !!params.routeId,
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
