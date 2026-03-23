'use client';
import { useState } from 'react';
import { Plus, Edit2, Trash2, ToggleLeft, ToggleRight, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatCurrency } from '@/lib/utils';
import type { MenuItem } from '@/types';

interface MenuForm {
  name: string;
  category: string;
  price: string;
  description: string;
  foodType: 'veg' | 'non-veg' | 'egg';
}

const defaultForm: MenuForm = { name: '', category: '', price: '', description: '', foodType: 'veg' };

export default function RestaurantMenuPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState<MenuItem | null>(null);
  const [form, setForm] = useState<MenuForm>(defaultForm);

  const { data: restaurant } = useQuery({
    queryKey: ['my-restaurant'],
    queryFn: async () => (await api.get('/restaurants/owner/me')).data.data.restaurant,
  });

  const { data: menuData, isLoading } = useQuery({
    queryKey: ['my-menu', restaurant?._id],
    queryFn: async () => (await api.get(`/menu/${restaurant._id}`)).data.data.menu as Record<string, MenuItem[]>,
    enabled: !!restaurant?._id,
  });

  const saveMutation = useMutation({
    mutationFn: (data: Partial<MenuItem>) =>
      editItem
        ? api.put(`/menu/${editItem._id}`, data)
        : api.post('/menu', data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-menu'] });
      setShowForm(false);
      setEditItem(null);
      setForm(defaultForm);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/menu/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-menu'] }),
  });

  const toggleMutation = useMutation({
    mutationFn: (id: string) => api.patch(`/menu/${id}/toggle`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['my-menu'] }),
  });

  const handleEdit = (item: MenuItem) => {
    setEditItem(item);
    setForm({ name: item.name, category: item.category, price: String(item.price), description: item.description || '', foodType: item.foodType });
    setShowForm(true);
  };

  const handleSave = () => {
    saveMutation.mutate({ ...form, price: parseFloat(form.price) });
  };

  const allItems = menuData ? Object.values(menuData).flat() : [];

  return (
    <div className="min-h-screen bg-background pb-8">
      <div className="flex items-center justify-between px-4 pt-12 pb-4 border-b">
        <h1 className="text-xl font-bold">Menu Management</h1>
        <Button size="sm" onClick={() => { setShowForm(true); setEditItem(null); setForm(defaultForm); }}>
          <Plus className="w-4 h-4 mr-1" /> Add Item
        </Button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
          <div className="bg-background w-full rounded-t-2xl p-6 space-y-3 max-h-[80vh] overflow-y-auto">
            <h2 className="font-bold text-lg">{editItem ? 'Edit Item' : 'Add Menu Item'}</h2>
            <Input placeholder="Item name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input placeholder="Category (e.g. Starters)" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} />
            <Input placeholder="Price (₹)" type="number" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
            <Input placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            <select
              className="w-full border rounded-md px-3 py-2 text-sm"
              value={form.foodType}
              onChange={(e) => setForm({ ...form, foodType: e.target.value as MenuForm['foodType'] })}
            >
              <option value="veg">🟢 Veg</option>
              <option value="non-veg">🔴 Non-Veg</option>
              <option value="egg">🟡 Egg</option>
            </select>
            <div className="flex gap-2">
              <Button className="flex-1" onClick={handleSave} disabled={saveMutation.isPending}>
                {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
              </Button>
              <Button variant="outline" className="flex-1" onClick={() => setShowForm(false)}>Cancel</Button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Items */}
      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : allItems.length ? (
          allItems.map((item) => (
            <div key={item._id} className={`bg-card border rounded-xl p-3 flex items-center gap-3 ${!item.isAvailable ? 'opacity-60' : ''}`}>
              <div className="flex-1">
                <p className="font-medium text-sm">{item.name}</p>
                <p className="text-xs text-muted-foreground">{item.category} • {formatCurrency(item.price)}</p>
              </div>
              <div className="flex items-center gap-2">
                <button onClick={() => toggleMutation.mutate(item._id)}>
                  {item.isAvailable
                    ? <ToggleRight className="w-6 h-6 text-green-500" />
                    : <ToggleLeft className="w-6 h-6 text-gray-400" />}
                </button>
                <button onClick={() => handleEdit(item)}>
                  <Edit2 className="w-4 h-4 text-muted-foreground" />
                </button>
                <button onClick={() => deleteMutation.mutate(item._id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <p className="text-center py-8 text-muted-foreground">No menu items yet. Add your first item!</p>
        )}
      </div>
    </div>
  );
}
