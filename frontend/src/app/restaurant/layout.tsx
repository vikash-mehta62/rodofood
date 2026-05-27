'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  LayoutDashboard, UtensilsCrossed, ShoppingBag,
  ToggleLeft, ToggleRight, LogOut, Menu, X, ChefHat, Tag
} from 'lucide-react';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/restaurant/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { href: '/restaurant/menu',      icon: UtensilsCrossed,  label: 'Menu'      },
  { href: '/restaurant/orders',    icon: ShoppingBag,      label: 'Orders'    },
  { href: '/restaurant/coupons',   icon: Tag,              label: 'Coupons'   },
  { href: '/restaurant/profile',   icon: ChefHat,          label: 'Profile'   },
];

export default function RestaurantLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const qc = useQueryClient();
  const { logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLogout = () => {
    logout();
    router.push('/landing');
  };

  const { data: restaurant } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn: async () => (await api.get('/restaurants/owner/me')).data.data.restaurant,
  });

  const toggleStatus = useMutation({
    mutationFn: () => api.patch('/restaurants/owner/toggle-status'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-restaurant'] }),
  });

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div className="min-w-0">
            <p className="text-white font-black text-sm truncate">{restaurant?.name || 'My Restaurant'}</p>
            <p className="text-slate-500 text-[10px] font-medium truncate">{restaurant?.address?.city || 'Restaurant Panel'}</p>
          </div>
        </div>

        {/* Open/Close */}
        <button
          onClick={() => toggleStatus.mutate()}
          className="mt-4 w-full flex items-center justify-center gap-2 rounded-xl py-2 border transition-all"
          style={{
            background: restaurant?.isOpen ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
            borderColor: restaurant?.isOpen ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)',
          }}
        >
          {restaurant?.isOpen
            ? <><ToggleRight className="w-4 h-4 text-green-400" /><span className="text-green-400 text-xs font-black">Restaurant Open</span></>
            : <><ToggleLeft className="w-4 h-4 text-red-400" /><span className="text-red-400 text-xs font-black">Restaurant Closed</span></>
          }
        </button>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
              <div className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                active
                  ? 'text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              )}
                style={active ? { background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' } : {}}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-bold text-sm">{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="px-3 py-4 border-t border-slate-800">
        <button
          onClick={handleLogout}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-bold text-sm">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ background: '#F1F5F9' }}>

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 sticky top-0 h-screen"
        style={{ background: '#0f172a' }}>
        <SidebarContent />
      </aside>

      {/* ── MOBILE SIDEBAR OVERLAY ── */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 flex flex-col h-full z-10" style={{ background: '#0f172a' }}>
            <button
              onClick={() => setMobileOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl hover:bg-slate-100 transition-colors">
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-slate-900 text-sm">{restaurant?.name || 'Restaurant'}</span>
          </div>
          <div className={`w-2.5 h-2.5 rounded-full ${restaurant?.isOpen ? 'bg-green-500' : 'bg-red-400'}`} />
        </header>

        <main className="flex-1 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
