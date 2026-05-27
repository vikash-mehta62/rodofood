'use client';
import { useState } from 'react';
import { ArrowLeft, ArrowRight, Loader2, Mail, Eye, EyeOff, RefreshCw, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import api from '@/lib/axios';

type Step = 'email' | 'otp' | 'done';

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const sendOtp = async () => {
    if (!email) return;
    setLoading(true); setError('');
    try {
      await api.post('/customer/forgot-password', { email });
      setStep('otp');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Failed to send OTP.');
    } finally { setLoading(false); }
  };

  const resetPassword = async () => {
    if (otp.length !== 6 || newPassword.length < 6) return;
    setLoading(true); setError('');
    try {
      await api.post('/customer/reset-password', { email, otp, newPassword });
      setStep('done');
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Invalid OTP or expired.');
    } finally { setLoading(false); }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">
        <Link href="/login" className="inline-flex items-center gap-2 text-sm text-gray-500 font-semibold hover:text-orange-500 transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Login
        </Link>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/logo.jpeg" alt="Rodofood" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-extrabold text-xl text-gray-900">Rodo<span className="text-orange-500">food</span></span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">
            {step === 'done' ? 'Password Reset!' : 'Forgot Password'}
          </h1>
          <p className="text-gray-500 text-sm mt-1">
            {step === 'email' && 'Enter your registered email to receive OTP'}
            {step === 'otp' && `OTP sent to ${email}`}
            {step === 'done' && 'Your password has been reset successfully'}
          </p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-4">

          {step === 'done' ? (
            <div className="text-center py-4 space-y-4">
              <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center mx-auto">
                <CheckCircle className="w-8 h-8 text-emerald-500" />
              </div>
              <p className="text-gray-600 text-sm">You can now login with your new password.</p>
              <button onClick={() => router.push('/login')}
                className="w-full h-12 text-white font-bold text-sm rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 shadow-md shadow-orange-200">
                Go to Login →
              </button>
            </div>
          ) : step === 'email' ? (
            <>
              <div className="w-11 h-11 bg-orange-100 rounded-xl flex items-center justify-center">
                <Mail className="w-5 h-5 text-orange-500" />
              </div>
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
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><span>Send OTP</span><ArrowRight className="w-4 h-4" /></>}
              </button>
            </>
          ) : (
            <>
              <div className="bg-orange-50 border border-orange-200 rounded-xl px-4 py-3">
                <p className="text-sm font-bold text-orange-800">Check your email</p>
                <p className="text-xs text-orange-600 mt-0.5">6-digit OTP sent to <span className="font-bold">{email}</span></p>
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">Enter OTP</label>
                <input type="tel" inputMode="numeric" placeholder="——————"
                  value={otp} onChange={e => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                  className="w-full h-14 text-center text-3xl font-extrabold tracking-[0.5em] border-2 border-gray-200 rounded-xl outline-none bg-gray-50 focus:border-orange-400 transition-colors"
                  maxLength={6} autoFocus />
              </div>

              <div>
                <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">New Password (min 6 chars)</label>
                <div className="flex items-center border-2 border-gray-200 rounded-xl overflow-hidden focus-within:border-orange-400 transition-colors">
                  <input type={showPass ? 'text' : 'password'} placeholder="Enter new password"
                    value={newPassword} onChange={e => setNewPassword(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && resetPassword()}
                    className="flex-1 px-4 py-3.5 bg-white text-base font-medium outline-none placeholder-gray-300" />
                  <button type="button" onClick={() => setShowPass(!showPass)} className="pr-4 text-gray-400 hover:text-gray-600">
                    {showPass ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              <button onClick={resetPassword} disabled={otp.length !== 6 || newPassword.length < 6 || loading}
                className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 bg-gradient-to-r from-orange-500 to-orange-400 shadow-md shadow-orange-200 disabled:shadow-none disabled:bg-none disabled:bg-gray-300">
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Reset Password ✓'}
              </button>

              <div className="flex items-center justify-between pt-1">
                <button type="button" onClick={() => { setStep('email'); setOtp(''); }}
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
      </div>
    </div>
  );
}
