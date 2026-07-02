'use client';
import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  QrCode, Plus, Trash2, Download, Eye, X, Loader2, Info, MapPin, Clock, Calendar, Share2, Edit, Store
} from 'lucide-react';
import api from '@/lib/axios';

interface StopItem {
  stopNumber: number;
  restaurantId: string;
  stopTime: string;
  stopDuration: string; // in minutes
}

const getHour = (time: string) => {
  return time.split(':')[0] || '12';
};

const getMin = (time: string) => {
  const rest = time.split(':')[1] || '';
  return rest.split(' ')[0] || '00';
};

const getAmpm = (time: string) => {
  return time.endsWith('PM') ? 'PM' : 'AM';
};

export default function AdminQRsPage() {
  const qc = useQueryClient();
  const [showAddModal, setShowAddModal] = useState(false);
  const [editQR, setEditQR] = useState<any>(null);
  const [selectedQR, setSelectedQR] = useState<any>(null);

  // Queries
  const { data: qrsData, isLoading: isQRsLoading } = useQuery({
    queryKey: ['admin-qrs'],
    queryFn: async () => (await api.get('/qrs')).data.data.qrs,
  });

  const { data: routesData } = useQuery({
    queryKey: ['admin-routes'],
    queryFn: async () => (await api.get('/routes')).data.data.routes,
  });

  const { data: restaurantsResponse } = useQuery({
    queryKey: ['admin-restaurants-list'],
    queryFn: async () => (await api.get('/restaurants', { params: { limit: 100 } })).data,
  });

  const routes = routesData || [];
  const qrs = qrsData || [];
  const allRestaurants = restaurantsResponse?.data || [];

  // Mutations
  const addQRMut = useMutation({
    mutationFn: (payload: any) => api.post('/qrs', payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-qrs'] });
      setShowAddModal(false);
    },
  });

  const updateQRMut = useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: any }) => api.put(`/qrs/${id}`, payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-qrs'] });
      setEditQR(null);
    },
  });

  const deleteQRMut = useMutation({
    mutationFn: (id: string) => api.delete(`/qrs/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-qrs'] });
    },
  });

  // Handle Download QR code image
  const handleDownload = async (qr: any) => {
    try {
      // 1. Create a canvas of high resolution (600 width, 850 height)
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 850;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // 2. Draw white background
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(0, 0, 600, 850);

      // Card border (thick brand orange)
      ctx.strokeStyle = '#FF6B35';
      ctx.lineWidth = 12;
      ctx.strokeRect(6, 6, 588, 838);

      // Inner thin grey boundary
      ctx.strokeStyle = '#E2E8F0';
      ctx.lineWidth = 2;
      ctx.strokeRect(20, 20, 560, 810);

      // 3. Draw RodoFood Logo
      const drawRoundRect = (x: number, y: number, w: number, h: number, r: number) => {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.arcTo(x + w, y, x + w, y + h, r);
        ctx.arcTo(x + w, y + h, x, y + h, r);
        ctx.arcTo(x, y + h, x, y, r);
        ctx.arcTo(x, y, x + w, y, r);
        ctx.closePath();
        ctx.fill();
      };

      // 3. Draw RodoFood Logo Image
      const logoImg = new Image();
      logoImg.src = '/logo.jpeg';
      await new Promise((resolve, reject) => {
        logoImg.onload = resolve;
        logoImg.onerror = reject;
      });

      // Draw logo centered (dimensions: 180 width, 60 height)
      const logoWidth = 180;
      const logoHeight = 60;
      const logoX = (600 - logoWidth) / 2;
      ctx.drawImage(logoImg, logoX, 50, logoWidth, logoHeight);

      // 4. Draw Route Name Pill
      const routeText = `ROUTE: ${(qr.route?.name || 'Default Highway').toUpperCase()}`;
      ctx.font = '900 15px sans-serif';
      const textWidth = ctx.measureText(routeText).width;
      const pillWidth = textWidth + 40;
      const pillX = (600 - pillWidth) / 2;

      ctx.fillStyle = '#F1F5F9';
      drawRoundRect(pillX, 130, pillWidth, 36, 18);

      ctx.fillStyle = '#64748B';
      ctx.textAlign = 'center';
      ctx.fillText(routeText, 300, 148);

      // 5. Load and Draw the QR Code image (CORS-friendly)
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${encodeURIComponent(qr.url)}`;
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.src = qrUrl;

      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
      });

      // Draw QR Code centered
      ctx.drawImage(img, 100, 210, 400, 400);

      // 6. Draw Redirection Link Bubble
      ctx.fillStyle = '#FFF7ED';
      drawRoundRect(60, 650, 480, 85, 20);

      // Link bubble orange border
      ctx.strokeStyle = '#FED7AA';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(80, 650);
      ctx.arcTo(540, 650, 540, 735, 20);
      ctx.arcTo(540, 735, 60, 735, 20);
      ctx.arcTo(60, 735, 60, 650, 20);
      ctx.arcTo(60, 650, 540, 650, 20);
      ctx.closePath();
      ctx.stroke();

      // Text in link bubble
      ctx.fillStyle = '#EA580C';
      ctx.font = '900 12px sans-serif';
      ctx.fillText('SCAN TO ORDER FOOD ONLINE', 300, 675);

      // Truncate display URL if extremely long
      let displayUrl = qr.url;
      if (displayUrl.length > 42) {
        displayUrl = displayUrl.substring(0, 42) + '...';
      }

      ctx.fillStyle = '#431407';
      ctx.font = 'bold 15px sans-serif';
      ctx.fillText(displayUrl, 300, 710);

      // 7. Trigger Download as PNG image
      const dataUrl = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = dataUrl;
      link.download = `${qr.title.replace(/\s+/g, '_')}_sticker.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      console.error('Error generating printable sticker:', err);
      // Fallback to downloading raw QR code
      const fallbackUrl = `https://api.qrserver.com/v1/create-qr-code/?size=500x500&data=${encodeURIComponent(qr.url)}`;
      const link = document.createElement('a');
      link.href = fallbackUrl;
      link.download = `${qr.title.replace(/\s+/g, '_')}_qr.png`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen" style={{ background: '#F1F5F9' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">QR Code Generator</h1>
          <p className="text-slate-400 text-sm font-medium mt-0.5">Generate stop-level QR codes for routes timeline</p>
        </div>
        <button onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 rounded-xl text-xs font-black text-white flex items-center gap-1.5 shadow-md hover:scale-[1.02] active:scale-[0.98] transition-all"
          style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
          <Plus className="w-4 h-4" /> Generate QR Code
        </button>
      </div>

      {isQRsLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {qrs.length > 0 ? (
            qrs.map((qr: any) => (
              <div key={qr._id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="p-2.5 bg-orange-50 rounded-xl">
                      <QrCode className="w-6 h-6 text-orange-500" />
                    </div>
                    
                    <div className="flex gap-1.5">
                      <button onClick={() => {
                        navigator.clipboard.writeText(qr.url);
                        alert('Redirection link copied to clipboard!');
                      }}
                        className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-orange-500 hover:bg-orange-50 transition-colors"
                        title="Copy Link">
                        <Share2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => setEditQR(qr)}
                        className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-blue-500 hover:bg-blue-50 transition-colors"
                        title="Edit QR Stop">
                        <Edit className="w-4 h-4" />
                      </button>
                      <button onClick={() => deleteQRMut.mutate(qr._id)} disabled={deleteQRMut.isPending}
                        className="p-2 rounded-lg bg-slate-50 text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                        title="Delete QR">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="font-black text-slate-950 text-sm mb-2">{qr.title}</h3>
                  
                  <div className="space-y-1.5 text-xs text-slate-500 font-medium">
                    <p className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-slate-400" />
                      Route: <span className="font-bold text-slate-700">{qr.route?.name || 'Deleted Route'}</span>
                    </p>
                    
                    {/* Stops summary */}
                    {qr.stops?.length > 0 && (
                      <div className="pt-2 border-t border-slate-50 mt-2 space-y-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Stops Sequence:</p>
                        <div className="space-y-1 pl-2 border-l-2 border-orange-200">
                          {qr.stops.map((s: any) => (
                            <p key={s._id} className="text-[11px] text-slate-700 font-bold">
                              Stop #{s.stopNumber}: <span className="text-orange-500">{s.restaurant?.name || 'Unknown'}</span> ({s.stopTime})
                            </p>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-50 flex gap-2">
                  <button onClick={() => setSelectedQR(qr)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl border border-slate-200 text-xs font-black text-slate-600 bg-white hover:bg-slate-50 transition-colors">
                    <Eye className="w-3.5 h-3.5" /> View QR
                  </button>
                  <button onClick={() => handleDownload(qr)}
                    className="flex-1 flex items-center justify-center gap-1 px-3 py-2 rounded-xl text-xs font-black text-white hover:opacity-90 transition-opacity"
                    style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                    <Download className="w-3.5 h-3.5" /> Download
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-20 bg-white rounded-2xl border border-slate-100 shadow-sm">
              <QrCode className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="font-black text-slate-400 text-sm">No QR codes generated yet</p>
            </div>
          )}
        </div>
      )}

      {/* Add Modal */}
      {showAddModal && (
        <AddQRModal
          routes={routes}
          allRestaurants={allRestaurants}
          onClose={() => setShowAddModal(false)}
          onSubmit={(payload) => addQRMut.mutate(payload)}
          isPending={addQRMut.isPending}
        />
      )}

      {/* Edit Modal */}
      {editQR && (
        <EditQRModal
          qr={editQR}
          routes={routes}
          allRestaurants={allRestaurants}
          onClose={() => setEditQR(null)}
          onSubmit={(payload) => updateQRMut.mutate({ id: editQR._id, payload })}
          isPending={updateQRMut.isPending}
        />
      )}

      {/* View Modal */}
      {selectedQR && (
        <ViewQRModal
          qr={selectedQR}
          onClose={() => setSelectedQR(null)}
          onDownload={() => handleDownload(selectedQR)}
        />
      )}
    </div>
  );
}

function AddQRModal({ routes, allRestaurants, onClose, onSubmit, isPending }: {
  routes: any[];
  allRestaurants: any[];
  onClose: () => void;
  onSubmit: (payload: any) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState('');
  const [routeId, setRouteId] = useState('');
  const [stops, setStops] = useState<StopItem[]>([
    { stopNumber: 1, restaurantId: '', stopTime: '12:00 PM', stopDuration: '' }
  ]);

  // Filter restaurants serving the selected route
  const routeRestaurants = allRestaurants.filter((res: any) =>
    res.routes?.some((r: any) => String(r._id || r) === String(routeId))
  );

  const addStop = () => {
    setStops(prev => [
      ...prev,
      { stopNumber: prev.length + 1, restaurantId: '', stopTime: '12:00 PM', stopDuration: '' }
    ]);
  };

  const removeStop = (index: number) => {
    setStops(prev =>
      prev.filter((_, idx) => idx !== index).map((s, idx) => ({ ...s, stopNumber: idx + 1 }))
    );
  };

  const updateStop = (index: number, field: keyof StopItem, value: any) => {
    setStops(prev => prev.map((s, idx) => idx === index ? { ...s, [field]: value } : s));
  };

  const handleTimeChange = (index: number, part: 'hour' | 'min' | 'ampm', value: string) => {
    const current = stops[index].stopTime || '12:00 PM';
    const parts = current.split(':');
    let hr = parts[0] || '12';
    const rest = parts[1] || '00 PM';
    const restParts = rest.split(' ');
    let min = restParts[0] || '00';
    let ampm = restParts[1] || 'PM';

    if (part === 'hour') hr = value;
    if (part === 'min') min = value;
    if (part === 'ampm') ampm = value;

    updateStop(index, 'stopTime', `${hr}:${min} ${ampm}`);
  };

  const canSubmit = title.trim() && routeId && stops.every(s => s.restaurantId);

  const handleSubmit = () => {
    if (!canSubmit) return;
    onSubmit({
      title: title.trim(),
      routeId,
      stops: stops.map(s => ({
        restaurantId: s.restaurantId,
        stopNumber: s.stopNumber,
        stopDuration: s.stopDuration.trim() || undefined,
        stopTime: s.stopTime.trim() || undefined,
      })),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-black text-slate-900">Generate Route QR Code</h2>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Generate one QR code containing multiple stop configurations</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        {/* Content (Scrollable) */}
        <div className="p-5 space-y-4 overflow-y-auto flex-1 font-sans">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">QR Title *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                placeholder="e.g. Bhopal Indore Highway Express"
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-400 transition-colors" />
            </div>

            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Select Route *</label>
              <select value={routeId} onChange={e => { setRouteId(e.target.value); setStops([{ stopNumber: 1, restaurantId: '', stopTime: '12:00 PM', stopDuration: '' }]); }}
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-400 bg-white transition-colors">
                <option value="">-- Choose Route --</option>
                {routes.map(r => (
                  <option key={r._id} value={r._id}>{r.name} ({r.fromCity} to {r.toCity})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stops List */}
          {routeId && (
            <div className="space-y-4 pt-2">
              <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Configure Journey Stops</h3>
              
              {stops.map((stop, idx) => (
                <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 relative space-y-3">
                  
                  {/* Stop Header */}
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-orange-500 bg-orange-50 border border-orange-100 rounded-lg px-2.5 py-1">
                      Stop #{stop.stopNumber}
                    </span>
                    {stops.length > 1 && (
                      <button onClick={() => removeStop(idx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  {/* Fields Row */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    
                    {/* Select Stop Restaurant */}
                    <div className="col-span-1">
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 block font-sans">Select Restaurant *</label>
                      <select value={stop.restaurantId} onChange={e => updateStop(idx, 'restaurantId', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-orange-400 bg-white transition-colors font-medium">
                        <option value="">-- Choose Restaurant --</option>
                        {routeRestaurants.map((res: any) => (
                          <option key={res._id} value={res._id}>{res.name} ({res.address?.city || 'No City'})</option>
                        ))}
                      </select>
                    </div>

                    {/* Arrive Time */}
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Arrive Time</label>
                      <div className="flex gap-1">
                        <select value={getHour(stop.stopTime)} onChange={e => handleTimeChange(idx, 'hour', e.target.value)}
                          className="flex-1 px-2 py-2 border-2 border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-orange-400 bg-white transition-colors font-medium">
                          {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                            <option key={h} value={h}>{h}</option>
                          ))}
                        </select>
                        <select value={getMin(stop.stopTime)} onChange={e => handleTimeChange(idx, 'min', e.target.value)}
                          className="flex-1 px-2 py-2 border-2 border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-orange-400 bg-white transition-colors font-medium">
                          {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                            <option key={m} value={m}>{m}</option>
                          ))}
                        </select>
                        <select value={getAmpm(stop.stopTime)} onChange={e => handleTimeChange(idx, 'ampm', e.target.value)}
                          className="px-2 py-2 border-2 border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-orange-400 bg-white transition-colors font-medium font-bold">
                          <option value="AM font-sans">AM</option>
                          <option value="PM font-sans">PM</option>
                        </select>
                      </div>
                    </div>

                    {/* Duration in minutes */}
                    <div>
                      <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Duration (In Mins)</label>
                      <input type="number" min="1" placeholder="e.g. 15" value={stop.stopDuration} onChange={e => updateStop(idx, 'stopDuration', e.target.value)}
                        className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-orange-400 transition-colors font-medium" />
                    </div>

                  </div>
                </div>
              ))}

              <button onClick={addStop}
                className="w-full py-3 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:text-orange-500 hover:border-orange-500 transition-all font-black text-xs flex items-center justify-center gap-1.5">
                <Plus className="w-4 h-4" /> Add New Stop
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-black border border-slate-200 text-slate-500 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!canSubmit || isPending}
            className="px-4 py-2 rounded-xl text-xs font-black text-white flex items-center gap-1.5 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <QrCode className="w-3.5 h-3.5" />} Generate QR Code
          </button>
        </div>

      </div>
    </div>
  );
}

function EditQRModal({ qr, routes, allRestaurants, onClose, onSubmit, isPending }: {
  qr: any;
  routes: any[];
  allRestaurants: any[];
  onClose: () => void;
  onSubmit: (payload: any) => void;
  isPending: boolean;
}) {
  const [title, setTitle] = useState(qr.title || '');
  const [routeId, setRouteId] = useState(qr.route?._id || qr.route || '');
  const [stops, setStops] = useState<StopItem[]>(
    qr.stops?.map((s: any) => ({
      stopNumber: s.stopNumber,
      restaurantId: s.restaurant?._id || s.restaurant || '',
      stopTime: s.stopTime || '12:00 PM',
      stopDuration: String(s.stopDuration || '').replace(/\s*mins?/i, ''),
    })) || [{ stopNumber: 1, restaurantId: '', stopTime: '12:00 PM', stopDuration: '' }]
  );

  // Filter restaurants serving this route
  const routeRestaurants = allRestaurants.filter((res: any) =>
    res.routes?.some((r: any) => String(r._id || r) === String(routeId))
  );

  const addStop = () => {
    setStops(prev => [
      ...prev,
      { stopNumber: prev.length + 1, restaurantId: '', stopTime: '12:00 PM', stopDuration: '' }
    ]);
  };

  const removeStop = (index: number) => {
    setStops(prev =>
      prev.filter((_, idx) => idx !== index).map((s, idx) => ({ ...s, stopNumber: idx + 1 }))
    );
  };

  const updateStop = (index: number, field: keyof StopItem, value: any) => {
    setStops(prev => prev.map((s, idx) => idx === index ? { ...s, [field]: value } : s));
  };

  const handleTimeChange = (index: number, part: 'hour' | 'min' | 'ampm', value: string) => {
    const current = stops[index].stopTime || '12:00 PM';
    const parts = current.split(':');
    let hr = parts[0] || '12';
    const rest = parts[1] || '00 PM';
    const restParts = rest.split(' ');
    let min = restParts[0] || '00';
    let ampm = restParts[1] || 'PM';

    if (part === 'hour') hr = value;
    if (part === 'min') min = value;
    if (part === 'ampm') ampm = value;

    updateStop(index, 'stopTime', `${hr}:${min} ${ampm}`);
  };

  const handleSubmit = () => {
    if (!title.trim() || !routeId || stops.some(s => !s.restaurantId)) return;
    onSubmit({
      title: title.trim(),
      routeId,
      stops: stops.map(s => ({
        restaurantId: s.restaurantId,
        stopNumber: s.stopNumber,
        stopDuration: s.stopDuration.trim() || undefined,
        stopTime: s.stopTime.trim() || undefined,
      })),
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-shrink-0">
          <div>
            <h2 className="text-base font-black text-slate-900">Edit Stop QR Code Configuration</h2>
            <p className="text-[11px] text-slate-400 font-medium mt-0.5">Modify stops configuration and details for this route journey</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto flex-1 font-sans">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">QR Title *</label>
              <input type="text" value={title} onChange={e => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-400 transition-colors" />
            </div>

            <div>
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-1.5 block">Select Route *</label>
              <select value={routeId} onChange={e => { setRouteId(e.target.value); setStops([{ stopNumber: 1, restaurantId: '', stopTime: '12:00 PM', stopDuration: '' }]); }}
                className="w-full px-4 py-2.5 border-2 border-slate-200 rounded-xl text-sm font-semibold outline-none focus:border-orange-400 bg-white transition-colors">
                {routes.map(r => (
                  <option key={r._id} value={r._id}>{r.name} ({r.fromCity} to {r.toCity})</option>
                ))}
              </select>
            </div>
          </div>

          {/* Stops List */}
          <div className="space-y-4 pt-2">
            <h3 className="text-xs font-black text-slate-900 uppercase tracking-wider">Journey Stops List</h3>
            
            {stops.map((stop, idx) => (
              <div key={idx} className="bg-slate-50 border border-slate-100 rounded-2xl p-4 relative space-y-3">
                
                {/* Stop Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-orange-500 bg-orange-50 border border-orange-100 rounded-lg px-2.5 py-1">
                    Stop #{stop.stopNumber}
                  </span>
                  {stops.length > 1 && (
                    <button onClick={() => removeStop(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Fields Row */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  
                  {/* Select Stop Restaurant */}
                  <div className="col-span-1">
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Select Restaurant *</label>
                    <select value={stop.restaurantId} onChange={e => updateStop(idx, 'restaurantId', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-orange-400 bg-white transition-colors font-medium">
                      <option value="">-- Choose Restaurant --</option>
                      {routeRestaurants.map((res: any) => (
                        <option key={res._id} value={res._id}>{res.name} ({res.address?.city || 'No City'})</option>
                      ))}
                    </select>
                  </div>

                  {/* Arrive Time */}
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Arrive Time</label>
                    <div className="flex gap-1">
                      <select value={getHour(stop.stopTime)} onChange={e => handleTimeChange(idx, 'hour', e.target.value)}
                        className="flex-1 px-2 py-2 border-2 border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-orange-400 bg-white transition-colors font-medium">
                        {Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0')).map(h => (
                          <option key={h} value={h}>{h}</option>
                        ))}
                      </select>
                      <select value={getMin(stop.stopTime)} onChange={e => handleTimeChange(idx, 'min', e.target.value)}
                        className="flex-1 px-2 py-2 border-2 border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-orange-400 bg-white transition-colors font-medium">
                        {Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0')).map(m => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <select value={getAmpm(stop.stopTime)} onChange={e => handleTimeChange(idx, 'ampm', e.target.value)}
                        className="px-2 py-2 border-2 border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-orange-400 bg-white transition-colors font-medium">
                        <option value="AM">AM</option>
                        <option value="PM">PM</option>
                      </select>
                    </div>
                  </div>

                  {/* Duration in minutes */}
                  <div>
                    <label className="text-[10px] font-black text-slate-500 uppercase tracking-wider mb-1 block">Duration (In Mins)</label>
                    <input type="number" min="1" placeholder="e.g. 15" value={stop.stopDuration} onChange={e => updateStop(idx, 'stopDuration', e.target.value)}
                      className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-xs font-semibold outline-none focus:border-orange-400 transition-colors font-medium" />
                  </div>

                </div>
              </div>
            ))}

            <button onClick={addStop}
              className="w-full py-3 border-2 border-dashed border-slate-300 rounded-2xl text-slate-500 hover:text-orange-500 hover:border-orange-500 transition-all font-black text-xs flex items-center justify-center gap-1.5">
              <Plus className="w-4 h-4" /> Add New Stop
            </button>
          </div>
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-2 flex-shrink-0">
          <button onClick={onClose} className="px-4 py-2 rounded-xl text-xs font-black border border-slate-200 text-slate-500 hover:bg-slate-50">Cancel</button>
          <button onClick={handleSubmit} disabled={!title.trim() || !routeId || stops.some(s => !s.restaurantId) || isPending}
            className="px-4 py-2 rounded-xl text-xs font-black text-white flex items-center gap-1.5 disabled:opacity-50"
            style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
            {isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <SaveIcon className="w-3.5 h-3.5" />} Save Changes
          </button>
        </div>

      </div>
    </div>
  );
}

function SaveIcon({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="2.5" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5" />
    </svg>
  );
}

function ViewQRModal({ qr, onClose, onDownload }: {
  qr: any;
  onClose: () => void;
  onDownload: () => void;
}) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(qr.url)}`;

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="bg-white rounded-3xl w-full max-w-sm shadow-2xl overflow-hidden p-6 text-center space-y-5 relative">
        
        {/* Close Button top-right */}
        <button onClick={onClose} className="absolute right-4 top-4 w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center hover:bg-slate-200 transition-colors">
          <X className="w-3.5 h-3.5 text-slate-600" />
        </button>

        {/* Brand Header */}
        <div className="flex flex-col items-center space-y-2 pt-2">
          <img src="/logo.jpeg" alt="RodoFood Logo" className="h-12 object-contain mx-auto" />
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-wider mt-1 px-4 py-0.5 bg-slate-100 rounded-full border border-slate-200">
            Route: {qr.route?.name || 'Default Highway'}
          </p>
        </div>

        {/* QR Code Container */}
        <div className="p-3.5 bg-slate-50 rounded-3xl inline-block border border-slate-100">
          <img src={qrUrl} alt={qr.title} className="w-52 h-52 mx-auto object-contain rounded-2xl shadow-sm bg-white" />
        </div>

        {/* Destination Link */}
        <div className="bg-orange-50/50 border border-orange-100 text-orange-950 rounded-2xl p-3.5 text-left space-y-1 font-sans">
          <p className="text-[9px] font-black uppercase tracking-wider text-orange-500">Scan Redirection Link</p>
          <p className="text-[11px] font-bold break-all leading-normal opacity-90 select-all cursor-pointer" 
             onClick={() => {
               navigator.clipboard.writeText(qr.url);
               alert('URL copied to clipboard!');
             }}
             title="Click to Copy">
            {qr.url}
          </p>
        </div>

        {/* Download Button */}
        <button onClick={onDownload}
          className="w-full py-3 rounded-2xl text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md hover:opacity-90 transition-opacity font-sans"
          style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
          <Download className="w-4 h-4" /> Download QR Sticker
        </button>
      </div>
    </div>
  );
}
