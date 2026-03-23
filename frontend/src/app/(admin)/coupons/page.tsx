'use client';
import { useState } from 'react';
import { Plus, Tag, Trash2, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface CouponForm {
  code: string;
  discountType: 'percentage' | 'flat';
  discountValue: string;
  minOrderAmount: string;
  validFrom: string;
  validUntil: string;
  description: string;
}

const defaultForm: CouponForm = {
  code: '', discountType: 'percentage', discountValue: '', minOrderAmount: '0',
  validFrom: '', validUntil: '', description: '',
};

export default function AdminCouponsPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<CouponForm>(defaultForm);

  const { data, isLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => (await api.get('/coupons')).data.data.coupons,
  });

  const createMutation = useMutation({
    mutationFn: (data: unknown) => api.post('/coupons', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-coupons'] }); setShowForm(false); setForm(defaultForm); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/coupons/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-coupons'] }),
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b">
        <h1 className="text-xl font-bold">Coupons</h1>
        <Button size="sm" onClick={() => setShowForm(true)}><Plus className="w-4 h-4 mr-1" /> Create</Button>
      </div>

      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-background w-full rounded-t-2xl p-6 space-y-3 max-h-[85vh] overflow-y-auto">
            <h2 className="font-bold text-lg">Create Coupon</h2>
            <Input placeholder="Coupon Code (e.g. SAVE20)" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })} />
            <Input placeholder="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <select className="w-full border rounded-md px-3 py-2 text-sm" value={form.discountType} onChange={(e) => setForm({ ...form, discountType: e.target.value as 'percentage' | 'flat' })}>
              <option value="percentage">Percentage (%)</option>
              <option value="flat">Flat Amount (₹)</option>
            </select>
            <Input placeholder={`Discount Value (${form.discountType === 'percentage' ? '%' : '₹'})`} type="number" value={form.discountValue} onChange={(e) => setForm({ ...form, discountValue: e.target.value })} />
            <Input placeholder="Min Order Amount (₹)" type="number" value={form.minOrderAmount} onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })} />
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs text-muted-foreground">Valid From</label>
                <Input type="date" value={form.validFrom} onChange={(e) => setForm({ ...form, validFrom: e.target.value })} />
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Valid Until</label>
                <Input type="date" value={form.validUntil} onChange={(e) => setForm({ ...form, validUntil: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={() => createMutation.mutate({ ...form, discountValue: parseFloat(form.discountValue), minOrderAmount: parseFloat(form.minOrderAmount) })} disabled={createMutation.isPending}>
                {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create'}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : data?.map((coupon: any) => (
          <div key={coupon._id} className="bg-card border rounded-xl p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-orange-50 rounded-lg flex items-center justify-center">
                  <Tag className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-bold text-primary">{coupon.code}</p>
                  <p className="text-xs text-muted-foreground">
                    {coupon.discountType === 'percentage' ? `${coupon.discountValue}% off` : `₹${coupon.discountValue} off`}
                    {coupon.minOrderAmount > 0 && ` • Min ₹${coupon.minOrderAmount}`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Used: {coupon.usageCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ''} times
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-xs px-2 py-0.5 rounded-full ${coupon.isActive ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                  {coupon.isActive ? 'Active' : 'Inactive'}
                </span>
                <button onClick={() => deleteMutation.mutate(coupon._id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
