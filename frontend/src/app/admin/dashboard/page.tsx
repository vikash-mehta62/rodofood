'use client';
import Link from 'next/link';
import { useState } from 'react';
import { Users, Store, ShoppingBag, DollarSign, TrendingUp, AlertCircle, Loader2, ArrowRight, CheckCircle, Clock, Calendar, BarChart3 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { formatCurrency } from '@/lib/utils';

export default function AdminDashboard() {
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month'>('day');

  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => (await api.get('/admin/dashboard')).data.data,
    refetchInterval: 30000,
  });

  const { data: revenueData, isLoading: revLoading } = useQuery({
    queryKey: ['admin-restaurant-revenue', timeframe],
    queryFn: async () => (await api.get('/admin/analytics/restaurant-revenue', { params: { timeframe } })).data.data,
  });

  if (isLoading) return (
    <div className="flex justify-center items-center min-h-screen">
      <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
    </div>
  );

  const STATS = [
    { label: 'Total Users',      value: stats?.users || 0,                          icon: Users,     color: 'text-blue-600',   bg: 'bg-blue-50',   href: '/admin/users' },
    { label: 'Restaurants',      value: stats?.restaurants || 0,                    icon: Store,     color: 'text-orange-600', bg: 'bg-orange-50', href: '/admin/restaurants' },
    { label: "Today's Orders",   value: stats?.orders?.today || 0,                  icon: ShoppingBag, color: 'text-purple-600', bg: 'bg-purple-50', href: '/admin/orders' },
    { label: "Today's Revenue",  value: formatCurrency(stats?.revenue?.today || 0), icon: DollarSign, color: 'text-green-600',  bg: 'bg-green-50',  href: '/admin/orders' },
    { label: 'Total Revenue',    value: formatCurrency(stats?.revenue?.total || 0), icon: TrendingUp, color: 'text-teal-600',   bg: 'bg-teal-50',   href: '/admin/orders' },
    { label: 'Open Tickets',     value: stats?.openTickets || 0,                    icon: AlertCircle, color: 'text-red-600',   bg: 'bg-red-50',    href: '/admin/orders' },
  ];

  return (
    <div className="p-4 sm:p-6 min-h-screen" style={{ background: '#F1F5F9' }}>
      <div className="mb-6">
        <h1 className="text-2xl font-black text-slate-900">Dashboard</h1>
        <p className="text-slate-400 text-sm font-medium mt-0.5">
          {new Date().toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {STATS.map(({ label, value, icon: Icon, color, bg, href }) => (
          <Link key={label} href={href}>
            <div className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5">
              <div className="flex items-center justify-between mb-4">
                <div className={`w-10 h-10 ${bg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${color}`} />
                </div>
                <ArrowRight className="w-4 h-4 text-slate-300" />
              </div>
              <p className={`text-2xl font-black ${color}`}>{value}</p>
              <p className="text-xs font-bold text-slate-400 mt-0.5">{label}</p>
            </div>
          </Link>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Pending Orders', value: stats?.orders?.pending || 0, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50' },
          { label: 'Completed Today', value: stats?.orders?.completed || 0, icon: CheckCircle, color: 'text-green-600', bg: 'bg-green-50' },
          { label: 'Active Restaurants', value: stats?.activeRestaurants || 0, icon: Store, color: 'text-orange-600', bg: 'bg-orange-50' },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-2xl p-4 border border-slate-100 shadow-sm text-center">
            <div className={`w-8 h-8 ${bg} rounded-xl flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <p className={`text-xl font-black ${color}`}>{value}</p>
            <p className="text-[10px] font-bold text-slate-400 mt-0.5 leading-tight">{label}</p>
          </div>
        ))}
      </div>

      {/* Quick actions */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-50">
          <h2 className="font-black text-slate-900 text-base">Quick Actions</h2>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 divide-x divide-y divide-slate-50">
          {[
            { href: '/admin/restaurants', label: 'Manage Restaurants', emoji: '🏪', desc: 'View, verify, activate' },
            { href: '/admin/users',       label: 'User Management',    emoji: '👥', desc: 'Profiles & roles' },
            { href: '/admin/orders',      label: 'All Orders',         emoji: '📦', desc: 'Track & manage' },
            { href: '/admin/coupons',     label: 'Coupons',            emoji: '🎟️', desc: 'Create & manage' },
            { href: '/admin/routes',      label: 'Routes',             emoji: '🛣️', desc: 'Highway routes' },
            { href: '/admin/cms',         label: 'CMS Content',        emoji: '📝', desc: 'Landing page' },
          ].map(({ href, label, emoji, desc }) => (
            <Link key={href} href={href}>
              <div className="p-5 hover:bg-slate-50 transition-colors flex items-center gap-3">
                <span className="text-2xl flex-shrink-0">{emoji}</span>
                <div className="min-w-0">
                  <p className="font-black text-slate-900 text-sm truncate">{label}</p>
                  <p className="text-[10px] text-slate-400 font-medium">{desc}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
      {/* Restaurant Revenue Analytics Overview */}
      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden mt-6">
        <div className="px-5 py-4 border-b border-slate-50 flex items-center justify-between flex-wrap gap-3">
          <h2 className="font-black text-slate-900 text-base flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-orange-500" />
            Restaurant Revenue
          </h2>
        </div>

        <div className="p-8 text-center bg-slate-50/50">
          <p className="text-slate-500 text-sm font-medium mb-4">
            View detailed revenue breakdowns including Subtotals, GST, Platform Fees, and Discounts for all restaurants.
          </p>
          <Link href="/admin/revenue">
            <button className="px-6 py-2.5 rounded-xl bg-orange-100 text-orange-600 hover:bg-orange-200 transition-colors font-bold text-sm">
              View Detailed Analytics
            </button>
          </Link>
        </div>
      </div>
    </div>
  );
}
