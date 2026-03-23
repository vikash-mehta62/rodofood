'use client';
import Link from 'next/link';
import { MapPin, ArrowRight, Star, Clock } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRoutes } from '@/hooks/useRestaurants';
import BottomNav from '@/components/shared/BottomNav';

export default function HomePage() {
  const { user } = useAuthStore();
  const { data: routes } = useRoutes();

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary to-orange-600 text-white px-4 pt-12 pb-8">
        <p className="text-sm opacity-80">Good {new Date().getHours() < 12 ? 'Morning' : new Date().getHours() < 17 ? 'Afternoon' : 'Evening'} 👋</p>
        <h1 className="text-2xl font-bold mt-1">{user?.name || 'Traveler'}</h1>
        <p className="text-sm opacity-80 mt-1">Where are you headed today?</p>
      </div>

      <div className="px-4 py-6 space-y-6">
        {/* Trip Planner CTA */}
        <Link href="/trip">
          <div className="bg-card border-2 border-primary rounded-2xl p-5 flex items-center justify-between hover:shadow-lg transition-shadow">
            <div>
              <p className="font-bold text-lg">Plan Your Trip</p>
              <p className="text-sm text-muted-foreground mt-1">Find restaurants along your route</p>
            </div>
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center">
              <ArrowRight className="w-6 h-6 text-white" />
            </div>
          </div>
        </Link>

        {/* Available Routes */}
        {routes && routes.length > 0 && (
          <div>
            <h2 className="font-bold mb-3">Available Routes</h2>
            <div className="space-y-2">
              {routes.map((route) => (
                <Link key={route._id} href={`/trip?routeId=${route._id}`}>
                  <div className="flex items-center gap-3 p-3 bg-card border rounded-xl hover:shadow-sm transition-shadow">
                    <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                      <MapPin className="w-5 h-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{route.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {route.fromCity} → {route.toCity}
                        {route.totalDistanceKm && ` • ${route.totalDistanceKm}km`}
                      </p>
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground" />
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* Features */}
        <div>
          <h2 className="font-bold mb-3">Why Rodofood?</h2>
          <div className="grid grid-cols-2 gap-3">
            {[
              { icon: Clock, title: 'No Waiting', desc: 'Food ready on arrival', color: 'bg-blue-50 text-blue-600' },
              { icon: Star, title: 'Top Rated', desc: 'Verified restaurants', color: 'bg-yellow-50 text-yellow-600' },
              { icon: MapPin, title: 'Route Based', desc: 'Only relevant stops', color: 'bg-green-50 text-green-600' },
              { icon: ArrowRight, title: 'Easy Order', desc: 'Order in 2 minutes', color: 'bg-purple-50 text-purple-600' },
            ].map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="bg-card border rounded-xl p-4">
                <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center mb-2`}>
                  <Icon className="w-5 h-5" />
                </div>
                <p className="font-semibold text-sm">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
