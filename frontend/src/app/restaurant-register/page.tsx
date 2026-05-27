'use client';
import { useState, useEffect } from 'react';
import { ArrowLeft, Loader2, CheckCircle, Store, Eye, EyeOff, Mail, RefreshCw, ChefHat, TrendingUp, ShoppingBag, Clock, Lock } from 'lucide-react';
import { useRestaurantRegister, useRestaurantVerifyEmail, useResendRestaurantOtp, useRestaurantLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import api from '@/lib/axios';

type Tab = 'login' | 'register';
type RegStep = 'form' | 'otp';
type LoginMode = 'password' | 'otp';
type OtpStep = 'email' | 'verify';
type ForgotStep = 'email' | 'otp' | 'done';

const BENEFITS = [
  { icon: ShoppingBag, text: 'Receive pre-orders before customers arrive' },
  { icon: TrendingUp, text: 'Grow your revenue with highway travellers' },
  { icon: Clock, text: 'Manage orders in real-time' },
];

export default function RestaurantAuthPage() {
  const router = useRouter();
  const { user, isAuthenticated, setAuth } = useAuthStore();
  const [tab, setTab] = useState<Tab>('login');
  const [loginMode, setLoginMode] = useState<LoginMode>('password');
  const [regStep, setRegStep] = useState<RegStep>('form');
  const [showPass, setShowPass] = useState(false);
  const [showForgot, setShowForgot] = useState(false);

  // Password login
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  // OTP login
  const [otpEmail, setOtpEmail] = useState('');
  const [loginOtp, setLoginOtp] = useState('');
  const [otpStep, setOtpStep] = useState<OtpStep>('email');
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState('');

  // Forgot password
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotOtp, setForgotOtp] = useState('');
  const [forgotNewPass, setForgotNewPass] = useState('');
  const [forgotStep, setForgotStep] = useState<ForgotStep>('email');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [showForgotPass, setShowForgotPass] = useState(false);

  // Register
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');

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

  const sendLoginOtp = async () => {
    if (!otpEmail) return;
    setOtpLoading(true); setOtpError('');
    try {
      await api.post('/restaurant/send-login-otp', { email: otpEmail });
      setOtpStep('verify');
    } catch (e: any) { setOtpError(e?.response?.data?.message || 'Failed to send OTP.'); }
    finally { setOtpLoading(false); }
  };

  const verifyLoginOtp = async () => {
    if (loginOtp.length !== 6) return;
    setOtpLoading(true); setOtpError('');
    try {
      const res = await api.post('/restaurant/verify-login-otp', { email: otpEmail, otp: loginOtp });
      const { token, user: u } = res.data.data;
      setAuth(u, token);
      router.push('/restaurant/dashboard');
    } catch (e: any) { setOtpError(e?.response?.data?.message || 'Invalid OTP.'); }
    finally { setOtpLoading(false); }
  };

  const sendForgotOtp = async () => {
    if (!forgotEmail) return;
    setForgotLoading(true); setForgotError('');
    try {
      await api.post('/restaurant/forgot-password', { email: forgotEmail });
      setForgotStep('otp');
    } catch (e: any) { setForgotError(e?.response?.data?.message || 'Failed to send OTP.'); }
    finally { setForgotLoading(false); }
  };

  const resetPassword = async () => {
    if (forgotOtp.length !== 6 || forgotNewPass.length < 6) return;
    setForgotLoading(true); setForgotError('');
    try {
      await api.post('/restaurant/reset-password', { email: forgotEmail, otp: forgotOtp, newPassword: forgotNewPass });
      setForgotStep('done');
    } catch (e: any) { setForgotError(e?.response?.data?.message || 'Invalid OTP.'); }
    finally { setForgotLoading(false); }
  };

  const resetForgot = () => {
    setShowForgot(false); setForgotStep('email');
    setForgotEmail(''); setForgotOtp(''); setForgotNewPass(''); setForgotError('');
  };

  // ── LEFT BRANDING (shared) ──
  const LeftPanel = () => (
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
          <span className="bg-gradient-to-r from-orange-400 to-amber-400 bg-clip-text text-transparent">highway pe famous.</span>
        </h1>
        <p className="text-orange-200/60 text-base leading-relaxed mb-8">
          Join India's first highway food pre-ordering network. Get orders before customers even arrive.
        </p>
        <div className="space-y-3">
          {BENEFITS.map(({ icon: Icon, text }) => (
            <div key={text} className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)' }}>
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(255,107,53,0.2)' }}>
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
  );

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <LeftPanel />

      <div className="flex-1 flex flex-col" style={{ background: '#FFF7ED' }}>
        {/* Mobile header */}
        <div className="lg:hidden px-6 pt-14 pb-8 relative overflow-hidden" style={{ background: 'linear-gradient(135deg,#1a0a00,#2d1200)' }}>
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
            <Link href="/landing" className="inline-flex items-center gap-2 text-sm text-amber-700 font-semibold mb-5 hover:text-amber-900 transition-colors">
              <ArrowLeft className="w-4 h-4" /> Back to Home
            </Link>

            {/* Main tabs */}
            <div className="flex gap-2 mb-5 bg-amber-100 rounded-2xl p-1.5 border border-amber-200">
              {(['login', 'register'] as Tab[]).map(t => (
                <button key={t} onClick={() => { setTab(t); setRegStep('form'); setShowForgot(false); }}
                  className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all capitalize ${tab === t ? 'text-white shadow-md' : 'text-amber-700 hover:text-amber-900'}`}
                  style={tab === t ? { background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' } : {}}>
                  {t === 'login' ? '🔑 Login' : '🏪 Register'}
                </button>
              ))}
            </div>

            {/* ── LOGIN TAB ── */}
            {tab === 'login' && !showForgot && (
              <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-7">
                <div className="mb-5">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-4" style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                    <ChefHat className="w-6 h-6 text-white" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900">Restaurant Login</h2>
                  <p className="text-gray-500 mt-1 text-sm">Access your restaurant dashboard</p>
                </div>

                {/* Login mode tabs */}
                <div className="flex gap-1.5 mb-5 bg-gray-100 rounded-xl p-1">
                  <button onClick={() => setLoginMode('password')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${loginMode === 'password' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                    <Lock className="w-3.5 h-3.5" /> Password
                  </button>
                  <button onClick={() => setLoginMode('otp')}
                    className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs font-bold transition-all ${loginMode === 'otp' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}>
                    <Mail className="w-3.5 h-3.5" /> Email OTP
                  </button>
                </div>

                {/* Password login */}
                {loginMode === 'password' && (
                  <div className="space-y-4">
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
                    <button onClick={handleLogin} disabled={loginPhone.length !== 10 || !loginPassword || login.isPending}
                      className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 disabled:shadow-none disabled:bg-gray-300"
                      style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)', boxShadow: '0 4px 15px rgba(255,107,53,0.3)' }}>
                      {login.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login to Dashboard →'}
                    </button>
                    {login.isError && (
                      <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center">
                        <p className="text-red-600 text-sm">{(login.error as any)?.response?.data?.message || 'Login failed.'}</p>
                      </div>
                    )}
                    <p className="text-center text-xs">
                      <button onClick={() => setShowForgot(true)} className="text-gray-400 hover:text-orange-500 transition-colors">Forgot password?</button>
                    </p>
                  </div>
                )}

                {/* OTP login */}
                {loginMode === 'otp' && (
                  <div className="space-y-4">
                    {otpStep === 'email' ? (
                      <>
                        <div>
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Email Address</label>
                          <input type="email" placeholder="your@email.com" value={otpEmail}
                            onChange={e => setOtpEmail(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && sendLoginOtp()}
                            autoFocus
                            className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl outline-none text-sm font-medium focus:border-orange-400 transition-colors bg-gray-50" />
                        </div>
                        <button onClick={sendLoginOtp} disabled={!otpEmail || otpLoading}
                          className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:bg-gray-300"
                          style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                          {otpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Mail className="w-4 h-4" /> Send OTP</>}
                        </button>
                      </>
                    ) : (
                      <>
                        <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                          <p className="text-sm font-bold text-orange-800">OTP sent to <span className="font-bold">{otpEmail}</span></p>
                        </div>
                        <div>
                          <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Enter 6-digit OTP</label>
                          <input type="tel" inputMode="numeric" placeholder="——————"
                            value={loginOtp} onChange={e => setLoginOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            onKeyDown={e => e.key === 'Enter' && verifyLoginOtp()}
                            className="w-full h-14 text-center text-3xl font-extrabold tracking-[0.5em] border-2 border-gray-200 rounded-xl outline-none bg-gray-50 focus:border-orange-400 transition-colors"
                            maxLength={6} autoFocus />
                        </div>
                        <button onClick={verifyLoginOtp} disabled={loginOtp.length !== 6 || otpLoading}
                          className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:bg-gray-300"
                          style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                          {otpLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login ✓'}
                        </button>
                        <div className="flex items-center justify-between">
                          <button onClick={() => { setOtpStep('email'); setLoginOtp(''); setOtpError(''); }} className="text-sm text-gray-400 hover:text-gray-700">← Change email</button>
                          <button onClick={sendLoginOtp} disabled={otpLoading} className="flex items-center gap-1.5 text-sm text-orange-500 font-semibold disabled:opacity-60">
                            <RefreshCw className={`w-3.5 h-3.5 ${otpLoading ? 'animate-spin' : ''}`} /> Resend
                          </button>
                        </div>
                      </>
                    )}
                    {otpError && <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center"><p className="text-red-600 text-sm">{otpError}</p></div>}
                  </div>
                )}

                <p className="text-center text-sm text-gray-500 mt-5">
                  New restaurant? <button onClick={() => setTab('register')} className="text-orange-500 font-bold hover:underline">Register here</button>
                </p>
              </div>
            )}

            {/* ── FORGOT PASSWORD ── */}
            {tab === 'login' && showForgot && (
              <div className="bg-white rounded-2xl shadow-sm border border-amber-100 p-7">
                <button onClick={resetForgot} className="flex items-center gap-2 text-sm text-gray-400 hover:text-gray-700 mb-5 transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Login
                </button>
                <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                  <Mail className="w-6 h-6 text-orange-500" />
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 mb-1">Forgot Password</h2>
                <p className="text-gray-500 text-sm mb-5">Reset your restaurant account password</p>

                {forgotStep === 'done' ? (
                  <div className="text-center space-y-4 py-4">
                    <div className="w-14 h-14 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                      <CheckCircle className="w-7 h-7 text-emerald-500" />
                    </div>
                    <p className="text-gray-600 text-sm">Password reset! You can now login with your new password.</p>
                    <button onClick={resetForgot} className="w-full h-12 text-white font-bold text-sm rounded-xl"
                      style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                      Back to Login →
                    </button>
                  </div>
                ) : forgotStep === 'email' ? (
                  <div className="space-y-4">
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Registered Email</label>
                      <input type="email" placeholder="your@email.com" value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && sendForgotOtp()}
                        autoFocus
                        className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl outline-none text-sm font-medium focus:border-orange-400 transition-colors bg-gray-50" />
                    </div>
                    <button onClick={sendForgotOtp} disabled={!forgotEmail || forgotLoading}
                      className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:bg-gray-300"
                      style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                      {forgotLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Send OTP →'}
                    </button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                      <p className="text-xs text-orange-700">OTP sent to <span className="font-bold">{forgotEmail}</span></p>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Enter OTP</label>
                      <input type="tel" inputMode="numeric" placeholder="——————"
                        value={forgotOtp} onChange={e => setForgotOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                        className="w-full h-14 text-center text-3xl font-extrabold tracking-[0.5em] border-2 border-gray-200 rounded-xl outline-none bg-gray-50 focus:border-orange-400 transition-colors"
                        maxLength={6} autoFocus />
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">New Password (min 6 chars)</label>
                      <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-400 transition-colors">
                        <input type={showForgotPass ? 'text' : 'password'} placeholder="Enter new password"
                          value={forgotNewPass} onChange={e => setForgotNewPass(e.target.value)}
                          onKeyDown={e => e.key === 'Enter' && resetPassword()}
                          className="flex-1 px-4 py-3.5 bg-white text-base font-medium outline-none placeholder-gray-300" />
                        <button type="button" onClick={() => setShowForgotPass(!showForgotPass)} className="pr-4 text-gray-400 hover:text-gray-600">
                          {showForgotPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                        </button>
                      </div>
                    </div>
                    <button onClick={resetPassword} disabled={forgotOtp.length !== 6 || forgotNewPass.length < 6 || forgotLoading}
                      className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:bg-gray-300"
                      style={{ background: 'linear-gradient(135deg,#FF6B35,#FF8C42)' }}>
                      {forgotLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password ✓'}
                    </button>
                    <div className="flex items-center justify-between">
                      <button onClick={() => { setForgotStep('email'); setForgotOtp(''); }} className="text-sm text-gray-400 hover:text-gray-700">← Change email</button>
                      <button onClick={sendForgotOtp} disabled={forgotLoading} className="flex items-center gap-1.5 text-sm text-orange-500 font-semibold disabled:opacity-60">
                        <RefreshCw className={`w-3.5 h-3.5 ${forgotLoading ? 'animate-spin' : ''}`} /> Resend OTP
                      </button>
                    </div>
                  </div>
                )}
                {forgotError && <div className="mt-3 bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-center"><p className="text-red-600 text-sm">{forgotError}</p></div>}
              </div>
            )}

            {/* ── REGISTER TAB ── */}
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

            {/* ── OTP VERIFY (register) ── */}
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
                  <button type="button" onClick={() => { setRegStep('form'); setOtp(''); }} className="text-sm text-gray-400 hover:text-gray-700 transition-colors">← Change details</button>
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
