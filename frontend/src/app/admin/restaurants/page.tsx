'use client';
import { useState } from 'react';
import { Search, Plus, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import type { Restaurant } from '@/types';

export default function AdminRestaurantsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-restaurants', search],
    queryFn: async () => (await api.get('/restaurants', { params: { search, limit: 50 } })).data,
  });

  const toggleMutation = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/restaurants/${id}`, { isActive: !isActive }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-restaurants'] }),
  });

  const restaurants: Restaurant[] = data?.data || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-12 pb-4 border-b">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold">Restaurants</h1>
          <Button size="sm"><Plus className="w-4 h-4 mr-1" /> Add</Button>
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search restaurants..."
            className="pl-9"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : restaurants.map((r) => (
          <div key={r._id} className="bg-card border rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <p className="font-semibold">{r.name}</p>
                <p className="text-xs text-muted-foreground">{r.address?.city} • {r.foodType}</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${(r as any).isVerified ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                    {(r as any).isVerified ? 'Verified' : 'Pending'}
                  </span>
                  <span className={`text-xs px-2 py-0.5 rounded-full ${r.isOpen ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                    {r.isOpen ? 'Open' : 'Closed'}
                  </span>
                </div>
              </div>
              <button onClick={() => toggleMutation.mutate({ id: r._id, isActive: r.isActive })}>
                {r.isActive
                  ? <ToggleRight className="w-7 h-7 text-green-500" />
                  : <ToggleLeft className="w-7 h-7 text-gray-400" />}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
