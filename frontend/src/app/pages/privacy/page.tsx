'use client';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SECTIONS = [
  {
    title: '1. Information We Collect',
    body: `We collect the following information when you use Rodofood:

• Mobile number — for OTP-based authentication
• Name & email address — for your profile and order confirmations
• Location data — to show restaurants on your highway route (only when you allow it)
• Order history — items ordered, restaurant, amount, ETA
• Payment information — processed securely via Razorpay; we do not store card/UPI details on our servers
• Device info & cookies — to maintain your login session`,
  },
  {
    title: '2. How We Use Your Information',
    body: `Your data is used to:

• Process and confirm your food pre-orders
• Send OTP for login and account verification
• Send order confirmation and status updates via email/SMS
• Show relevant restaurants along your selected highway route
• Improve platform performance and user experience
• Resolve disputes and provide customer support

We do not sell, rent, or share your personal data with third parties for marketing purposes.`,
  },
  {
    title: '3. Payment Data',
    body: `All payments are processed through Razorpay, a PCI-DSS compliant payment gateway. Rodofood does not store your card number, CVV, UPI PIN, or any sensitive payment credentials. Only the Razorpay Payment ID (transaction reference) is stored for order tracking and refund purposes.`,
  },
  {
    title: '4. Cookies',
    body: `We use cookies and local storage solely to:

• Maintain your login session
• Remember your cart and trip preferences

We do not use advertising cookies or third-party tracking cookies. You can clear cookies from your browser settings at any time, which will log you out of the app.`,
  },
  {
    title: '5. Data Sharing',
    body: `We share your data only in the following limited cases:

• With the restaurant you order from — your name, order details, and ETA are shared so they can prepare your food
• With Razorpay — for payment processing
• With law enforcement — if required by applicable law

We do not share your phone number or email with restaurants.`,
  },
  {
    title: '6. Data Retention',
    body: `We retain your account data as long as your account is active. Order history is retained for 2 years for legal and support purposes. You can request deletion of your account and associated data by contacting us at support@rodofood.com.`,
  },
  {
    title: '7. Security',
    body: `We use industry-standard security measures including HTTPS encryption, hashed passwords (bcrypt), and JWT-based authentication. OTPs expire within 10 minutes and are never stored after verification. Our servers are hosted on secure cloud infrastructure.`,
  },
  {
    title: '8. Children\'s Privacy',
    body: `Rodofood is not intended for users under the age of 13. We do not knowingly collect personal information from children. If you believe a child has provided us with personal data, please contact us immediately.`,
  },
  {
    title: '9. Your Rights',
    body: `You have the right to:

• Access the personal data we hold about you
• Request correction of inaccurate data
• Request deletion of your account and data
• Withdraw consent for location access at any time via device settings

To exercise these rights, contact us at support@rodofood.com.`,
  },
  {
    title: '10. Contact',
    body: `For any privacy concerns or data requests:

📧 Email: support@rodofood.com
📞 Phone: +91 7580851506
📍 Address: Bhopal, Madhya Pradesh, India – 462001`,
  },
];

export default function PrivacyPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#F5F6FA] pb-10">
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 pt-12 pb-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <div>
          <h1 className="text-xl font-extrabold text-gray-900">Privacy Policy</h1>
        </div>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-3">
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
