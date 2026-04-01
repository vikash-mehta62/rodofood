'use client';
import { useState } from 'react';
import { Search, ToggleLeft, ToggleRight, Loader2, User, Phone, Mail, Calendar, Shield } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

const ROLE_CFG = {
  admin:      { label: 'Admin',      cls: 'bg-purple-100 text-purple-700 border-purple-200' },
  restaurant: { label: 'Restaurant', cls: 'bg-orange-100 text-orange-700 border-orange-200' },
  customer:   { label: 'Customer',   cls: 'bg-blue-100 text-blue-700 border-blue-200' },
};

export default function AdminUsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  const { data, isLoading } = useQuery({
    queryKey: ['admin-users', search, roleFilter],
    queryFn: async () => (await api.get('/admin/users', {
      params: { search: search || undefined, role: roleFilter !== 'all' ? roleFilter : undefined, limit: 100 }
    })).data,
  });

  const toggleMut = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const users = data?.data || [];

  return (
    <div className="p-4 sm:p-6 min-h-screen" style={{ background: '#F1F5F9' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Users</h1>
          <p className="text-slate-400 text-sm font-medium mt-0.5">{users.length} users found</p>
        </div>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or phone..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 transition-colors" />
        </div>
        <div className="flex gap-2">
          {['all', 'customer', 'restaurant', 'admin'].map(r => (
            <button key={r} onClick={() => setRoleFilter(r)}
              className={`px-3 py-2 rounded-xl text-xs font-black border transition-all capitalize ${roleFilter === r ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-500'}`}
              style={roleFilter === r ? { background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' } : {}}>
              {r === 'all' ? 'All' : r}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          {users.length ? (
            <div className="divide-y divide-slate-50">
              {users.map((user: any) => {
                const roleCfg = ROLE_CFG[user.role as keyof typeof ROLE_CFG] || ROLE_CFG.customer;
                return (
                  <div key={user._id} className="px-5 py-4 flex items-center gap-4 hover:bg-slate-50/50 transition-colors">
                    {/* Avatar */}
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-black text-sm flex-shrink-0"
                      style={{ background: user.role === 'admin' ? 'linear-gradient(135deg,#8B5CF6,#7C3AED)' : user.role === 'restaurant' ? 'linear-gradient(135deg,#FF6B35,#FF8C42)' : 'linear-gradient(135deg,#3B82F6,#2563EB)' }}>
                      {(user.name?.[0] || user.phone?.[0] || 'U').toUpperCase()}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                        <p className="font-black text-slate-900 text-sm">{user.name || 'No name set'}</p>
                        <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${roleCfg.cls}`}>
                          {roleCfg.label}
                        </span>
                        {!user.isActive && (
                          <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-red-100 text-red-600 border border-red-200">Blocked</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-slate-400 font-medium flex-wrap">
                        <span className="flex items-center gap-1"><Phone className="w-3 h-3" />+91 {user.phone}</span>
                        {user.email && <span className="flex items-center gap-1"><Mail className="w-3 h-3" />{user.email}</span>}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Joined {new Date(user.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </span>
                      </div>
                    </div>

                    {/* Toggle */}
                    <button onClick={() => toggleMut.mutate(user._id)}
                      disabled={toggleMut.isPending}
                      className="flex-shrink-0 transition-transform active:scale-90">
                      {user.isActive
                        ? <ToggleRight className="w-8 h-8 text-green-500" />
                        : <ToggleLeft className="w-8 h-8 text-slate-300" />}
                    </button>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-16">
              <User className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="font-black text-slate-400">No users found</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
