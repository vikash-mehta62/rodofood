'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, MapPin, ShoppingBag, User } from 'lucide-react';
import { cn } from '@/lib/utils';

const navItems = [
  { href: '/home', icon: Home, label: 'Home' },
  { href: '/trip', icon: MapPin, label: 'Trip' },
  { href: '/orders', icon: ShoppingBag, label: 'Orders' },
  { href: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-background border-t safe-area-pb">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
        {navItems.map(({ href, icon: Icon, label }) => {
          const active = pathname.startsWith(href);
          return (
            <Link key={href} href={href} className="flex flex-col items-center gap-0.5 flex-1">
              <Icon className={cn('w-5 h-5 transition-colors', active ? 'text-primary' : 'text-muted-foreground')} />
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
