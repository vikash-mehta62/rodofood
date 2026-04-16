'use client';
import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Loader2, CheckCircle, Store, Zap } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';
import Link from 'next/link';

const DEV_RESTAURANTS = [
  { name: 'Sehore Highway Treat',     ph: '8800000001' },
  { name: 'Midway Delite Ashta',       ph: '8800000002' },
  { name: 'Dewas Restaurant & Sweets', ph: '8800000003' },
];

type Step = 'phone' | 'otp' | 'details';

export default function RestaurantRegisterPage() {
  const router = useRouter();
  const { setAuth, user, isAuthenticated, updateUser } = useAuthStore();

  const [step, setStep] = useState<Step>('phone');
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [devOtp, setDevOtp] = useState<string | null>(null);
  const [otpLoading, setOtpLoading] = useState(false);
  const [verifyLoading, setVerifyLoading] = useState(false);
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState('');
  const [ownerName, setOwnerName] = useState('');
  const [email, setEmail] = useState('');

  // Already logged in → go to correct dashboard (only if not mid-registration)
  useEffect(() => {
    if (step !== 'phone') return;
    if (isAuthenticated && user?.name && user?.role === 'restaurant') router.replace('/restaurant/dashboard');
    else if (isAuthenticated && user?.name && user?.role === 'admin') router.replace('/admin/dashboard');
    else if (isAuthenticated && user?.name && user?.role === 'customer') router.replace('/home');
  }, [isAuthenticated, user, router, step]);

  // ── Step 1: Send OTP ──
  const handleSendOtp = async () => {
    if (phone.length !== 10) return;
    setError('');
    setOtpLoading(true);
    try {
      const res = await api.post('/restaurant-auth/send-otp', { phone });
      if (res.data?.data?.devOtp) setDevOtp(res.data.data.devOtp);
      setStep('otp');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to send OTP. Try again.');
    } finally {
      setOtpLoading(false);
    }
  };

  // ── Step 2: Verify OTP — dedicated restaurant endpoint, always sets role=restaurant ──
  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    setError('');
    setVerifyLoading(true);
    try {
      const res = await api.post('/restaurant-auth/verify-otp', { phone, otp });
      const { token, user } = res.data.data;
      setAuth(user, token);
      setStep('details');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Invalid OTP. Try again.');
    } finally {
      setVerifyLoading(false);
    }
  };

  // ── Step 3: Complete profile ──
  const handleSubmit = async () => {
    if (!ownerName.trim()) return;
    setError('');
    setSubmitLoading(true);
    try {
      const res = await api.put('/restaurant-auth/complete-profile', {
        name: ownerName.trim(),
        email: email.trim() || undefined,
      });
      const updatedUser = res.data.data.user;
      updateUser(updatedUser);
      await new Promise(r => setTimeout(r, 100));
      router.push('/restaurant/dashboard');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Something went wrong. Try again.');
    } finally {
      setSubmitLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0C0F1A] flex flex-col">

      {/* Top bar */}
      <div className="px-5 pt-12 pb-6 flex items-center gap-4">
        <Link href="/login">
          <button className="w-9 h-9 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>
        </Link>
        <div className="flex items-center gap-2">
          <img src="/logo.jpeg" alt="Rodofood" className="w-7 h-7 rounded-lg object-cover" />
          <span className="font-extrabold text-white">Rodo<span className="text-orange-500">food</span></span>
        </div>
      </div>

      {/* Progress steps */}
      <div className="px-5 mb-6">
        <div className="flex items-center gap-2 max-w-md mx-auto">
          {(['phone', 'otp', 'details'] as Step[]).map((s, i) => (
            <div key={s} className="flex items-center gap-2 flex-1">
              <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 transition-all ${
                step === s ? 'bg-orange-500 text-white' :
                (['phone', 'otp', 'details'].indexOf(step) > i) ? 'bg-emerald-500 text-white' :
                'bg-white/10 text-gray-500'
              }`}>
                {(['phone', 'otp', 'details'].indexOf(step) > i) ? <CheckCircle className="w-4 h-4" /> : i + 1}
              </div>
              <span className={`text-xs font-semibold hidden sm:block ${step === s ? 'text-white' : 'text-gray-500'}`}>
                {s === 'phone' ? 'Mobile' : s === 'otp' ? 'Verify' : 'Details'}
              </span>
              {i < 2 && <div className={`flex-1 h-0.5 rounded ${(['phone', 'otp', 'details'].indexOf(step) > i) ? 'bg-emerald-500' : 'bg-white/10'}`} />}
            </div>
          ))}
        </div>
      </div>

      {/* Card */}
      <div className="flex-1 flex items-start justify-center px-5 pb-10">
        <div className="w-full max-w-md">

          {/* ── STEP 1: Phone ── */}
          {step === 'phone' && (
            <div className="bg-white rounded-2xl p-7">
              <div className="mb-7">
                <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                  <Store className="w-6 h-6 text-amber-600" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900">List your Restaurant</h2>
                <p className="text-gray-500 mt-1 text-sm">Join Rodofood and get pre-orders from highway travellers</p>
              </div>

              {/* Benefits */}
              <div className="mb-6 space-y-2">
                {[
                  '🍽️ Receive pre-orders before customers arrive',
                  '📊 Manage menu, pricing & availability',
                  '🛣️ Reach highway travellers on your route',
                ].map(b => (
                  <div key={b} className="flex items-center gap-2 text-sm text-gray-600">
                    <span>{b}</span>
                  </div>
                ))}
              </div>

              <div className="mb-5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                  Owner's Mobile Number
                </label>
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-400 transition-colors">
                  <div className="flex items-center gap-2 px-4 py-3.5 border-r border-gray-200 bg-gray-50 flex-shrink-0">
                    <span className="text-lg">🇮🇳</span>
                    <span className="text-sm font-bold text-gray-600">+91</span>
                  </div>
                  <input
                    type="tel" inputMode="numeric" placeholder="10-digit number"
                    value={phone}
                    onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                    className="flex-1 px-4 py-3.5 bg-white text-base font-medium outline-none placeholder-gray-300"
                    maxLength={10} autoFocus
                  />
                  {phone.length === 10 && <span className="pr-4 text-emerald-500"><CheckCircle className="w-5 h-5" /></span>}
                </div>
              </div>

              <button
                onClick={handleSendOtp}
                disabled={phone.length !== 10 || otpLoading}
                className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-orange-200 disabled:shadow-none disabled:bg-none disabled:bg-gray-300">
                {otpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Send OTP</span><ArrowRight className="w-4 h-4" /></>}
              </button>

              {error && <p className="mt-4 text-red-500 text-sm text-center">{error}</p>}

              {/* Dev fill */}
              <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                <p className="text-xs font-bold text-blue-700 mb-2">🧪 Dev — Restaurant numbers</p>
                <div className="space-y-1.5">
                  {DEV_RESTAURANTS.map(r => (
                    <div key={r.ph} className="flex items-center justify-between gap-2">
                      <span className="text-[10px] text-blue-700 font-medium truncate flex-1">{r.name}</span>
                      <button type="button" onClick={() => setPhone(r.ph)}
                        className="text-xs font-mono text-gray-600 bg-white px-2.5 py-0.5 rounded-lg border border-gray-200 hover:border-orange-400 transition-colors flex-shrink-0">
                        {r.ph}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── STEP 2: OTP ── */}
          {step === 'otp' && (
            <div className="bg-white rounded-2xl p-7">
              <div className="mb-6">
                <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                  <Zap className="w-6 h-6 text-emerald-600" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900">Verify OTP</h2>
                <p className="text-gray-500 mt-1 text-sm">
                  Sent to <span className="font-semibold text-gray-800">+91 {phone}</span>
                </p>
              </div>

              {devOtp && (
                <div className="mb-5 p-4 rounded-xl border-2 border-amber-300 bg-amber-50">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">🧪 Dev OTP</p>
                      <p className="text-3xl font-extrabold tracking-[0.3em] text-amber-900">{devOtp}</p>
                    </div>
                    <button type="button" onClick={() => setOtp(devOtp)}
                      className="text-white text-sm font-bold px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 transition-colors">
                      Auto Fill
                    </button>
                  </div>
                </div>
              )}

              <div className="mb-5">
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Enter 6-digit OTP</label>
                <input
                  type="tel" inputMode="numeric" placeholder="——————"
                  value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                  className="w-full h-14 text-center text-3xl font-extrabold tracking-[0.5em] border-2 border-gray-200 rounded-xl outline-none bg-gray-50 focus:border-orange-400 transition-colors"
                  maxLength={6} autoFocus
                />
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={otp.length !== 6 || verifyLoading}
                className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-orange-200 disabled:shadow-none disabled:bg-none disabled:bg-gray-300 mb-3">
                {verifyLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Continue ✓'}
              </button>

              <button type="button" onClick={() => { setStep('phone'); setOtp(''); setDevOtp(null); setError(''); }}
                className="w-full text-sm text-gray-400 hover:text-gray-700 transition-colors py-2">
                ← Change number
              </button>

              {error && <p className="mt-3 text-red-500 text-sm text-center">{error}</p>}
            </div>
          )}

          {/* ── STEP 3: Details ── */}
          {step === 'details' && (
            <div className="bg-white rounded-2xl p-7">
              <div className="mb-7">
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <Store className="w-6 h-6 text-orange-500" />
                </div>
                <h2 className="text-2xl font-extrabold text-gray-900">Almost done!</h2>
                <p className="text-gray-500 mt-1 text-sm">Tell us about yourself to complete registration</p>
              </div>

              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                    Owner Name *
                  </label>
                  <input
                    type="text"
                    placeholder="Your full name"
                    value={ownerName}
                    onChange={e => setOwnerName(e.target.value)}
                    autoFocus
                    className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl outline-none text-sm font-medium focus:border-orange-400 transition-colors bg-gray-50"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                    Email (optional)
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl outline-none text-sm font-medium focus:border-orange-400 transition-colors bg-gray-50"
                  />
                </div>
              </div>

              <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3">
                <p className="text-xs font-bold text-amber-800 mb-1">Next steps after registration:</p>
                <ul className="text-xs text-amber-700 space-y-0.5 list-disc list-inside">
                  <li>Add your restaurant name & address</li>
                  <li>Upload menu items with prices</li>
                  <li>Go live and start receiving orders</li>
                </ul>
              </div>

              <button
                onClick={handleSubmit}
                disabled={!ownerName.trim() || submitLoading}
                className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-orange-200 disabled:shadow-none disabled:bg-none disabled:bg-gray-300">
                {submitLoading
                  ? <Loader2 className="w-5 h-5 animate-spin" />
                  : <><span>Complete Registration</span><ArrowRight className="w-4 h-4" /></>
                }
              </button>

              {error && <p className="mt-4 text-red-500 text-sm text-center">{error}</p>}
            </div>
          )}

          <p className="text-center text-xs text-gray-500 mt-5">
            Already registered? <Link href="/login" className="text-orange-400 font-semibold hover:underline">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
