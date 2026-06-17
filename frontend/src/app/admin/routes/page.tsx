'use client';
import { useState, useEffect, useRef } from 'react';
import { Plus, MapPin, Loader2, Trash2, X, ChevronRight } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '@/lib/axios';
import type { Route } from '@/types';

interface WP { name: string; lat: string; lng: string; }
interface RForm { name: string; fromCity: string; toCity: string; totalDistanceKm: string; waypoints: WP[]; }
const DEF: RForm = { name:'', fromCity:'', toCity:'', totalDistanceKm:'', waypoints:[{name:'',lat:'',lng:''},{name:'',lat:'',lng:''}] };

const CITY_SUGGESTIONS = [
  { name: 'Bhopal', lat: '23.2599', lng: '77.4126' },
  { name: 'Indore', lat: '22.7196', lng: '75.8577' },
  { name: 'Sehore', lat: '23.2000', lng: '77.0833' },
  { name: 'Ashta', lat: '23.0167', lng: '76.7167' },
  { name: 'Dewas', lat: '22.9676', lng: '76.0534' },
  { name: 'Obaidullaganj', lat: '23.1167', lng: '77.5167' },
  { name: 'Ujjain', lat: '23.1760', lng: '75.7885' },
  { name: 'Jabalpur', lat: '23.1815', lng: '79.9864' },
  { name: 'Gwalior', lat: '26.2183', lng: '78.1828' },
  { name: 'Sagar', lat: '23.8388', lng: '78.7378' },
  { name: 'Shajapur', lat: '23.4286', lng: '76.2736' },
  { name: 'Ratlam', lat: '23.3315', lng: '75.0367' },
  { name: 'Hoshangabad', lat: '22.7533', lng: '77.7289' },
  { name: 'Vidisha', lat: '23.5251', lng: '77.8081' },
  { name: 'Delhi', lat: '28.6139', lng: '77.2090' },
  { name: 'Jaipur', lat: '26.9124', lng: '75.7873' },
  { name: 'Mumbai', lat: '19.0760', lng: '72.8777' },
  { name: 'Pune', lat: '18.5204', lng: '73.8567' },
  { name: 'Kotputli', lat: '27.7028', lng: '76.1983' }
];

const loadGoogleMapsScript = (callback: () => void) => {
  if (typeof window === 'undefined') return;
  if ((window as any).google && (window as any).google.maps) {
    callback();
    return;
  }
  const scriptId = 'google-maps-script';
  const existingScript = document.getElementById(scriptId);
  if (existingScript) {
    const cb = () => {
      callback();
      existingScript.removeEventListener('load', cb);
    };
    existingScript.addEventListener('load', cb);
    return;
  }
  const script = document.createElement('script');
  script.id = scriptId;
  script.src = `https://maps.googleapis.com/maps/api/js?key=${process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY}&libraries=places`;
  script.async = true;
  script.defer = true;
  script.onload = () => {
    callback();
  };
  document.body.appendChild(script);
};

