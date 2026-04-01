'use client';
import { useState } from 'react';
import { Plus, MapPin, Loader2, Trash2, X, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Route } from '@/types';

interface WP { name: string; lat: string; lng: string; }
interface RForm { name: string; fromCity: string; toCity: string; totalDistanceKm: string; waypoints: WP[]; }
const DEF: RForm = { name:'', fromCity:'', toCity:'', totalDistanceKm:'', waypoints:[{name:'',lat:'',lng:''},{name:'',lat:'',lng:''}] };

function Field({ label, value, onChange, placeholder, type='text' }: { label:string; value:string; onChange:(v:string)=>void; placeholder?:string; type?:string; }) {
  return (
    <div>
      <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 transition-colors" />
    </div>
  );
}

export default function AdminRoutesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RForm>(DEF);

  const { data: routes, isLoading } = useQuery({
    queryKey: ['admin-routes'],
    queryFn: async () => (await api.get('/routes')).data.data.routes as Route[],
  });

  const createMut = useMutation({
    mutationFn: (body: object) => api.post('/routes', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-routes'] }); setShowForm(false); setForm(DEF); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/routes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-routes'] }),
  });

  const setWp = (i: number, k: keyof WP, v: string) =>
    setForm(f => ({ ...f, waypoints: f.waypoints.map((w, idx) => idx === i ? { ...w, [k]: v } : w) }));

  const handleCreate = () => {
    createMut.mutate({
      name: form.name, fromCity: form.fromCity, toCity: form.toCity,
      totalDistanceKm: form.totalDistanceKm ? Number(form.totalDistanceKm) : undefined,
      waypoints: form.waypoints.filter(w => w.name).map((w, i) => ({
        name: w.name, order: i,
        coordinates: w.lat && w.lng ? { lat: Number(w.lat), lng: Number(w.lng) } : undefined,
      })),
    });
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen" style={{ background: '#F1F5F9' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Routes</h1>
          <p className="text-slate-400 text-sm font-medium mt-0.5">{routes?.length || 0} highway routes</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-white font-black px-5 py-2.5 rounded-2xl text-sm shadow-lg hover:scale-105 active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
          <Plus className="w-4 h-4" /> Add Route
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : (
        <div className="space-y-4">
          {routes?.map(route => (
            <div key={route._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)' }}>
                <MapPin className="w-6 h-6 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 text-base">{route.name}</p>
                <p className="text-sm text-slate-500 font-medium mt-0.5">
                  {route.fromCity} → {route.toCity}
                  {route.totalDistanceKm && <span className="text-orange-500 font-bold ml-2">{route.totalDistanceKm} km</span>}
                </p>
                {route.waypoints?.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 overflow-x-auto scrollbar-hide">
                    {route.waypoints.map((wp, i) => (
                      <div key={i} className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{wp.name}</span>
                        {i < route.waypoints.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => deleteMut.mutate(route._id)} disabled={deleteMut.isPending}
                className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors flex-shrink-0">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
          {!routes?.length && (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <MapPin className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="font-black text-slate-400">No routes yet</p>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <h2 className="font-black text-slate-900 text-lg">Add New Route</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <Field label="Route Name *" value={form.name} onChange={v => setForm(f=>({...f,name:v}))} placeholder="e.g. Bhopal - Indore Highway" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="From City *" value={form.fromCity} onChange={v => setForm(f=>({...f,fromCity:v}))} placeholder="Bhopal" />
                <Field label="To City *" value={form.toCity} onChange={v => setForm(f=>({...f,toCity:v}))} placeholder="Indore" />
              </div>
              <Field label="Total Distance (km)" value={form.totalDistanceKm} onChange={v => setForm(f=>({...f,totalDistanceKm:v}))} placeholder="195" type="number" />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Waypoints (in order)</label>
                  <button type="button" onClick={() => setForm(f=>({...f,waypoints:[...f.waypoints,{name:'',lat:'',lng:''}]}))}
                    className="text-xs font-black text-orange-500 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Stop
                  </button>
                </div>
                <div className="space-y-2">
                  {form.waypoints.map((wp, i) => (
                    <div key={i} className="flex gap-2 items-center">
                      <span className="text-[10px] font-black text-slate-400 w-5 flex-shrink-0">{i+1}.</span>
                      <input value={wp.name} onChange={e=>setWp(i,'name',e.target.value)}
                        placeholder={i===0?'Start city':i===form.waypoints.length-1?'End city':'Stop name'}
                        className="flex-1 px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400" />
                      <input value={wp.lat} onChange={e=>setWp(i,'lat',e.target.value)} placeholder="Lat" type="number"
                        className="w-20 px-2 py-2 border-2 border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-orange-400" />
                      <input value={wp.lng} onChange={e=>setWp(i,'lng',e.target.value)} placeholder="Lng" type="number"
                        className="w-20 px-2 py-2 border-2 border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-orange-400" />
                      {form.waypoints.length > 2 && (
                        <button onClick={() => setForm(f=>({...f,waypoints:f.waypoints.filter((_,idx)=>idx!==i)}))} className="text-red-400">
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-black text-sm">Cancel</button>
              <button onClick={handleCreate} disabled={createMut.isPending || !form.name || !form.fromCity || !form.toCity}
                className="flex-1 py-3 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Route'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
