'use client';
import { useState, useEffect } from 'react';
import { ArrowRight, ArrowLeft, Loader2, CheckCircle, Store, Eye, EyeOff } from 'lucide-react';
import { useRestaurantRegister, useRestaurantLogin } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

type Tab = 'register' | 'login';

export default function RestaurantRegisterPage() {
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();
  const [tab, setTab] = useState<Tab>('register');
  const [showPass, setShowPass] = useState(false);

  // Register form
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  // Login form
  const [loginPhone, setLoginPhone] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const register = useRestaurantRegister();
  const login = useRestaurantLogin();

  useEffect(() => {
    if (isAuthenticated && user?.role === 'restaurant' && user?.name) router.replace('/restaurant/dashboard');
    else if (isAuthenticated && user?.role === 'admin') router.replace('/admin/dashboard');
    else if (isAuthenticated && user?.role === 'customer' && user?.name) router.replace('/home');
  }, [isAuthenticated, user, router]);

  const handleRegister = async () => {
    if (!name.trim() || phone.length !== 10 || password.length < 6) return;
    try { await register.mutateAsync({ name: name.trim(), phone, password, email: email || undefined }); } catch (_) {}
  };

  const handleLogin = async () => {
    if (loginPhone.length !== 10 || !loginPassword) return;
    try { await login.mutateAsync({ phone: loginPhone, password: loginPassword }); } catch (_) {}
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

      <div className="flex-1 flex items-start justify-center px-5 pb-10">
        <div className="w-full max-w-md">

          {/* Tabs */}
          <div className="flex gap-2 mb-5 bg-white/10 rounded-2xl p-1.5">
            <button onClick={() => setTab('register')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'register' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
              Register Restaurant
            </button>
            <button onClick={() => setTab('login')}
              className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all ${tab === 'login' ? 'bg-orange-500 text-white shadow-md' : 'text-gray-400 hover:text-white'}`}>
              Already Registered
            </button>
          </div>

          <div className="bg-white rounded-2xl p-7">
            {tab === 'register' ? (
              <>
                <div className="mb-6">
                  <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4">
                    <Store className="w-6 h-6 text-amber-600" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900">List your Restaurant</h2>
                  <p className="text-gray-500 mt-1 text-sm">Join Rodofood and get pre-orders from highway travellers</p>
                </div>

                <div className="space-y-4 mb-6">
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
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Email (optional)</label>
                    <input type="email" placeholder="your@email.com" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl outline-none text-sm font-medium focus:border-orange-400 transition-colors bg-gray-50" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Password * (min 6 chars)</label>
                    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-400 transition-colors">
                      <input type={showPass ? 'text' : 'password'} placeholder="Create a password"
                        value={password} onChange={e => setPassword(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleRegister()}
                        className="flex-1 px-4 py-3.5 bg-white text-base font-medium outline-none placeholder-gray-300" />
                      <button type="button" onClick={() => setShowPass(!showPass)} className="pr-4 text-gray-400">
                        {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1">
                  <p className="text-xs font-bold text-amber-800">After registration:</p>
                  <ul className="text-xs text-amber-700 space-y-0.5 list-disc list-inside">
                    <li>Add restaurant name, address & location</li>
                    <li>Set up menu & pricing</li>
                    <li>Start receiving pre-orders</li>
                  </ul>
                </div>

                <button onClick={handleRegister}
                  disabled={!name.trim() || phone.length !== 10 || password.length < 6 || register.isPending}
                  className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-orange-200 disabled:shadow-none disabled:bg-none disabled:bg-gray-300">
                  {register.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Register Restaurant</span><ArrowRight className="w-4 h-4" /></>}
                </button>

                {register.isError && (
                  <p className="mt-3 text-red-500 text-sm text-center">{(register.error as any)?.response?.data?.message || 'Registration failed.'}</p>
                )}
              </>
            ) : (
              <>
                <div className="mb-6">
                  <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center mb-4">
                    <Store className="w-6 h-6 text-orange-500" />
                  </div>
                  <h2 className="text-2xl font-extrabold text-gray-900">Restaurant Login</h2>
                  <p className="text-gray-500 mt-1 text-sm">Login to your restaurant dashboard</p>
                </div>

                <div className="space-y-4 mb-6">
                  <div>
                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Mobile Number</label>
                    <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-400 transition-colors">
                      <div className="flex items-center gap-2 px-4 py-3.5 border-r border-gray-200 bg-gray-50 flex-shrink-0">
                        <span className="text-lg">🇮🇳</span>
                        <span className="text-sm font-bold text-gray-600">+91</span>
                      </div>
                      <input type="tel" inputMode="numeric" placeholder="10-digit number"
                        value={loginPhone} onChange={e => setLoginPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                        className="flex-1 px-4 py-3.5 bg-white text-base font-medium outline-none placeholder-gray-300" maxLength={10} autoFocus />
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
                      <button type="button" onClick={() => setShowPass(!showPass)} className="pr-4 text-gray-400">
                        {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                      </button>
                    </div>
                  </div>
                </div>

                <button onClick={handleLogin}
                  disabled={loginPhone.length !== 10 || !loginPassword || login.isPending}
                  className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-orange-200 disabled:shadow-none disabled:bg-none disabled:bg-gray-300">
                  {login.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Login to Dashboard →'}
                </button>

                {login.isError && (
                  <p className="mt-3 text-red-500 text-sm text-center">{(login.error as any)?.response?.data?.message || 'Login failed.'}</p>
                )}
              </>
            )}
          </div>

          <p className="text-center text-xs text-gray-500 mt-5">
            Customer?{' '}
            <Link href="/login" className="text-orange-400 font-semibold hover:underline">Login here</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
