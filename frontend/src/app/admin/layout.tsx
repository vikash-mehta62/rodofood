'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, Store, ShoppingBag, Users,
  Tag, MapPin, FileText, LogOut, Menu, X, Shield
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/admin/dashboard',    icon: LayoutDashboard, label: 'Dashboard'   },
  { href: '/admin/restaurants',  icon: Store,           label: 'Restaurants' },
  { href: '/admin/orders',       icon: ShoppingBag,     label: 'Orders'      },
  { href: '/admin/users',        icon: Users,           label: 'Users'       },
  { href: '/admin/coupons',      icon: Tag,             label: 'Coupons'     },
  { href: '/admin/routes',       icon: MapPin,          label: 'Routes'      },
  { href: '/admin/cms',          icon: FileText,        label: 'CMS'         },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { logout } = useAuthStore();
  const [mobileOpen, setMobileOpen] = useState(false);

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      <div className="px-5 py-6 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-white font-black text-sm">Rodofood Admin</p>
            <p className="text-slate-500 text-[10px] font-medium">Super Control Panel</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ href, icon: Icon, label }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link key={href} href={href} onClick={() => setMobileOpen(false)}>
              <div className={cn(
                'flex items-center gap-3 px-4 py-3 rounded-xl transition-all',
                active ? 'text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'
              )} style={active ? { background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' } : {}}>
                <Icon className="w-5 h-5 flex-shrink-0" />
                <span className="font-bold text-sm">{label}</span>
              </div>
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t border-slate-800">
        <button onClick={() => logout()}
          className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all">
          <LogOut className="w-5 h-5" />
          <span className="font-bold text-sm">Logout</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex min-h-screen" style={{ background: '#F1F5F9' }}>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-64 flex-shrink-0 sticky top-0 h-screen" style={{ background: '#0f172a' }}>
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50 flex">
          <div className="absolute inset-0 bg-black/60" onClick={() => setMobileOpen(false)} />
          <aside className="relative w-72 flex flex-col h-full z-10" style={{ background: '#0f172a' }}>
            <button onClick={() => setMobileOpen(false)} className="absolute top-4 right-4 text-slate-400 hover:text-white">
              <X className="w-5 h-5" />
            </button>
            <SidebarContent />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-slate-200 sticky top-0 z-40">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-xl hover:bg-slate-100">
            <Menu className="w-5 h-5 text-slate-700" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
              <Shield className="w-4 h-4 text-white" />
            </div>
            <span className="font-black text-slate-900 text-sm">Admin Panel</span>
          </div>
          <div className="w-9" />
        </header>
        <main className="flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
