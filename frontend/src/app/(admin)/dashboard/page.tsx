'use client';
import { Users, Store, ShoppingBag, DollarSign, AlertCircle, TrendingUp, Loader2 } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { formatCurrency } from '@/lib/utils';
import Link from 'next/link';

const StatCard = ({ icon: Icon, label, value, href, color }: {
  icon: React.ElementType; label: string; value: string | number; href?: string; color: string;
}) => (
  <Link href={href || '#'}>
    <div className="bg-card border rounded-xl p-4 hover:shadow-md transition-shadow">
      <div className={`w-10 h-10 rounded-lg ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  </Link>
);

export default function AdminDashboard() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['admin-stats'],
    queryFn: async () => (await api.get('/admin/dashboard')).data.data,
    refetchInterval: 30000,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-brand-dark text-white px-6 pt-12 pb-6">
        <h1 className="text-2xl font-bold">Rodofood Admin</h1>
        <p className="text-sm opacity-70 mt-1">Super Control Panel</p>
      </div>

      <div className="p-6 space-y-6">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <StatCard icon={Users} label="Total Users" value={stats?.users || 0} href="/admin/users" color="bg-blue-500" />
          <StatCard icon={Store} label="Restaurants" value={stats?.restaurants || 0} href="/admin/restaurants" color="bg-orange-500" />
          <StatCard icon={ShoppingBag} label="Today's Orders" value={stats?.orders?.today || 0} href="/admin/orders" color="bg-purple-500" />
          <StatCard icon={DollarSign} label="Today's Revenue" value={formatCurrency(stats?.revenue?.today || 0)} color="bg-green-500" />
        </div>

        {/* Secondary Stats */}
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-card border rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-orange-500">{stats?.orders?.pending || 0}</p>
            <p className="text-xs text-muted-foreground">Pending Orders</p>
          </div>
          <div className="bg-card border rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-red-500">{stats?.openTickets || 0}</p>
            <p className="text-xs text-muted-foreground">Open Tickets</p>
          </div>
          <div className="bg-card border rounded-xl p-3 text-center">
            <p className="text-lg font-bold text-green-500">{formatCurrency(stats?.revenue?.total || 0)}</p>
            <p className="text-xs text-muted-foreground">Total Revenue</p>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h2 className="font-bold mb-3">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { href: '/admin/restaurants', label: 'Manage Restaurants', emoji: '🏪' },
              { href: '/admin/routes', label: 'Manage Routes', emoji: '🛣️' },
              { href: '/admin/coupons', label: 'Coupons', emoji: '🎟️' },
              { href: '/admin/cms', label: 'CMS Content', emoji: '📝' },
              { href: '/admin/orders', label: 'All Orders', emoji: '📦' },
              { href: '/admin/users', label: 'Users', emoji: '👥' },
            ].map(({ href, label, emoji }) => (
              <Link key={href} href={href}>
                <div className="bg-card border rounded-xl p-4 flex items-center gap-3 hover:shadow-md transition-shadow">
                  <span className="text-2xl">{emoji}</span>
                  <span className="text-sm font-medium">{label}</span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
