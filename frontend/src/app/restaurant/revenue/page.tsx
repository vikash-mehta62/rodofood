'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { formatCurrency } from '@/lib/utils';
import { Loader2, Banknote, TrendingUp, Calendar, AlertCircle, ShoppingBag, Percent, Receipt } from 'lucide-react';

export default function RestaurantRevenuePage() {
  const [timeframe, setTimeframe] = useState<'today' | 'thisMonth' | 'allTime' | 'custom'>('thisMonth');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: earningsData, isLoading } = useQuery({
    queryKey: ['restaurant-detailed-earnings', timeframe, startDate, endDate],
    queryFn: async () => {
      let url = '/orders/restaurant/earnings';
      if (timeframe === 'custom') {
        if (!startDate || !endDate) return null; // Let the fallback handle empty custom state
        url += `?timeframe=custom&startDate=${startDate}&endDate=${endDate}`;
      }
      return (await api.get(url)).data.data;
    },
    enabled: timeframe !== 'custom' || !!(startDate && endDate),
  });

  if (isLoading) {
    return <div className="flex justify-center items-center min-h-[60vh]"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>;
  }

  const currentStats = earningsData?.[timeframe] || {
    total: 0, subtotal: 0, gstAmount: 0, platformFee: 0, discount: 0, count: 0
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-orange-600" />
            </div>
            My Revenue
          </h1>
          <p className="text-slate-500 font-medium mt-1">Detailed breakdown of your restaurant's earnings</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 rounded-xl p-1.5 overflow-x-auto w-full sm:w-auto">
            {(['today', 'thisMonth', 'allTime', 'custom'] as const).map(t => (
              <button key={t} onClick={() => setTimeframe(t)}
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all whitespace-nowrap flex-1 sm:flex-none ${timeframe === t ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {t === 'today' ? 'Today' : t === 'thisMonth' ? 'This Month' : t === 'allTime' ? 'All Time' : 'Custom Date'}
              </button>
            ))}
          </div>
          
          {timeframe === 'custom' && (
            <div className="flex items-center gap-2 w-full sm:w-auto mt-2 sm:mt-0">
              <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} 
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:border-orange-500 flex-1 sm:flex-none w-full sm:w-[140px]" />
              <span className="text-slate-400 font-bold">to</span>
              <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 text-sm font-medium text-slate-700 focus:outline-none focus:border-orange-500 flex-1 sm:flex-none w-full sm:w-[140px]" />
            </div>
          )}
        </div>
      </div>

      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Net Earnings */}
        <div className="lg:col-span-2 bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-slate-900/20">
          <div className="absolute -right-4 -top-4 w-32 h-32 bg-white/5 rounded-full blur-2xl" />
          <TrendingUp className="w-6 h-6 text-emerald-400 mb-4" />
          <p className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-1">Gross Total Amount</p>
          <p className="text-4xl font-black">{formatCurrency(currentStats.total)}</p>
          <p className="text-xs text-slate-400 mt-2 font-medium flex items-center gap-1">
            <ShoppingBag className="w-3.5 h-3.5" /> Total Orders: <span className="text-white font-bold">{currentStats.count}</span>
          </p>
        </div>

        {/* Subtotal (Food) */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-orange-200 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Receipt className="w-5 h-5 text-orange-500" />
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">Food Total (Subtotal)</p>
          <p className="text-2xl font-black text-slate-900">{formatCurrency(currentStats.subtotal)}</p>
          <p className="text-[10px] text-slate-400 mt-2 font-medium leading-tight">Total value of food items ordered</p>
        </div>

        {/* Platform Fees */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <Banknote className="w-5 h-5 text-emerald-500" />
          </div>
          <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-1">Platform Fees</p>
          <p className="text-2xl font-black text-emerald-600">{formatCurrency(currentStats.platformFee)}</p>
          <p className="text-[10px] text-slate-400 mt-2 font-medium leading-tight">Fees deducted by the platform</p>
        </div>

      </div>

      {/* Secondary Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* GST */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center flex-shrink-0">
            <Percent className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-0.5">GST Collected</p>
            <p className="text-xl font-black text-slate-900">{formatCurrency(currentStats.gstAmount)}</p>
          </div>
        </div>

        {/* Discounts */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-red-50 flex items-center justify-center flex-shrink-0">
            <TrendingUp className="w-5 h-5 text-red-500 rotate-180" />
          </div>
          <div>
            <p className="text-slate-400 font-bold text-xs uppercase tracking-wider mb-0.5">Discounts Given</p>
            <p className="text-xl font-black text-red-500">{formatCurrency(currentStats.discount)}</p>
          </div>
        </div>

      </div>

      {/* Breakdown Info Card */}
      <div className="bg-slate-50 border border-slate-100 rounded-3xl p-6 sm:p-8 text-center mt-6">
        <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
        <h3 className="text-lg font-black text-slate-900 mb-2">How is this calculated?</h3>
        <p className="text-sm text-slate-500 font-medium max-w-2xl mx-auto">
          Your Gross Total Amount is calculated as: <br className="sm:hidden" />
          <span className="font-bold text-slate-700 bg-slate-200/50 px-2 py-0.5 rounded-md mx-1">Food Subtotal</span> + 
          <span className="font-bold text-slate-700 bg-slate-200/50 px-2 py-0.5 rounded-md mx-1">GST</span> + 
          <span className="font-bold text-emerald-700 bg-emerald-100/50 px-2 py-0.5 rounded-md mx-1">Platform Fee</span> - 
          <span className="font-bold text-red-700 bg-red-100/50 px-2 py-0.5 rounded-md mx-1">Discounts</span>
        </p>
      </div>

    </div>
  );
}
