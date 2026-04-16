'use client';
import { useState } from 'react';
import { ArrowRight, Loader2, Shield, Zap, CheckCircle, Store } from 'lucide-react';
import { useSendOtp, useVerifyOtp } from '@/hooks/useAuth';
import Link from 'next/link';

const FEATURES = [
  { icon: '🚗', text: 'Route-based restaurant discovery' },
  { icon: '⏱️', text: 'Food ready when you arrive' },
  { icon: '📍', text: 'Live location tracking' },
];

const TEST_USERS = [
  { role: 'Admin',    color: 'bg-violet-100 text-violet-700',  ph: '9999999999' },
  { role: 'Customer', color: 'bg-emerald-100 text-emerald-700', ph: '9876543210' },
];

const RESTAURANTS = [
  { name: 'Sehore Highway Treat',       ph: '8800000001' },
  { name: 'Midway Delite Ashta',         ph: '8800000002' },
  { name: 'Dewas Restaurant & Sweets',   ph: '8800000003' },
  { name: 'Obaidullaganj Quick Bites',   ph: '8800000004' },
  { name: 'Highway Grill & Bar-B-Q',     ph: '8800000005' },
  { name: 'Indore Sarafa Sweets',        ph: '8800000006' },
];

type Step = 'phone' | 'otp';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<Step>('phone');
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const sendOtp = useSendOtp();
  const verifyOtp = useVerifyOtp();

  const handleSendOtp = async () => {
    if (phone.length !== 10) return;
    try {
      const res = await sendOtp.mutateAsync(phone);
      if (res.data?.data?.devOtp) setDevOtp(res.data.data.devOtp);
      setStep('otp');
    } catch (_) {}
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    try {
      await verifyOtp.mutateAsync({ phone, otp, intendedRole: 'customer' });
    } catch (_) {}
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">

      {/* ── LEFT PANEL — desktop only ── */}
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
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              ghar jaisi feeling.
            </span>
          </h1>
          <p className="text-gray-400 text-base mb-10 leading-relaxed">
            Pre-order your meal while you drive. Your hot fresh food will be ready the moment you arrive.
          </p>
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

        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-12 h-full opacity-10 pointer-events-none">
          <div className="w-full h-full bg-gray-600 relative overflow-hidden">
            <div className="absolute left-1/2 -translate-x-1/2 w-1 h-full"
              style={{ background: 'repeating-linear-gradient(to bottom,#FF6B35 0,#FF6B35 24px,transparent 24px,transparent 48px)', animation: 'road-move 1.2s linear infinite' }} />
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL ── */}
      <div className="flex-1 flex flex-col">

        {/* Mobile header */}
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

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-5 py-10 bg-gray-50">
          <div className="w-full max-w-md space-y-4">

            {step === 'phone' ? (
              <>
                <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
                  <div className="mb-7">
                    <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                      <Shield className="w-5 h-5 text-orange-500" />
                    </div>
                    <h2 className="text-xl font-extrabold text-gray-900">Customer Login</h2>
                    <p className="text-gray-500 mt-1 text-sm">Enter your mobile number to continue</p>
                  </div>

                  {/* Phone input */}
                  <div className="mb-5">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Mobile Number</label>
                    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-400 transition-colors">
                      <div className="flex items-center gap-2 px-4 py-3.5 border-r border-gray-200 bg-gray-50 flex-shrink-0">
                        <span className="text-lg">🇮🇳</span>
                        <span className="text-sm font-bold text-gray-600">+91</span>
                      </div>
                      <input
                        type="tel" inputMode="numeric" placeholder="10-digit number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                        className="flex-1 px-4 py-3.5 bg-white text-base font-medium outline-none placeholder-gray-300"
                        maxLength={10} autoFocus
                      />
                      {phone.length === 10 && (
                        <span className="pr-4 text-emerald-500"><CheckCircle className="w-5 h-5" /></span>
                      )}
                    </div>
                  </div>

                  <button
                    onClick={handleSendOtp}
                    disabled={phone.length !== 10 || sendOtp.isPending}
                    className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 bg-gradient-to-r from-orange-500 to-orange-400 shadow-md shadow-orange-200 hover:shadow-orange-300 disabled:shadow-none disabled:bg-none disabled:bg-gray-300">
                    {sendOtp.isPending
                      ? <Loader2 className="w-5 h-5 animate-spin" />
                      : <><span>Get OTP</span><ArrowRight className="w-4 h-4" /></>
                    }
                  </button>

                  {sendOtp.isError && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
                      <p className="text-red-600 text-sm">{(sendOtp.error as any)?.response?.data?.message || 'Something went wrong. Try again.'}</p>
                    </div>
                  )}

                  {/* Dev credentials */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-700 mb-3">🧪 Dev Mode — Click to fill</p>
                    <div className="space-y-2">
                      {TEST_USERS.map(u => (
                        <div key={u.ph} className="flex items-center justify-between">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${u.color}`}>{u.role}</span>
                          <button type="button" onClick={() => setPhone(u.ph)}
                            className="text-xs font-mono text-gray-600 bg-white px-3 py-1 rounded-lg border border-gray-200 hover:border-orange-400 transition-colors">
                            {u.ph}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Restaurant signup card */}
                <Link href="/restaurant-register">
                  <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-6 hover:border-amber-300 hover:shadow-lg transition-all cursor-pointer group">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                        <Store className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-extrabold text-gray-900 mb-1">List your Restaurant / Dhaba</h3>
                        <p className="text-sm text-gray-600 mb-3 leading-relaxed">
                          Join Rodofood network and start receiving pre-orders from highway travellers
                        </p>
                        <div className="flex items-center gap-2 text-amber-700 font-bold text-sm">
                          <span>Register Now</span>
                          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </div>
                      </div>
                    </div>
                  </div>
                </Link>
              </>

            ) : (
              <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
                <div className="mb-6">
                  <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                    <Zap className="w-5 h-5 text-emerald-600" />
                  </div>
                  <h2 className="text-xl font-extrabold text-gray-900">Verify OTP</h2>
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
                        className="flex-shrink-0 text-white text-sm font-bold px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-600 transition-colors">
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
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                    className="w-full h-14 text-center text-3xl font-extrabold tracking-[0.5em] border-2 border-gray-200 rounded-xl outline-none bg-gray-50 focus:border-orange-400 transition-colors"
                    maxLength={6} autoFocus
                  />
                </div>

                <button
                  onClick={handleVerifyOtp}
                  disabled={otp.length !== 6 || verifyOtp.isPending}
                  className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 bg-gradient-to-r from-orange-500 to-orange-400 shadow-md shadow-orange-200 hover:shadow-orange-300 disabled:shadow-none disabled:bg-none disabled:bg-gray-300 mb-3">
                  {verifyOtp.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login ✓'}
                </button>

                <button type="button" onClick={() => { setStep('phone'); setOtp(''); setDevOtp(null); }}
                  className="w-full text-sm text-gray-400 hover:text-gray-700 transition-colors py-2">
                  ← Change number
                </button>

                {verifyOtp.isError && (
                  <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
                    <p className="text-red-600 text-sm">{(verifyOtp.error as any)?.response?.data?.message || 'Invalid OTP. Try again.'}</p>
                  </div>
                )}
              </div>
            )}

            <p className="text-center text-xs text-gray-400 mt-5">By continuing, you agree to our Terms &amp; Privacy Policy</p>
          </div>
        </div>
      </div>

      <style jsx>{`
        @keyframes road-move {
          from { background-position: 0 0; }
          to { background-position: 0 48px; }
        }
      `}</style>
    </div>
  );
}
