'use client';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/axios';
import { formatCurrency } from '@/lib/utils';
import { Loader2, Banknote, Store, TrendingUp, Calendar, AlertCircle } from 'lucide-react';

export default function AdminRevenuePage() {
  const [timeframe, setTimeframe] = useState<'day' | 'week' | 'month' | 'custom'>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { data: revenueData, isLoading } = useQuery({
    queryKey: ['admin-revenue', timeframe, startDate, endDate],
    queryFn: async () => {
      let url = `/admin/analytics/restaurant-revenue?timeframe=${timeframe}`;
      if (timeframe === 'custom') {
        if (!startDate || !endDate) return [];
        url += `&startDate=${startDate}&endDate=${endDate}`;
      }
      return (await api.get(url)).data.data.revenueByRestaurant;
    },
    enabled: timeframe !== 'custom' || !!(startDate && endDate),
  });

  const totalPlatformRevenue = revenueData?.reduce((acc: number, curr: any) => acc + (curr.platformFee || 0), 0) || 0;
  const totalGrossRevenue = revenueData?.reduce((acc: number, curr: any) => acc + (curr.revenue || 0), 0) || 0;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-100 flex items-center justify-center">
              <Banknote className="w-5 h-5 text-orange-600" />
            </div>
            Revenue Analytics
          </h1>
          <p className="text-slate-500 font-medium mt-1">Detailed financial breakdown across all restaurants</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex bg-slate-100 rounded-xl p-1.5 overflow-x-auto w-full sm:w-auto">
            {(['day', 'week', 'month', 'custom'] as const).map(t => (
              <button key={t} onClick={() => setTimeframe(t)}
                className={`px-4 py-2 rounded-lg text-sm font-bold capitalize transition-all whitespace-nowrap flex-1 sm:flex-none ${timeframe === t ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>
                {t === 'day' ? 'Today' : t === 'week' ? 'This Week' : t === 'month' ? 'This Month' : 'Custom Date'}
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

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-slate-900/20">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/5 rounded-full blur-2xl" />
          <TrendingUp className="w-6 h-6 text-emerald-400 mb-4" />
          <p className="text-slate-400 font-bold text-sm uppercase tracking-wider mb-1">Total Gross Revenue</p>
          <p className="text-3xl font-black">{formatCurrency(totalGrossRevenue)}</p>
          <p className="text-xs text-slate-500 mt-2 font-medium flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Selected timeframe</p>
        </div>
        <div className="bg-gradient-to-br from-orange-500 to-amber-500 rounded-3xl p-6 text-white relative overflow-hidden shadow-lg shadow-orange-500/20">
          <div className="absolute -right-4 -top-4 w-24 h-24 bg-white/20 rounded-full blur-2xl" />
          <Banknote className="w-6 h-6 text-white/90 mb-4" />
          <p className="text-orange-100 font-bold text-sm uppercase tracking-wider mb-1">Platform Fees Collected</p>
          <p className="text-3xl font-black">{formatCurrency(totalPlatformRevenue)}</p>
          <p className="text-xs text-orange-200 mt-2 font-medium flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> Selected timeframe</p>
        </div>
      </div>

      {/* Detailed Table */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
        <div className="px-6 py-5 border-b border-slate-100 flex items-center justify-between">
          <h2 className="font-black text-slate-900 text-lg">Restaurant Breakdown</h2>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-orange-500" /></div>
        ) : revenueData?.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead>
                <tr className="bg-slate-50/50">
                  <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100">Restaurant</th>
                  <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100 text-right">Orders</th>
                  <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100 text-right">Subtotal</th>
                  <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100 text-right">GST</th>
                  <th className="px-6 py-4 font-bold text-xs text-slate-500 uppercase tracking-wider border-b border-slate-100 text-right">Discounts</th>
                  <th className="px-6 py-4 font-bold text-xs text-emerald-600 uppercase tracking-wider border-b border-slate-100 text-right bg-emerald-50/30">Platform Fee</th>
                  <th className="px-6 py-4 font-black text-xs text-slate-900 uppercase tracking-wider border-b border-slate-100 text-right">Gross Total</th>
                </tr>
              </thead>
              <tbody>
                {revenueData.map((res: any) => (
                  <tr key={res._id} className="hover:bg-slate-50/50 transition-colors group border-b border-slate-50 last:border-0">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center flex-shrink-0">
                          <Store className="w-4 h-4 text-slate-400" />
                        </div>
                        <p className="font-bold text-slate-900 text-sm group-hover:text-orange-600 transition-colors">{res.restaurantName}</p>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="inline-flex items-center justify-center bg-slate-100 text-slate-600 font-bold text-xs px-2.5 py-1 rounded-md">
                        {res.orders}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right font-medium text-slate-600 text-sm">{formatCurrency(res.subtotal || 0)}</td>
                    <td className="px-6 py-4 text-right font-medium text-slate-500 text-sm">{formatCurrency(res.gstAmount || 0)}</td>
                    <td className="px-6 py-4 text-right font-medium text-red-500 text-sm">{(res.discount || 0) > 0 ? `-${formatCurrency(res.discount)}` : '-'}</td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600 text-sm bg-emerald-50/10">{formatCurrency(res.platformFee || 0)}</td>
                    <td className="px-6 py-4 text-right font-black text-slate-900 text-sm">{formatCurrency(res.revenue || 0)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="w-8 h-8 text-slate-300" />
            </div>
            <p className="font-bold text-slate-900 text-lg">No Revenue Found</p>
            <p className="text-slate-500 text-sm mt-1">There are no completed orders for the selected timeframe.</p>
          </div>
        )}
      </div>

    </div>
  );
}
