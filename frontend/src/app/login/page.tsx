'use client';
import { useState } from 'react';
import { ArrowRight, Loader2, Eye, EyeOff, CheckCircle, Store, Lock, Phone } from 'lucide-react';
import { useCustomerLogin } from '@/hooks/useAuth';
import Link from 'next/link';

const FEATURES = [
  { icon: '🚗', text: 'Route-based restaurant discovery' },
  { icon: '⏱️', text: 'Food ready when you arrive' },
  { icon: '📍', text: 'Live location tracking' },
];

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const login = useCustomerLogin();

  const handleLogin = async () => {
    if (phone.length !== 10 || !password) return;
    try { await login.mutateAsync({ phone, password }); } catch (_) {}
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">

      {/* LEFT PANEL */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 relative overflow-hidden flex-col justify-between p-12 bg-[#0C0F1A]">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px] pointer-events-none"
          style={{ background: 'radial-gradient(circle,#FF6B35 0%,transparent 65%)' }} />
        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo.jpeg" alt="Rodofood" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-extrabold text-xl text-white">Rodo<span className="text-orange-500">food</span></span>
        </div>
        <div className="relative z-10">
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.1] mb-5">
            Highway ka khana,<br />
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">ghar jaisi feeling.</span>
          </h1>
          <p className="text-gray-400 text-base mb-10 leading-relaxed">Pre-order your meal while you drive. Your hot fresh food will be ready the moment you arrive.</p>
          <div className="space-y-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <span className="text-2xl">{f.icon}</span>
                <span className="text-sm text-gray-300 font-medium">{f.text}</span>
                <CheckCircle className="w-4 h-4 text-emerald-400 ml-auto flex-shrink-0" />
              </div>
            ))}
          </div>
        </div>
        <div className="relative z-10 grid grid-cols-3 gap-3">
          {[{ val: '1,200+', label: 'Daily Orders' }, { val: '4.8★', label: 'Avg Rating' }, { val: '50+', label: 'Restaurants' }].map(s => (
            <div key={s.label} className="bg-white/5 border border-white/10 rounded-xl p-3 text-center">
              <p className="text-lg font-extrabold text-white">{s.val}</p>
              <p className="text-[10px] text-gray-500 font-semibold uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* RIGHT PANEL */}
      <div className="flex-1 flex flex-col">
        <div className="lg:hidden px-6 pt-14 pb-8 bg-[#0C0F1A] relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.04]"
            style={{ backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)', backgroundSize: '32px 32px' }} />
          <div className="relative z-10 flex items-center gap-3">
            <img src="/logo.jpeg" alt="Rodofood" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <h1 className="text-2xl font-extrabold text-white">Rodo<span className="text-orange-500">food</span></h1>
              <p className="text-gray-400 text-xs mt-0.5">Highway food, pre-ordered</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 py-10 bg-gray-50">
          <div className="w-full max-w-md space-y-4">

            {/* Login form */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
              <div className="mb-7">
                <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <Lock className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-xl font-extrabold text-gray-900">Customer Login</h2>
                <p className="text-gray-500 mt-1 text-sm">Enter your phone number and password</p>
              </div>

              <div className="space-y-4 mb-5">
                {/* Phone */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Mobile Number</label>
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

                {/* Password */}
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Password</label>
                  <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-400 transition-colors">
                    <div className="flex items-center px-4 py-3.5 bg-gray-50 border-r border-gray-200 flex-shrink-0">
                      <Phone className="w-4 h-4 text-gray-400" />
                    </div>
                    <input type={showPass ? 'text' : 'password'} placeholder="Enter your password"
                      value={password} onChange={e => setPassword(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleLogin()}
                      className="flex-1 px-4 py-3.5 bg-white text-base font-medium outline-none placeholder-gray-300" />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="pr-4 text-gray-400 hover:text-gray-600">
                      {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </div>

              <button onClick={handleLogin} disabled={phone.length !== 10 || !password || login.isPending}
                className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 bg-gradient-to-r from-orange-500 to-orange-400 shadow-md shadow-orange-200 hover:shadow-orange-300 disabled:shadow-none disabled:bg-none disabled:bg-gray-300">
                {login.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Login</span><ArrowRight className="w-4 h-4" /></>}
              </button>

              {login.isError && (
                <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
                  <p className="text-red-600 text-sm">{(login.error as any)?.response?.data?.message || 'Login failed. Try again.'}</p>
                </div>
              )}

              <p className="text-center text-sm text-gray-500 mt-5">
                New here?{' '}
                <Link href="/register" className="text-orange-500 font-bold hover:underline">Create account</Link>
              </p>
            </div>

            {/* Restaurant card */}
            <Link href="/restaurant-register">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 hover:border-amber-300 hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Store className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-extrabold text-gray-900 mb-1">List your Restaurant / Dhaba</h3>
                    <p className="text-sm text-gray-600 mb-3 leading-relaxed">Join Rodofood network and start receiving pre-orders from highway travellers</p>
                    <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                      <span>Register Now</span>
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </div>
            </Link>

            <p className="text-center text-xs text-gray-400">By continuing, you agree to our Terms &amp; Privacy Policy</p>
          </div>
        </div>
      </div>
    </div>
  );
}
