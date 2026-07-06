'use client';
import { useState, useRef, useEffect } from 'react';
import { Bell, Send, Trash2, Loader2, Users, CheckCircle, Image as ImageIcon, X, LayoutDashboard, Plus, Settings2, Smartphone, MonitorSmartphone, Store, UserCheck, AlertTriangle } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import Image from 'next/image';
import DeviceEnrollmentModal from './DeviceEnrollmentModal';

export default function AdminNotificationsPage() {
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState<'broadcast' | 'topics'>('broadcast');

  // Broadcast State
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [targetTopic, setTargetTopic] = useState('all_users');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageUrl, setImageUrl] = useState(''); // For image link URL
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [sent, setSent] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Manage Topics State
  const [topicKey, setTopicKey] = useState('');
  const [topicLabel, setTopicLabel] = useState('');
  const [topicDesc, setTopicDesc] = useState('');
  const [autoSubscribe, setAutoSubscribe] = useState(false);
  const [enrollModalOpen, setEnrollModalOpen] = useState(false);
  const [selectedTopicForEnroll, setSelectedTopicForEnroll] = useState<any>(null);

  // Data Fetching
  const { data: stats } = useQuery({
    queryKey: ['fcm-stats'],
    queryFn: async () => (await api.get('/fcm/stats')).data.data,
  });

  const { data: topics, isLoading: topicsLoading } = useQuery({
    queryKey: ['fcm-topics'],
    queryFn: async () => (await api.get('/fcm/topics')).data.data,
  });

  // Mutations
  const sendMut = useMutation({
    mutationFn: async () => {
      let finalImageUrl = imageUrl;
      if (imageFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('image', imageFile);
        const res = await api.post('/admin/upload', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        finalImageUrl = res.data.data.imageUrl;
        setIsUploading(false);
      }
      
      return api.post('/fcm/send', {
        targetType: 'topic',
        target: targetTopic,
        title,
        body: message,
        imageUrl: finalImageUrl || undefined,
        type: 'system',
        data: {
          type: 'system',
          screen: 'Notifications',
          timestamp: Date.now().toString()
        }
      });
    },
    onSuccess: (response) => {
      const deliveryInfo = response.data.deliveryInfo;
      const deviceCount = deliveryInfo?.targetDeviceCount || 0;
      
      if (deviceCount === 0) {
        alert('⚠️ Warning: No devices subscribed to this topic!');
      }
      
      setTitle(''); 
      setMessage(''); 
      setImageUrl('');
      clearImage();
      setSent(true);
      setTimeout(() => setSent(false), 3000);
    },
    onError: (error) => {
      console.error('Notification send failed:', error);
      setIsUploading(false);
      alert('Failed to send notification: ' + (error.response?.data?.message || error.message));
    }
  });

  const createTopicMut = useMutation({
    mutationFn: () => api.post('/fcm/topics', { topicKey, displayName: topicLabel, description: topicDesc, autoSubscribe }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fcm-topics'] });
      setTopicKey(''); setTopicLabel(''); setTopicDesc(''); setAutoSubscribe(false);
    }
  });

  const deleteTopicMut = useMutation({
    mutationFn: (id: string) => api.delete(`/fcm/topics/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['fcm-topics'] })
  });

  // Handlers
  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
      setImageUrl(''); // clear text URL if file uploaded
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen bg-slate-50">
      
      {/* ── HEADER & TABS ── */}
      <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
            <Bell className="w-6 h-6 text-indigo-600" /> Broadcast Push Notifications
          </h1>
          <p className="text-slate-500 text-sm mt-1 max-w-2xl">
            Instantly dispatch Firebase Cloud Messaging alerts to iOS and Android devices. Support logged-in customers, partners, and guest applications.
          </p>
        </div>
        
        <div className="flex bg-white rounded-lg p-1 shadow-sm border border-slate-200">
          <button onClick={() => setActiveTab('broadcast')}
            className={`px-4 py-2 text-sm font-bold rounded-md flex items-center gap-2 transition-colors ${activeTab === 'broadcast' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Send className="w-4 h-4" /> Broadcast Message
          </button>
          <button onClick={() => setActiveTab('topics')}
            className={`px-4 py-2 text-sm font-bold rounded-md flex items-center gap-2 transition-colors ${activeTab === 'topics' ? 'bg-indigo-600 text-white' : 'text-slate-600 hover:bg-slate-50'}`}>
            <Settings2 className="w-4 h-4" /> Manage Topics ({topics?.length || 0})
          </button>
        </div>
      </div>

      {activeTab === 'broadcast' && (
        <div className="space-y-6">
          {/* ── STATS CARDS ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-indigo-500 rounded-xl p-5 text-white shadow-md shadow-indigo-200 relative overflow-hidden">
              <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Total Devices</p>
              <h3 className="text-3xl font-black">{stats?.totalDevices || 0}</h3>
              <MonitorSmartphone className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-20" />
            </div>
            <div className="bg-emerald-500 rounded-xl p-5 text-white shadow-md shadow-emerald-200 relative overflow-hidden">
              <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Customers</p>
              <h3 className="text-3xl font-black">{stats?.customers || 0}</h3>
              <UserCheck className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-20" />
            </div>
            <div className="bg-orange-500 rounded-xl p-5 text-white shadow-md shadow-orange-200 relative overflow-hidden">
              <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Partners</p>
              <h3 className="text-3xl font-black">{stats?.partners || 0}</h3>
              <Store className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-20" />
            </div>
            <div className="bg-pink-500 rounded-xl p-5 text-white shadow-md shadow-pink-200 relative overflow-hidden">
              <p className="text-xs font-bold uppercase tracking-wider opacity-80 mb-1">Guest Installs</p>
              <h3 className="text-3xl font-black">{stats?.guests || 0}</h3>
              <Users className="absolute -right-4 -bottom-4 w-24 h-24 text-white opacity-20" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_350px] gap-8">
            {/* ── COMPOSE FORM ── */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 lg:p-8">
              <h2 className="font-black text-slate-900 text-lg flex items-center gap-2 mb-6">
                <Send className="w-5 h-5 text-indigo-500" /> Compose Broadcast Message
              </h2>

              <div className="space-y-5">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Notification Title <span className="text-red-500">*</span></label>
                  <input value={title} onChange={e => setTitle(e.target.value)} maxLength={80}
                    placeholder="e.g. 🎉 Mega Rewards Weekend!"
                    className="w-full h-11 px-4 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Notification Message Body <span className="text-red-500">*</span></label>
                  <textarea value={message} onChange={e => setMessage(e.target.value)} maxLength={300} rows={3}
                    placeholder="e.g. Earn 2x reward points on all bookings this Saturday and Sunday. Tap to book now!"
                    className="w-full px-4 py-3 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors resize-none" />
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">Target Audience Category <span className="text-red-500">*</span></label>
                  <select value={targetTopic} onChange={e => setTargetTopic(e.target.value)}
                    className="w-full h-11 px-4 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 bg-white">
                    <option value="all_users">🚀 All Registered Devices ({(stats?.totalDevices || 0)})</option>
                    <option value="customers">👥 Customers Only ({(stats?.customers || 0)})</option>
                    <option value="all_restaurants">🏪 Partners Only ({(stats?.partners || 0)})</option>
                    <option value="guests">👤 Guests Only ({(stats?.guests || 0)})</option>
                    {topics?.map((t: any) => (
                      <option key={t._id} value={t.topicKey}>#️⃣ {t.displayName} ({t.subscribersCount || 0})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Rich Image Attachment <span className="text-slate-400 font-normal">(Optional)</span></label>
                    <div className="flex gap-2">
                      <button onClick={() => clearImage()} className={`text-[10px] font-bold px-2 py-1 rounded border ${!imageFile ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>Image Link URL</button>
                      <button onClick={() => fileInputRef.current?.click()} className={`text-[10px] font-bold px-2 py-1 rounded border ${imageFile ? 'bg-indigo-50 text-indigo-700 border-indigo-200' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>Upload File</button>
                    </div>
                  </div>
                  
                  <input type="file" ref={fileInputRef} accept="image/*" className="hidden" onChange={handleImageChange} />
                  
                  {imageFile ? (
                    <div className="flex items-center gap-3 p-2 border border-slate-300 rounded-lg bg-slate-50">
                       <div className="w-12 h-12 relative rounded bg-slate-200 overflow-hidden border border-slate-300">
                         {imagePreview && <Image src={imagePreview} alt="Preview" fill className="object-cover" />}
                       </div>
                       <div className="flex-1 min-w-0">
                         <p className="text-sm font-bold text-slate-700 truncate">{imageFile.name}</p>
                         <p className="text-[10px] text-slate-500">{(imageFile.size / 1024).toFixed(1)} KB</p>
                       </div>
                       <button onClick={clearImage} className="w-8 h-8 rounded bg-white border border-slate-200 hover:bg-red-50 hover:text-red-500 flex items-center justify-center transition-colors">
                         <X className="w-4 h-4" />
                       </button>
                    </div>
                  ) : (
                    <div className="relative">
                      <ImageIcon className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
                      <input value={imageUrl} onChange={e => setImageUrl(e.target.value)} 
                        placeholder="e.g. https://domain.com/banner.png"
                        className="w-full h-11 pl-10 pr-4 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-colors" />
                    </div>
                  )}
                  <p className="text-[10px] text-slate-400 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> High-quality landscape (approx. 2:1 aspect ratio) matches best for notifications.</p>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <button
                    onClick={() => sendMut.mutate()}
                    disabled={!title.trim() || !message.trim() || sendMut.isPending || isUploading}
                    className="w-full h-12 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-all bg-indigo-600 hover:bg-indigo-700 shadow-md shadow-indigo-200 disabled:opacity-50 disabled:shadow-none">
                    {sendMut.isPending || isUploading
                      ? <Loader2 className="w-5 h-5 animate-spin" />
                      : sent
                      ? <><CheckCircle className="w-5 h-5" /> Sent Successfully!</>
                      : <><Send className="w-4 h-4" /> Dispatch Push Notification</>
                    }
                  </button>
                </div>
              </div>
            </div>

            {/* ── LIVE PREVIEW PHONE ── */}
            <div className="flex flex-col items-center">
               <div className="w-[300px] h-[600px] bg-slate-900 rounded-[40px] shadow-2xl p-3 relative border-[8px] border-slate-800">
                  {/* Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-800 rounded-b-2xl z-20"></div>
                  
                  {/* Screen Content */}
                  <div className="w-full h-full bg-gradient-to-br from-indigo-200 via-sky-200 to-emerald-200 rounded-[28px] relative overflow-hidden flex flex-col items-center pt-10">
                     <p className="text-4xl font-light text-slate-800 mb-1">10:42</p>
                     <p className="text-[10px] font-bold text-slate-600 uppercase tracking-widest mb-6">Tuesday, June 2</p>

                     {/* Notification Bubble */}
                     <div className="w-[90%] bg-white/80 backdrop-blur-md rounded-2xl shadow-lg shadow-slate-900/10 overflow-hidden flex flex-col p-3 mx-auto animate-in fade-in slide-in-from-top-4 duration-300">
                       <div className="flex items-center justify-between mb-2">
                         <div className="flex items-center gap-2">
                           <div className="w-5 h-5 bg-indigo-600 rounded flex items-center justify-center text-[10px] font-bold text-white">RF</div>
                           <span className="text-[11px] font-bold text-slate-800 uppercase">Rodofood</span>
                         </div>
                         <span className="text-[9px] text-slate-500">NOW</span>
                       </div>
                       
                       <p className="font-bold text-slate-900 text-[13px] leading-tight mb-1">{title || 'Notification Title'}</p>
                       <p className="text-slate-600 text-[11px] leading-snug line-clamp-3 mb-2">{message || 'Create a notification in the composition panel to preview how it renders on customer handsets.'}</p>
                       
                       {(imagePreview || imageUrl) && (
                         <div className="w-full h-28 relative rounded-lg overflow-hidden bg-slate-200 mt-1 border border-slate-200">
                           {/* eslint-disable-next-line @next/next/no-img-element */}
                           <img src={imagePreview || imageUrl} alt="Push banner" className="w-full h-full object-cover" />
                         </div>
                       )}
                     </div>

                     <div className="absolute bottom-6 flex flex-col items-center gap-2 w-full">
                        <p className="text-[9px] font-bold text-slate-600 uppercase tracking-widest flex items-center gap-1">
                          <span className="w-3 h-4 border-2 border-slate-600 rounded-full border-t-0 border-l-0 rotate-45 transform -translate-y-1 inline-block"></span>
                          Swipe up to open
                        </p>
                     </div>
                  </div>
               </div>
               <p className="text-[10px] text-slate-400 mt-4 text-center">Interactive lock-screen visualization.</p>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'topics' && (
        <div className="grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-6">
           {/* ── CREATE TOPIC ── */}
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 h-fit">
             <h2 className="font-black text-slate-900 text-base flex items-center gap-2 mb-6">
               <Plus className="w-4 h-4 text-indigo-500" /> Add Custom Audience Topic
             </h2>

             <div className="space-y-4">
               <div>
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Topic Key Name <span className="text-red-500">*</span></label>
                 <input value={topicKey} onChange={e => setTopicKey(e.target.value.toLowerCase().replace(/\s+/g, '_'))} 
                   placeholder="e.g. premium_users"
                   className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500" />
                 <p className="text-[9px] text-slate-400 mt-1">Letters, numbers, and underscores only. Generates Firebase group: group_{topicKey}</p>
               </div>
               <div>
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Display Label Name <span className="text-red-500">*</span></label>
                 <input value={topicLabel} onChange={e => setTopicLabel(e.target.value)} 
                   placeholder="e.g. Premium App Users"
                   className="w-full h-10 px-3 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500" />
               </div>
               <div>
                 <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 block">Description</label>
                 <textarea value={topicDesc} onChange={e => setTopicDesc(e.target.value)} rows={3}
                   placeholder="What is this notification group targeting..."
                   className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm outline-none focus:border-indigo-500 resize-none" />
               </div>
               <label className="flex items-center justify-between p-3 border border-slate-200 rounded-lg bg-slate-50 cursor-pointer">
                  <div>
                    <p className="text-sm font-bold text-slate-800">Auto-Subscribe Devices</p>
                    <p className="text-[10px] text-slate-500">Join new devices matching rules</p>
                  </div>
                  <input type="checkbox" checked={autoSubscribe} onChange={e => setAutoSubscribe(e.target.checked)} className="w-5 h-5 accent-indigo-600 cursor-pointer" />
               </label>

               <button
                  onClick={() => createTopicMut.mutate()}
                  disabled={!topicKey || !topicLabel || createTopicMut.isPending}
                  className="w-full h-11 text-white font-bold text-sm rounded-lg flex items-center justify-center gap-2 transition-all bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                  <Plus className="w-4 h-4" /> Add Custom Topic
               </button>
               {createTopicMut.isError && (
                 <p className="text-red-500 text-xs text-center">{(createTopicMut.error as any)?.response?.data?.message || 'Failed to create'}</p>
               )}
             </div>
           </div>

           {/* ── TOPICS TABLE ── */}
           <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
             <div className="flex items-center justify-between mb-6">
                <h2 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Settings2 className="w-4 h-4 text-slate-400" /> Active Custom Topics
                </h2>
                <button onClick={() => qc.invalidateQueries({ queryKey: ['fcm-topics'] })} className="text-[10px] font-bold text-slate-500 border border-slate-200 rounded px-2 py-1 flex items-center gap-1 hover:bg-slate-50">
                  Reload Topics
                </button>
             </div>

             <div className="overflow-x-auto">
               <table className="w-full text-left border-collapse">
                 <thead>
                   <tr className="border-b-2 border-slate-100">
                     <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider w-[40%]">Topic Details</th>
                     <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">Firebase Key Group</th>
                     <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Subscribers</th>
                     <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-center">Status</th>
                     <th className="pb-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider text-right">Actions</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-100">
                   {topicsLoading ? (
                     <tr><td colSpan={5} className="py-8 text-center text-slate-400"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></td></tr>
                   ) : topics?.length === 0 ? (
                     <tr><td colSpan={5} className="py-12 text-center text-sm font-bold text-slate-400">No custom topics found</td></tr>
                   ) : (
                     topics?.map((t: any) => (
                       <tr key={t._id} className="group hover:bg-slate-50/50 transition-colors">
                         <td className="py-4">
                           <p className="font-bold text-slate-900 text-sm">{t.displayName}</p>
                           {t.autoSubscribe && <span className="inline-block mt-1 text-[9px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-200 rounded px-1.5 py-0.5">⚡ AUTO-SUBSCRIBE ENABLED</span>}
                         </td>
                         <td className="py-4">
                           <code className="text-xs bg-slate-100 text-slate-600 px-2 py-1 rounded">{t.topicKey}</code>
                         </td>
                         <td className="py-4 text-center font-black text-slate-700 text-sm">{t.subscribersCount || 0}</td>
                         <td className="py-4 text-center">
                           <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${t.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-200' : 'bg-slate-100 text-slate-500 border-slate-200'}`}>
                             {t.status}
                           </span>
                         </td>
                         <td className="py-4 text-right">
                           <div className="flex items-center justify-end gap-2">
                             <button onClick={() => { setSelectedTopicForEnroll(t); setEnrollModalOpen(true); }}
                               className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[11px] font-bold rounded-lg transition-colors shadow-sm shadow-rose-200 flex items-center gap-1">
                               <Plus className="w-3 h-3" /> Subscribers
                             </button>
                             <button onClick={() => deleteTopicMut.mutate(t._id)}
                               className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors">
                               <Trash2 className="w-4 h-4" />
                             </button>
                           </div>
                         </td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
             </div>
           </div>
        </div>
      )}

      {enrollModalOpen && (
         <DeviceEnrollmentModal 
           onClose={() => { setEnrollModalOpen(false); setSelectedTopicForEnroll(null); }}
           selectedTopic={selectedTopicForEnroll}
           topics={topics}
         />
      )}

    </div>
  );
}
