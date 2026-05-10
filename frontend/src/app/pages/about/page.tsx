'use client';
import { ArrowLeft, Zap, MapPin, Users, ShieldCheck } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function AboutPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#F5F6FA] pb-10">
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 pt-12 pb-4 flex items-center gap-3 sticky top-0 z-10">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h1 className="text-xl font-extrabold text-gray-900">About Us</h1>
      </div>

      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">

        {/* Hero */}
        <div className="bg-gradient-to-br from-orange-500 to-orange-400 rounded-2xl p-6 text-white">
          <div className="flex items-center gap-3 mb-4">
            <img src="/logo.jpeg" alt="Rodofood" className="w-12 h-12 rounded-xl object-cover border-2 border-white/30" />
            <div>
              <p className="font-extrabold text-xl">Rodo<span className="text-white/80">food</span></p>
              <p className="text-white/70 text-xs">India's Highway Food Network</p>
            </div>
          </div>
          <p className="text-white/90 text-sm leading-relaxed">
            Rodofood is India's first highway food pre-ordering platform — built for travellers who don't want to waste time waiting at roadside restaurants.
          </p>
        </div>

        {/* What we do */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">What We Do</p>
          <p className="text-gray-600 text-sm leading-relaxed">
            We connect highway travellers with restaurants and dhabas along their route. You pre-order your food before you arrive — the kitchen starts cooking based on your ETA, so your meal is hot and ready the moment you walk in.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            No more stopping and waiting. No more cold food. Just plan, pre-order, and enjoy.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-2 gap-3">
          {[
            { icon: Zap,        color: 'bg-orange-50 text-orange-500', title: 'Pre-Order',    desc: 'Order before you arrive' },
            { icon: MapPin,     color: 'bg-blue-50 text-blue-500',     title: 'Route-Based',  desc: 'Restaurants on your highway' },
            { icon: Users,      color: 'bg-emerald-50 text-emerald-500', title: 'For Everyone', desc: 'Travellers & road trippers' },
            { icon: ShieldCheck,color: 'bg-violet-50 text-violet-500', title: 'Secure Pay',   desc: 'Razorpay powered payments' },
          ].map(({ icon: Icon, color, title, desc }) => (
            <div key={title} className="bg-white rounded-2xl border border-gray-100 p-4 flex items-start gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{title}</p>
                <p className="text-xs text-gray-400 mt-0.5">{desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Mission */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-2">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Our Mission</p>
          <p className="text-gray-600 text-sm leading-relaxed">
            To make every highway journey more enjoyable by eliminating the uncertainty and wait time of roadside dining — one pre-order at a time.
          </p>
        </div>

        {/* Business Info */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Business Details</p>
          <div className="space-y-2 text-sm text-gray-600">
            <p><span className="font-semibold text-gray-800">Business Name:</span> Rodofood</p>
            <p><span className="font-semibold text-gray-800">Type:</span> Online Food Pre-Ordering Platform</p>
            <p><span className="font-semibold text-gray-800">Serving:</span> Highway routes across Madhya Pradesh & Central India</p>
            <p><span className="font-semibold text-gray-800">Email:</span> support@rodofood.in</p>
            <p><span className="font-semibold text-gray-800">Phone:</span> +91 62601 44122</p>
            <p><span className="font-semibold text-gray-800">Address:</span> Bhopal, Madhya Pradesh, India – 462001</p>
          </div>
        </div>

        {/* Links */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Legal</p>
          <div className="space-y-2">
            {[
              { label: 'Privacy Policy', href: '/pages/privacy' },
              { label: 'Terms & Conditions', href: '/pages/terms' },
              { label: 'Refund & Cancellation Policy', href: '/pages/refund' },
              { label: 'Contact Us', href: '/pages/contact' },
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