function MapPickerModal({ isOpen, onClose, onConfirm, initialLat, initialLng }: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, lat: number, lng: number) => void;
  initialLat?: string;
  initialLng?: string;
}) {
  const mapRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [coords, setCoords] = useState({
    lat: initialLat ? parseFloat(initialLat) : 23.2599,
    lng: initialLng ? parseFloat(initialLng) : 77.4126
  });
  const [placeName, setPlaceName] = useState('');
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const googleMap = useRef<any>(null);
  const googleMarker = useRef<any>(null);

  useEffect(() => {
    if (isOpen) {
      loadGoogleMapsScript(() => {
        setMapsLoaded(true);
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (!mapsLoaded || !isOpen || !mapRef.current) return;

    const google = (window as any).google;
    const center = { lat: coords.lat, lng: coords.lng };

    googleMap.current = new google.maps.Map(mapRef.current, {
      center: center,
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
    });

    googleMarker.current = new google.maps.Marker({
      position: center,
      map: googleMap.current,
      draggable: true,
      animation: google.maps.Animation.DROP,
    });

    googleMarker.current.addListener('dragend', () => {
      const pos = googleMarker.current.getPosition();
      const latVal = pos.lat();
      const lngVal = pos.lng();
      setCoords({ lat: latVal, lng: lngVal });
      
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat: latVal, lng: lngVal } }, (results: any, status: any) => {
        if (status === 'OK' && results[0]) {
          setPlaceName(results[0].formatted_address);
          if (inputRef.current) inputRef.current.value = results[0].formatted_address;
        }
      });
    });

    if (inputRef.current) {
      const autocomplete = new google.maps.places.Autocomplete(inputRef.current);
      autocomplete.bindTo('bounds', googleMap.current);

      autocomplete.addListener('place_changed', () => {
        const place = autocomplete.getPlace();
        if (!place.geometry || !place.geometry.location) return;

        const loc = place.geometry.location;
        googleMap.current.setCenter(loc);
        googleMap.current.setZoom(15);
        googleMarker.current.setPosition(loc);
        setCoords({ lat: loc.lat(), lng: loc.lng() });
        setPlaceName(place.formatted_address || place.name || '');
      });
    }
  }, [mapsLoaded, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 z-[60] flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)' }}>
      <style>{`
        .pac-container {
          z-index: 999999 !important;
          pointer-events: auto !important;
        }
      `}</style>
      <div className="bg-white rounded-3xl w-full max-w-xl shadow-2xl flex flex-col overflow-hidden h-[80vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
          <h3 className="font-black text-slate-900 text-base">Select Location on Map</h3>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>

        <div className="p-4 bg-slate-50 border-b border-slate-100 flex-shrink-0">
          <input
            ref={inputRef}
            type="text"
            placeholder="Search city, address or waypoint..."
            className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 bg-white"
          />
        </div>

        <div className="flex-1 relative bg-slate-100">
          {!mapsLoaded ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
            </div>
          ) : (
            <div ref={mapRef} className="w-full h-full" />
          )}
        </div>

        <div className="p-4 border-t border-slate-100 space-y-3 bg-white flex-shrink-0">
          <div className="bg-slate-50 p-3 rounded-2xl text-[11px] font-bold text-slate-500 space-y-1">
            <p className="truncate text-slate-700">📍 Selected: {placeName || 'Search or drag marker'}</p>
            <p>🌐 Lat: {coords.lat.toFixed(6)} | Lng: {coords.lng.toFixed(6)}</p>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-black text-sm">Cancel</button>
            <button
              onClick={() => onConfirm(placeName, coords.lat, coords.lng)}
              className="flex-1 py-3 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2"
              style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}
            >
              Confirm Location
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function WaypointRow({ wp, i, totalWaypoints, mapsApiReady, onChangeWp, onRemoveWp, onPickMap }: {
  wp: WP;
  i: number;
  totalWaypoints: number;
  mapsApiReady: boolean;
  onChangeWp: (index: number, updates: Partial<WP>) => void;
  onRemoveWp: (index: number) => void;
  onPickMap: (index: number) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<any>(null);

  useEffect(() => {
    const google = (window as any).google;
    if (!google || !google.maps || !google.maps.places || !inputRef.current) return;

    autocompleteRef.current = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['geocode', 'establishment']
    });

    autocompleteRef.current.addListener('place_changed', () => {
      const place = autocompleteRef.current.getPlace();
      if (!place.geometry || !place.geometry.location) return;

      const loc = place.geometry.location;
      const shortName = (place.formatted_address || place.name || '').split(',')[0].trim();
      
      onChangeWp(i, {
        name: shortName,
        lat: String(loc.lat()),
        lng: String(loc.lng())
      });
    });

    return () => {
      if (google.maps.event && autocompleteRef.current) {
        google.maps.event.clearInstanceListeners(autocompleteRef.current);
      }
    };
  }, [i, mapsApiReady]);

  return (
    <div className="flex gap-2 items-center relative">
      <span className="text-[10px] font-black text-slate-400 w-5 flex-shrink-0">{i+1}.</span>
      <div className="flex-1 relative flex gap-1.5 items-center">
        <div className="flex-1 relative">
          <input
            ref={inputRef}
            value={wp.name}
            onChange={e => onChangeWp(i, { name: e.target.value })}
            placeholder={i===0?'Start city':i===totalWaypoints-1?'End city':'Stop name'}
            className="w-full px-3 py-2 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400"
          />
        </div>
        <button type="button" onClick={() => onPickMap(i)}
          className="w-9 h-9 rounded-xl bg-orange-50 hover:bg-orange-100 flex items-center justify-center flex-shrink-0 transition-colors"
          title="Pick on Google Map">
          <MapPin className="w-4 h-4 text-orange-500" />
        </button>
      </div>
      <input
        value={wp.lat}
        onChange={e => onChangeWp(i, { lat: e.target.value })}
        placeholder="Lat *"
        type="number"
        step="any"
        className="w-20 px-2 py-2 border-2 border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-orange-400"
      />
      <input
        value={wp.lng}
        onChange={e => onChangeWp(i, { lng: e.target.value })}
        placeholder="Lng *"
        type="number"
        step="any"
        className="w-20 px-2 py-2 border-2 border-slate-200 rounded-xl text-xs font-medium outline-none focus:border-orange-400"
      />
      {totalWaypoints > 2 && (
        <button onClick={() => onRemoveWp(i)} className="text-red-400">
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

function Field({ label, value, onChange, placeholder, type='text' }: { label:string; value:string; onChange:(v:string)=>void; placeholder?:string; type?:string; }) {
  return (
    <div>
      <label className="text-xs font-black text-slate-500 uppercase tracking-wider mb-2 block">{label}</label>
      <input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder}
        className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl text-sm font-medium outline-none focus:border-orange-400 transition-colors" />
    </div>
  );
}

export default function AdminRoutesPage() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<RForm>(DEF);
  const [activeWpSuggest, setActiveWpSuggest] = useState<{ index: number; show: boolean }>({ index: -1, show: false });
  const [pickerIndex, setPickerIndex] = useState<number>(-1);
  const [mapsApiReady, setMapsApiReady] = useState(false);

  useEffect(() => {
    loadGoogleMapsScript(() => {
      setMapsApiReady(true);
    });
  }, []);

  const { data: routes, isLoading } = useQuery({
    queryKey: ['admin-routes'],
    queryFn: async () => (await api.get('/routes')).data.data.routes as Route[],
  });

  const createMut = useMutation({
    mutationFn: (body: object) => api.post('/routes', body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['admin-routes'] }); setShowForm(false); setForm(DEF); },
  });

  const deleteMut = useMutation({
    mutationFn: (id: string) => api.delete(`/routes/${id}`),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-routes'] }),
  });

  const setWp = (i: number, k: keyof WP, v: string) =>
    setForm(f => ({ ...f, waypoints: f.waypoints.map((w, idx) => idx === i ? { ...w, [k]: v } : w) }));

  const handleCreate = () => {
    createMut.mutate({
      name: form.name, fromCity: form.fromCity, toCity: form.toCity,
      totalDistanceKm: form.totalDistanceKm ? Number(form.totalDistanceKm) : undefined,
      waypoints: form.waypoints.filter(w => w.name).map((w, i) => ({
        name: w.name, order: i,
        coordinates: w.lat && w.lng ? { lat: Number(w.lat), lng: Number(w.lng) } : undefined,
      })),
    });
  };

  return (
    <div className="p-4 sm:p-6 min-h-screen" style={{ background: '#F1F5F9' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Routes</h1>
          <p className="text-slate-400 text-sm font-medium mt-0.5">{routes?.length || 0} highway routes</p>
        </div>
        <button onClick={() => setShowForm(true)}
          className="flex items-center gap-2 text-white font-black px-5 py-2.5 rounded-2xl text-sm shadow-lg hover:scale-105 active:scale-95 transition-all"
          style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
          <Plus className="w-4 h-4" /> Add Route
        </button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-orange-500" /></div>
      ) : (
        <div className="space-y-4">
          {routes?.map(route => (
            <div key={route._id} className="bg-white rounded-2xl border border-slate-100 shadow-sm p-5 flex items-start gap-4 hover:shadow-md transition-all">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0" style={{ background: 'linear-gradient(135deg,#FFF7ED,#FFEDD5)' }}>
                <MapPin className="w-6 h-6 text-orange-500" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-black text-slate-900 text-base">{route.name}</p>
                <p className="text-sm text-slate-500 font-medium mt-0.5">
                  {route.fromCity} → {route.toCity}
                  {route.totalDistanceKm && <span className="text-orange-500 font-bold ml-2">{route.totalDistanceKm} km</span>}
                </p>
                {route.waypoints?.length > 0 && (
                  <div className="flex items-center gap-1 mt-2 overflow-x-auto scrollbar-hide">
                    {route.waypoints.map((wp, i) => (
                      <div key={i} className="flex items-center gap-1 flex-shrink-0">
                        <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">{wp.name}</span>
                        {i < route.waypoints.length - 1 && <ChevronRight className="w-3 h-3 text-slate-300" />}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button onClick={() => deleteMut.mutate(route._id)} disabled={deleteMut.isPending}
                className="w-9 h-9 rounded-xl bg-red-50 hover:bg-red-100 flex items-center justify-center transition-colors flex-shrink-0">
                <Trash2 className="w-4 h-4 text-red-500" />
              </button>
            </div>
          ))}
          {!routes?.length && (
            <div className="text-center py-16 bg-white rounded-2xl border border-slate-100">
              <MapPin className="w-12 h-12 text-slate-200 mx-auto mb-3" />
              <p className="font-black text-slate-400">No routes yet</p>
            </div>
          )}
        </div>
      )}

      {showForm && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4" style={{ backdropFilter: 'blur(4px)' }}>
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-2xl max-h-[92vh] flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 flex-shrink-0">
              <h2 className="font-black text-slate-900 text-lg">Add New Route</h2>
              <button onClick={() => setShowForm(false)} className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center">
                <X className="w-4 h-4 text-slate-600" />
              </button>
            </div>
            <div className="overflow-y-auto flex-1 px-6 py-5 space-y-4">
              <Field label="Route Name *" value={form.name} onChange={v => setForm(f=>({...f,name:v}))} placeholder="e.g. Bhopal - Indore Highway" />
              <div className="grid grid-cols-2 gap-3">
                <Field label="From City *" value={form.fromCity} onChange={v => setForm(f=>({...f,fromCity:v}))} placeholder="Bhopal" />
                <Field label="To City *" value={form.toCity} onChange={v => setForm(f=>({...f,toCity:v}))} placeholder="Indore" />
              </div>
              <Field label="Total Distance (km)" value={form.totalDistanceKm} onChange={v => setForm(f=>({...f,totalDistanceKm:v}))} placeholder="195" type="number" />
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Waypoints (in order - all fields required *)</label>
                  <button type="button" onClick={() => setForm(f=>({...f,waypoints:[...f.waypoints,{name:'',lat:'',lng:''}]}))}
                    className="text-xs font-black text-orange-500 flex items-center gap-1">
                    <Plus className="w-3 h-3" /> Add Stop
                  </button>
                </div>
                <div className="space-y-2">
                  {form.waypoints.map((wp, i) => (
                    <WaypointRow
                      key={i}
                      wp={wp}
                      i={i}
                      totalWaypoints={form.waypoints.length}
                      mapsApiReady={mapsApiReady}
                      onChangeWp={(index, updates) => {
                        setForm(f => ({
                          ...f,
                          waypoints: f.waypoints.map((w, idx) => idx === index ? { ...w, ...updates } : w)
                        }));
                      }}
                      onRemoveWp={(index) => {
                        setForm(f => ({ ...f, waypoints: f.waypoints.filter((_, idx) => idx !== index) }));
                      }}
                      onPickMap={(index) => setPickerIndex(index)}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-slate-100 flex gap-3 flex-shrink-0">
              <button onClick={() => setShowForm(false)} className="flex-1 py-3 rounded-2xl bg-slate-100 text-slate-700 font-black text-sm">Cancel</button>
              <button onClick={handleCreate} 
                disabled={createMut.isPending || !form.name || !form.fromCity || !form.toCity || form.waypoints.some(w => !w.name || !w.lat || !w.lng)}
                className="flex-1 py-3 rounded-2xl text-white font-black text-sm flex items-center justify-center gap-2 disabled:opacity-50"
                style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                {createMut.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Route'}
              </button>
            </div>
          </div>
        </div>
      )}

      {pickerIndex >= 0 && (
        <MapPickerModal
          isOpen={pickerIndex >= 0}
          onClose={() => setPickerIndex(-1)}
          initialLat={form.waypoints[pickerIndex]?.lat}
          initialLng={form.waypoints[pickerIndex]?.lng}
          onConfirm={(name, lat, lng) => {
            const shortName = name.split(',')[0].trim();
            setForm(f => ({
              ...f,
              waypoints: f.waypoints.map((w, idx) => 
                idx === pickerIndex 
                  ? { name: shortName || w.name, lat: String(lat), lng: String(lng) } 
                  : w
              )
            }));
            setPickerIndex(-1);
          }}
        />
      )}
    </div>
  );
}
