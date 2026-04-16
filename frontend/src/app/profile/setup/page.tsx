'use client';
import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Loader2, ArrowRight, CheckCircle, Store, User } from 'lucide-react';
import { useUpdateProfile } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/authStore';

export default function ProfileSetupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuthStore();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'customer' | 'restaurant'>('customer');

  // Pre-select role from URL param (passed from login page)
  useEffect(() => {
    const r = searchParams.get('role');
    if (r === 'restaurant') setRole('restaurant');
  }, [searchParams]);

  const handleSubmit = async () => {
    if (!name.trim()) return;
    await updateProfile.mutateAsync({ name: name.trim(), email: email.trim() || undefined, role });
    if (role === 'restaurant') router.push('/restaurant/dashboard');
    else router.push('/home');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center px-5 py-10">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-3 mb-4">
            <img src="/logo.jpeg" alt="Rodofood" className="w-8 h-8 rounded-lg object-cover" />
            <span className="font-extrabold text-xl text-gray-900">Rodo<span className="text-orange-500">food</span></span>
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900">Complete your profile</h1>
          <p className="text-gray-500 text-sm mt-1">Just a few details to get you started</p>
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 space-y-5">

          {/* Role selection — shown first so user confirms their intent */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3 block">
              I am signing up as...
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setRole('customer')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  role === 'customer'
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <User className={`w-6 h-6 ${role === 'customer' ? 'text-orange-500' : 'text-gray-400'}`} />
                <span className="text-sm font-bold text-gray-800">Customer</span>
                <span className="text-[10px] text-gray-500 text-center leading-tight">Order food on the go</span>
                {role === 'customer' && <CheckCircle className="w-4 h-4 text-orange-500" />}
              </button>

              <button
                type="button"
                onClick={() => setRole('restaurant')}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                  role === 'restaurant'
                    ? 'border-orange-400 bg-orange-50'
                    : 'border-gray-200 bg-gray-50 hover:border-gray-300'
                }`}
              >
                <Store className={`w-6 h-6 ${role === 'restaurant' ? 'text-orange-500' : 'text-gray-400'}`} />
                <span className="text-sm font-bold text-gray-800">Restaurant / Dhaba</span>
                <span className="text-[10px] text-gray-500 text-center leading-tight">Manage your outlet</span>
                {role === 'restaurant' && <CheckCircle className="w-4 h-4 text-orange-500" />}
              </button>
            </div>
          </div>

          {/* Name */}
          <div>
            <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 block">
              {role === 'restaurant' ? 'Owner Name *' : 'Your Name *'}
            </label>
            <input
              type="text"
              placeholder={role === 'restaurant' ? 'Restaurant owner full name' : 'Enter your full name'}
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
              className="w-full h-12 px-4 border-2 border-gray-200 rounded-xl outline-none text-sm font-medium focus:border-orange-400 transition-colors bg-gray-50"
            />
          </div>

          {/* Email */}
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

          {/* Restaurant note */}
          {role === 'restaurant' && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 space-y-1">
              <p className="text-xs font-bold text-amber-800">After setup you can:</p>
              <ul className="text-xs text-amber-700 space-y-0.5 list-disc list-inside">
                <li>Add your restaurant details & location</li>
                <li>Set up your menu & pricing</li>
                <li>Start receiving pre-orders</li>
              </ul>
            </div>
          )}

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!name.trim() || updateProfile.isPending}
            className="w-full h-12 text-white font-bold text-sm rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-40 bg-gradient-to-r from-orange-500 to-orange-400 shadow-md shadow-orange-200 hover:shadow-orange-300 disabled:shadow-none disabled:bg-none disabled:bg-gray-300"
          >
            {updateProfile.isPending
              ? <Loader2 className="w-5 h-5 animate-spin" />
              : <><span>{role === 'restaurant' ? 'Register My Restaurant' : 'Get Started'}</span><ArrowRight className="w-4 h-4" /></>
            }
          </button>

          {updateProfile.isError && (
            <p className="text-red-500 text-sm text-center">
              {(updateProfile.error as any)?.response?.data?.message || 'Something went wrong.'}
            </p>
          )}
        </div>

        <p className="text-center text-xs text-gray-400 mt-5">
          +91 {user?.phone} · You can update details later from your profile
        </p>
      </div>
    </div>
  );
}
