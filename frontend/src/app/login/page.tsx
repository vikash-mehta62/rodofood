'use client';
import { useState } from 'react';
import { ArrowRight, ArrowLeft, Loader2, Eye, EyeOff, CheckCircle, Store, Lock, Mail, RefreshCw } from 'lucide-react';
import { useCustomerLogin } from '@/hooks/useAuth';
import Link from 'next/link';
import api from '@/lib/axios';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';

type Tab = 'password' | 'otp';
type OtpStep = 'email' | 'verify';

function PasswordLogin() {
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const login = useCustomerLogin();

  const handle = async () => {
    if (phone.length !== 10 || !password) return;
    try { await login.mutateAsync({ phone, password }); } catch (_) {}
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Mobile Number</label>
        <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-400 transition-colors">
          <div className="flex items-center gap-2 px-4 py-3.5 border-r border-gray-200 bg-gray-50 flex-shrink-0">
            <span className="text-lg">🇮🇳</span>
            <span className="text-sm font-bold text-gray-600">+91</span>
          </div>
          <input type="tel" inputMode="numeric" placeholder="10-digit number"
            value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
            onKeyDown={e => e.key === 'Enter' && handle()}
            className="flex-1 px-4 py-3.5 bg-white text-base font-medium outline-none placeholder-gray-300"
            maxLength={10} autoFocus />
          {phone.length === 10 && <span className="pr-4 text-emerald-500"><CheckCircle className="w-5 h-5" /></span>}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Password</label>
        <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-400 transition-colors">
          <input type={showPass ? 'text' : 'password'} placeholder="Enter your password"
            value={password} onChange={e => setPassword(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && handle()}
            className="flex-1 px-4 py-3.5 bg-white text-base font-medium outline-none placeholder-gray-300" />
          <button type="button" onClick={() => setShowPass(!showPass)} className="pr-4 text-gray-400 hover:text-gray-600">
            {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
          </button>
        </div>
      </div>

      <button onClick={handle} disabled={phone.length !== 10 || !password || login.isPending}
        className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 bg-gradient-to-r from-orange-500 to-orange-400 shadow-md shadow-orange-200 hover:shadow-orange-300 disabled:shadow-none disabled:bg-none disabled:bg-gray-300">
        {login.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Login</span><ArrowRight className="w-4 h-4" /></>}
      </button>

      {login.isError && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
          <p className="text-red-600 text-sm">{(login.error as any)?.response?.data?.message || 'Login failed.'}</p>
        </div>
      )}

      <p className="text-center text-xs text-gray-400 pt-1">
        <Link href="/forgot-password" className="text-gray-400 hover:text-orange-500 transition-colors">Forgot password?</Link>
      </p>
    </div>
  );
}

function OtpLogin() {
  const [step, setStep] = useState<OtpStep>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { setAuth } = useAuthStore();
  const router = useRouter();

  const sendOtp = async () => {
    if (!email) return;
    setLoading(true); setError('');
    try {
      await api.post('/customer/send-login-otp', { email });
      setStep('verify');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to send OTP.');
    } finally { setLoading(false); }
  };

  const verifyOtp = async () => {
    if (otp.length !== 6) return;
    setLoading(true); setError('');
    try {
      const res = await api.post('/customer/verify-login-otp', { email, otp });
      const { token, user } = res.data.data;
      setAuth(user, token);
      router.push('/home');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Invalid OTP.');
    } finally { setLoading(false); }
  };

  return (
    <div className="space-y-4">
      {step === 'email' ? (
        <>
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Email Address</label>
            <input type="email" placeholder="your@email.com" value={email}
              onChange={e => setEmail(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && sendOtp()}
              autoFocus
              className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl outline-none text-sm font-medium focus:border-orange-400 transition-colors bg-gray-50" />
          </div>

          <button onClick={sendOtp} disabled={!email || loading}
            className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 bg-gradient-to-r from-orange-500 to-orange-400 shadow-md shadow-orange-200 disabled:shadow-none disabled:bg-none disabled:bg-gray-300">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Mail className="w-4 h-4" /><span>Send OTP</span></>}
          </button>
        </>
      ) : (
        <>
          <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
            <p className="text-sm font-bold text-orange-800">OTP sent!</p>
            <p className="text-xs text-orange-600 mt-0.5">Check your inbox at <span className="font-bold">{email}</span></p>
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Enter 6-digit OTP</label>
            <input type="tel" inputMode="numeric" placeholder="——————"
              value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              onKeyDown={e => e.key === 'Enter' && verifyOtp()}
              className="w-full h-14 text-center text-3xl font-extrabold tracking-[0.5em] border-2 border-gray-200 rounded-xl outline-none bg-gray-50 focus:border-orange-400 transition-colors"
              maxLength={6} autoFocus />
          </div>

          <button onClick={verifyOtp} disabled={otp.length !== 6 || loading}
            className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 bg-gradient-to-r from-orange-500 to-orange-400 shadow-md shadow-orange-200 disabled:shadow-none disabled:bg-none disabled:bg-gray-300">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login ✓'}
          </button>

          <div className="flex items-center justify-between pt-1">
            <button type="button" onClick={() => { setStep('email'); setOtp(''); setError(''); }}
              className="text-sm text-gray-400 hover:text-gray-700 transition-colors">← Change email</button>
            <button type="button" onClick={sendOtp} disabled={loading}
              className="flex items-center gap-1.5 text-sm text-orange-500 font-semibold hover:text-orange-600 disabled:opacity-60">
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} /> Resend OTP
            </button>
          </div>
        </>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}

export default function CustomerLoginPage() {
  const [tab, setTab] = useState<Tab>('password');

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white">

      {/* ── LEFT — branding ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 flex-col justify-between p-12 bg-[#0C0F1A] relative overflow-hidden">
        <div className="absolute inset-0 opacity-[0.04]"
          style={{ backgroundImage: 'linear-gradient(white 1px,transparent 1px),linear-gradient(90deg,white 1px,transparent 1px)', backgroundSize: '48px 48px' }} />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] rounded-full opacity-20 blur-[120px]"
          style={{ background: 'radial-gradient(circle,#FF6B35 0%,transparent 65%)' }} />

        <div className="relative z-10 flex items-center gap-3">
          <img src="/logo.jpeg" alt="Rodofood" className="w-8 h-8 rounded-lg object-cover" />
          <span className="font-extrabold text-xl text-white">Rodo<span className="text-orange-500">food</span></span>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-1.5 mb-6">
            <span className="w-2 h-2 bg-orange-400 rounded-full animate-pulse" />
            <span className="text-orange-300 text-xs font-bold uppercase tracking-widest">Customer Portal</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.1] mb-5">
            Highway ka khana,<br />
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              ghar jaisi feeling.
            </span>
          </h1>
          <p className="text-gray-400 text-base leading-relaxed mb-8">
            Pre-order your meal while you drive. Your hot fresh food will be ready the moment you arrive.
          </p>
          <div className="space-y-3">
            {['🚗 Route-based restaurant discovery', '⏱️ Food ready when you arrive', '📍 Live location tracking'].map(f => (
              <div key={f} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl px-4 py-3">
                <span className="text-sm text-gray-300 font-medium">{f}</span>
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

      {/* ── RIGHT — form ── */}
      <div className="flex-1 flex flex-col">
        {/* Mobile header */}
        <div className="lg:hidden px-6 pt-14 pb-8 bg-[#0C0F1A]">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="Rodofood" className="w-8 h-8 rounded-lg object-cover" />
            <div>
              <h1 className="text-2xl font-extrabold text-white">Rodo<span className="text-orange-500">food</span></h1>
              <p className="text-gray-400 text-xs mt-0.5">Customer Portal</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 py-10 bg-gray-50">
          <div className="w-full max-w-md space-y-4">
            <Link href="/landing" className="inline-flex items-center gap-2 text-sm text-gray-500 font-semibold hover:text-orange-500 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-7">
              <div className="mb-6">
                <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <Lock className="w-5 h-5 text-orange-500" />
                </div>
                <h2 className="text-xl font-extrabold text-gray-900">Welcome back!</h2>
                <p className="text-gray-500 mt-1 text-sm">Login to your customer account</p>
              </div>

              {/* Tabs */}
              <div className="flex gap-1.5 mb-6 bg-gray-100 rounded-xl p-1">
                <button onClick={() => setTab('password')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    tab === 'password' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                  }`}>
                  <Lock className="w-3.5 h-3.5" /> Password
                </button>
                <button onClick={() => setTab('otp')}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${
                    tab === 'otp' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                  }`}>
                  <Mail className="w-3.5 h-3.5" /> Email OTP
                </button>
              </div>

              {tab === 'password' ? <PasswordLogin /> : <OtpLogin />}

              <p className="text-center text-sm text-gray-500 mt-5">
                New here? <Link href="/register" className="text-orange-500 font-bold hover:underline">Create account</Link>
              </p>
            </div>

            {/* Restaurant card */}
            <Link href="/restaurant-register">
              <div className="bg-gradient-to-br from-amber-50 to-orange-50 border-2 border-amber-200 rounded-2xl p-5 hover:border-amber-300 hover:shadow-lg transition-all cursor-pointer group">
                <div className="flex items-center gap-4">
                  <div className="w-11 h-11 bg-amber-500 rounded-xl flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Store className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-extrabold text-gray-900 text-sm">Restaurant / Dhaba Owner?</p>
                    <p className="text-xs text-gray-500 mt-0.5">Register or login to your restaurant panel</p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-amber-600 group-hover:translate-x-1 transition-transform" />
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
