'use client';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import BottomNav from '@/components/shared/BottomNav';
import { Bell, Loader2, CheckCheck, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NotificationsPage() {
  const qc = useQueryClient();
  const router = useRouter();

  const { data, isLoading } = useQuery({
    queryKey: ['my-notifications'],
    queryFn: async () => {
      const res = await api.get('/notifications/my');
      return res.data.data as { notifications: any[]; unreadCount: number };
    },
  });

  const markRead = useMutation({
    mutationFn: (id: string) => api.patch(`/notifications/${id}/read`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-notifications'] }),
  });

  const markAllRead = useMutation({
    mutationFn: () => api.patch('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-notifications'] }),
  });

  const notifications = data?.notifications || [];
  const unreadCount = data?.unreadCount || 0;

  return (
    <div className="min-h-screen bg-[#F5F6FA] pb-28">
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 pt-12 pb-4 sticky top-0 z-10">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button onClick={() => router.back()} className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center">
              <ArrowLeft className="w-4 h-4 text-gray-600" />
            </button>
            <div>
              <h1 className="text-xl font-extrabold text-gray-900">Notifications</h1>
              {unreadCount > 0 && <p className="text-xs text-orange-500 font-semibold">{unreadCount} unread</p>}
            </div>
          </div>
          {unreadCount > 0 && (
            <button onClick={() => markAllRead.mutate()}
              disabled={markAllRead.isPending}
              className="flex items-center gap-1.5 text-xs font-bold text-orange-500 border border-orange-200 bg-orange-50 px-3 py-1.5 rounded-xl hover:bg-orange-100 transition-colors">
              <CheckCheck className="w-3.5 h-3.5" /> Mark all read
            </button>
          )}
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 py-5">
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
        ) : notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 gap-3 text-center">
            <div className="w-16 h-16 bg-orange-50 rounded-2xl flex items-center justify-center">
              <Bell className="w-8 h-8 text-orange-300" />
            </div>
            <p className="font-extrabold text-gray-800">No notifications yet</p>
            <p className="text-gray-400 text-sm">We'll notify you about offers, order updates and more.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {notifications.map((n: any) => (
              <button key={n._id} onClick={() => { if (!n.isRead) markRead.mutate(n._id); }}
                className={`w-full flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
                  !n.isRead ? 'bg-orange-50 border-orange-200' : 'bg-white border-gray-100'
                }`}>
                <span className="text-2xl flex-shrink-0 mt-0.5">{n.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-sm font-bold truncate ${!n.isRead ? 'text-gray-900' : 'text-gray-700'}`}>{n.title}</p>
                    {!n.isRead && <span className="w-2 h-2 rounded-full bg-orange-500 flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-[10px] text-gray-400 mt-1.5">
                    {new Date(n.createdAt).toLocaleString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      <BottomNav />
    </div>
  );
}
