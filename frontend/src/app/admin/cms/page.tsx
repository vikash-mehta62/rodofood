'use client';
import { useState } from 'react';
import { Edit2, Save, Loader2, Info, ExternalLink } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import Link from 'next/link';

const CMS_SECTIONS = [
  {
    title: 'Contact Info',
    desc: 'Used across legal pages and support links',
    fields: [
      { key: 'contact_phone',    label: 'Phone Number',     type: 'text', placeholder: '+91 XXXXX XXXXX' },
      { key: 'contact_email',    label: 'Support Email',    type: 'text', placeholder: 'support@yourdomain.com' },
      { key: 'whatsapp_number',  label: 'WhatsApp Number',  type: 'text', placeholder: '91XXXXXXXXXX (no +)' },
      { key: 'business_address', label: 'Business Address', type: 'text', placeholder: 'City, State, PIN' },
    ],
  },
  {
    title: 'Landing Page',
    desc: 'Hero section and app download link',
    fields: [
      { key: 'hero_title',    label: 'Hero Title',       type: 'text', placeholder: 'India\'s First Highway Food Network' },
      { key: 'hero_subtitle', label: 'Hero Subtitle',    type: 'text', placeholder: 'Pre-order food before you arrive' },
      { key: 'hero_cta',      label: 'CTA Button Text',  type: 'text', placeholder: 'Start Pre-Ordering' },
      { key: 'banner_text',   label: 'Top Banner Text',  type: 'text', placeholder: 'Free delivery on first order!' },
      { key: 'app_download_link', label: 'App Download Link', type: 'text', placeholder: 'https://play.google.com/...' },
    ],
  },
  {
    title: 'About Section',
    desc: 'About us content on landing page',
    fields: [
      { key: 'about_title', label: 'About Title', type: 'text', placeholder: 'About Rodofood' },
      { key: 'about_text',  label: 'About Description', type: 'text', placeholder: 'We connect highway travellers...' },
    ],
  },
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
    mutationFn: ({ key, value, section }: { key: string; value: string; section: string }) =>
      api.post('/cms', {
        key, value, section, type: 'text',
        label: CMS_SECTIONS.flatMap(s => s.fields).find(f => f.key === key)?.label,
      }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['cms'] }); setEditKey(null); },
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="px-4 pt-12 pb-4 bg-white border-b">
        <h1 className="text-xl font-bold">CMS Content</h1>
        <p className="text-sm text-muted-foreground">Manage site content, contact info, and landing page text</p>
      </div>

      {/* Offer banners note */}
      <div className="mx-4 mt-4 bg-blue-50 border border-blue-200 rounded-xl p-4 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" />
        <div className="flex-1">
          <p className="text-sm font-bold text-blue-800">Offer Banners come from Coupons</p>
          <p className="text-xs text-blue-600 mt-0.5">
            The rotating offer banners on the homepage are automatically generated from active coupons in the database.
            To change them, manage your coupons.
          </p>
        </div>
        <Link href="/admin/coupons">
          <button className="flex-shrink-0 flex items-center gap-1 text-xs font-bold text-blue-700 bg-blue-100 hover:bg-blue-200 px-3 py-1.5 rounded-lg transition-colors">
            Manage Coupons <ExternalLink className="w-3 h-3" />
          </button>
        </Link>
      </div>

      <div className="px-4 py-4 space-y-6">
        {isLoading ? (
          <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          CMS_SECTIONS.map(section => (
            <div key={section.title}>
              <div className="mb-3">
                <h2 className="font-bold text-gray-900 text-sm">{section.title}</h2>
                <p className="text-xs text-gray-400">{section.desc}</p>
              </div>
              <div className="space-y-2">
                {section.fields.map(field => (
                  <div key={field.key} className="bg-white border border-gray-100 rounded-xl p-4">
                    <p className="font-medium text-sm text-gray-800 mb-2">{field.label}</p>

                    {editKey === field.key ? (
                      <div className="flex gap-2">
                        <Input
                          value={editValue}
                          onChange={e => setEditValue(e.target.value)}
                          placeholder={field.placeholder}
                          className="flex-1 text-sm"
                          autoFocus
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveMutation.mutate({ key: field.key, value: editValue, section: section.title.toLowerCase().replace(' ', '_') });
                            if (e.key === 'Escape') setEditKey(null);
                          }}
                        />
                        <Button size="sm" variant="outline" onClick={() => setEditKey(null)}>Cancel</Button>
                        <Button
                          size="sm"
                          onClick={() => saveMutation.mutate({ key: field.key, value: editValue, section: section.title.toLowerCase().replace(' ', '_') })}
                          disabled={saveMutation.isPending}
                        >
                          {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm flex-1 truncate ${cmsData?.[field.key] ? 'text-gray-700' : 'text-gray-300 italic'}`}>
                          {cmsData?.[field.key] || field.placeholder}
                        </p>
                        <button
                          onClick={() => { setEditKey(field.key); setEditValue(cmsData?.[field.key] || ''); }}
                          className="flex-shrink-0 p-1.5 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <Edit2 className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
