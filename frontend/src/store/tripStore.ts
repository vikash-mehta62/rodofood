import { create } from 'zustand';
import type { Route } from '@/types';

interface TripStore {
  selectedRoute: Route | null;
  fromCity: string;
  toCity: string;
  userLocation: { lat: number; lng: number } | null;
  isTrackingLocation: boolean;

  setRoute: (route: Route) => void;
  setFromCity: (city: string) => void;
  setToCity: (city: string) => void;
  setUserLocation: (location: { lat: number; lng: number }) => void;
  setTrackingLocation: (tracking: boolean) => void;
  swapCities: () => void;
  resetTrip: () => void;
}

export const useTripStore = create<TripStore>((set, get) => ({
  selectedRoute: null,
  fromCity: '',
  toCity: '',
  userLocation: null,
  isTrackingLocation: false,

  setRoute: (route) => set({ selectedRoute: route }),
  setFromCity: (city) => set({ fromCity: city }),
  setToCity: (city) => set({ toCity: city }),
  setUserLocation: (location) => set({ userLocation: location }),
  setTrackingLocation: (tracking) => set({ isTrackingLocation: tracking }),

  swapCities: () => {
    const { fromCity, toCity } = get();
    set({ fromCity: toCity, toCity: fromCity });
  },

  resetTrip: () =>
    set({ selectedRoute: null, fromCity: '', toCity: '', userLocation: null, isTrackingLocation: false }),
}));
