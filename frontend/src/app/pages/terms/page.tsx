'use client';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

const SECTIONS = [
  {
    title: '1. Acceptance of Terms',
    body: `By accessing or using Rodofood ("the Platform"), you agree to be bound by these Terms & Conditions. If you do not agree, please do not use the platform. These terms apply to all users including customers and restaurant partners.`,
  },
  {
    title: '2. About the Service',
    body: `Rodofood is an online food pre-ordering platform that allows highway travellers to browse restaurants along their route, pre-order food based on their estimated arrival time (ETA), and pay online or at the restaurant. Rodofood acts as a technology intermediary between customers and restaurants.`,
  },
  {
    title: '3. Eligibility',
    body: `You must be at least 18 years of age to use this platform. By using Rodofood, you confirm that you are 18 or older and legally capable of entering into a binding agreement.`,
  },
  {
    title: '4. Account & Registration',
    body: `• You must register with a valid mobile number and verify it via OTP
• You are responsible for maintaining the confidentiality of your account
• Do not share your OTP with anyone — Rodofood will never ask for your OTP
• You are responsible for all activity that occurs under your account
• Rodofood reserves the right to suspend accounts that violate these terms`,
  },
  {
    title: '5. Orders & Payments',
    body: `• Orders are placed based on your selected ETA — the restaurant prepares food accordingly
• An order is confirmed only after the restaurant accepts it
• Prices displayed are inclusive of applicable GST
• Online payments are processed securely via Razorpay
• Rodofood does not store your payment credentials
• Cash and UPI payments at the restaurant are the customer's responsibility`,
  },
  {
    title: '6. Cancellations',
    body: `• You may cancel an order only while it is in "Pending" status (before restaurant confirmation)
• Once a restaurant confirms your order, cancellation is not guaranteed
• For cancellation requests after confirmation, contact us immediately at support@rodofood.com
• Refunds for cancelled orders are subject to our Refund Policy`,
  },
  {
    title: '7. Restaurant Responsibility',
    body: `Restaurants listed on Rodofood are independent businesses. Rodofood is not responsible for:

• Food quality, taste, or hygiene
• Preparation delays beyond the stated ETA
• Restaurant closures or unavailability
• Any disputes between customers and restaurants

However, we will assist in resolving disputes where possible.`,
  },
  {
    title: '8. Prohibited Conduct',
    body: `You agree not to:

• Place fraudulent or fake orders
• Abuse, harass, or threaten restaurant staff or Rodofood team
• Use the platform for any unlawful purpose
• Attempt to reverse-engineer or hack the platform
• Create multiple accounts to abuse promotions or coupons`,
  },
  {
    title: '9. Intellectual Property',
    body: `All content on Rodofood including the logo, design, code, and text is the property of Rodofood. You may not copy, reproduce, or distribute any content without written permission.`,
  },
  {
    title: '10. Limitation of Liability',
    body: `Rodofood's liability is limited to the amount paid for the specific order in dispute. We are not liable for indirect, incidental, or consequential damages arising from use of the platform.`,
  },
  {
    title: '11. Governing Law',
    body: `These terms are governed by the laws of India. Any disputes shall be subject to the exclusive jurisdiction of courts in Bhopal, Madhya Pradesh.`,
  },
  {
    title: '12. Changes to Terms',
    body: `Rodofood reserves the right to modify these terms at any time. We will notify users of significant changes via email or in-app notification. Continued use of the platform after changes constitutes acceptance of the updated terms.`,
  },
  {
    title: '13. Contact',
    body: `For any queries regarding these terms:

📧 Email: support@rodofood.com
📞 Phone: +91 7580851506
📍 Address: Bhopal, Madhya Pradesh, India – 462001`,
  },
  {
    title: '14. Restaurant Partner Policy',
    body: `By registering as a Restaurant Partner on Rodofood, you agree to the following:

Onboarding & Listing:
• You must provide accurate restaurant details including name, address, FSSAI license, and menu
• Rodofood reserves the right to approve or reject any restaurant listing
• Your restaurant will be visible to customers only after admin approval

Order Management:
• You must accept or reject incoming orders within 5 minutes
• Once accepted, you are responsible for preparing the order on time based on customer ETA
• Repeated cancellations or delays may result in temporary suspension

Food Quality & Hygiene:
• All food must comply with FSSAI standards
• Rodofood may conduct periodic quality checks
• Any hygiene complaints will be investigated and may result in delisting

Payments & Commission:
• Rodofood charges a platform commission on each completed order (as per your agreement)
• Payments are settled weekly to your registered bank account
• Rodofood is not responsible for cash payments made directly at the restaurant

Portal Access:
• Your restaurant portal access can be suspended by admin for policy violations
• You must not share your login credentials with unauthorized persons

Termination:
• Either party may terminate the partnership with 7 days written notice
• Rodofood may immediately terminate access in case of fraud, repeated violations, or legal issues

For partner support: support@rodofood.com | +91 7580851506`,
  },
];

export default function TermsPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#F5F6FA] pb-10">
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 pt-12 pb-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h1 className="text-xl font-extrabold text-gray-900">Terms & Conditions</h1>
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
