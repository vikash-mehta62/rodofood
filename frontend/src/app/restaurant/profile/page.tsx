'use client';
import { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Camera, MapPin, Phone, Mail, Clock, Loader2, Save, Navigation } from 'lucide-react';
import api from '@/lib/axios';
import { BASE_URL } from '@/lib/config';
const CUISINES_LIST = ['North Indian','South Indian','Chinese','Fast Food','Snacks','Beverages','Sweets','Biryani','Thali','Continental'];

interface RForm {
  name: string; description: string; phone: string; email: string;
  'address.street': string; 'address.city': string; 'address.state': string; 'address.pincode': string;
  latitude: string; longitude: string;
  foodType: 'veg'|'non-veg'|'both';
  cuisines: string[];
  routes: string[];
  avgPrepTimeMinutes: string;
  'openingHours.open': string; 'openingHours.close': string;
  coverFile: File|null; coverPreview: string;
  allowPayAtStore: boolean;
  requireBookingAmountForPayAtStore: boolean;
}

export default function RestaurantProfilePage() {
  const qc = useQueryClient();
  const coverRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<RForm>({
    name:'', description:'', phone:'', email:'',
    'address.street':'', 'address.city':'', 'address.state':'', 'address.pincode':'',
    latitude:'', longitude:'',
    foodType:'both', cuisines:[],
    routes: [],
    avgPrepTimeMinutes:'20',
    'openingHours.open':'08:00', 'openingHours.close':'22:00',
    coverFile:null, coverPreview:'',
    allowPayAtStore: true,
    requireBookingAmountForPayAtStore: false,
  });
  const [saved, setSaved] = useState(false);

  const { data: restaurant, isLoading } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn: async () => (await api.get('/restaurants/owner/me')).data.data.restaurant,
  });

  const { data: routesResponse } = useQuery({
    queryKey: ['routes'],
    queryFn: async () => (await api.get('/routes')).data,
  });
  const routes = routesResponse?.data?.routes || [];

  useEffect(() => {
    if (!restaurant) return;
    setForm(f => ({
      ...f,
      name: restaurant.name || '',
      description: restaurant.description || '',
      phone: restaurant.phone || '',
      email: restaurant.email || '',
      'address.street': restaurant.address?.street || '',
      'address.city': restaurant.address?.city || '',
      'address.state': restaurant.address?.state || '',
      'address.pincode': restaurant.address?.pincode || '',
      latitude: restaurant.location?.coordinates?.[1]?.toString() || '',
      longitude: restaurant.location?.coordinates?.[0]?.toString() || '',
      foodType: restaurant.foodType || 'both',
      cuisines: restaurant.cuisines || [],
      routes: restaurant.routes ? restaurant.routes.map((r: any) => typeof r === 'object' && r ? r._id : r) : [],
      avgPrepTimeMinutes: String(restaurant.avgPrepTimeMinutes || 20),
      'openingHours.open': restaurant.openingHours?.open || '08:00',
      'openingHours.close': restaurant.openingHours?.close || '22:00',
      coverPreview: restaurant.coverImage ? (restaurant.coverImage.startsWith('http') ? restaurant.coverImage : `${BASE_URL}${restaurant.coverImage}`) : '',
      allowPayAtStore: restaurant.allowPayAtStore ?? true,
      requireBookingAmountForPayAtStore: restaurant.requireBookingAmountForPayAtStore ?? false,
    }));
  }, [restaurant]);

  const saveMut = useMutation({
    mutationFn: (fd: FormData) => api.put('/restaurants/owner/me', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-restaurant'] }); setSaved(true); setTimeout(() => setSaved(false), 3000); },
  });

  const handleSave = () => {
    const fd = new FormData();
    Object.entries(form).forEach(([k, v]) => {
      if (k === 'coverFile' || k === 'coverPreview') return;
      if (k === 'cuisines') (v as string[]).forEach(c => fd.append('cuisines[]', c));
      else if (k === 'routes') (v as string[]).forEach(r => fd.append('routes[]', r));
      else fd.append(k, String(v));
    });
    if (form.coverFile) fd.append('coverImage', form.coverFile);
    saveMut.mutate(fd);
  };

  const handleGetLocation = () => {
    navigator.geolocation?.getCurrentPosition(pos => {
      setForm(f => ({ ...f, latitude: String(pos.coords.latitude), longitude: String(pos.coords.longitude) }));
    });
  };

  const toggleCuisine = (c: string) =>
    setForm(f => ({ ...f, cuisines: f.cuisines.includes(c) ? f.cuisines.filter(x => x !== c) : [...f.cuisines, c] }));

  const toggleRoute = (routeId: string) =>
    setForm(f => ({
      ...f,
      routes: f.routes.includes(routeId)
        ? f.routes.filter(id => id !== routeId)
        : [...f.routes, routeId]
    }));

  const set = (k: keyof RForm, v: string) => setForm(f => ({ ...f, [k]: v }));

  if (isLoading) return <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>;

  return (
    <div className="p-4 sm:p-6 min-h-screen" style={{ background: '#F1F5F9' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Restaurant Profile</h1>
          <p className="text-slate-400 text-sm font-medium mt-0.5">Update your restaurant details</p>
        </div>
        {saved && <span className="text-green-600 text-sm font-black bg-green-50 border border-green-200 px-3 py-1.5 rounded-xl">✓ Saved!</span>}
      </div>

      <div className="space-y-5 max-w-2xl">

        {/* Cover Photo */}
        <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden shadow-sm">
          <div className="relative h-44 cursor-pointer group" onClick={() => coverRef.current?.click()}
            style={{ background: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)' }}>
            {form.coverPreview
              ? <img src={form.coverPreview} alt="cover" className="w-full h-full object-cover" />
              : <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-slate-400">
                  <Camera className="w-8 h-8" />
                  <p className="text-sm font-black">Upload Cover Photo</p>
                </div>
            }
            <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
              <div className="bg-white/90 rounded-xl px-4 py-2 flex items-center gap-2">
                <Camera className="w-4 h-4 text-slate-700" />
                <span className="text-sm font-black text-slate-700">Change Photo</span>
              </div>
            </div>
          </div>
          <input ref={coverRef} type="file" accept="image/*" className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) setForm(p => ({ ...p, coverFile: f, coverPreview: URL.createObjectURL(f) })); }} />
        </div>

        {/* Basic Info */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <h2 className="font-black text-slate-900 text-sm uppercase tracking-wider">Basic Information</h2>
          <Field label="Restaurant Name *" value={form.name} onChange={v => set('name', v)} placeholder="e.g. Sehore Highway Treat" />
          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              placeholder="Tell customers about your restaurant, specialities, history..."
              rows={3} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 transition-colors resize-none" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Phone *" value={form.phone} onChange={v => set('phone', v)} placeholder="9876543210" type="tel" icon={<Phone className="w-4 h-4 text-slate-400" />} />
            <Field label="Email" value={form.email} onChange={v => set('email', v)} placeholder="restaurant@email.com" type="email" icon={<Mail className="w-4 h-4 text-slate-400" />} />
          </div>
        </div>

        {/* Food Type */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h2 className="font-black text-slate-900 text-sm uppercase tracking-wider mb-4">Food Type</h2>
          <div className="grid grid-cols-3 gap-2">
            {([['veg','🟢 Pure Veg','border-green-500 text-green-700 bg-green-50'],['non-veg','🔴 Non-Veg','border-red-500 text-red-600 bg-red-50'],['both','🟡 Both','border-yellow-500 text-yellow-700 bg-yellow-50']] as [string,string,string][]).map(([k,l,cls]) => (
              <button key={k} type="button" onClick={() => set('foodType', k as 'veg'|'non-veg'|'both')}
                className={`py-3 rounded-xl border-2 text-xs font-black transition-all ${form.foodType === k ? cls : 'border-slate-200 text-slate-400 bg-white'}`}>
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Cuisines */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h2 className="font-black text-slate-900 text-sm uppercase tracking-wider mb-4">Cuisines</h2>
          <div className="flex flex-wrap gap-2">
            {CUISINES_LIST.map(c => (
              <button key={c} type="button" onClick={() => toggleCuisine(c)}
                className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-all ${form.cuisines.includes(c) ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-slate-200 text-slate-400 bg-white'}`}>
                {c}
              </button>
            ))}
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <h2 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
            <MapPin className="w-4 h-4 text-orange-500" /> Address
          </h2>
          <Field label="Street / Landmark" value={form['address.street']} onChange={v => set('address.street', v)} placeholder="NH-46, Near Toll Plaza" />
          <div className="grid grid-cols-2 gap-3">
            <Field label="City *" value={form['address.city']} onChange={v => set('address.city', v)} placeholder="Sehore" />
            <Field label="State" value={form['address.state']} onChange={v => set('address.state', v)} placeholder="Madhya Pradesh" />
          </div>
          <Field label="Pincode" value={form['address.pincode']} onChange={v => set('address.pincode', v)} placeholder="466001" />

          {/* GPS Coordinates */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">GPS Coordinates (for route sorting)</label>
              <button type="button" onClick={handleGetLocation}
                className="flex items-center gap-1 text-xs font-black text-orange-500 hover:text-orange-600">
                <Navigation className="w-3.5 h-3.5" /> Auto-detect
              </button>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Latitude" value={form.latitude} onChange={v => set('latitude', v)} placeholder="23.2156" type="number" />
              <Field label="Longitude" value={form.longitude} onChange={v => set('longitude', v)} placeholder="77.4304" type="number" />
            </div>
            {form.latitude && form.longitude && (
              <a href={`https://maps.google.com/?q=${form.latitude},${form.longitude}`} target="_blank" rel="noreferrer"
                className="mt-2 text-xs text-blue-500 font-bold flex items-center gap-1 hover:underline">
                <MapPin className="w-3 h-3" /> Verify on Google Maps
              </a>
            )}
          </div>
        </div>

        {/* Routes */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm">
          <h2 className="font-black text-slate-900 text-sm uppercase tracking-wider mb-2">Routes *</h2>
          <p className="text-xs text-slate-400 font-medium mb-4">Select one or more routes along which your restaurant is located.</p>
          <div className="grid sm:grid-cols-2 gap-2">
            {routes.map((route: any) => {
              const active = form.routes.includes(route._id);
              return (
                <button key={route._id} type="button" onClick={() => toggleRoute(route._id)}
                  className={`text-left px-3 py-2.5 rounded-xl border-2 transition-all ${active ? 'border-orange-400 bg-orange-50 text-orange-700' : 'border-slate-200 bg-white text-slate-500'}`}>
                  <p className="text-xs font-black">{route.name}</p>
                  <p className="text-[10px] font-medium opacity-70 mt-0.5">{route.fromCity} to {route.toCity}</p>
                </button>
              );
            })}
          </div>
        </div>

        {/* Operations */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <h2 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
            <Clock className="w-4 h-4 text-orange-500" /> Operations
          </h2>
          <Field label="Avg Preparation Time (minutes)" value={form.avgPrepTimeMinutes} onChange={v => set('avgPrepTimeMinutes', v)} placeholder="20" type="number" />
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Opening Time</label>
              <input type="time" value={form['openingHours.open']} onChange={e => set('openingHours.open', e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 transition-colors" />
            </div>
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Closing Time</label>
              <input type="time" value={form['openingHours.close']} onChange={e => set('openingHours.close', e.target.value)}
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 transition-colors" />
            </div>
          </div>
        </div>

        {/* Payment Settings */}
        <div className="bg-white rounded-2xl border border-slate-100 p-5 shadow-sm space-y-4">
          <h2 className="font-black text-slate-900 text-sm uppercase tracking-wider flex items-center gap-2">
            💳 Payment Settings
          </h2>
          
          <div className="flex items-center justify-between p-3 border-2 border-slate-100 rounded-xl">
            <div>
              <p className="font-bold text-sm text-slate-800">Allow "Pay at Store"</p>
              <p className="text-xs text-slate-400 font-medium">Customers can place orders without paying online</p>
            </div>
            <button type="button" onClick={() => setForm(f => ({ ...f, allowPayAtStore: !f.allowPayAtStore }))}
              className={`w-12 h-6 rounded-full transition-colors relative ${form.allowPayAtStore ? 'bg-green-500' : 'bg-slate-200'}`}>
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${form.allowPayAtStore ? 'left-6' : 'left-0.5'}`} />
            </button>
          </div>

          {form.allowPayAtStore && (
            <div className="flex items-center justify-between p-3 border-2 border-slate-100 rounded-xl bg-orange-50/50">
              <div>
                <p className="font-bold text-sm text-slate-800">Require 30% Booking Amount</p>
                <p className="text-xs text-slate-400 font-medium">Customers must pay 30% online when choosing "Pay at Store"</p>
              </div>
              <button type="button" onClick={() => setForm(f => ({ ...f, requireBookingAmountForPayAtStore: !f.requireBookingAmountForPayAtStore }))}
                className={`w-12 h-6 rounded-full transition-colors relative ${form.requireBookingAmountForPayAtStore ? 'bg-orange-500' : 'bg-slate-200'}`}>
                <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 transition-all ${form.requireBookingAmountForPayAtStore ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
          )}
        </div>

        {/* Save */}
        <button onClick={handleSave} disabled={saveMut.isPending || !form.name || !form.phone || form.routes.length === 0}
          className="w-full py-4 rounded-2xl text-white font-black text-base flex items-center justify-center gap-2 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 shadow-lg"
          style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
          {saveMut.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Profile</>}
        </button>
      </div>
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type = 'text', icon }: {
  label: string; value: string; onChange: (v: string) => void;
  placeholder?: string; type?: string; icon?: React.ReactNode;
}) {
  return (
    <div>
      <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">{label}</label>
      <div className="relative">
        {icon && <div className="absolute left-3 top-1/2 -translate-y-1/2">{icon}</div>}
        <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
          className={`w-full ${icon ? 'pl-9' : 'px-4'} pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 transition-colors`} />
      </div>
    </div>
  );
}
