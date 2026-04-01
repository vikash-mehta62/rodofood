'use client';
import { useState } from 'react';
import { User, Phone, Mail, LogOut, ChevronRight, MessageCircle, HelpCircle, FileText, Edit2, Check, X } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUpdateProfile } from '@/hooks/useAuth';
import BottomNav from '@/components/shared/BottomNav';
import { useRouter } from 'next/navigation';
import { useMyOrders } from '@/hooks/useOrders';
import Link from 'next/link';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const updateProfile = useUpdateProfile();
  const { data: orders } = useMyOrders();

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleSave = async () => {
    await updateProfile.mutateAsync({ name, email });
    setEditing(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const completedOrders = orders?.filter(o => o.status === 'completed').length ?? 0;
  const totalSpent = orders?.filter(o => o.status === 'completed').reduce((s, o) => s + o.totalAmount, 0) ?? 0;

  const MENU = [
    { icon: MessageCircle, label: 'WhatsApp Support', sub: 'Chat with us anytime', action: () => window.open('https://wa.me/919999999999'), color: 'text-emerald-600 bg-emerald-50' },
    { icon: HelpCircle,    label: 'Help & FAQ',       sub: 'Common questions answered', action: () => window.open('https://wa.me/919999999999'), color: 'text-blue-600 bg-blue-50' },
    { icon: FileText,      label: 'Terms & Conditions', sub: 'Our terms of service', action: () => {}, color: 'text-gray-500 bg-gray-100' },
    { icon: FileText,      label: 'Privacy Policy',   sub: 'How we use your data', action: () => {}, color: 'text-gray-500 bg-gray-100' },
  ];

  return (
    <div className="min-h-screen bg-[#F5F6FA] pb-28">

      {/* Header */}
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 sm:px-6 pt-12 pb-4">
        <div className="max-w-lg mx-auto">
          <h1 className="text-xl font-extrabold text-gray-900">Profile</h1>
        </div>
      </div>

      <div className="max-w-lg mx-auto px-4 sm:px-6 py-5 space-y-4">

        {/* Avatar + name card */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-4">
            {/* Avatar */}
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center text-white font-extrabold text-2xl shadow-lg shadow-orange-200 flex-shrink-0">
              {user?.name?.[0]?.toUpperCase() || <User className="w-8 h-8" />}
            </div>
            <div className="flex-1 min-w-0">
              {editing ? (
                <input
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full text-base font-extrabold text-gray-900 border-b-2 border-orange-400 outline-none bg-transparent pb-0.5 mb-1"
                  placeholder="Your name"
                  autoFocus
                />
              ) : (
                <p className="font-extrabold text-gray-900 text-base truncate">{user?.name || 'Set your name'}</p>
              )}
              <p className="text-sm text-gray-500 flex items-center gap-1.5 mt-0.5">
                <Phone className="w-3.5 h-3.5" /> +91 {user?.phone}
              </p>
            </div>
            {!editing ? (
              <button onClick={() => setEditing(true)}
                className="w-9 h-9 rounded-xl bg-gray-100 hover:bg-orange-50 hover:border-orange-200 border border-gray-200 flex items-center justify-center transition-colors flex-shrink-0">
                <Edit2 className="w-4 h-4 text-gray-600" />
              </button>
            ) : (
              <div className="flex gap-2 flex-shrink-0">
                <button onClick={handleSave} disabled={updateProfile.isPending}
                  className="w-9 h-9 rounded-xl bg-emerald-500 flex items-center justify-center disabled:opacity-60">
                  <Check className="w-4 h-4 text-white" />
                </button>
                <button onClick={() => { setEditing(false); setName(user?.name || ''); setEmail(user?.email || ''); }}
                  className="w-9 h-9 rounded-xl bg-gray-200 flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>
            )}
          </div>

          {/* Email row */}
          <div className="mt-4 pt-4 border-t border-gray-50">
            {editing ? (
              <div className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-gray-400 flex-shrink-0" />
                <input
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  type="email"
                  className="flex-1 text-sm text-gray-700 border-b border-gray-200 outline-none bg-transparent pb-0.5 focus:border-orange-400 transition-colors"
                  placeholder="Email (optional)"
                />
              </div>
            ) : user?.email ? (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <Mail className="w-4 h-4 text-gray-400" />
                <span>{user.email}</span>
              </div>
            ) : (
              <button onClick={() => setEditing(true)} className="flex items-center gap-2 text-sm text-orange-500 font-semibold">
                <Mail className="w-4 h-4" /> Add email address
              </button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/orders">
            <div className="bg-white rounded-2xl border border-gray-100 p-4 hover:border-orange-200 hover:shadow-md transition-all cursor-pointer">
              <p className="text-2xl font-extrabold text-gray-900">{completedOrders}</p>
              <p className="text-xs text-gray-500 font-medium mt-0.5">Orders Completed</p>
            </div>
          </Link>
          <div className="bg-white rounded-2xl border border-gray-100 p-4">
            <p className="text-2xl font-extrabold text-gray-900">
              ₹{totalSpent >= 1000 ? `${(totalSpent / 1000).toFixed(1)}k` : totalSpent}
            </p>
            <p className="text-xs text-gray-500 font-medium mt-0.5">Total Spent</p>
          </div>
        </div>

        {/* Menu */}
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          {MENU.map(({ icon: Icon, label, sub, action, color }, i) => (
            <button key={label} onClick={action}
              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-gray-50 transition-colors text-left ${i > 0 ? 'border-t border-gray-50' : ''}`}>
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-800">{label}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
              <ChevronRight className="w-4 h-4 text-gray-300 flex-shrink-0" />
            </button>
          ))}
        </div>

        {/* App version */}
        <p className="text-center text-xs text-gray-400">Rodofood v1.0 · Made for highway travellers 🛣️</p>

        {/* Logout */}
        <button onClick={handleLogout}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-sm font-bold text-red-600 border-2 border-red-200 bg-red-50 hover:bg-red-100 transition-colors">
          <LogOut className="w-4 h-4" /> Log Out
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
