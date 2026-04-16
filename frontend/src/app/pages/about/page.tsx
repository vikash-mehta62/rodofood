'use client';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AboutPage() {
  const router = useRouter();
  return (
    <div className="min-h-screen bg-[#F5F6FA] pb-10">
      <div className="bg-white border-b border-gray-100 shadow-sm px-4 pt-12 pb-4 flex items-center gap-3">
        <button onClick={() => router.back()} className="w-9 h-9 rounded-xl bg-gray-100 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-gray-600" />
        </button>
        <h1 className="text-xl font-extrabold text-gray-900">About Us</h1>
      </div>
      <div className="max-w-lg mx-auto px-4 py-6 space-y-4">
        <div className="bg-white rounded-2xl border border-gray-100 p-6 space-y-4">
          <div className="flex items-center gap-3">
            <img src="/logo.jpeg" alt="Rodofood" className="w-10 h-10 rounded-xl object-cover" />
            <span className="font-extrabold text-xl text-gray-900">Rodo<span className="text-orange-500">food</span></span>
          </div>
          <p className="text-gray-600 text-sm leading-relaxed">
            Rodofood is India's first highway food pre-ordering platform. We connect highway travellers with restaurants and dhabas along their route, so your food is hot and ready the moment you arrive.
          </p>
          <p className="text-gray-600 text-sm leading-relaxed">
            No more stopping and waiting. Plan your meal, pre-order on the go, and enjoy fresh food without delay — whether you're on a road trip, a daily commute, or a long haul.
          </p>
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Our Mission</p>
            <p className="text-gray-600 text-sm leading-relaxed">
              To make every highway journey more enjoyable by eliminating the uncertainty of roadside dining.
            </p>
          </div>
          <div className="border-t border-gray-100 pt-4 space-y-2">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact</p>
            <p className="text-gray-600 text-sm">📧 support@rodofood.in</p>
            <p className="text-gray-600 text-sm">📞 +91 99999 99999</p>
          </div>
        </div>
      </div>
    </div>
  );
}
