'use client';
import { useState } from 'react';
import Image from 'next/image';
import { Phone, ArrowRight, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
    const res = await sendOtp.mutateAsync(phone);
    // Show OTP in UI for dev/testing
    if (res.data?.data?.devOtp) {
      setDevOtp(res.data.data.devOtp);
    }
    setStep('otp');
  };

  const handleVerifyOtp = async () => {
    if (otp.length !== 6) return;
    await verifyOtp.mutateAsync({ phone, otp });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-orange-50 to-white flex flex-col">
      {/* Header */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-8">
        <div className="w-20 h-20 bg-primary rounded-2xl flex items-center justify-center mb-6 shadow-lg">
          <span className="text-4xl">🛣️</span>
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Rodofood</h1>
        <p className="text-muted-foreground mt-2 text-center">
          Order highway food before you arrive
        </p>
      </div>

      {/* Form */}
      <div className="bg-white rounded-t-3xl shadow-xl px-6 pt-8 pb-12">
        <h2 className="text-xl font-bold mb-1">
          {step === 'phone' ? 'Enter your mobile number' : 'Verify OTP'}
        </h2>
        <p className="text-sm text-muted-foreground mb-6">
          {step === 'phone'
            ? 'We\'ll send you a 6-digit OTP to verify'
            : `OTP sent to +91 ${phone}`}
        </p>

        {step === 'phone' ? (
          <div className="space-y-4">
            <div className="flex items-center border rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-primary">
              <div className="px-3 py-2.5 bg-muted border-r text-sm font-medium text-muted-foreground">
                +91
              </div>
              <Input
                type="tel"
                placeholder="10-digit mobile number"
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                maxLength={10}
              />
            </div>
            <Button
              className="w-full h-12 text-base"
              onClick={handleSendOtp}
              disabled={phone.length !== 10 || sendOtp.isPending}
            >
              {sendOtp.isPending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>Get OTP <ArrowRight className="w-4 h-4 ml-2" /></>
              )}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <Input
              type="tel"
              placeholder="Enter 6-digit OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              className="text-center text-2xl tracking-widest h-14"
              maxLength={6}
            />

            {/* Dev mode OTP hint */}
            {devOtp && (
              <div className="flex items-center justify-between bg-amber-50 border border-amber-300 rounded-xl px-4 py-3">
                <div>
                  <p className="text-xs font-semibold text-amber-700 uppercase tracking-wide">
                    🧪 Dev Mode — Your OTP
                  </p>
                  <p className="text-2xl font-bold tracking-widest text-amber-800 mt-0.5">
                    {devOtp}
                  </p>
                </div>
                <button
                  onClick={() => setOtp(devOtp)}
                  className="bg-amber-500 text-white text-xs font-bold px-3 py-2 rounded-lg hover:bg-amber-600 transition-colors"
                >
                  Auto Fill
                </button>
              </div>
            )}
            <Button
              className="w-full h-12 text-base"
              onClick={handleVerifyOtp}
              disabled={otp.length !== 6 || verifyOtp.isPending}
            >
              {verifyOtp.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Verify & Login'}
            </Button>
            <button
              onClick={() => { setStep('phone'); setOtp(''); setDevOtp(null); }}
              className="w-full text-sm text-muted-foreground text-center"
            >
              Change number
            </button>
          </div>
        )}

        {(sendOtp.isError || verifyOtp.isError) && (
          <p className="text-destructive text-sm text-center mt-3">
            {(sendOtp.error as any)?.response?.data?.message ||
              (verifyOtp.error as any)?.response?.data?.message ||
              'Something went wrong'}
          </p>
        )}
      </div>
    </div>
  );
}
