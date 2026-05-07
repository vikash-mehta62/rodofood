'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, ShoppingBag, User, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';

function useUnreadCount() {
  const { isAuthenticated, user } = useAuthStore();
  return useQuery({
    queryKey: ['notifications-unread'],
    queryFn: async () => {
      const res = await api.get('/notifications/my');
      return res.data.data.unreadCount as number;
    },
    enabled: isAuthenticated && user?.role === 'customer',
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

const navItems = [
  { href: '/home',          icon: Home,        label: 'Home'    },
  { href: '/trip',          icon: MapPin,       label: 'Trip'    },
  { href: '/orders',        icon: ShoppingBag,  label: 'Orders'  },
  { href: '/notifications', icon: Bell,         label: 'Alerts'  },
  { href: '/profile',       icon: User,         label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();
  const { data: unreadCount } = useUnreadCount();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-lg mx-auto px-2">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          const isNotif = href === '/notifications';
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-0.5 flex-1 relative">
              <div className="relative">
                <Icon className={cn('w-5 h-5 transition-colors', active ? 'text-primary' : 'text-muted-foreground')} />
                {isNotif && unreadCount && unreadCount > 0 ? (
                  <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[9px] font-black rounded-full flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                ) : null}
              </div>
              <span className={cn('text-[10px] font-medium', active ? 'text-primary' : 'text-muted-foreground')}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
