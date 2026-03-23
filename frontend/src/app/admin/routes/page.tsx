'use client';
import { useState } from 'react';
import { Plus, MapPin, Loader2, Trash2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import type { Route } from '@/types';

export default function AdminRoutesPage() {
  const qc = useQueryClient();

  const { data: routes, isLoading } = useQuery({
    queryKey: ['admin-routes'],
    queryFn: async () => (await api.get('/routes')).data.data.routes as Route[],
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/routes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-routes'] }),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b">
        <h1 className="text-xl font-bold">Route Management</h1>
        <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add Route</Button>
      </div>

      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : routes?.map((route) => (
          <div key={route._id} className="bg-card border rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <MapPin className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold">{route.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {route.fromCity} → {route.toCity}
                    {route.totalDistanceKm && ` • ${route.totalDistanceKm}km`}
                  </p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {route.waypoints?.length || 0} waypoints
                  </p>
                </div>
              </div>
              <button onClick={() => deleteMutation.mutate(route._id)} className="p-2 text-destructive">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>

            {/* Waypoints */}
            {route.waypoints && (
              <div className="mt-3 flex items-center gap-1 overflow-x-auto">
                {route.waypoints.map((wp, i) => (
                  <div key={i} className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs bg-muted px-2 py-0.5 rounded-full">{wp.name}</span>
                    {i < route.waypoints.length - 1 && <span className="text-muted-foreground text-xs">→</span>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
