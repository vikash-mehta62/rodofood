'use client';
import { useState } from 'react';
import { Search, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Input } from '@/components/ui/input';
import type { User } from '@/types';

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search],
    queryFn: async () => (await api.get('/admin/users', { params: { search, limit: 50 } })).data,
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const users: User[] = data?.data || [];

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-12 pb-4 border-b">
        <h1 className="text-xl font-bold mb-4">Users</h1>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search by name or phone..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      <div className="px-4 py-4 space-y-2">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : users.map((user) => (
          <div key={user._id} className="bg-card border rounded-xl p-3 flex items-center justify-between">
            <div>
              <p className="font-medium text-sm">{user.name || 'No name'}</p>
              <p className="text-xs text-muted-foreground">+91 {user.phone}</p>
              <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${
                user.role === 'admin' ? 'bg-purple-100 text-purple-700' :
                user.role === 'restaurant' ? 'bg-orange-100 text-orange-700' :
                'bg-blue-100 text-blue-700'
              }`}>
                {user.role}
              </span>
            </div>
            <button onClick={() => toggleMutation.mutate(user._id)}>
              {user.isActive
                ? <ToggleRight className="w-7 h-7 text-green-500" />
                : <ToggleLeft className="w-7 h-7 text-gray-400" />}
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
