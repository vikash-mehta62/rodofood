'use client';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SECTIONS = [
  {
    title: 'Nature of Service',
    body: `Rodofood is a food pre-ordering platform for highway travellers. We facilitate pre-orders at restaurants along your route. This is a pickup/dine-in service — we do not deliver food to your location.`,
  },
  {
    title: 'How It Works',
    body: `1. You select a restaurant on your highway route
2. You place a pre-order with your estimated arrival time (ETA)
3. The restaurant prepares your food based on your ETA
4. You arrive at the restaurant and collect your order (takeaway) or sit down (dine-in)

There is no physical shipping or courier involved.`,
  },
  {
    title: 'Order Fulfillment',
    body: `• Orders are fulfilled at the restaurant location
• Your food will be ready at or before your selected ETA
• If you are delayed, please contact the restaurant directly
• Rodofood is not responsible for delays caused by traffic or unforeseen circumstances`,
  },
  {
    title: 'Service Area',
    body: `Rodofood currently operates on highway routes in Madhya Pradesh and Central India, including:

• Bhopal – Indore Highway (NH-46)
• Bhopal – Jabalpur Highway (NH-30)
• Bhopal – Nagpur Highway (NH-46)

We are continuously expanding to new routes. Check the app for the latest available routes.`,
  },
  {
    title: 'No Physical Delivery',
    body: `Rodofood does not offer home delivery, courier services, or any form of physical shipping. All orders must be collected in person at the restaurant. If you are unable to collect your order, please refer to our Refund & Cancellation Policy.`,
  },
  {
    title: 'Digital Receipts',
    body: `Order confirmations and receipts are sent digitally via email (if provided) and are available in the app under "My Orders". No physical receipts or documents are shipped.`,
  },
  {
    title: 'Contact',
    body: `For any questions about order fulfillment:

📧 Email: support@rodofood.in
📞 Phone: +91 62601 44122
📍 Address: Bhopal, Madhya Pradesh, India – 462001`,
  },
];

export default function ShippingPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#F5F6FA] pb-10">
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 pt-12 pb-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h1 className="text-xl font-extrabold text-gray-900">Shipping Policy</h1>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-3">
        <div className="bg-blue-50 border border-blue-100 rounded-2xl px-4 py-3">
          <p className="text-xs text-blue-700 font-medium">
            ℹ️ Rodofood is a pickup/dine-in service. We do not ship or deliver food.
          </p>
        </div>
        <div className="bg-orange-50 border border-orange-100 rounded-2xl px-4 py-3">
          <p className="text-xs text-orange-700 font-medium">Last updated: May 2026 · Effective immediately</p>
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
