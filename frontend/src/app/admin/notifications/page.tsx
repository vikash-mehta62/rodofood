'use client';
import { useState } from 'react';
import { Bell, Send, Trash2, Loader2, Users, User, CheckCircle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

export default function AdminNotificationsPage() {
  const qc = useQueryClient();
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [type, setType] = useState<'all' | 'user'>('all');
  const [targetPhone, setTargetPhone] = useState('');
  const [icon, setIcon] = useState('🔔');
  const [sent, setSent] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-notifications'],
    queryFn: async () => (await api.get('/notifications')).data.data.notifications,
  });

  const sendMut = useMutation({
    mutationFn: () => api.post('/notifications', { title, message, type, targetPhone: targetPhone || undefined, icon }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-notifications'] });
      setTitle(''); setMessage(''); setTargetPhone(''); setType('all'); setIcon('🔔');
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/notifications/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-notifications'] }),
  });

  const ICONS = ['🔔', '🎉', '🍽️', '🚗', '💰', '⚡', '📢', '🎁'];

  return (
    <div className="p-4 sm:p-6 min-h-screen" style={{ background: '#F1F5F9' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">Notifications</h1>
        <p className="text-slate-400 text-sm mt-0.5">Send in-app notifications to customers</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6">

        {/* ── SEND FORM ── */}
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-6 space-y-4 h-fit">
          <h2 className="font-black text-slate-900 text-base flex items-center gap-2">
            <Send className="w-4 h-4 text-orange-500" /> Send Notification
          </h2>

          {/* Target */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Send To</label>
            <div className="grid grid-cols-2 gap-2">
              <button onClick={() => setType('all')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${type === 'all' ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-slate-200 text-slate-500'}`}>
                <Users className="w-4 h-4" /> All Customers
              </button>
              <button onClick={() => setType('user')}
                className={`flex items-center justify-center gap-2 py-2.5 rounded-xl border-2 text-sm font-bold transition-all ${type === 'user' ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-slate-200 text-slate-500'}`}>
                <User className="w-4 h-4" /> Specific User
              </button>
            </div>
          </div>

          {type === 'user' && (
            <div>
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Customer Phone</label>
              <input value={targetPhone} onChange={e => setTargetPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                placeholder="10-digit mobile number"
                className="w-full h-11 px-4 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-orange-400 transition-colors" />
            </div>
          )}

          {/* Icon picker */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Icon</label>
            <div className="flex gap-2 flex-wrap">
              {ICONS.map(ic => (
                <button key={ic} onClick={() => setIcon(ic)}
                  className={`w-9 h-9 rounded-xl text-lg flex items-center justify-center border-2 transition-all ${icon === ic ? 'border-orange-400 bg-orange-50' : 'border-slate-200 hover:border-slate-300'}`}>
                  {ic}
                </button>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Title *</label>
            <input value={title} onChange={e => setTitle(e.target.value)} maxLength={80}
              placeholder="e.g. Special Offer Today!"
              className="w-full h-11 px-4 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-orange-400 transition-colors" />
          </div>

          {/* Message */}
          <div>
            <label className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 block">Message *</label>
            <textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={300} rows={3}
              placeholder="Write your notification message..."
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm outline-none focus:border-orange-400 transition-colors resize-none" />
            <p className="text-[10px] text-slate-400 mt-1 text-right">{message.length}/300</p>
          </div>

          {/* Preview */}
          {(title || message) && (
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Preview</p>
              <div className="flex items-start gap-3 bg-white rounded-xl p-3 shadow-sm border border-slate-100">
                <span className="text-2xl flex-shrink-0">{icon}</span>
                <div>
                  <p className="font-bold text-slate-900 text-sm">{title || 'Title...'}</p>
                  <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{message || 'Message...'}</p>
                </div>
              </div>
            </div>
          )}

          <button
            onClick={() => sendMut.mutate()}
            disabled={!title.trim() || !message.trim() || sendMut.isPending || (type === 'user' && targetPhone.length !== 10)}
            className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all disabled:opacity-40 bg-gradient-to-r from-orange-500 to-orange-400 shadow-md shadow-orange-200 disabled:shadow-none">
            {sendMut.isPending
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : sent
              ? <><CheckCircle className="w-5 h-5" /> Sent!</>
              : <><Send className="w-4 h-4" /> Send Notification</>
            }
          </button>

          {sendMut.isError && (
            <p className="text-red-500 text-sm text-center">{(sendMut.error as any)?.response?.data?.message || 'Failed to send'}</p>
          )}
        </div>

        {/* ── SENT NOTIFICATIONS LIST ── */}
        <div>
          <h2 className="font-black text-slate-900 text-base mb-4 flex items-center gap-2">
            <Bell className="w-4 h-4 text-slate-400" /> Sent Notifications
            {data?.length > 0 && <span className="text-xs font-bold text-slate-400">({data.length})</span>}
          </h2>

          {isLoading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
          ) : !data?.length ? (
            <div className="bg-white rounded-2xl border border-slate-100 p-12 text-center">
              <Bell className="w-10 h-10 text-slate-200 mx-auto mb-3" />
              <p className="font-bold text-slate-400">No notifications sent yet</p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.map((n: any) => (
                <div key={n._id} className="bg-white rounded-2xl border border-slate-100 p-4 flex items-start gap-4">
                  <span className="text-2xl flex-shrink-0">{n.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <p className="font-bold text-slate-900 text-sm">{n.title}</p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                        n.type === 'all' ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-violet-50 text-violet-700 border-violet-200'
                      }`}>
                        {n.type === 'all' ? '📢 All Customers' : `👤 ${n.targetUser?.name || n.targetUser?.phone || 'User'}`}
                      </span>
                    </div>
                    <p className="text-xs text-slate-500 leading-relaxed mb-2">{n.message}</p>
                    <div className="flex items-center gap-3 text-[10px] text-slate-400">
                      <span>{new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span>
                      <span>· {n.readBy?.length || 0} read</span>
                    </div>
                  </div>
                  <button onClick={() => deleteMut.mutate(n._id)} disabled={deleteMut.isPending}
                    className="w-8 h-8 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center flex-shrink-0 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-red-500" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
