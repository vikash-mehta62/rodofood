'use client';
import { useState } from 'react';
import { X, Search, Settings2, Plus, Minus, Loader2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';

interface Props {
  onClose: () => void;
  selectedTopic: any;
  topics: any[];
}

export default function DeviceEnrollmentModal({ onClose, selectedTopic, topics }: Props) {
  const qc = useQueryClient();
  const [topicKey, setTopicKey] = useState(selectedTopic?.topicKey || '');
  const [search, setSearch] = useState('');
  const [customToken, setCustomToken] = useState('');
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [selectedTokens, setSelectedTokens] = useState<string[]>([]);

  // Fetch all devices
  const { data: devices, isLoading } = useQuery({
    queryKey: ['fcm-devices'],
    queryFn: async () => (await api.get('/fcm/devices')).data.data,
  });

  const subMut = useMutation({
    mutationFn: (fcmTokens: string[]) => api.post('/fcm/subscribe', { fcmTokens, topic: topicKey, deviceIds: selectedIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fcm-devices'] });
      qc.invalidateQueries({ queryKey: ['fcm-topics'] });
      setSelectedIds([]); setSelectedTokens([]); setCustomToken('');
      alert('Successfully Subscribed!');
    }
  });

  const unsubMut = useMutation({
    mutationFn: (fcmTokens: string[]) => api.post('/fcm/unsubscribe', { fcmTokens, topic: topicKey, deviceIds: selectedIds }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['fcm-devices'] });
      qc.invalidateQueries({ queryKey: ['fcm-topics'] });
      setSelectedIds([]); setSelectedTokens([]); setCustomToken('');
      alert('Successfully Unsubscribed!');
    }
  });

  const toggleDevice = (d: any) => {
    if (selectedIds.includes(d.deviceId)) {
      setSelectedIds(prev => prev.filter(id => id !== d.deviceId));
      setSelectedTokens(prev => prev.filter(t => t !== d.fcmToken));
    } else {
      setSelectedIds(prev => [...prev, d.deviceId]);
      setSelectedTokens(prev => [...prev, d.fcmToken]);
    }
  };

  const handleCustomAdd = () => {
    if (customToken && !selectedTokens.includes(customToken)) {
      setSelectedTokens(prev => [...prev, customToken]);
      setCustomToken('');
    }
  };

  const customers = devices?.filter((d: any) => d.userId) || [];
  const partners = devices?.filter((d: any) => d.vendorId) || [];

  const filterDevices = (list: any[]) => list.filter(d => {
    const term = search.toLowerCase();
    const name = d.userId?.name || d.vendorId?.restaurantName || '';
    const phone = d.userId?.phone || d.vendorId?.phone || '';
    return name.toLowerCase().includes(term) || phone.includes(term) || d.deviceId.toLowerCase().includes(term);
  });

  const filteredCustomers = filterDevices(customers);
  const filteredPartners = filterDevices(partners);

  const selectAll = () => {
    const all = [...filteredCustomers, ...filteredPartners];
    setSelectedIds(all.map(d => d.deviceId));
    setSelectedTokens(all.map(d => d.fcmToken));
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-4xl flex flex-col md:flex-row overflow-hidden animate-in zoom-in-95 duration-200">
        
        {/* LEFT PANEL */}
        <div className="w-full md:w-[35%] bg-slate-50 p-6 sm:p-8 border-r border-slate-200 flex flex-col">
           <div className="flex items-center gap-2 text-rose-500 mb-6">
             <Settings2 className="w-5 h-5" />
             <h2 className="text-lg font-black text-slate-900">Manual Device Enrollment</h2>
           </div>

           <div className="space-y-6 flex-1">
             <div>
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Select Audience Topic <span className="text-red-500">*</span></label>
               <select value={topicKey} onChange={e => setTopicKey(e.target.value)}
                 className="w-full h-11 px-3 border border-slate-300 rounded-lg text-sm outline-none focus:border-rose-400 bg-white">
                 <option value="" disabled>Choose topic...</option>
                 {topics?.map((t: any) => (
                   <option key={t._id} value={t.topicKey}>{t.displayName} (group_{t.topicKey})</option>
                 ))}
               </select>
             </div>

             <div>
               <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Selected Devices ({selectedTokens.length})</label>
               <div className="h-24 border-2 border-dashed border-slate-200 rounded-xl bg-white flex flex-col items-center justify-center text-center p-2 overflow-y-auto">
                 {selectedTokens.length === 0 ? (
                   <p className="text-xs italic text-slate-400">No devices selected yet. Select devices from the list on the right.</p>
                 ) : (
                   <div className="flex flex-wrap gap-1 w-full">
                     {selectedTokens.map(t => (
                       <span key={t} className="text-[9px] bg-slate-100 border border-slate-200 text-slate-600 px-1.5 py-0.5 rounded truncate max-w-[100px]">{t}</span>
                     ))}
                   </div>
                 )}
               </div>
             </div>
           </div>

           <div className="grid grid-cols-2 gap-3 mt-6">
             <button onClick={() => subMut.mutate(selectedTokens)} disabled={!topicKey || selectedTokens.length === 0 || subMut.isPending}
               className="h-11 bg-emerald-400 hover:bg-emerald-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-1 transition-colors disabled:opacity-50">
               {subMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Plus className="w-4 h-4" /> Subscribe</>}
             </button>
             <button onClick={() => unsubMut.mutate(selectedTokens)} disabled={!topicKey || selectedTokens.length === 0 || unsubMut.isPending}
               className="h-11 bg-rose-400 hover:bg-rose-500 text-white text-sm font-bold rounded-xl flex items-center justify-center gap-1 transition-colors disabled:opacity-50">
               {unsubMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Minus className="w-4 h-4" /> Unsubscribe</>}
             </button>
           </div>
        </div>

        {/* RIGHT PANEL */}
        <div className="w-full md:w-[65%] bg-white p-6 sm:p-8 flex flex-col h-[500px] md:h-auto relative">
           <button onClick={onClose} className="absolute top-6 right-6 p-2 text-slate-400 hover:text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-full transition-colors">
             <X className="w-5 h-5" />
           </button>

           <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-2 block">Choose Registered Devices</label>
           
           <div className="flex items-center gap-2 mb-4">
             <div className="relative flex-1">
               <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
               <input value={search} onChange={e => setSearch(e.target.value)}
                 placeholder="Search name, contact, platform, device ID..."
                 className="w-full h-11 pl-9 pr-4 border border-slate-200 rounded-xl text-sm outline-none focus:border-rose-400" />
             </div>
           </div>

           <div className="flex items-center gap-2 mb-4">
             <div className="relative flex-1">
               <span className="absolute left-3 top-3 text-lg">✍️</span>
               <input value={customToken} onChange={e => setCustomToken(e.target.value)}
                 placeholder="Paste custom device ID/FCM token"
                 className="w-full h-11 pl-10 pr-4 border border-slate-200 rounded-xl text-sm outline-none focus:border-indigo-400" />
             </div>
             <button onClick={handleCustomAdd} disabled={!customToken}
               className="h-11 px-6 bg-indigo-600 text-white text-sm font-bold rounded-xl disabled:opacity-50">
               Add
             </button>
           </div>

           <div className="flex-1 overflow-y-auto border border-slate-200 rounded-xl p-2 relative">
              {isLoading ? (
                <div className="flex items-center justify-center h-full"><Loader2 className="w-6 h-6 animate-spin text-slate-400" /></div>
              ) : (
                <>
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider sticky top-0 bg-white/90 backdrop-blur p-2 z-10 flex items-center gap-2">
                    <span className="w-4 h-4 bg-indigo-100 text-indigo-600 rounded flex items-center justify-center">👤</span> CUSTOMERS ({filteredCustomers.length})
                  </p>
                  <div className="space-y-1 mb-4">
                    {filteredCustomers.map(d => (
                      <label key={d.deviceId} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                        <input type="checkbox" checked={selectedIds.includes(d.deviceId)} onChange={() => toggleDevice(d)} className="w-4 h-4 accent-indigo-600" />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{d.userId?.name || 'Unknown'} <span className="text-slate-400 font-normal">({d.userId?.phone || 'No phone'})</span></p>
                        </div>
                      </label>
                    ))}
                    {filteredCustomers.length === 0 && <p className="text-xs text-slate-400 px-2 italic">No customers match search.</p>}
                  </div>

                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-wider sticky top-0 bg-white/90 backdrop-blur p-2 z-10 flex items-center gap-2">
                    <span className="w-4 h-4 bg-orange-100 text-orange-600 rounded flex items-center justify-center">🏪</span> PARTNERS ({filteredPartners.length})
                  </p>
                  <div className="space-y-1">
                    {filteredPartners.map(d => (
                      <label key={d.deviceId} className="flex items-center gap-3 p-2 hover:bg-slate-50 rounded-lg cursor-pointer">
                        <input type="checkbox" checked={selectedIds.includes(d.deviceId)} onChange={() => toggleDevice(d)} className="w-4 h-4 accent-indigo-600" />
                        <div>
                          <p className="text-sm font-bold text-slate-800">{d.vendorId?.restaurantName || 'Unknown'} <span className="text-slate-400 font-normal">({d.vendorId?.phone || 'No phone'})</span></p>
                        </div>
                      </label>
                    ))}
                    {filteredPartners.length === 0 && <p className="text-xs text-slate-400 px-2 italic">No partners match search.</p>}
                  </div>
                </>
              )}
           </div>
           
           <div className="flex items-center justify-between mt-3 px-1">
             <button onClick={selectAll} className="text-[10px] font-bold text-indigo-600 hover:underline">Select All Matching ({(filteredCustomers.length + filteredPartners.length)})</button>
             <button onClick={() => { setSelectedIds([]); setSelectedTokens([]); }} className="text-[10px] font-bold text-rose-500 hover:underline">Clear Selections</button>
           </div>
        </div>

      </div>
    </div>
  );
}
