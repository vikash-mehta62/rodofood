'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, CheckCircle, Store, Eye, EyeOff, Mail, RefreshCw, ChefHat, TrendingUp, ShoppingBag, Clock } from 'lucide-react';
import { useRestaurantRegister, useRestaurantVerifyEmail, useResendRestaurantOtp, useRestaurantLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Tab = 'login' | 'register';
type RegStep = 'form' | 'otp';

const BENEFITS = [
  { icon: ShoppingBag, text: 'Receive pre-orders before customers arrive' },
  { icon: TrendingUp, text: 'Grow your revenue with highway travellers' },
  { icon: Clock, text: 'Manage orders in real-time' },
];

export default function RestaurantAuthPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [tab, setTab] = useState<Tab>('login');
  const [regStep, setRegStep] = useState<RegStep>('form');
  const [showPass, setShowPass] = useState(false);

  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const register = useRestaurantRegister();
  const verifyEmail = useRestaurantVerifyEmail();
  const resendOtp = useResendRestaurantOtp();
  const login = useRestaurantLogin();

  useEffect(() => {
    if (isAuthenticated && user?.role === 'restaurant') router.replace('/restaurant/dashboard');
    else if (isAuthenticated && user?.role === 'admin') router.replace('/admin/dashboard');
    else if (isAuthenticated && user?.role === 'customer') router.replace('/home');
  }, [isAuthenticated, user, router]);

  const handleRegister = async () => {
    if (!name.trim() || phone.length !== 10 || !email || password.length < 6) return;
    try { await register.mutateAsync({ name: name.trim(), phone, email, password }); setRegStep('otp'); } catch (_) {}
  };

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    try { await verifyEmail.mutateAsync({ email, otp }); } catch (_) {}
  };

  const handleLogin = async () => {
    if (loginPhone.length !== 10 || !loginPassword) return;
    try { await login.mutateAsync({ phone: loginPhone, password: loginPassword }); } catch (_) {}
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── LEFT — restaurant branding ── */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-1/2 flex-col justify-between p-12 relative overflow-hidden"
        style={{ background: 'linear-gradient(135deg,#1a0a00 0%,#2d1200 50%,#1a0a00 100%)' }}>
        <div className="absolute inset-0 opacity-[0.06]"
          style={{ backgroundImage: 'radial-gradient(circle, #FF6B35 1px, transparent 1px)', backgroundSize: '32px 32px' }} />
        <div className="absolute top-0 right-0 w-[600px] h-[600px] rounded-full opacity-15 blur-[100px]"
          style={{ background: 'radial-gradient(circle,#FF6B35 0%,transparent 65%)' }} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
            <ChefHat className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="font-extrabold text-xl text-white">Rodo<span className="text-orange-500">food</span></span>
            <p className="text-orange-400/60 text-[10px] font-bold uppercase tracking-widest">Restaurant Panel</p>
          </div>
        </div>

        <div className="relative z-10">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/30 rounded-full px-4 py-1.5 mb-6">
            <Store className="w-3.5 h-3.5 text-orange-400" />
            <span className="text-orange-300 text-xs font-bold uppercase tracking-widest">For Restaurant Owners</span>
          </div>
          <h1 className="text-4xl xl:text-5xl font-extrabold text-white leading-[1.1] mb-5">
            Apna dhaba,<br />
            <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">
              highway pe famous.
            </span>
          </h1>
          <p className="text-orange-200/60 text-base leading-relaxed mb-8">
            Join India's first highway food pre-ordering network. Get orders before customers even arrive.
          </p>
          <div className="space-y-3">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3 rounded-xl px-4 py-3"
                style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)' }}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                  style={{ background: 'rgba(255,107,53,0.2)' }}>
                  <Icon className="w-4 h-4 text-orange-400" />
                </div>
                <span className="text-sm text-orange-100/80 font-medium">{text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 grid grid-cols-3 gap-3">
          {[{ val: '50+', label: 'Restaurants' }, { val: '1,200+', label: 'Daily Orders' }, { val: '4.8★', label: 'Avg Rating' }].map(s => (
            <div key={s.label} className="rounded-xl p-3 text-center" style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.15)' }}>
              <p className="text-lg font-extrabold text-orange-400">{s.val}</p>
              <p className="text-[10px] text-orange-200/40 font-semibold uppercase tracking-wider mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── RIGHT — form ── */}
      <div className="flex-1 flex flex-col" style={{ background: '#FFF7ED' }}>
        {/* Mobile header */}
        <div className="lg:hidden px-6 pt-14 pb-8 relative overflow-hidden"
          style={{ background: 'linear-gradient(135deg,#1a0a00,#2d1200)' }}>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
              <ChefHat className="w-4 h-4 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-white">Rodo<span className="text-orange-500">food</span></h1>
              <p className="text-orange-400/60 text-[10px] font-bold uppercase tracking-widest">Restaurant Panel</p>
            </div>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-5 py-10">
          <div className="w-full max-w-md">

            {/* Back to customer */}
            <Link href="/login" className="inline-flex items-center gap-2 text-sm text-amber-700 font-semibold mb-5 hover:text-amber-900 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Customer Login
            </Link>

            {/* Tabs */}
            <div className="flex gap-2 mb-5 bg-amber-100 rounded-2xl p-1.5 border border-amber-200">
              {(['login', 'register'] as Tab[]).map(t => (
                <button key={t} onClick={() => { setTab(t); setRegStep('form'); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${
                    tab === t
                      ? 'text-white shadow-md'
                      : 'text-amber-700 hover:text-amber-900'
                  }`}
                  style={tab === t ? { background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' } : {}}>
                  {t === 'login' ? '🔑 Login' : '🏪 Register'}
                </button>
              ))}
            </div>

            {/* ── LOGIN ── */}
            {tab === 'login' && (
              <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-7">
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
                    style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                    <ChefHat className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900">Restaurant Login</h2>
                  <p className="text-gray-500 mt-1 text-sm">Access your restaurant dashboard</p>
                </div>

                <div className="space-y-4 mb-5">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Owner's Mobile Number</label>
                    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-400 transition-colors">
                      <div className="flex items-center gap-2 px-4 py-3.5 border-r border-gray-200 bg-gray-50 flex-shrink-0">
                        <span className="text-lg">🇮🇳</span>
                        <span className="text-sm font-bold text-gray-600">+91</span>
                      </div>
                      <input type="tel" inputMode="numeric" placeholder="10-digit number"
                        value={loginPhone} onChange={e => setLoginPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        className="flex-1 px-4 py-3.5 bg-white text-base font-medium outline-none placeholder-gray-300"
                        maxLength={10} autoFocus />
                      {loginPhone.length === 10 && <span className="pr-4 text-emerald-500"><CheckCircle className="w-5 h-5" /></span>}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Password</label>
                    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-400 transition-colors">
                      <input type={showPass ? 'text' : 'password'} placeholder="Your password"
                        value={loginPassword} onChange={e => setLoginPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleLogin()}
                        className="flex-1 px-4 py-3.5 bg-white text-base font-medium outline-none placeholder-gray-300" />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="pr-4 text-gray-400 hover:text-gray-600">
                        {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button onClick={handleLogin} disabled={loginPhone.length !== 10 || !loginPassword || login.isPending}
                  className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none disabled:bg-gray-300"
                  style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)', boxShadow: '0 4px 15px rgba(255,107,53,0.3)' }}>
                  {login.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login to Dashboard →'}
                </button>

                {login.isError && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
                    <p className="text-red-600 text-sm">{(login.error as any)?.response?.data?.message || 'Login failed.'}</p>
                  </div>
                )}

                <p className="text-center text-sm text-gray-500 mt-5">
                  New restaurant? <button onClick={() => setTab('register')} className="text-orange-500 font-bold hover:underline">Register here</button>
                </p>
              </div>
            )}

            {/* ── REGISTER ── */}
            {tab === 'register' && regStep === 'form' && (
              <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-7">
                <div className="mb-6">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                    <Store className="w-6 h-6 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900">List your Restaurant</h2>
                  <p className="text-gray-500 mt-1 text-sm">Create your restaurant owner account</p>
                </div>

                <div className="space-y-4 mb-5">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Owner Name *</label>
                    <input type="text" placeholder="Your full name" value={name} onChange={e => setName(e.target.value)} autoFocus
                      className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl outline-none text-sm font-medium focus:border-orange-400 transition-colors bg-gray-50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Mobile Number *</label>
                    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-400 transition-colors">
                      <div className="flex items-center gap-2 px-4 py-3.5 border-r border-gray-200 bg-gray-50 flex-shrink-0">
                        <span className="text-lg">🇮🇳</span>
                        <span className="text-sm font-bold text-gray-600">+91</span>
                      </div>
                      <input type="tel" inputMode="numeric" placeholder="10-digit number"
                        value={phone} onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="flex-1 px-4 py-3.5 bg-white text-base font-medium outline-none placeholder-gray-300" maxLength={10} />
                      {phone.length === 10 && <span className="pr-4 text-emerald-500"><CheckCircle className="w-5 h-5" /></span>}
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Email * (OTP will be sent here)</label>
                    <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl outline-none text-sm font-medium focus:border-orange-400 transition-colors bg-gray-50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Password * (min 6 chars)</label>
                    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-400 transition-colors">
                      <input type={showPass ? 'text' : 'password'} placeholder="Create a strong password"
                        value={password} onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleRegister()}
                        className="flex-1 px-4 py-3.5 bg-white text-base font-medium outline-none placeholder-gray-300" />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="pr-4 text-gray-400 hover:text-gray-600">
                        {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mb-5 rounded-xl px-4 py-3" style={{ background: 'rgba(255,107,53,0.06)', border: '1px solid rgba(255,107,53,0.2)' }}>
                  <p className="text-xs font-bold text-orange-700 mb-1">After registration you can:</p>
                  <ul className="text-xs text-orange-600 space-y-0.5 list-disc list-inside">
                    <li>Add restaurant name, address & location</li>
                    <li>Set up menu & pricing</li>
                    <li>Start receiving pre-orders</li>
                  </ul>
                </div>

                <button onClick={handleRegister}
                  disabled={!name.trim() || phone.length !== 10 || !email || password.length < 6 || register.isPending}
                  className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none disabled:bg-gray-300"
                  style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)', boxShadow: '0 4px 15px rgba(255,107,53,0.3)' }}>
                  {register.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send Verification OTP →'}
                </button>

                {register.isError && (
                  <div className="mt-4 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
                    <p className="text-red-600 text-sm">{(register.error as any)?.response?.data?.message || 'Registration failed.'}</p>
                  </div>
                )}
              </div>
            )}

            {/* ── OTP VERIFY ── */}
            {tab === 'register' && regStep === 'otp' && (
              <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-7">
                <div className="mb-6">
                  <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mb-4">
                    <Mail className="w-6 h-6 text-emerald-600" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900">Verify Email</h2>
                  <p className="text-gray-500 mt-1 text-sm">OTP sent to <span className="font-bold text-gray-800">{email}</span></p>
                </div>

                <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mb-5">
                  <p className="text-xs text-amber-700">Check your inbox and enter the 6-digit OTP below. Valid for 10 minutes.</p>
                </div>

                <div className="mb-5">
                  <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Enter 6-digit OTP</label>
                  <input type="tel" inputMode="numeric" placeholder="——————"
                    value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    onKeyDown={e => e.key === 'Enter' && handleVerify()}
                    className="w-full h-14 text-center text-3xl font-extrabold tracking-[0.5em] border-2 border-gray-200 rounded-xl outline-none bg-gray-50 focus:border-orange-400 transition-colors"
                    maxLength={6} autoFocus />
                </div>

                <button onClick={handleVerify} disabled={otp.length !== 6 || verifyEmail.isPending}
                  className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none disabled:bg-gray-300 mb-3"
                  style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)', boxShadow: '0 4px 15px rgba(255,107,53,0.3)' }}>
                  {verifyEmail.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Register ✓'}
                </button>

                {verifyEmail.isError && (
                  <p className="text-red-500 text-sm text-center mb-3">{(verifyEmail.error as any)?.response?.data?.message || 'Invalid OTP.'}</p>
                )}

                <div className="flex items-center justify-between">
                  <button type="button" onClick={() => { setRegStep('form'); setOtp(''); }}
                    className="text-sm text-gray-400 hover:text-gray-700 transition-colors">← Change details</button>
                  <button type="button" onClick={() => resendOtp.mutate(email)} disabled={resendOtp.isPending}
                    className="flex items-center gap-1.5 text-sm text-orange-500 font-semibold hover:text-orange-600 disabled:opacity-60">
                    <RefreshCw className={`w-3.5 h-3.5 ${resendOtp.isPending ? 'animate-spin' : ''}`} /> Resend OTP
                  </button>
                </div>
              </div>
            )}

            <p className="text-center text-xs text-gray-500 mt-5">By continuing, you agree to our Terms &amp; Privacy Policy</p>
          </div>
        </div>
      </div>
    </div>
  );
}
