'use client';
import { useState } from 'react';
import { Search, ToggleLeft, ToggleRight, Loader2, User, Phone, Mail, Calendar, Shield, Plus, X } from 'lucide-react';
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
  const [showAddModal, setShowAddModal] = useState(false);
  const [newAdmin, setNewAdmin] = useState({ name: '', phone: '', email: '', password: '' });
  const [errorMsg, setErrorMsg] = useState('');

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

  const makeAdminMut = useMutation({
    mutationFn: (id: string) => api.patch(`/admin/users/${id}/make-admin`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-users'] }),
  });

  const createAdminMut = useMutation({
    mutationFn: (payload: typeof newAdmin) => api.post('/admin/users/create-admin', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-users'] });
      setShowAddModal(false);
      setNewAdmin({ name: '', phone: '', email: '', password: '' });
      setErrorMsg('');
    },
    onError: (err: any) => {
      setErrorMsg(err?.response?.data?.message || 'Failed to create admin staff');
    }
  });

  const users = data?.data || [];

  return (
    <div className="p-4 sm:p-6 min-h-screen" style={{ background: '#F1F5F9' }}>
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Users & Admin Access</h1>
          <p className="text-slate-400 text-sm font-medium mt-0.5">{users.length} users found</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-black text-white flex items-center gap-2 shadow-sm transition-transform active:scale-95"
          style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)' }}>
          <Plus className="w-4 h-4" /> Add Admin Staff
        </button>
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

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {user.role !== 'admin' && (
                        <button onClick={() => {
                          if (window.confirm(`Are you sure you want to promote ${user.name || user.phone} to Admin?`)) {
                            makeAdminMut.mutate(user._id);
                          }
                        }}
                          disabled={makeAdminMut.isPending}
                          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-purple-50 text-purple-700 border border-purple-200 hover:bg-purple-100 transition-colors">
                          <Shield className="w-3.5 h-3.5" /> Make Admin
                        </button>
                      )}
                      
                      {/* Toggle */}
                      <button onClick={() => toggleMut.mutate(user._id)}
                        disabled={toggleMut.isPending}
                        className="flex-shrink-0 transition-transform active:scale-90 ml-2">
                        {user.isActive
                          ? <ToggleRight className="w-8 h-8 text-green-500" />
                          : <ToggleLeft className="w-8 h-8 text-slate-300" />}
                      </button>
                    </div>
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

      {/* Add Admin Staff Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)' }}
          onClick={e => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl overflow-hidden">
            <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-black text-slate-900">Add Admin Staff</h2>
                <p className="text-xs text-slate-400 font-medium mt-0.5">Grant admin portal access to new or existing staff.</p>
              </div>
              <button onClick={() => setShowAddModal(false)} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-500">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-600">
                  {errorMsg}
                </div>
              )}

              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Staff Name</label>
                <input value={newAdmin.name} onChange={e => setNewAdmin(a => ({ ...a, name: e.target.value }))} placeholder="e.g. Rahul Sharma"
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-purple-500" />
              </div>

              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Mobile Phone Number *</label>
                <input value={newAdmin.phone} onChange={e => setNewAdmin(a => ({ ...a, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))} placeholder="10-digit mobile number"
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-purple-500" />
              </div>

              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Email (Optional)</label>
                <input type="email" value={newAdmin.email} onChange={e => setNewAdmin(a => ({ ...a, email: e.target.value }))} placeholder="staff@rodofood.com"
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-purple-500" />
              </div>

              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Password</label>
                <input type="password" value={newAdmin.password} onChange={e => setNewAdmin(a => ({ ...a, password: e.target.value }))} placeholder="Leave empty for default: Admin@12345"
                  className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-purple-500" />
              </div>
            </div>

            <div className="px-6 py-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50/50">
              <button onClick={() => setShowAddModal(false)} className="px-4 py-2.5 rounded-xl text-xs font-black border border-slate-200 text-slate-500">
                Cancel
              </button>
              <button onClick={() => {
                if (newAdmin.phone.length !== 10) {
                  setErrorMsg('Please enter a valid 10-digit mobile number');
                  return;
                }
                createAdminMut.mutate(newAdmin);
              }} disabled={createAdminMut.isPending}
                className="px-5 py-2.5 rounded-xl text-xs font-black text-white flex items-center gap-2"
                style={{ background: 'linear-gradient(135deg,#8B5CF6,#7C3AED)' }}>
                {createAdminMut.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />} Give Admin Access
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
