'use client';
import { useEffect, useState } from 'react';
import {
  Search, ToggleLeft, ToggleRight, Loader2, MapPin, Star,
  Phone, CheckCircle, XCircle, Store, X, Mail, Clock,
  Utensils, ChevronRight, Eye, Users, ShoppingBag, Plus, Save,
  Trash2
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { resolveImage } from '@/lib/config';

const FOOD_CFG = {
  veg:     { label: 'Pure Veg',      cls: 'bg-green-50 text-green-700 border-green-200' },
  'non-veg': { label: 'Non-Veg',    cls: 'bg-red-50 text-red-600 border-red-200' },
  both:    { label: 'Veg & Non-Veg', cls: 'bg-yellow-50 text-yellow-700 border-yellow-200' },
};

type RestaurantForm = {
  ownerName: string;
  ownerPhone: string;
  name: string;
  phone: string;
  email: string;
  description: string;
  addressStreet: string;
  addressCity: string;
  addressState: string;
  addressPincode: string;
  latitude: string;
  longitude: string;
  foodType: 'veg' | 'non-veg' | 'both';
  avgPrepTimeMinutes: string;
  routes: string[];
};

const emptyRestaurantForm = (): RestaurantForm => ({
  ownerName: '',
  ownerPhone: '',
  name: '',
  phone: '',
  email: '',
  description: '',
  addressStreet: '',
  addressCity: '',
  addressState: '',
  addressPincode: '',
  latitude: '',
  longitude: '',
  foodType: 'both',
  avgPrepTimeMinutes: '20',
  routes: [],
});

function AddRestaurantModal({
  routes,
  onClose,
  onSubmit,
  isPending,
}: {
  routes: any[];
  onClose: () => void;
  onSubmit: (payload: any) => void;
  isPending: boolean;
}) {
  const [form, setForm] = useState<RestaurantForm>(emptyRestaurantForm);

  useEffect(() => {
    if (routes.length && form.routes.length === 0) {
      setForm((current) => ({ ...current, routes: [routes[0]._id] }));
    }
  }, [routes, form.routes.length]);

  const set = (key: keyof RestaurantForm, value: string) =>
    setForm((current) => ({ ...current, [key]: value }));

  const toggleRoute = (routeId: string) =>
    setForm((current) => ({
      ...current,
      routes: current.routes.includes(routeId)
        ? current.routes.filter((id) => id !== routeId)
        : [...current.routes, routeId],
    }));

  const canSubmit =
    form.ownerPhone.length === 10 &&
    form.name.trim() &&
    form.phone.length === 10 &&
    form.addressCity.trim() &&
    form.latitude &&
    form.longitude &&
    form.routes.length > 0;

  const submit = () => {
    if (!canSubmit) return;
    onSubmit({
      ownerName: form.ownerName,
      ownerPhone: form.ownerPhone,
      name: form.name,
      phone: form.phone,
      email: form.email || undefined,
      description: form.description || undefined,
      address: {
        street: form.addressStreet,
        city: form.addressCity,
        state: form.addressState,
        pincode: form.addressPincode,
      },
      location: {
        type: 'Point',
        coordinates: [Number(form.longitude), Number(form.latitude)],
      },
      foodType: form.foodType,
      avgPrepTimeMinutes: Number(form.avgPrepTimeMinutes || 20),
      routes: form.routes,
      isOpen: true,
      isActive: true,
      isVerified: true,
      portalEnabled: true,
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden" style={{ maxHeight: '92vh' }}>
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Add Restaurant</h2>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Assign one or more routes while creating it.</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5" style={{ maxHeight: 'calc(92vh - 132px)' }}>
          <div className="grid sm:grid-cols-2 gap-3">
            <AdminField label="Owner Name" value={form.ownerName} onChange={v => set('ownerName', v)} placeholder="Owner name" />
            <AdminField label="Owner Phone *" value={form.ownerPhone} onChange={v => set('ownerPhone', v.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" />
            <AdminField label="Restaurant Name *" value={form.name} onChange={v => set('name', v)} placeholder="Restaurant name" />
            <AdminField label="Restaurant Phone *" value={form.phone} onChange={v => set('phone', v.replace(/\D/g, '').slice(0, 10))} placeholder="9876543210" />
            <AdminField label="Email" value={form.email} onChange={v => set('email', v)} placeholder="restaurant@email.com" />
            <AdminField label="Prep Time" value={form.avgPrepTimeMinutes} onChange={v => set('avgPrepTimeMinutes', v)} placeholder="20" type="number" />
          </div>

          <div>
            <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Description</label>
            <textarea value={form.description} onChange={e => set('description', e.target.value)}
              rows={3} placeholder="Short description"
              className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 transition-colors resize-none" />
          </div>

          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Food Type</p>
            <div className="grid grid-cols-3 gap-2">
              {(['veg', 'non-veg', 'both'] as const).map(type => (
                <button key={type} type="button" onClick={() => set('foodType', type)}
                  className={`py-2.5 rounded-xl border-2 text-xs font-black transition-all ${form.foodType === type ? FOOD_CFG[type].cls : 'border-slate-200 text-slate-400 bg-white'}`}>
                  {FOOD_CFG[type].label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-3">
            <AdminField label="Street" value={form.addressStreet} onChange={v => set('addressStreet', v)} placeholder="NH-46, landmark" />
            <AdminField label="City *" value={form.addressCity} onChange={v => set('addressCity', v)} placeholder="Sehore" />
            <AdminField label="State" value={form.addressState} onChange={v => set('addressState', v)} placeholder="Madhya Pradesh" />
            <AdminField label="Pincode" value={form.addressPincode} onChange={v => set('addressPincode', v)} placeholder="466001" />
            <AdminField label="Latitude *" value={form.latitude} onChange={v => set('latitude', v)} placeholder="23.2000" type="number" />
            <AdminField label="Longitude *" value={form.longitude} onChange={v => set('longitude', v)} placeholder="77.0833" type="number" />
          </div>

          <div>
            <p className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2">Routes *</p>
            <div className="grid sm:grid-cols-2 gap-2">
              {routes.map(route => {
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
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2">
          <button onClick={onClose} className="px-4 py-2.5 rounded-xl text-xs font-black border border-slate-200 text-slate-500">Cancel</button>
          <button onClick={submit} disabled={!canSubmit || isPending}
            className="px-4 py-2.5 rounded-xl text-xs font-black text-white flex items-center gap-1.5 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Restaurant
          </button>
        </div>
      </div>
    </div>
  );
}

function AdminField({ label, value, onChange, placeholder, type = 'text' }: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 transition-colors" />
    </div>
  );
}

function RestaurantDetailModal({ restaurant, onClose, onToggleActive, onToggleVerify, onTogglePortal }: {
  restaurant: any;
  onClose: () => void;
  onToggleActive: () => void;
  onToggleVerify: () => void;
  onTogglePortal: () => void;
}) {
  const imgSrc = resolveImage(restaurant.coverImage);

  const ft = FOOD_CFG[restaurant.foodType as keyof typeof FOOD_CFG] || FOOD_CFG.both;

  const { data: menuData } = useQuery({
    queryKey: ['admin-menu', restaurant._id],
    queryFn: async () => (await api.get(`/menu/${restaurant._id}`)).data.data.menu,
  });

  const allItems = menuData ? Object.values(menuData).flat() as any[] : [];

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden" style={{ maxHeight: '90vh' }}>

        {/* Close button — fixed over modal */}
        <div className="relative">
          <button onClick={onClose}
            className="absolute top-3 right-3 z-10 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center shadow-md hover:bg-white transition-colors">
            <X className="w-4 h-4 text-slate-700" />
          </button>
        </div>

        {/* ALL content scrollable — cover photo scrolls too */}
        <div className="overflow-y-auto" style={{ maxHeight: '90vh' }}>

          {/* Cover image — scrolls with content */}
          <div className="relative h-44" style={{ background: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)' }}>
            {imgSrc
              ? <img src={imgSrc} alt={restaurant.name} className="w-full h-full object-cover" />
              : <div className="w-full h-full flex items-center justify-center text-5xl opacity-20">🍽️</div>
            }
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
            <div className="absolute bottom-3 left-4 right-4">
              <h2 className="text-base font-black text-white leading-tight">{restaurant.name}</h2>
              {restaurant.cuisines?.length > 0 && (
                <p className="text-white/70 text-[11px] font-medium mt-0.5">{restaurant.cuisines.join(' · ')}</p>
              )}
            </div>
          </div>

          {/* Status bar */}
          <div className="px-5 py-3 bg-slate-50 border-b border-slate-100 flex items-center gap-2 flex-wrap">
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${restaurant.isOpen ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
              {restaurant.isOpen ? '● Open' : '● Closed'}
            </span>
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${ft.cls}`}>
              {restaurant.foodType === 'veg' ? '🟢' : restaurant.foodType === 'non-veg' ? '🔴' : '🟡'} {ft.label}
            </span>
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${restaurant.isVerified ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
              {restaurant.isVerified ? '✓ Verified' : '⏳ Pending Verification'}
            </span>
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${restaurant.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
              {restaurant.isActive ? 'Active' : 'Inactive'}
            </span>
            <span className={`text-[10px] font-black px-2.5 py-1 rounded-full border ${restaurant.portalEnabled !== false ? 'bg-violet-50 text-violet-700 border-violet-200' : 'bg-gray-100 text-gray-500 border-gray-200'}`}>
              {restaurant.portalEnabled !== false ? '🔓 Portal On' : '🔒 Portal Off'}
            </span>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-4 divide-x divide-slate-100 border-b border-slate-100">
            {[
              { icon: Star, val: restaurant.rating?.toFixed(1) || '0.0', label: 'Rating', color: 'text-amber-500' },
              { icon: Users, val: restaurant.totalRatings || 0, label: 'Reviews', color: 'text-blue-500' },
              { icon: Clock, val: `${restaurant.avgPrepTimeMinutes || 20}m`, label: 'Prep Time', color: 'text-orange-500' },
              { icon: ShoppingBag, val: restaurant.totalOrders || 0, label: 'Orders', color: 'text-purple-500' },
            ].map(({ icon: Icon, val, label, color }) => (
              <div key={label} className="py-2.5 text-center">
                <Icon className={`w-3.5 h-3.5 ${color} mx-auto mb-0.5`} />
                <p className={`font-black text-xs ${color}`}>{val}</p>
                <p className="text-[9px] text-slate-400 font-medium">{label}</p>
              </div>
            ))}
          </div>

          <div className="px-4 py-4 space-y-4">

            {/* Description */}
            {restaurant.description && (
              <div className="bg-slate-50 rounded-xl p-3">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-1.5">About</p>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">{restaurant.description}</p>
              </div>
            )}

            {/* Contact & Address */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Contact & Location</p>
              <div className="space-y-2">
                <div className="flex items-start gap-2.5">
                  <div className="w-7 h-7 bg-orange-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <MapPin className="w-3.5 h-3.5 text-orange-500" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-900">
                      {[restaurant.address?.street, restaurant.address?.city, restaurant.address?.state, restaurant.address?.pincode].filter(Boolean).join(', ')}
                    </p>
                    {restaurant.location?.coordinates && (
                      <a href={`https://maps.google.com/?q=${restaurant.location.coordinates[1]},${restaurant.location.coordinates[0]}`}
                        target="_blank" rel="noreferrer"
                        className="text-[10px] text-blue-500 font-bold hover:underline mt-0.5 block">
                        📍 {restaurant.location.coordinates[1].toFixed(4)}, {restaurant.location.coordinates[0].toFixed(4)} — View on Maps
                      </a>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-7 h-7 bg-green-50 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Phone className="w-3.5 h-3.5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-400 font-semibold">Restaurant Phone</p>
                    <a href={`tel:+91${restaurant.phone}`} className="text-xs font-bold text-slate-900 hover:text-orange-500">
                      +91 {restaurant.phone}
                    </a>
                  </div>
                </div>
                {restaurant.owner?.phone && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-violet-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Phone className="w-3.5 h-3.5 text-violet-600" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-semibold">Owner Login Number</p>
                      <a href={`tel:+91${restaurant.owner.phone}`} className="text-xs font-bold text-violet-700 hover:text-violet-500">
                        +91 {restaurant.owner.phone}
                      </a>
                    </div>
                  </div>
                )}
                {restaurant.email && (
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 bg-blue-50 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Mail className="w-3.5 h-3.5 text-blue-500" />
                    </div>
                    <p className="text-xs font-bold text-slate-900">{restaurant.email}</p>
                  </div>
                )}
              </div>
            </div>

            {/* Opening hours */}
            {restaurant.openingHours && (
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Opening Hours</p>
                <div className="flex items-center gap-2.5 bg-slate-50 rounded-xl p-2.5">
                  <Clock className="w-3.5 h-3.5 text-orange-500" />
                  <span className="text-xs font-bold text-slate-900">
                    {restaurant.openingHours.open} – {restaurant.openingHours.close}
                  </span>
                </div>
              </div>
            )}

            {/* Menu items */}
            <div>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider mb-2">Menu Items ({allItems.length})</p>
              {allItems.length > 0 ? (
                <div className="space-y-1.5">
                  {allItems.map((item: any) => {
                    const itemImg = resolveImage(item.image);
                    return (
                      <div key={item._id} className={`flex items-center gap-2.5 p-2.5 rounded-xl border ${item.isAvailable ? 'border-slate-100 bg-white' : 'border-slate-100 bg-slate-50 opacity-60'}`}>
                        <div className="w-10 h-10 rounded-lg overflow-hidden flex-shrink-0 bg-orange-50">
                          {itemImg
                            ? <img src={itemImg} alt={item.name} className="w-full h-full object-cover" />
                            : <div className="w-full h-full flex items-center justify-center text-lg">🍽️</div>
                          }
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className={`w-2.5 h-2.5 rounded-sm border flex items-center justify-center flex-shrink-0 ${item.foodType === 'veg' ? 'border-green-600' : 'border-red-600'}`}>
                              <span className={`w-1 h-1 rounded-full ${item.foodType === 'veg' ? 'bg-green-600' : 'bg-red-600'}`} />
                            </span>
                            <p className="font-bold text-slate-900 text-xs truncate">{item.name}</p>
                            {item.isPopular && <span className="text-[8px] font-black bg-yellow-100 text-yellow-700 px-1 py-0.5 rounded flex-shrink-0">⭐</span>}
                          </div>
                          <p className="text-[10px] text-slate-400 font-medium">{item.category}</p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="font-black text-slate-900 text-xs">₹{item.discountedPrice || item.price}</p>
                          {item.discountedPrice && <p className="text-[9px] text-slate-400 line-through">₹{item.price}</p>}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-6 bg-slate-50 rounded-xl">
                  <Utensils className="w-6 h-6 text-slate-200 mx-auto mb-1.5" />
                  <p className="text-slate-400 text-xs font-bold">No menu items yet</p>
                </div>
              )}
            </div>

          </div>

          {/* Action footer — inside scroll so it's always reachable */}
          <div className="px-4 py-3 border-t border-slate-100 bg-white flex gap-2.5 sticky bottom-0">
            <button onClick={onToggleVerify}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black border-2 transition-all ${restaurant.isVerified ? 'border-blue-300 bg-blue-50 text-blue-700 hover:bg-blue-100' : 'border-yellow-300 bg-yellow-50 text-yellow-700 hover:bg-yellow-100'}`}>
              {restaurant.isVerified ? <><CheckCircle className="w-3.5 h-3.5" /> Verified</> : <><XCircle className="w-3.5 h-3.5" /> Mark Verified</>}
            </button>
            <button onClick={onTogglePortal}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black border-2 transition-all ${restaurant.portalEnabled !== false ? 'border-violet-300 bg-violet-50 text-violet-700 hover:bg-violet-100' : 'border-gray-300 bg-gray-100 text-gray-500 hover:bg-gray-200'}`}>
              {restaurant.portalEnabled !== false
                ? <><ToggleRight className="w-3.5 h-3.5" /> Portal On</>
                : <><ToggleLeft className="w-3.5 h-3.5" /> Portal Off</>
              }
            </button>
            <button onClick={onToggleActive}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-xs font-black border-2 transition-all ${restaurant.isActive ? 'border-red-300 bg-red-50 text-red-600 hover:bg-red-100' : 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'}`}>
              {restaurant.isActive
                ? <><ToggleLeft className="w-3.5 h-3.5" /> Deactivate</>
                : <><ToggleRight className="w-3.5 h-3.5" /> Activate</>
              }
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function AdminRestaurantsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all'|'active'|'inactive'|'verified'>('all');
  const [selected, setSelected] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const { data: routesResponse } = useQuery({
    queryKey: ['admin-routes'],
    queryFn: async () => (await api.get('/routes')).data,
  });
  const routes = routesResponse?.data?.routes || [];

  const addRestaurantMut = useMutation({
    mutationFn: (payload: any) => api.post('/restaurants', payload),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-restaurants'] });
      setShowAddModal(false);
      if (vars.routes && vars.routes.length > 0) {
        if (window.confirm('Restaurant successfully added! Do you want to view a demo of the route it was added to?')) {
          // Find the first route the restaurant was added to and redirect to its QR demo if possible
          // For now, we'll just go to the QRs page so they can pick the route's QR
          window.location.href = '/admin/qrs';
        }
      }
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-restaurants', search, filter],
    queryFn: async () => (await api.get('/restaurants', {
      params: {
        search: search || undefined,
        isActive: filter === 'active' ? true : filter === 'inactive' ? false : undefined,
        isVerified: filter === 'verified' ? true : undefined,
        limit: 100,
      }
    })).data,
  });

  const toggleActiveMut = useMutation({
    mutationFn: ({ id, isActive }: { id: string; isActive: boolean }) =>
      api.put(`/restaurants/${id}`, { isActive: !isActive }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-restaurants'] });
      if (selected?._id === vars.id) setSelected((p: any) => ({ ...p, isActive: !p.isActive }));
    },
  });

  const toggleVerifyMut = useMutation({
    mutationFn: ({ id, isVerified }: { id: string; isVerified: boolean }) =>
      api.put(`/restaurants/${id}`, { isVerified: !isVerified }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-restaurants'] });
      if (selected?._id === vars.id) setSelected((p: any) => ({ ...p, isVerified: !p.isVerified }));
    },
  });

  const togglePortalMut = useMutation({
    mutationFn: ({ id }: { id: string; portalEnabled: boolean }) =>
      api.patch(`/restaurants/${id}/toggle-portal`),
    onSuccess: (res, vars) => {
      qc.invalidateQueries({ queryKey: ['admin-restaurants'] });
      if (selected?._id === vars.id) {
        setSelected((p: any) => ({ ...p, portalEnabled: res.data.data.portalEnabled }));
      }
    },
  });

  const restaurants = data?.data || [];

  return (
    <div className="p-4 sm:p-6 min-h-screen" style={{ background: '#F1F5F9' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Restaurants</h1>
          <p className="text-slate-400 text-sm font-medium mt-0.5">{restaurants.length} restaurants · Click to view details</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-black text-white flex items-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
          style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
          <Plus className="w-4 h-4" /> Add Restaurant
        </button>
      </div>

      {/* Search + filter */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[200px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search restaurants..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 transition-colors" />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['all','active','inactive','verified'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-3 py-2 rounded-xl text-xs font-black border transition-all capitalize ${filter === f ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-500'}`}
              style={filter === f ? { background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' } : {}}>
              {f}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : (
        <div className="space-y-3">
          {restaurants.length ? restaurants.map((r: any) => {
            const imgSrc = resolveImage(r.coverImage);
            return (
              <div key={r._id}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden hover:shadow-lg hover:border-orange-200 transition-all cursor-pointer"
                onClick={() => setSelected(r)}>
                <div className="flex gap-4 p-4">
                  {/* Image */}
                  <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-orange-50 to-amber-50 relative">
                    {imgSrc
                      ? <img src={imgSrc} alt={r.name} className="w-full h-full object-cover" />
                      : <div className="w-full h-full flex items-center justify-center text-2xl">🍽️</div>
                    }
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-1">
                      <p className="font-black text-slate-900 text-sm">{r.name}</p>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        <span className="text-xs font-black text-slate-700">{r.rating?.toFixed(1) || '0.0'}</span>
                      </div>
                    </div>

                    {r.description && (
                      <p className="text-[11px] text-slate-400 font-medium mb-1.5 line-clamp-1">{r.description}</p>
                    )}

                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-medium mb-2">
                      <MapPin className="w-3 h-3 flex-shrink-0" />
                      <span className="truncate">{[r.address?.street, r.address?.city, r.address?.state].filter(Boolean).join(', ')}</span>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${r.isOpen ? 'bg-green-50 text-green-700 border-green-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                        {r.isOpen ? '● Open' : '● Closed'}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${r.isVerified ? 'bg-blue-50 text-blue-700 border-blue-200' : 'bg-yellow-50 text-yellow-700 border-yellow-200'}`}>
                        {r.isVerified ? '✓ Verified' : '⏳ Pending'}
                      </span>
                      <span className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${r.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-600 border-red-200'}`}>
                        {r.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-slate-300 flex-shrink-0 self-center" />
                </div>

                {/* Quick actions */}
                <div className="px-4 py-2.5 border-t border-slate-50 flex items-center gap-3 bg-slate-50/50"
                  onClick={e => e.stopPropagation()}>
                  <button
                    onClick={() => toggleVerifyMut.mutate({ id: r._id, isVerified: r.isVerified })}
                    disabled={toggleVerifyMut.isPending}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${r.isVerified ? 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100' : 'bg-yellow-50 text-yellow-700 border-yellow-200 hover:bg-yellow-100'}`}>
                    {r.isVerified ? <><CheckCircle className="w-3.5 h-3.5" /> Verified</> : <><XCircle className="w-3.5 h-3.5" /> Verify</>}
                  </button>
                  <button
                    onClick={() => togglePortalMut.mutate({ id: r._id, portalEnabled: r.portalEnabled !== false })}
                    disabled={togglePortalMut.isPending}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black border transition-all ${r.portalEnabled !== false ? 'bg-violet-50 text-violet-700 border-violet-200 hover:bg-violet-100' : 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-gray-200'}`}>
                    {r.portalEnabled !== false ? <><ToggleRight className="w-3.5 h-3.5" /> Portal On</> : <><ToggleLeft className="w-3.5 h-3.5" /> Portal Off</>}
                  </button>
                  <div className="flex-1" />
                  <button
                    onClick={() => setSelected(r)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black bg-orange-50 text-orange-600 border border-orange-200 hover:bg-orange-100 transition-all">
                    <Eye className="w-3.5 h-3.5" /> View Details
                  </button>
                  <button onClick={() => toggleActiveMut.mutate({ id: r._id, isActive: r.isActive })} disabled={toggleActiveMut.isPending}>
                    {r.isActive
                      ? <ToggleRight className="w-8 h-8 text-green-500" />
                      : <ToggleLeft className="w-8 h-8 text-slate-300" />}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if(window.confirm('Are you sure you want to delete this restaurant? This cannot be undone.')){
                         api.delete(`/restaurants/${r._id}`).then(() => qc.invalidateQueries({ queryKey: ['admin-restaurants'] }));
                      }
                    }}
                    className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-50 text-red-600 border border-red-200 hover:bg-red-100 transition-all ml-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          }) : (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <Store className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="font-black text-slate-400">No restaurants found</p>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selected && (
        <RestaurantDetailModal
          restaurant={selected}
          onClose={() => setSelected(null)}
          onToggleActive={() => toggleActiveMut.mutate({ id: selected._id, isActive: selected.isActive })}
          onToggleVerify={() => toggleVerifyMut.mutate({ id: selected._id, isVerified: selected.isVerified })}
          onTogglePortal={() => togglePortalMut.mutate({ id: selected._id, portalEnabled: selected.portalEnabled !== false })}
        />
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddRestaurantModal
          routes={routes}
          onClose={() => setShowAddModal(false)}
          onSubmit={(payload) => addRestaurantMut.mutate(payload)}
          isPending={addRestaurantMut.isPending}
        />
      )}
    </div>
  );
}
