'use client';
import { ArrowLeft, MessageCircle, Mail, Phone, MapPin } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function ContactPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#F5F6FA] pb-10">
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h1 className="text-xl font-extrabold text-gray-900">Contact Us</h1>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-3">

        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4">
          <p className="text-sm font-bold text-gray-900">Get in touch</p>
          <p className="text-sm text-gray-500 leading-relaxed">
            We're here to help. Reach out via any of the channels below and we'll get back to you as soon as possible.
          </p>

          {[
            { icon: MessageCircle, label: 'WhatsApp', value: '+91 99999 99999', color: 'bg-emerald-50 text-emerald-600', action: () => window.open('https://wa.me/919999999999') },
            { icon: Mail,          label: 'Email',    value: 'support@rodofood.in', color: 'bg-blue-50 text-blue-600',    action: () => window.open('mailto:support@rodofood.in') },
            { icon: Phone,         label: 'Phone',    value: '+91 99999 99999',     color: 'bg-orange-50 text-orange-500', action: () => window.open('tel:+919999999999') },
            { icon: MapPin,        label: 'Address',  value: 'Bhopal, Madhya Pradesh, India', color: 'bg-gray-100 text-gray-500', action: () => {} },
          ].map(({ icon: Icon, label, value, color, action }) => (
            <button key={label} onClick={action}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all text-left">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
              </div>
            </button>
          ))}
        </div>

        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-sm font-bold text-gray-900 mb-1">Support Hours</p>
          <p className="text-sm text-gray-500">Monday – Saturday: 9 AM – 8 PM</p>
          <p className="text-sm text-gray-500">Sunday: 10 AM – 6 PM</p>
        </div>
      </div>
    </div>
  );
}
