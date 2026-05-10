'use client';
import { ArrowLeft, MessageCircle, Mail, Phone, MapPin, Clock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function ContactPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#F5F6FA] pb-10">
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 pt-12 pb-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h1 className="text-xl font-extrabold text-gray-900">Contact Us</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Intro */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl p-5 text-white">
          <p className="font-extrabold text-base mb-1">We're here to help 👋</p>
          <p className="text-white/80 text-sm leading-relaxed">
            Have a question about your order, a refund, or anything else? Reach out — we typically respond within a few hours.
          </p>
        </div>

        {/* Contact channels */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Get in Touch</p>

          {[
            {
              icon: MessageCircle,
              label: 'WhatsApp',
              value: '+91 62601 44122',
              sub: 'Fastest response',
              color: 'bg-emerald-50 text-emerald-600',
              action: () => window.open('https://wa.me/916260144122'),
            },
            {
              icon: Mail,
              label: 'Email',
              value: 'support@rodofood.in',
              sub: 'For detailed queries & refunds',
              color: 'bg-blue-50 text-blue-600',
              action: () => window.open('mailto:support@rodofood.in'),
            },
            {
              icon: Phone,
              label: 'Phone',
              value: '+91 62601 44122',
              sub: 'Call during support hours',
              color: 'bg-orange-50 text-orange-500',
              action: () => window.open('tel:+916260144122'),
            },
            {
              icon: MapPin,
              label: 'Address',
              value: 'Bhopal, Madhya Pradesh',
              sub: 'India – 462001',
              color: 'bg-gray-100 text-gray-500',
              action: () => {},
            },
          ].map(({ icon: Icon, label, value, sub, color, action }) => (
            <button key={label} onClick={action}
              className="w-full flex items-center gap-4 p-4 rounded-xl border border-gray-100 hover:border-orange-200 hover:bg-orange-50/30 transition-all text-left">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">{label}</p>
                <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
                <p className="text-xs text-gray-400">{sub}</p>
              </div>
            </button>
          ))}
        </div>

        {/* Support hours */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Clock className="w-4 h-4 text-orange-500" />
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Support Hours</p>
          </div>
          <div className="space-y-1.5 text-sm text-gray-600">
            <div className="flex justify-between">
              <span>Monday – Friday</span>
              <span className="font-semibold text-gray-800">9:00 AM – 8:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span>Saturday</span>
              <span className="font-semibold text-gray-800">9:00 AM – 6:00 PM</span>
            </div>
            <div className="flex justify-between">
              <span>Sunday</span>
              <span className="font-semibold text-gray-800">10:00 AM – 4:00 PM</span>
            </div>
          </div>
          <p className="text-xs text-gray-400 mt-3">WhatsApp messages are monitored outside hours too — we'll reply as soon as possible.</p>
        </div>

        {/* For order issues */}
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <p className="text-sm font-bold text-amber-800 mb-2">📦 Order Issue?</p>
          <p className="text-sm text-amber-700 leading-relaxed mb-3">
            For order-related issues, refunds, or cancellations — please have your Order Number ready when you contact us.
          </p>
          <Link href="/orders">
            <button className="text-xs font-bold text-amber-700 border border-amber-300 bg-white px-4 py-2 rounded-xl hover:bg-amber-50 transition-colors">
              View My Orders →
            </button>
          </Link>
        </div>

        {/* Legal links */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Legal</p>
          <div className="space-y-2">
            {[
              { label: 'Privacy Policy', href: '/pages/privacy' },
              { label: 'Terms & Conditions', href: '/pages/terms' },
              { label: 'Refund & Cancellation Policy', href: '/pages/refund' },
              { label: 'About Us', href: '/pages/about' },
            ].map(({ label, href }) => (
              <Link key={href} href={href}
                className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                <span className="text-sm text-gray-700 font-medium">{label}</span>
                <span className="text-gray-300 text-xs">›</span>
              </Link>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
