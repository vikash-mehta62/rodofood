'use client';
import { useState } from 'react';
import { Plus, Tag, Trash2, Loader2, X, Edit2, Percent, IndianRupee, Calendar, Users, Store } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

interface CForm {
  code: string; description: string; discountType: 'percentage'|'flat';
  discountValue: string; maxDiscountAmount: string; minOrderAmount: string;
  usageLimit: string; validFrom: string; validUntil: string;
  applicableTo: 'all'|'restaurant'; restaurantId: string; isActive: boolean;
}
const DEF: CForm = {
  code:'', description:'', discountType:'percentage',
  discountValue:'', maxDiscountAmount:'', minOrderAmount:'0',
  usageLimit:'', validFrom: new Date().toISOString().split('T')[0],
  validUntil: new Date(Date.now()+30*86400000).toISOString().split('T')[0],
  applicableTo:'all', restaurantId:'', isActive:true,
};

function Field({ label, value, onChange, placeholder, type='text' }: { label:string; value:string; onChange:(v:string)=>void; placeholder?:string; type?:string; }) {
  return (
    <div>
      <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 transition-colors" />
    </div>
  );
}

export default function AdminCouponsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string|null>(null);
  const [form, setForm] = useState<CForm>(DEF);
  const [delId, setDelId] = useState<string|null>(null);
  const set = (k: keyof CForm, v: string|boolean) => setForm(p=>({...p,[k]:v}));

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => (await api.get('/coupons')).data.data.coupons,
  });

  const { data: restaurants } = useQuery({
    queryKey: ['admin-restaurants-list'],
    queryFn: async () => (await api.get('/restaurants', { params: { limit: 100 } })).data.data,
  });

  const saveMut = useMutation({
    mutationFn: (body: object) => editId ? api.put(`/coupons/${editId}`, body) : api.post('/coupons', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-coupons'] }); closeForm(); },
  });

  const delMut = useMutation({
    mutationFn: (id: string) => api.delete(`/coupons/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-coupons'] }); setDelId(null); },
  });

  const closeForm = () => { setShowForm(false); setEditId(null); setForm(DEF); };

  const openEdit = (c: any) => {
    setEditId(c._id);
    setForm({ code:c.code, description:c.description||'', discountType:c.discountType, discountValue:String(c.discountValue),
      maxDiscountAmount:c.maxDiscountAmount?String(c.maxDiscountAmount):'', minOrderAmount:String(c.minOrderAmount||0),
      usageLimit:c.usageLimit?String(c.usageLimit):'', validFrom:c.validFrom?.split('T')[0]||DEF.validFrom,
      validUntil:c.validUntil?.split('T')[0]||DEF.validUntil, applicableTo:c.applicableTo||'all',
      restaurantId:c.restaurant||'', isActive:c.isActive });
    setShowForm(true);
  };

  const handleSave = () => {
    saveMut.mutate({
      code: form.code.toUpperCase(), description: form.description,
      discountType: form.discountType, discountValue: Number(form.discountValue),
      maxDiscountAmount: form.maxDiscountAmount ? Number(form.maxDiscountAmount) : undefined,
      minOrderAmount: Number(form.minOrderAmount),
      usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
      validFrom: form.validFrom, validUntil: form.validUntil,
      applicableTo: form.applicableTo,
      restaurant: form.applicableTo === 'restaurant' && form.restaurantId ? form.restaurantId : undefined,
      isActive: form.isActive,
    });
  };

  const coupons = data || [];
  const now = new Date();

  return (
    <div className="p-4 sm:p-6 min-h-screen" style={{ background: '#F1F5F9' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Coupons</h1>
          <p className="text-slate-400 text-sm font-medium mt-0.5">{coupons.length} coupons total</p>
        </div>
        <button onClick={() => { setEditId(null); setForm(DEF); setShowForm(true); }}
          className="flex items-center gap-2 text-white font-black px-5 py-2.5 rounded-2xl text-sm shadow-lg hover:scale-105 active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
          <Plus className="w-4 h-4" /> Create Coupon
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : coupons.length ? (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {coupons.map((c: any) => {
            const expired = new Date(c.validUntil) < now;
            const active = c.isActive && !expired;
            return (
              <div key={c._id} className={`bg-white rounded-2xl border overflow-hidden shadow-sm hover:shadow-md transition-all ${!active ? 'opacity-70' : 'border-slate-100'}`}>
                <div className="px-5 py-4 relative" style={{ background: active ? 'linear-gradient(135deg,#FF6B35,#FF8C42)' : '#94a3b8' }}>
                  <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle, white 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
                  <div className="relative z-10 flex items-center justify-between">
                    <div>
                      <p className="text-white/70 text-[10px] font-black uppercase tracking-widest mb-1">
                        {c.applicableTo === 'all' ? '🌐 All Restaurants' : '🏪 Restaurant Specific'}
                      </p>
                      <p className="text-white font-black text-xl tracking-widest">{c.code}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-black text-2xl">{c.discountType==='percentage'?`${c.discountValue}%`:`₹${c.discountValue}`}</p>
                      <p className="text-white/70 text-[10px] font-bold">OFF</p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center px-4">
                  <div className="w-4 h-4 rounded-full -ml-6 bg-slate-100 border border-slate-200" />
                  <div className="flex-1 border-t-2 border-dashed border-slate-200 mx-2" />
                  <div className="w-4 h-4 rounded-full -mr-6 bg-slate-100 border border-slate-200" />
                </div>
                <div className="px-5 py-4 space-y-2">
                  {c.description && <p className="text-xs text-slate-500 font-medium">{c.description}</p>}
                  <div className="grid grid-cols-2 gap-2 text-[10px] font-bold text-slate-500">
                    <span className="flex items-center gap-1"><IndianRupee className="w-3 h-3" /> Min ₹{c.minOrderAmount}</span>
                    {c.maxDiscountAmount && <span className="flex items-center gap-1"><Percent className="w-3 h-3" /> Max ₹{c.maxDiscountAmount}</span>}
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" /> {c.usageCount||0}/{c.usageLimit||'∞'} used</span>
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" /> Till {new Date(c.validUntil).toLocaleDateString('en-IN')}</span>
                  </div>
                  <div className="flex items-center justify-between pt-2">
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${active?'bg-green-100 text-green-700':expired?'bg-red-100 text-red-600':'bg-slate-100 text-slate-500'}`}>
                      {expired?'Expired':active?'Active':'Inactive'}
                    </span>
                    <div className="flex gap-2">
                      <button onClick={() => openEdit(c)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-blue-50 hover:text-blue-600 flex items-center justify-center transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => setDelId(c._id)} className="w-8 h-8 rounded-xl bg-slate-100 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-100">
          <Tag className="w-12 h-12 text-slate-200 mx-auto mb-3" />
          <p className="font-black text-slate-400">No coupons yet</p>
        </div>
      )}

      {delId && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-2xl flex items-center justify-center mx-auto mb-4"><Trash2 className="w-6 h-6 text-red-500" /></div>
            <h3 className="font-black text-slate-900 text-center text-lg mb-1">Delete Coupon?</h3>
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

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <h2 className="font-black text-slate-900 text-lg">{editId ? 'Edit Coupon' : 'Create Coupon'}</h2>
              <button onClick={closeForm} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center"><X className="w-4 h-4 text-slate-600" /></button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <Field label="Coupon Code *" value={form.code} onChange={v=>set('code',v.toUpperCase())} placeholder="SAVE20" />
              <Field label="Description" value={form.description} onChange={v=>set('description',v)} placeholder="20% off on all orders" />
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Discount Type</label>
                <div className="grid grid-cols-2 gap-2">
                  {(['percentage','flat'] as const).map(t => (
                    <button key={t} type="button" onClick={() => set('discountType',t)}
                      className={`py-3 rounded-xl border-2 text-sm font-black transition-all ${form.discountType===t?'border-orange-400 bg-orange-50 text-orange-600':'border-slate-200 text-slate-400 bg-white'}`}>
                      {t==='percentage'?'% Percentage':'₹ Flat Amount'}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label={form.discountType==='percentage'?'Discount %':'Discount ₹'} value={form.discountValue} onChange={v=>set('discountValue',v)} placeholder={form.discountType==='percentage'?'20':'50'} type="number" />
                {form.discountType==='percentage' && <Field label="Max Discount ₹" value={form.maxDiscountAmount} onChange={v=>set('maxDiscountAmount',v)} placeholder="100" type="number" />}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Min Order ₹" value={form.minOrderAmount} onChange={v=>set('minOrderAmount',v)} placeholder="0" type="number" />
                <Field label="Usage Limit" value={form.usageLimit} onChange={v=>set('usageLimit',v)} placeholder="Unlimited" type="number" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Valid From" value={form.validFrom} onChange={v=>set('validFrom',v)} type="date" />
                <Field label="Valid Until" value={form.validUntil} onChange={v=>set('validUntil',v)} type="date" />
              </div>
              <div>
                <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Applicable To</label>
                <div className="grid grid-cols-2 gap-2">
                  {([['all','🌐 All Restaurants'],['restaurant','🏪 Specific Restaurant']] as [string,string][]).map(([k,l]) => (
                    <button key={k} type="button" onClick={() => set('applicableTo',k)}
                      className={`py-3 rounded-xl border-2 text-xs font-black transition-all ${form.applicableTo===k?'border-orange-400 bg-orange-50 text-orange-600':'border-slate-200 text-slate-400 bg-white'}`}>
                      {l}
                    </button>
                  ))}
                </div>
                {form.applicableTo==='restaurant' && (
                  <div className="mt-2">
                    <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">Select Restaurant</label>
                    <select value={form.restaurantId} onChange={e=>set('restaurantId',e.target.value)}
                      className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 bg-white">
                      <option value="">-- Select --</option>
                      {(restaurants||[]).map((r: any) => <option key={r._id} value={r._id}>{r.name}</option>)}
                    </select>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-between p-4 bg-slate-50 rounded-xl">
                <div>
                  <p className="font-black text-slate-900 text-sm">Active</p>
                  <p className="text-xs text-slate-400 font-medium">Customers can use this coupon</p>
                </div>
                <button type="button" onClick={() => set('isActive',!form.isActive)}
                  className={`w-12 h-6 rounded-full transition-all relative ${form.isActive?'bg-green-500':'bg-slate-300'}`}>
                  <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${form.isActive?'left-6':'left-0.5'}`} />
                </button>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
              <button onClick={closeForm} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-black text-sm">Cancel</button>
              <button onClick={handleSave} disabled={saveMut.isPending || !form.code || !form.discountValue}
                className="flex-1 py-3 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                {saveMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : editId ? 'Save Changes' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
