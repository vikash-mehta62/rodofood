'use client';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: 'By using Rodofood, you agree to these terms. If you do not agree, please do not use the platform.',
  },
  {
    title: '2. Use of Service',
    body: 'Rodofood is a food pre-ordering platform for highway travellers. You must provide accurate information when registering and placing orders.',
  },
  {
    title: '3. Orders & Payments',
    body: 'Orders are confirmed only after restaurant acceptance. Payment is collected at the time of ordering. Prices displayed are inclusive of applicable taxes.',
  },
  {
    title: '4. Cancellations',
    body: 'Orders can be cancelled before the restaurant confirms them. Once confirmed, cancellations are subject to the restaurant\'s policy. Refunds are processed within 5-7 business days.',
  },
  {
    title: '5. Restaurant Listings',
    body: 'Restaurants listed on Rodofood are independent businesses. Rodofood is not responsible for food quality, preparation time, or restaurant conduct beyond what is stated in our service.',
  },
  {
    title: '6. Account Responsibility',
    body: 'You are responsible for maintaining the confidentiality of your account. Do not share your OTP with anyone.',
  },
  {
    title: '7. Modifications',
    body: 'Rodofood reserves the right to modify these terms at any time. Continued use of the platform constitutes acceptance of updated terms.',
  },
  {
    title: '8. Contact',
    body: 'For any queries regarding these terms, contact us at support@rodofood.in.',
  },
];

export default function TermsPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#F5F6FA] pb-10">
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h1 className="text-xl font-extrabold text-gray-900">Terms & Conditions</h1>
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
