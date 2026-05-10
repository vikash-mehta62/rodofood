'use client';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SECTIONS = [
  {
    title: 'Overview',
    body: `Rodofood is a food pre-ordering platform. Since food is prepared fresh based on your ETA, our refund and cancellation policy is designed to be fair to both customers and restaurant partners.`,
  },
  {
    title: 'Cancellation by Customer',
    body: `You can cancel your order only while it is in "Pending" status — i.e., before the restaurant confirms it.

• Go to My Orders → Select the order → Cancel Order
• Once the restaurant confirms your order, cancellation is not possible through the app
• For urgent cancellations after confirmation, contact us immediately at support@rodofood.in or +91 62601 44122`,
  },
  {
    title: 'Cancellation by Restaurant',
    body: `If a restaurant cancels or rejects your order:

• You will be notified immediately via the app
• A full refund will be initiated automatically for online payments
• Refund will be credited within 5–7 business days to your original payment method`,
  },
  {
    title: 'Refund Eligibility',
    body: `You are eligible for a full refund if:

✅ Your order was not accepted by the restaurant
✅ The restaurant cancelled or rejected your order after confirmation
✅ You cancelled before restaurant confirmation (pending status)
✅ You were charged but the order was not placed due to a technical error

You are NOT eligible for a refund if:

❌ The restaurant has confirmed and started preparing your order
❌ You did not arrive at the restaurant within a reasonable time after the food was ready
❌ You provided incorrect order details or ETA
❌ The cancellation request was made after food preparation began`,
  },
  {
    title: 'Refund Process & Timeline',
    body: `Approved refunds are processed as follows:

• Razorpay / UPI payments: 3–5 business days
• Credit/Debit card payments: 5–7 business days
• Net banking: 5–7 business days

Refunds are credited to the original payment method used at the time of order. We do not issue refunds in cash or to a different account.`,
  },
  {
    title: 'Partial Refunds',
    body: `In cases where only part of your order was unfulfilled (e.g., an item was unavailable), a partial refund proportional to the undelivered items will be issued after review.`,
  },
  {
    title: 'No-Show Policy',
    body: `If you place an order and do not arrive at the restaurant, no refund will be issued once the restaurant has confirmed and prepared your food. Please cancel promptly if your plans change.`,
  },
  {
    title: 'How to Request a Refund',
    body: `To request a refund:

1. Email us at support@rodofood.in with subject: "Refund Request – Order #[your order number]"
2. Include your registered phone number and reason for refund
3. Our team will review and respond within 24 business hours

Alternatively, WhatsApp us at +91 62601 44122.`,
  },
  {
    title: 'Dispute Resolution',
    body: `If you are unsatisfied with our refund decision, you may escalate by emailing support@rodofood.in with "Escalation" in the subject line. We aim to resolve all disputes within 7 business days.`,
  },
];

export default function RefundPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#F5F6FA] pb-10">
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 pt-12 pb-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h1 className="text-xl font-extrabold text-gray-900">Refund & Cancellation Policy</h1>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-3">
        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3">
          <p className="text-xs text-orange-700 font-medium">Last updated: May 2026 · Effective immediately</p>
        </div>

        {/* Quick summary */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Quick Summary</p>
          <div className="space-y-2">
            {[
              { emoji: '✅', text: 'Cancel before restaurant confirms — full refund' },
              { emoji: '✅', text: 'Restaurant rejects order — full refund' },
              { emoji: '⏱️', text: 'Refund timeline: 3–7 business days' },
              { emoji: '❌', text: 'No refund after food preparation starts' },
            ].map(({ emoji, text }) => (
              <div key={text} className="flex items-start gap-2">
                <span className="text-base flex-shrink-0">{emoji}</span>
                <p className="text-sm text-gray-600">{text}</p>
              </div>
            ))}
          </div>
        </div>

        {SECTIONS.map(s => (
          <div key={s.title} className="bg-white rounded-2xl border border-gray-100 p-5">
            <p className="font-bold text-gray-900 text-sm mb-2">{s.title}</p>
            <p className="text-gray-600 text-sm leading-relaxed whitespace-pre-line">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
