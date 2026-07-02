'use client';
import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import {
  MapPin, Clock, Calendar, Store, Star, ArrowRight, Loader2
} from 'lucide-react';
import api from '@/lib/axios';
import { resolveImage } from '@/lib/config';
import BottomNav from '@/components/shared/BottomNav';

function QRLandingContent() {
  const searchParams = useSearchParams();
  const qrId = searchParams.get('qrId') || '';

  const [liveTimeStr, setLiveTimeStr] = useState('');
  const [liveTimeMinutes, setLiveTimeMinutes] = useState(0);

  // Live clock updater
  useEffect(() => {
    const updateTime = () => {
      const d = new Date();
      setLiveTimeMinutes(d.getHours() * 60 + d.getMinutes());
      let hours = d.getHours();
      const mins = String(d.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      setLiveTimeStr(`${String(hours).padStart(2, '0')}:${mins} ${ampm}`);
    };
    updateTime();
    const interval = setInterval(updateTime, 60000);
    return () => clearInterval(interval);
  }, []);

  // Fetch consolidated QR Config
  const { data: qr, isLoading: isQrLoading } = useQuery({
    queryKey: ['qr-config', qrId],
    queryFn: async () => {
      if (!qrId) return null;
      return (await api.get(`/qrs/${qrId}`)).data.data.qr;
    },
    enabled: !!qrId,
  });

  const routeId = qr?.route?._id || qr?.route || '';

  // Fetch all restaurants serving the route
  const { data: restaurantsResponse, isLoading: isRestaurantsLoading } = useQuery({
    queryKey: ['qr-landing-restaurants-list', routeId],
    queryFn: async () => {
      if (!routeId) return null;
      return (await api.get('/restaurants', { params: { limit: 100 } })).data;
    },
    enabled: !!routeId,
  });

  const timelineStops = qr?.stops || [];
  const allRestaurants = restaurantsResponse?.data || [];
  const isLoading = isQrLoading || isRestaurantsLoading;

  return (
    <div className="min-h-screen pb-32" style={{ background: '#F8FAFC' }}>
      
      {/* HEADER GREETING */}
      <div className="relative overflow-hidden px-4 pt-14 pb-8"
        style={{ background: 'linear-gradient(135deg,#1a1a2e 0%,#16213e 50%,#0f3460 100%)' }}>
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,107,53,0.5) 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        <div className="relative z-10 space-y-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="bg-orange-500/20 text-orange-400 text-[10px] font-black px-2.5 py-1 rounded-full uppercase tracking-wider border border-orange-500/30 flex items-center gap-1">
              🛣️ Live Route Companion
            </span>
          </div>

          <div>
            <h1 className="text-2xl font-black text-white leading-tight">
              {qr?.title || 'Live Journey Timeline'}
            </h1>
            {qr?.route && (
              <p className="text-slate-300 text-xs font-bold mt-1 flex items-center gap-1">
                Route: {qr.route.name} ({qr.route.fromCity} <ArrowRight className="w-3.5 h-3.5 text-orange-400" /> {qr.route.toCity})
              </p>
            )}
          </div>
        </div>
      </div>

      {/* TIMELINE CONTAINER */}
      <div className="px-4 py-6 space-y-6">
        
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
        ) : timelineStops.length > 0 ? (
          <div className="bg-white rounded-3xl p-5 border border-slate-150/50 shadow-xl space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-slate-50 flex-wrap gap-2">
              <h2 className="text-sm font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                🛣️ Journey Timeline
              </h2>
              <div className="flex items-center gap-1.5 text-xs font-black text-slate-700 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-100">
                <Clock className="w-3.5 h-3.5 text-orange-500 animate-pulse" />
                <span>Live Time: {liveTimeStr}</span>
              </div>
            </div>

            {/* Timeline Tree */}
            <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-[2px] before:bg-slate-100">
              {timelineStops.map((stop: any) => {
                const stopCity = stop.restaurant?.address?.city || '';

                // Filter all restaurants serving this route located in the stop city
                const stopRestaurants = allRestaurants.filter((res: any) =>
                  res.routes?.some((r: any) => String(r._id || r) === String(routeId)) &&
                  res.address?.city?.toLowerCase() === stopCity.toLowerCase()
                );

                return (
                  <div key={stop._id} className="relative group">
                    
                    {/* Circle Indicator (Always green & pulsing because all stops are active/clickable) */}
                    <span className="absolute -left-[22px] top-1.5 w-3 h-3 rounded-full border-2 border-green-500 scale-110 bg-white z-10 transition-all shadow-[0_0_12px_rgba(34,197,94,0.4)]">
                      <span className="absolute inset-0 rounded-full bg-green-500 animate-ping opacity-75" />
                    </span>

                    {/* Content Block */}
                    <div className="p-4 rounded-2xl border border-slate-100 bg-white shadow-sm hover:border-orange-200 hover:shadow-md transition-all">
                      
                      {/* Stop Info Row */}
                      <div className="pb-3 border-b border-slate-50 flex items-center justify-between flex-wrap gap-2">
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-wider">
                              Stop #{stop.stopNumber}
                            </span>
                            <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-green-50 text-green-700 border border-green-100">
                              ● Active Stop
                            </span>
                          </div>
                          
                          <h4 className="text-xs font-black mt-1 text-slate-900">
                            {stopCity || 'Stop'} Station
                          </h4>
                        </div>

                        <div className="flex items-center gap-3 text-[10px] text-slate-500 font-bold flex-wrap">
                          <span className="flex items-center gap-0.5"><Clock className="w-3.5 h-3.5 text-slate-450" /> Arrive: {stop.stopTime}</span>
                          {stop.stopDuration && (
                            <span className="flex items-center gap-0.5"><Calendar className="w-3.5 h-3.5 text-slate-450" /> Stops: {stop.stopDuration}</span>
                          )}
                        </div>
                      </div>

                      {/* Restaurants List under this Stop Waypoint */}
                      <div className="mt-4 space-y-3">
                        {stopRestaurants.length > 0 ? (
                          stopRestaurants.map((rest: any) => (
                            <Link href={`/restaurants/${rest._id}?routeId=${routeId}&fromCity=${stopCity}&stopNumber=${stop.stopNumber}&stopTime=${stop.stopTime}&stopDuration=${stop.stopDuration}`}
                              key={rest._id}
                              className="bg-slate-50/50 border border-slate-100 rounded-2xl p-3 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 hover:bg-slate-50 hover:border-orange-200 transition-all hover:scale-[1.01] block">
                              <div className="flex items-center gap-3">
                                <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 flex-shrink-0">
                                  <img src={resolveImage(rest.coverImage) || undefined} alt={rest.name} className="w-full h-full object-cover" />
                                </div>
                                <div className="min-w-0 font-sans">
                                  <p className="text-xs font-black text-slate-900 truncate">{rest.name}</p>
                                  {rest.cuisines?.length > 0 && (
                                    <p className="text-[10px] text-slate-400 font-medium truncate mt-0.5">{rest.cuisines.join(' · ')}</p>
                                  )}
                                  <div className="flex items-center gap-2 mt-1">
                                    <span className="flex items-center gap-0.5 bg-green-50 px-1.5 py-0.5 rounded text-[9px] font-black text-green-700">
                                      ★ {rest.rating?.toFixed(1)}
                                    </span>
                                    <span className="text-[9px] text-slate-400 font-bold flex items-center gap-0.5">
                                      <Clock className="w-2.5 h-2.5" /> {rest.avgPrepTimeMinutes}m prep
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Ordering Button (Always clickable/active to support delayed buses) */}
                              <div className="flex items-center justify-end">
                                <span className="text-[10px] font-black text-white px-3.5 py-2 rounded-xl block shadow-sm text-center w-full sm:w-auto"
                                  style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                                  Order Food
                                </span>
                              </div>
                            </Link>
                          ))
                        ) : (
                          <div className="text-center py-4 bg-slate-50/50 border border-dashed border-slate-200 rounded-2xl">
                            <Store className="w-8 h-8 text-slate-300 mx-auto mb-1.5" />
                            <p className="text-[10px] font-bold text-slate-400">No restaurants serving this route at this stop</p>
                          </div>
                        )}
                      </div>

                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-150/50 shadow-xl font-sans">
            <Store className="w-12 h-12 text-slate-200 mx-auto mb-3" />
            <p className="font-black text-slate-400 text-sm">QR Code configuration has no stops registered</p>
          </div>
        )}

      </div>

      <BottomNav />
    </div>
  );
}

export default function QRLandingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-orange-500 animate-spin" />
      </div>
    }>
      <QRLandingContent />
    </Suspense>
  );
}
