'use client';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SECTIONS = [
  {
    title: 'Eligibility for Refund',
    body: 'Refunds are applicable if: (1) your order was not accepted by the restaurant, (2) the restaurant cancelled your order, or (3) you cancelled before restaurant confirmation.',
  },
  {
    title: 'Non-Refundable Cases',
    body: 'Refunds are not applicable once the restaurant has confirmed and started preparing your order, or if you provided incorrect delivery/pickup details.',
  },
  {
    title: 'Refund Process',
    body: 'Approved refunds are processed to your original payment method within 5-7 business days. UPI refunds are typically faster (1-2 days).',
  },
  {
    title: 'How to Request a Refund',
    body: 'Contact us via WhatsApp at +91 99999 99999 or email support@rodofood.in with your order number. Our team will review and respond within 24 hours.',
  },
  {
    title: 'Partial Refunds',
    body: 'In cases where only part of an order was unfulfilled, a partial refund proportional to the undelivered items will be issued.',
  },
];

export default function RefundPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#F5F6FA] pb-10">
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h1 className="text-xl font-extrabold text-gray-900">Refund Policy</h1>
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
