'use client';
import { useState } from 'react';
import { ArrowRight, Loader2, Shield, Zap } from 'lucide-react';
import { useSendOtp, useVerifyOtp } from '@/hooks/useAuth';

export default function LoginPage() {
  const [phone, setPhone] = useState('');
  const [otp, setOtp] = useState('');
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
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
      await verifyOtp.mutateAsync({ phone, otp });
    } catch (_) {}
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left Panel (desktop) ── */}
      <div
        className="hidden lg:flex lg:w-1/2 relative overflow-hidden flex-col items-center justify-center p-12"
        style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 40%, #0f3460 100%)' }}
      >
        <div className="absolute inset-0 opacity-20"
          style={{ backgroundImage: 'radial-gradient(circle, rgba(255,107,53,0.3) 1px, transparent 1px)', backgroundSize: '24px 24px' }}
        />

        {/* Animated road strip */}
        <div className="absolute left-1/2 -translate-x-1/2 bottom-0 w-16 h-full opacity-20">
          <div className="w-full h-full bg-gray-600 relative overflow-hidden">
            <div className="absolute left-1/2 -translate-x-1/2 w-1 h-full"
              style={{
                background: 'repeating-linear-gradient(to bottom, #FF6B35 0px, #FF6B35 24px, transparent 24px, transparent 48px)',
                animation: 'road-move 1.2s linear infinite',
              }}
            />
          </div>
        </div>

        <div className="relative z-10 text-center text-white max-w-sm">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-8 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #FF6B35, #FF8C42)', animation: 'float 3s ease-in-out infinite' }}
          >
            <span className="text-5xl">🛣️</span>
          </div>

          <h1 className="text-5xl font-black mb-4">
            Rodo<span style={{ color: '#FF6B35' }}>food</span>
          </h1>
          <p className="text-gray-300 text-lg mb-10 leading-relaxed">
            Highway ka khana, ghar jaisi feeling.<br />
            Pre-order karo, bhooke mat raho! 🍽️
          </p>

          <div className="space-y-3 text-left">
            {[
              { icon: '🚗', text: 'Route-based restaurant discovery' },
              { icon: '⏱️', text: 'Food ready when you arrive' },
              { icon: '📍', text: 'Live location tracking' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(10px)' }}>
                <span className="text-2xl">{f.icon}</span>
                <span className="text-sm text-gray-200">{f.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Right Panel ── */}
      <div className="flex-1 flex flex-col">

        {/* Mobile top bar */}
        <div className="lg:hidden px-6 pt-14 pb-10 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #0f3460 100%)' }}>
          <div className="absolute inset-0 opacity-20"
            style={{ backgroundImage: 'radial-gradient(circle, rgba(255,107,53,0.3) 1px, transparent 1px)', backgroundSize: '20px 20px' }}
          />
          <div className="relative z-10 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-xl"
              style={{ background: 'linear-gradient(135deg, #FF6B35, #FF8C42)' }}>
              <span className="text-3xl">🛣️</span>
            </div>
            <div>
              <h1 className="text-3xl font-black text-white">
                Rodo<span style={{ color: '#FF6B35' }}>food</span>
              </h1>
              <p className="text-gray-300 text-sm">Highway food, pre-ordered</p>
            </div>
          </div>
        </div>

        {/* Form */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 bg-gray-50">
          <div className="w-full max-w-md">

            {step === 'phone' ? (
              <div key="phone-step">
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">

                  <div className="mb-8">
                    <div className="w-12 h-12 bg-orange-100 rounded-2xl flex items-center justify-center mb-4">
                      <Shield className="w-6 h-6" style={{ color: '#FF6B35' }} />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Welcome back!</h2>
                    <p className="text-gray-500 mt-1 text-sm">Enter your mobile number to continue</p>
                  </div>

                  {/* Phone input */}
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                      Mobile Number
                    </label>
                    <div className="flex items-center border-2 border-gray-200 rounded-2xl overflow-hidden"
                      style={{ transition: 'border-color 0.2s' }}
                      onFocus={() => {}} >
                      <div className="flex items-center gap-2 px-4 py-4 border-r border-gray-200 bg-gray-50 flex-shrink-0">
                        <span className="text-lg">🇮🇳</span>
                        <span className="text-sm font-bold text-gray-600">+91</span>
                      </div>
                      <input
                        type="tel"
                        inputMode="numeric"
                        placeholder="10-digit number"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        onKeyDown={(e) => e.key === 'Enter' && handleSendOtp()}
                        className="flex-1 px-4 py-4 bg-white text-base font-medium outline-none placeholder-gray-400"
                        maxLength={10}
                        autoFocus
                      />
                      {phone.length === 10 && (
                        <span className="pr-4 text-green-500 font-bold text-lg">✓</span>
                      )}
                    </div>
                  </div>

                  {/* Send OTP button */}
                  <button
                    onClick={handleSendOtp}
                    disabled={phone.length !== 10 || sendOtp.isPending}
                    className="w-full h-14 text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:cursor-not-allowed"
                    style={{
                      background: phone.length === 10 && !sendOtp.isPending
                        ? 'linear-gradient(135deg, #FF6B35, #FF8C42)'
                        : '#d1d5db',
                    }}
                  >
                    {sendOtp.isPending
                      ? <Loader2 className="w-5 h-5 animate-spin" />
                      : <><span>Get OTP</span><ArrowRight className="w-5 h-5" /></>
                    }
                  </button>

                  {sendOtp.isError && (
                    <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
                      <p className="text-red-600 text-sm">
                        {(sendOtp.error as any)?.response?.data?.message || 'Something went wrong. Try again.'}
                      </p>
                    </div>
                  )}

                  {/* Test credentials box */}
                  <div className="mt-6 p-4 bg-blue-50 rounded-2xl border border-blue-100">
                    <p className="text-xs font-bold text-blue-700 mb-3">🧪 Test Credentials (Dev Mode)</p>
                    <div className="space-y-2">
                      {[
                        { role: 'Admin', ph: '9999999999', badge: 'bg-purple-100 text-purple-700' },
                        { role: 'Restaurant', ph: '8888888888', badge: 'bg-orange-100 text-orange-700' },
                        { role: 'Customer', ph: '9876543210', badge: 'bg-green-100 text-green-700' },
                      ].map(({ role, ph, badge }) => (
                        <div key={role} className="flex items-center justify-between">
                          <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badge}`}>{role}</span>
                          <button
                            type="button"
                            onClick={() => setPhone(ph)}
                            className="text-xs font-mono text-gray-600 bg-white px-3 py-1 rounded-lg border border-gray-200 hover:border-orange-400 transition-colors"
                          >
                            {ph}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            ) : (
              <div key="otp-step">
                <div className="bg-white rounded-3xl shadow-xl p-8 border border-gray-100">

                  <div className="mb-6">
                    <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center mb-4">
                      <Zap className="w-6 h-6 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900">Verify OTP</h2>
                    <p className="text-gray-500 mt-1 text-sm">
                      Sent to{' '}
                      <span className="font-semibold text-gray-800">+91 {phone}</span>
                    </p>
                  </div>

                  {/* Dev OTP display */}
                  {devOtp && (
                    <div className="mb-5 p-4 rounded-2xl border-2 border-amber-300 bg-amber-50">
                      <div className="flex items-center justify-between gap-3">
                        <div>
                          <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-1">
                            🧪 Dev Mode — Your OTP
                          </p>
                          <p className="text-3xl font-black tracking-[0.3em] text-amber-900">
                            {devOtp}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => setOtp(devOtp)}
                          className="flex-shrink-0 text-white text-sm font-bold px-4 py-2.5 rounded-xl transition-colors"
                          style={{ background: '#F59E0B' }}
                        >
                          Auto Fill
                        </button>
                      </div>
                    </div>
                  )}

                  {/* OTP input */}
                  <div className="mb-4">
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
                      Enter 6-digit OTP
                    </label>
                    <input
                      type="tel"
                      inputMode="numeric"
                      placeholder="——————"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                      onKeyDown={(e) => e.key === 'Enter' && handleVerifyOtp()}
                      className="w-full h-16 text-center text-3xl font-black tracking-[0.5em] border-2 border-gray-200 rounded-2xl outline-none bg-gray-50 transition-colors focus:border-orange-400"
                      maxLength={6}
                      autoFocus
                    />
                  </div>

                  {/* Verify button */}
                  <button
                    onClick={handleVerifyOtp}
                    disabled={otp.length !== 6 || verifyOtp.isPending}
                    className="w-full h-14 text-white font-bold text-base rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:cursor-not-allowed mb-3"
                    style={{
                      background: otp.length === 6 && !verifyOtp.isPending
                        ? 'linear-gradient(135deg, #FF6B35, #FF8C42)'
                        : '#d1d5db',
                    }}
                  >
                    {verifyOtp.isPending
                      ? <Loader2 className="w-5 h-5 animate-spin" />
                      : 'Verify & Login ✓'
                    }
                  </button>

                  <button
                    type="button"
                    onClick={() => { setStep('phone'); setOtp(''); setDevOtp(null); }}
                    className="w-full text-sm text-gray-400 hover:text-gray-700 transition-colors py-2"
                  >
                    ← Change number
                  </button>

                  {verifyOtp.isError && (
                    <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
                      <p className="text-red-600 text-sm">
                        {(verifyOtp.error as any)?.response?.data?.message || 'Invalid OTP. Try again.'}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <p className="text-center text-xs text-gray-400 mt-6">
              By continuing, you agree to our Terms &amp; Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
