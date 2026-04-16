'use client';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SECTIONS = [
  {
    title: 'Information We Collect',
    body: 'We collect your mobile number for authentication, your name and email (optional) for your profile, and your location to show nearby restaurants on your route.',
  },
  {
    title: 'How We Use Your Information',
    body: 'Your information is used to process orders, send OTP for login, show relevant restaurants on your route, and improve our service. We do not sell your data to third parties.',
  },
  {
    title: 'Data Security',
    body: 'We use industry-standard encryption and secure servers to protect your data. OTPs expire within 10 minutes and are never stored after verification.',
  },
  {
    title: 'Cookies',
    body: 'We use cookies solely to maintain your login session. No tracking or advertising cookies are used.',
  },
  {
    title: 'Your Rights',
    body: 'You can request deletion of your account and data at any time by contacting us at support@rodofood.in.',
  },
  {
    title: 'Contact',
    body: 'For any privacy concerns, email us at support@rodofood.in or WhatsApp +91 99999 99999.',
  },
];

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#F5F6FA] pb-10">
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h1 className="text-xl font-extrabold text-gray-900">Privacy Policy</h1>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-3">
        <p className="text-xs text-gray-400 px-1">Last updated: January 2025</p>
        {SECTIONS.map(s => (
          <div key={s.title} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-bold text-gray-900 text-sm mb-2">{s.title}</p>
            <p className="text-gray-600 text-sm leading-relaxed">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
