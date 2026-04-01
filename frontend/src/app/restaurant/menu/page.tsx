'use client';
import { useState, useRef } from 'react';
import {
  Plus, Edit2, Trash2, ToggleLeft, ToggleRight,
  Loader2, Upload, X, Star, Clock, Search,
  ChevronDown, ImageIcon
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { formatCurrency } from '@/lib/utils';
import { resolveImage } from '@/lib/config';
import type { MenuItem } from '@/types';

const CATEGORIES = ['Starters','Main Course','Breads','Rice & Biryani','Snacks','Beverages','Desserts','Thali','Combo','Other'];
const TAGS = ['Bestseller','Spicy','Must Try','New','Chef Special','Healthy'];
const FOOD_CFG = {
  veg:       { label: 'Veg',     color: 'border-green-500 text-green-600 bg-green-50',    icon: '🟢' },
  'non-veg': { label: 'Non-Veg', color: 'border-red-500 text-red-600 bg-red-50',          icon: '🔴' },
  egg:       { label: 'Egg',     color: 'border-yellow-500 text-yellow-600 bg-yellow-50', icon: '🟡' },
} as const;

interface MForm {
  name: string; category: string; customCategory: string;
  price: string; discountedPrice: string; description: string;
  foodType: 'veg'|'non-veg'|'egg'; preparationTime: string;
  isPopular: boolean; tags: string[];
  imageFile: File|null; imagePreview: string;
}
const DEF: MForm = {
  name:'', category:'Starters', customCategory:'',
  price:'', discountedPrice:'', description:'',
  foodType:'veg', preparationTime:'15',
  isPopular:false, tags:[], imageFile:null, imagePreview:'',
};

const getImgUrl = (path?: string | null) => resolveImage(path);

export default function RestaurantMenuPage() {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem|null>(null);
  const [form, setForm] = useState<MForm>(DEF);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState('All');
  const [delId, setDelId] = useState<string|null>(null);

  const { data: restaurant } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn: async () => (await api.get('/restaurants/owner/me')).data.data.restaurant,
  });

  const { data: menuData, isLoading } = useQuery({
    queryKey: ['my-menu', restaurant?._id],
    queryFn: async () => (await api.get('/menu/owner/all')).data.data.menu as Record<string, MenuItem[]>,
    enabled: !!restaurant?._id,
  });

  const saveMut = useMutation({
    mutationFn: (fd: FormData) =>
      editItem
        ? api.put(`/menu/${editItem._id}`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
        : api.post('/menu', fd, { headers: { 'Content-Type': 'multipart/form-data' } }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-menu'] }); closeForm(); },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => api.delete(`/menu/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['my-menu'] }); setDelId(null); },
  });

  const togMut = useMutation({
    mutationFn: (id: string) => api.patch(`/menu/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-menu'] }),
  });

  const closeForm = () => { setShowForm(false); setEditItem(null); setForm(DEF); };

  const openEdit = (item: MenuItem) => {
    setEditItem(item);
    setForm({
      name: item.name,
      category: CATEGORIES.includes(item.category) ? item.category : 'Other',
      customCategory: CATEGORIES.includes(item.category) ? '' : item.category,
      price: String(item.price),
      discountedPrice: item.discountedPrice ? String(item.discountedPrice) : '',
      description: item.description || '',
      foodType: item.foodType,
      preparationTime: String(item.preparationTime || 15),
      isPopular: item.isPopular || false,
      tags: item.tags || [],
      imageFile: null,
      imagePreview: getImgUrl(item.image) || '',
    });
    setShowForm(true);
  };

  const handleImg = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (f) setForm(p => ({ ...p, imageFile: f, imagePreview: URL.createObjectURL(f) }));
  };

  const toggleTag = (t: string) =>
    setForm(p => ({ ...p, tags: p.tags.includes(t) ? p.tags.filter(x => x !== t) : [...p.tags, t] }));

  const handleSave = () => {
    const fd = new FormData();
    const cat = form.category === 'Other' && form.customCategory ? form.customCategory : form.category;
    fd.append('name', form.name);
    fd.append('category', cat);
    fd.append('price', form.price);
    if (form.discountedPrice) fd.append('discountedPrice', form.discountedPrice);
    fd.append('description', form.description);
    fd.append('foodType', form.foodType);
    fd.append('preparationTime', form.preparationTime);
    fd.append('isPopular', String(form.isPopular));
    form.tags.forEach(t => fd.append('tags[]', t));
    if (form.imageFile) fd.append('image', form.imageFile);
    saveMut.mutate(fd);
  };

  const allItems: MenuItem[] = menuData ? Object.values(menuData).flat() : [];
  const cats = ['All', ...Array.from(new Set(allItems.map(i => i.category)))];
  const filtered = allItems.filter(i =>
    (filterCat === 'All' || i.category === filterCat) &&
    i.name.toLowerCase().includes(search.toLowerCase())
  );
  const grouped = filtered.reduce<Record<string, MenuItem[]>>((a, i) => {
    (a[i.category] ??= []).push(i); return a;
  }, {});

  return (
    <div className="p-4 sm:p-6 min-h-screen" style={{ background: '#F1F5F9' }}>

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Menu</h1>
          <p className="text-slate-400 text-sm font-medium mt-0.5">{allItems.length} items · {cats.length - 1} categories</p>
        </div>
        <button onClick={() => { setEditItem(null); setForm(DEF); setShowForm(true); }}
          className="flex items-center gap-2 text-white font-black px-5 py-2.5 rounded-2xl text-sm shadow-lg hover:scale-105 active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
          <Plus className="w-4 h-4" /> Add Item
        </button>
      </div>

      {/* Search + Filter */}
      <div className="flex gap-3 mb-5 flex-wrap">
        <div className="flex-1 min-w-[180px] relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search items..."
            className="w-full pl-9 pr-4 py-2.5 bg-white border border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 transition-colors" />
        </div>
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {cats.map(c => (
            <button key={c} onClick={() => setFilterCat(c)}
              className={`flex-shrink-0 px-3 py-2 rounded-xl text-xs font-black border transition-all ${filterCat === c ? 'text-white border-transparent' : 'bg-white border-slate-200 text-slate-500'}`}
              style={filterCat === c ? { background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' } : {}}>
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Items */}
      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : filtered.length ? (
        <div className="space-y-6">
          {Object.entries(grouped).map(([cat, items]) => (
            <div key={cat}>
              <h2 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3 px-1">{cat}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {items.map(item => {
                  const ft = FOOD_CFG[item.foodType];
                  const imgUrl = getImgUrl(item.image);
                  const disc = item.discountedPrice ? Math.round((1 - item.discountedPrice / item.price) * 100) : 0;
                  return (
                    <div key={item._id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all ${!item.isAvailable ? 'opacity-60' : 'border-slate-100'}`}>
                      {/* Image */}
                      <div className="relative h-36 overflow-hidden" style={{ background: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)' }}>
                        {imgUrl
                          ? <img src={imgUrl} alt={item.name} className="w-full h-full object-cover" />
                          : (
                            <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 cursor-pointer"
                              onClick={() => openEdit(item)}>
                              <span className="text-4xl opacity-20">🍽️</span>
                              <span className="text-[10px] font-black text-slate-400 bg-white/80 px-2 py-0.5 rounded-lg">+ Add Photo</span>
                            </div>
                          )
                        }
                        <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                          <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-md border ${ft.color}`}>{ft.icon} {ft.label}</span>
                          {item.isPopular && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-yellow-400 text-yellow-900">⭐ Popular</span>}
                          {disc > 0 && <span className="text-[9px] font-black px-1.5 py-0.5 rounded-md bg-green-500 text-white">{disc}% OFF</span>}
                        </div>
                        <button onClick={() => togMut.mutate(item._id)} className="absolute top-2 right-2 bg-white/90 rounded-lg p-1 shadow-sm">
                          {item.isAvailable ? <ToggleRight className="w-5 h-5 text-green-500" /> : <ToggleLeft className="w-5 h-5 text-slate-400" />}
                        </button>
                      </div>
                      {/* Body */}
                      <div className="p-4">
                        <p className="font-black text-slate-900 text-sm mb-1">{item.name}</p>
                        {item.description && <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-2 line-clamp-2">{item.description}</p>}
                        {item.tags && item.tags.length > 0 && (
                          <div className="flex gap-1 flex-wrap mb-2">
                            {item.tags.map(t => <span key={t} className="text-[9px] font-black bg-orange-50 text-orange-600 px-1.5 py-0.5 rounded-md">{t}</span>)}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-2">
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-black text-slate-900 text-base">₹{item.discountedPrice || item.price}</span>
                            {item.discountedPrice && <span className="text-xs text-slate-400 line-through">₹{item.price}</span>}
                          </div>
                          <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <Clock className="w-3 h-3" />{item.preparationTime || 15} min
                          </span>
                        </div>
                        <div className="flex gap-2 mt-3">
                          <button onClick={() => openEdit(item)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-600 text-xs font-black transition-colors">
                            <Edit2 className="w-3.5 h-3.5" /> Edit
                          </button>
                          <button onClick={() => setDelId(item._id)}
                            className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-500 text-slate-600 text-xs font-black transition-colors">
                            <Trash2 className="w-3.5 h-3.5" /> Delete
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <div className="w-16 h-16 bg-slate-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Plus className="w-8 h-8 text-slate-300" />
          </div>
          <p className="font-black text-slate-400 text-lg">No items found</p>
          <p className="text-slate-300 text-sm font-medium mt-1">Add your first menu item to get started</p>
        </div>
      )}

      {/* Delete confirm */}
      {delId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-500" />
            </div>
            <h3 className="font-black text-slate-900 text-center text-lg mb-1">Delete Item?</h3>
            <p className="text-slate-400 text-sm text-center font-medium mb-6">This cannot be undone.</p>
            <div className="flex gap-3">
              <button onClick={() => setDelId(null)} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-black text-sm">Cancel</button>
              <button onClick={() => delMut.mutate(delId)} disabled={delMut.isPending}
                className="flex-1 py-3 rounded-2xl bg-red-500 text-white font-black text-sm flex items-center justify-center gap-2">
                {delMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add/Edit Modal */}
      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <h2 className="font-black text-slate-900 text-lg">{editItem ? 'Edit Item' : 'Add New Item'}</h2>
              <button onClick={closeForm} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors">
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-5">

              {/* Image */}
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Item Photo</label>
                <div onClick={() => fileRef.current?.click()}
                  className="relative h-44 rounded-2xl border-2 border-dashed border-slate-200 hover:border-orange-400 cursor-pointer overflow-hidden transition-colors group"
                  style={{ background: form.imagePreview ? 'transparent' : '#FAFAFA' }}>
                  {form.imagePreview ? (
                    <>
                      <img src={form.imagePreview} alt="preview" className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <p className="text-white font-black text-sm">Change Photo</p>
                      </div>
                    </>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full gap-2">
                      <div className="w-12 h-12 bg-orange-50 rounded-2xl flex items-center justify-center">
                        <ImageIcon className="w-6 h-6 text-orange-400" />
                      </div>
                      <p className="text-sm font-black text-slate-400">Click to upload photo</p>
                      <p className="text-xs text-slate-300 font-medium">JPG, PNG up to 5MB</p>
                    </div>
                  )}
                </div>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleImg} />
              </div>

              {/* Food Type */}
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Food Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {(['veg','non-veg','egg'] as const).map(ft => (
                    <button key={ft} type="button" onClick={() => setForm(p => ({ ...p, foodType: ft }))}
                      className={`py-2.5 rounded-xl border-2 text-xs font-black transition-all ${form.foodType === ft ? FOOD_CFG[ft].color + ' border-current' : 'border-slate-200 text-slate-400 bg-white'}`}>
                      {FOOD_CFG[ft].icon} {FOOD_CFG[ft].label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Name */}
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Item Name *</label>
                <input value={form.name} onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
                  placeholder="e.g. Dal Baati Churma"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 transition-colors" />
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  placeholder="Describe the dish — ingredients, taste, speciality..."
                  rows={3} className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 transition-colors resize-none" />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Category *</label>
                <div className="relative">
                  <select value={form.category} onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 transition-colors appearance-none bg-white">
                    {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                </div>
                {form.category === 'Other' && (
                  <input value={form.customCategory} onChange={e => setForm(p => ({ ...p, customCategory: e.target.value }))}
                    placeholder="Enter custom category name"
                    className="mt-2 w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 transition-colors" />
                )}
              </div>

              {/* Price */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Price (₹) *</label>
                  <input type="number" min="0" value={form.price} onChange={e => setForm(p => ({ ...p, price: e.target.value }))}
                    placeholder="149"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 transition-colors" />
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Offer Price (₹)</label>
                  <input type="number" min="0" value={form.discountedPrice} onChange={e => setForm(p => ({ ...p, discountedPrice: e.target.value }))}
                    placeholder="119"
                    className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 transition-colors" />
                </div>
              </div>

              {/* Prep time + Popular */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Prep Time (min)</label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input type="number" min="1" value={form.preparationTime} onChange={e => setForm(p => ({ ...p, preparationTime: e.target.value }))}
                      className="w-full pl-9 pr-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 transition-colors" />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Mark Popular</label>
                  <button type="button" onClick={() => setForm(p => ({ ...p, isPopular: !p.isPopular }))}
                    className={`w-full py-3 rounded-xl border-2 text-sm font-black transition-all flex items-center justify-center gap-2 ${form.isPopular ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-slate-200 text-slate-400 bg-white'}`}>
                    <Star className={`w-4 h-4 ${form.isPopular ? 'fill-yellow-400 text-yellow-400' : ''}`} />
                    {form.isPopular ? 'Popular ✓' : 'Not Popular'}
                  </button>
                </div>
              </div>

              {/* Tags */}
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Tags</label>
                <div className="flex flex-wrap gap-2">
                  {TAGS.map(t => (
                    <button key={t} type="button" onClick={() => toggleTag(t)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-black border-2 transition-all ${form.tags.includes(t) ? 'border-orange-400 bg-orange-50 text-orange-600' : 'border-slate-200 text-slate-400 bg-white hover:border-orange-300'}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
              <button onClick={closeForm} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-black text-sm hover:bg-slate-200 transition-colors">
                Cancel
              </button>
              <button onClick={handleSave} disabled={saveMut.isPending || !form.name || !form.price}
                className="flex-1 py-3 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                {saveMut.isPending
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><Upload className="w-4 h-4" />{editItem ? 'Save Changes' : 'Add to Menu'}</>
                }
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
