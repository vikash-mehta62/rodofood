import Link from 'next/link';
import { MapPin, Clock, Smartphone, Star, ChevronRight, Phone, Mail, MessageCircle } from 'lucide-react';
import api from '@/lib/axios';

async function getCmsContent() {
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';
    const res = await fetch(`${apiUrl}/cms`, { next: { revalidate: 300 } });
    if (!res.ok) return {};
    const data = await res.json();
    return data.data?.content || {};
  } catch {
    return {};
  }
}

export default async function LandingPage() {
  const cms = await getCmsContent();

  return (
    <div className="min-h-screen bg-white">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛣️</span>
            <span className="font-bold text-xl text-primary">Rodofood</span>
          </div>
          <div className="hidden md:flex items-center gap-6 text-sm font-medium">
            <a href="#how-it-works" className="text-muted-foreground hover:text-foreground">How It Works</a>
            <a href="#about" className="text-muted-foreground hover:text-foreground">About</a>
            <a href="#contact" className="text-muted-foreground hover:text-foreground">Contact</a>
          </div>
          <Link href="/login">
            <button className="bg-primary text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium">
              Order Now
            </button>
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-24 pb-16 px-4 bg-gradient-to-br from-orange-50 via-white to-orange-50">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 bg-orange-100 text-orange-700 rounded-full px-4 py-1.5 text-sm font-medium mb-6">
            <span className="w-2 h-2 bg-orange-500 rounded-full animate-pulse" />
            Now live on Bhopal ↔ Indore Highway
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight mb-6">
            {cms.hero_title || 'Order Food Before You Arrive'}
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
            {cms.hero_subtitle || 'Pre-order from highway restaurants. Food ready when you reach. No waiting, just eating.'}
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/login">
              <button className="bg-primary text-white px-8 py-4 rounded-xl text-lg font-semibold hover:bg-primary/90 transition-colors flex items-center gap-2">
                {cms.hero_cta || 'Start Ordering'} <ChevronRight className="w-5 h-5" />
              </button>
            </Link>
            <a href="#how-it-works">
              <button className="border-2 border-primary text-primary px-8 py-4 rounded-xl text-lg font-semibold hover:bg-primary/5 transition-colors">
                How It Works
              </button>
            </a>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="max-w-2xl mx-auto mt-12 bg-white rounded-2xl shadow-xl p-6 border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-3 h-3 rounded-full bg-green-500" />
            <div className="flex-1 h-1 bg-gradient-to-r from-green-500 to-orange-500 rounded" />
            <div className="w-3 h-3 rounded-full bg-orange-500" />
          </div>
          <div className="flex justify-between text-sm font-medium">
            <span>Bhopal</span>
            <span className="text-muted-foreground">🚗 You are here</span>
            <span>Indore</span>
          </div>
          <div className="mt-4 space-y-2">
            {['Sehore Dhaba', 'Highway Tadka', 'Dewas Food Court'].map((name, i) => (
              <div key={name} className={`flex items-center gap-3 p-3 rounded-lg ${i === 0 ? 'bg-orange-50 border border-orange-200' : 'bg-gray-50'}`}>
                <span className="text-xl">🍽️</span>
                <div className="flex-1">
                  <p className="font-medium text-sm">{name}</p>
                  <p className="text-xs text-muted-foreground">{[12, 28, 45][i]} km ahead</p>
                </div>
                {i === 0 && <span className="text-xs bg-green-500 text-white px-2 py-0.5 rounded-full">Order Now</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section id="how-it-works" className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-12">
            {cms.how_it_works_title || 'How Rodofood Works'}
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {[
              { step: '1', icon: MapPin, title: 'Plan Your Trip', desc: 'Enter your From and To location on the highway' },
              { step: '2', icon: Star, title: 'Browse Restaurants', desc: 'See all restaurants along your route with ratings' },
              { step: '3', icon: Clock, title: 'Pre-Order Food', desc: 'Select items and set your arrival time' },
              { step: '4', icon: Smartphone, title: 'Food Ready on Arrival', desc: 'Restaurant prepares food. You arrive and eat!' },
            ].map(({ step, icon: Icon, title, desc }) => (
              <div key={step} className="text-center">
                <div className="w-14 h-14 bg-primary rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <div className="text-xs font-bold text-primary mb-1">STEP {step}</div>
                <h3 className="font-bold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* About */}
      <section id="about" className="py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-6">{cms.about_title || 'About Rodofood'}</h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {cms.about_text || 'Rodofood is India\'s first highway food pre-ordering platform. We connect travelers with restaurants along their route, eliminating wait times and ensuring fresh, hot food on arrival.'}
          </p>
          <div className="grid grid-cols-3 gap-6 mt-12">
            {[
              { value: '50+', label: 'Partner Restaurants' },
              { value: '2', label: 'Active Routes' },
              { value: '1000+', label: 'Happy Travelers' },
            ].map(({ value, label }) => (
              <div key={label}>
                <p className="text-3xl font-bold text-primary">{value}</p>
                <p className="text-sm text-muted-foreground">{label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* App Download */}
      <section className="py-16 px-4 bg-primary text-primary-foreground">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Get the App</h2>
          <p className="opacity-80 mb-8">Available on Android. iOS coming soon.</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <a
              href={cms.app_download_link || '#'}
              className="bg-white text-primary px-8 py-4 rounded-xl font-semibold hover:bg-white/90 transition-colors"
            >
              📱 Download Android App
            </a>
            <div className="bg-white/20 rounded-xl p-4">
              <p className="text-sm mb-2">Scan QR Code</p>
              <div className="w-24 h-24 bg-white rounded-lg flex items-center justify-center text-primary text-xs font-medium">
                QR Code
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Contact */}
      <section id="contact" className="py-16 px-4 bg-gray-50">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-8">Contact & Support</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <a href={`tel:${cms.contact_phone || '+919999999999'}`} className="bg-white rounded-xl p-6 border hover:shadow-md transition-shadow">
              <Phone className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="font-semibold">Call Us</p>
              <p className="text-sm text-muted-foreground">{cms.contact_phone || '+91 99999 99999'}</p>
            </a>
            <a href={`mailto:${cms.contact_email || 'support@rodofood.in'}`} className="bg-white rounded-xl p-6 border hover:shadow-md transition-shadow">
              <Mail className="w-8 h-8 text-primary mx-auto mb-3" />
              <p className="font-semibold">Email Us</p>
              <p className="text-sm text-muted-foreground">{cms.contact_email || 'support@rodofood.in'}</p>
            </a>
            <a href={`https://wa.me/${cms.whatsapp_number || '919999999999'}`} target="_blank" rel="noopener noreferrer" className="bg-white rounded-xl p-6 border hover:shadow-md transition-shadow">
              <MessageCircle className="w-8 h-8 text-green-500 mx-auto mb-3" />
              <p className="font-semibold">WhatsApp</p>
              <p className="text-sm text-muted-foreground">Chat with us</p>
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8 px-4">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-2xl">🛣️</span>
            <span className="font-bold text-xl">Rodofood</span>
          </div>
          <div className="flex gap-6 text-sm text-gray-400">
            <Link href="/landing" className="hover:text-white">Home</Link>
            <a href="#about" className="hover:text-white">About</a>
            <a href="#contact" className="hover:text-white">Contact</a>
            <Link href="/support" className="hover:text-white">Support</Link>
          </div>
          <p className="text-sm text-gray-500">© 2026 Rodofood. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
