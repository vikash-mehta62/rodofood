'use client';
import { useState } from 'react';
import { Loader2, Eye, EyeOff, CheckCircle, Shield } from 'lucide-react';
import { useAdminLogin } from '@/hooks/useAuth';

export default function AdminLoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const login = useAdminLogin();

  const handleLogin = async () => {
    if (phone.length !== 10 || !password) return;
    try { await login.mutateAsync({ phone, password }); } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-[#0C0F1A] flex items-center justify-center px-5">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-extrabold text-white">Admin Panel</h1>
          <p className="text-gray-400 text-sm mt-1">Rodofood Super Control</p>
        </div>

        <div className="bg-white rounded-2xl p-7 space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Admin Phone</label>
            <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-400 transition-colors">
              <div className="flex items-center gap-2 px-4 py-3.5 border-r border-gray-200 bg-gray-50 flex-shrink-0">
                <span className="text-lg">🇮🇳</span>
                <span className="text-sm font-bold text-gray-600">+91</span>
              </div>
              <input type="tel" inputMode="numeric" placeholder="10-digit number"
                value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="flex-1 px-4 py-3.5 bg-white text-base font-medium outline-none placeholder-gray-300"
                maxLength={10} autoFocus />
              {phone.length === 10 && <span className="pr-4 text-emerald-500"><CheckCircle className="w-5 h-5" /></span>}
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Password</label>
            <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-400 transition-colors">
              <input type={showPass ? 'text' : 'password'} placeholder="Admin password"
                value={password} onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="flex-1 px-4 py-3.5 bg-white text-base font-medium outline-none placeholder-gray-300" />
              <button type="button" onClick={() => setShowPass(!showPass)} className="pr-4 text-gray-400">
                {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <button onClick={handleLogin} disabled={phone.length !== 10 || !password || login.isPending}
            className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 bg-gradient-to-r from-orange-500 to-orange-400 shadow-md shadow-orange-200 disabled:shadow-none disabled:bg-none disabled:bg-gray-300">
            {login.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login to Admin Panel'}
          </button>

          {login.isError && (
            <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
              <p className="text-red-600 text-sm">{(login.error as any)?.response?.data?.message || 'Login failed.'}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
