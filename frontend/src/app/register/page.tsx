'use client';
import { useState } from 'react';
import { ArrowRight, ArrowLeft, Loader2, Eye, EyeOff, CheckCircle, UserPlus, Mail, RefreshCw } from 'lucide-react';
import { useCustomerRegister, useCustomerVerifyEmail, useResendCustomerOtp } from '@/hooks/useAuth';
import Link from 'next/link';

type Step = 'form' | 'otp';

export default function RegisterPage() {
  const [step, setStep] = useState<Step>('form');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [showPass, setShowPass] = useState(false);

  const register = useCustomerRegister();
  const verifyEmail = useCustomerVerifyEmail();
  const resendOtp = useResendCustomerOtp();

  const handleRegister = async () => {
    if (!name.trim() || phone.length !== 10 || !email || password.length < 6) return;
    try {
      await register.mutateAsync({ name: name.trim(), phone, email, password });
      setStep('otp');
    } catch (_) {}
  };

  const handleVerify = async () => {
    if (otp.length !== 6) return;
    try { await verifyEmail.mutateAsync({ email, otp }); } catch (_) {}
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <Link href="/landing" className="inline-flex items-center gap-2 text-sm text-gray-500 font-semibold hover:text-orange-500 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Home
        </Link>
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/logo.jpeg" alt="Rodofood" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-extrabold text-xl text-gray-900">Rodo<span className="text-orange-500">food</span></span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            {step === 'form' ? 'Create Account' : 'Verify Email'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 'form' ? 'Sign up to start ordering highway food' : `OTP sent to ${email}`}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">

          {step === 'form' ? (
            <>
              <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center">
                <UserPlus className="w-5 h-5 text-orange-500" />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Full Name *</label>
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
                  <input type={showPass ? 'text' : 'password'} placeholder="Create a password"
                    value={password} onChange={e => setPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleRegister()}
                    className="flex-1 px-4 py-3.5 bg-white text-base font-medium outline-none placeholder-gray-300" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="pr-4 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button onClick={handleRegister}
                disabled={!name.trim() || phone.length !== 10 || !email || password.length < 6 || register.isPending}
                className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 bg-gradient-to-r from-orange-500 to-orange-400 shadow-md shadow-orange-200 disabled:shadow-none disabled:bg-none disabled:bg-gray-300">
                {register.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Send Verification OTP</span><ArrowRight className="w-4 h-4" /></>}
              </button>

              {register.isError && (
                <p className="text-red-500 text-sm text-center">{(register.error as any)?.response?.data?.message || 'Registration failed.'}</p>
              )}
            </>
          ) : (
            <>
              <div className="w-11 h-11 bg-emerald-100 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-emerald-600" />
              </div>

              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                <p className="text-sm font-bold text-orange-800">Check your email</p>
                <p className="text-xs text-orange-600 mt-0.5">We sent a 6-digit OTP to <span className="font-bold">{email}</span></p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Enter 6-digit OTP</label>
                <input type="tel" inputMode="numeric" placeholder="——————"
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  onKeyDown={e => e.key === 'Enter' && handleVerify()}
                  className="w-full h-14 text-center text-3xl font-extrabold tracking-[0.5em] border-2 border-gray-200 rounded-xl outline-none bg-gray-50 focus:border-orange-400 transition-colors"
                  maxLength={6} autoFocus />
              </div>

              <button onClick={handleVerify} disabled={otp.length !== 6 || verifyEmail.isPending}
                className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 bg-gradient-to-r from-orange-500 to-orange-400 shadow-md shadow-orange-200 disabled:shadow-none disabled:bg-none disabled:bg-gray-300">
                {verifyEmail.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Create Account ✓'}
              </button>

              {verifyEmail.isError && (
                <p className="text-red-500 text-sm text-center">{(verifyEmail.error as any)?.response?.data?.message || 'Invalid OTP.'}</p>
              )}

              <div className="flex items-center justify-between pt-1">
                <button type="button" onClick={() => { setStep('form'); setOtp(''); }}
                  className="text-sm text-gray-400 hover:text-gray-700 transition-colors">← Change details</button>
                <button type="button" onClick={() => resendOtp.mutate(email)} disabled={resendOtp.isPending}
                  className="flex items-center gap-1.5 text-sm text-orange-500 font-semibold hover:text-orange-600 disabled:opacity-60">
                  <RefreshCw className={`w-3.5 h-3.5 ${resendOtp.isPending ? 'animate-spin' : ''}`} /> Resend OTP
                </button>
              </div>
            </>
          )}

          <p className="text-center text-sm text-gray-500 pt-1">
            Already have an account?{' '}
            <Link href="/login" className="text-orange-500 font-bold hover:underline">Login</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
