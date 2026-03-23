'use client';
import { useState } from 'react';
import { Edit2, Save, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

const CMS_FIELDS = [
  { key: 'hero_title', section: 'hero', label: 'Hero Title', type: 'text' },
  { key: 'hero_subtitle', section: 'hero', label: 'Hero Subtitle', type: 'text' },
  { key: 'hero_cta', section: 'hero', label: 'Hero CTA Button Text', type: 'text' },
  { key: 'about_title', section: 'about', label: 'About Title', type: 'text' },
  { key: 'about_text', section: 'about', label: 'About Description', type: 'text' },
  { key: 'how_it_works_title', section: 'how_it_works', label: 'How It Works Title', type: 'text' },
  { key: 'contact_phone', section: 'contact', label: 'Contact Phone', type: 'text' },
  { key: 'contact_email', section: 'contact', label: 'Contact Email', type: 'text' },
  { key: 'whatsapp_number', section: 'contact', label: 'WhatsApp Number', type: 'text' },
  { key: 'app_download_link', section: 'app', label: 'App Download Link', type: 'text' },
  { key: 'banner_text', section: 'banner', label: 'Banner Text', type: 'text' },
];

export default function AdminCmsPage() {
  const qc = useQueryClient();
  const [editKey, setEditKey] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  const { data: cmsData, isLoading } = useQuery({
    queryKey: ['cms'],
    queryFn: async () => (await api.get('/cms')).data.data.content as Record<string, string>,
  });

  const saveMutation = useMutation({
    mutationFn: ({ key, value, section, type }: { key: string; value: string; section: string; type: string }) =>
      api.post('/cms', { key, value, section, type, label: CMS_FIELDS.find((f) => f.key === key)?.label }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['cms'] });
      setEditKey(null);
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <div className="px-4 pt-12 pb-4 border-b">
        <h1 className="text-xl font-bold">CMS Content</h1>
        <p className="text-sm text-muted-foreground">Edit landing page content</p>
      </div>

      <div className="px-4 py-4 space-y-3">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          CMS_FIELDS.map((field) => (
            <div key={field.key} className="bg-card border rounded-xl p-4">
              <p className="text-xs text-muted-foreground mb-1">{field.section.toUpperCase()}</p>
              <p className="font-medium text-sm mb-2">{field.label}</p>

              {editKey === field.key ? (
                <div className="flex gap-2">
                  <Input
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    className="flex-1"
                    autoFocus
                  />
                  <Button
                    size="sm"
                    onClick={() => saveMutation.mutate({ key: field.key, value: editValue, section: field.section, type: field.type })}
                    disabled={saveMutation.isPending}
                  >
                    {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  </Button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground truncate flex-1">
                    {cmsData?.[field.key] || <span className="italic">Not set</span>}
                  </p>
                  <button
                    onClick={() => { setEditKey(field.key); setEditValue(cmsData?.[field.key] || ''); }}
                    className="ml-2 p-1.5 rounded-lg hover:bg-muted"
                  >
                    <Edit2 className="w-4 h-4 text-muted-foreground" />
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
