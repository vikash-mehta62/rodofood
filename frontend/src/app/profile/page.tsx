'use client';
import { useState } from 'react';
import { User, Phone, Mail, LogOut, ChevronRight, MessageCircle, HelpCircle, FileText } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUpdateProfile } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import BottomNav from '@/components/shared/BottomNav';
import { useRouter } from 'next/navigation';

export default function ProfilePage() {
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const updateProfile = useUpdateProfile();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');

  const handleSave = async () => {
    await updateProfile.mutateAsync({ name, email });
    setEditing(false);
  };

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="px-4 pt-12 pb-6 border-b">
        <h1 className="text-xl font-bold">Profile</h1>
      </div>

      <div className="px-4 py-6 space-y-4">
        {/* Avatar */}
        <div className="flex flex-col items-center py-4">
          <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mb-3">
            <User className="w-10 h-10 text-primary" />
          </div>
          <p className="font-bold text-lg">{user?.name || 'Set your name'}</p>
          <p className="text-sm text-muted-foreground">+91 {user?.phone}</p>
        </div>

        {/* Edit Profile */}
        <div className="bg-card border rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="font-semibold">Personal Info</p>
            <button onClick={() => setEditing(!editing)} className="text-sm text-primary">
              {editing ? 'Cancel' : 'Edit'}
            </button>
          </div>
          {editing ? (
            <div className="space-y-3">
              <Input placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input placeholder="Email (optional)" type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
              <Button className="w-full" onClick={handleSave} disabled={updateProfile.isPending}>
                Save Changes
              </Button>
            </div>
          ) : (
            <div className="space-y-2">
              <div className="flex items-center gap-3 text-sm">
                <Phone className="w-4 h-4 text-muted-foreground" />
                <span>+91 {user?.phone}</span>
              </div>
              {user?.email && (
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground" />
                  <span>{user.email}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Menu Items */}
        <div className="bg-card border rounded-xl overflow-hidden">
          {[
            { icon: MessageCircle, label: 'WhatsApp Support', action: () => window.open('https://wa.me/919999999999') },
            { icon: HelpCircle, label: 'Help & Support', action: () => router.push('/support') },
            { icon: FileText, label: 'Terms & Conditions', action: () => {} },
            { icon: FileText, label: 'Privacy Policy', action: () => {} },
          ].map(({ icon: Icon, label, action }, i) => (
            <button
              key={label}
              onClick={action}
              className={`w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted transition-colors ${i > 0 ? 'border-t' : ''}`}
            >
              <Icon className="w-5 h-5 text-muted-foreground" />
              <span className="flex-1 text-left text-sm">{label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        {/* Logout */}
        <Button variant="destructive" className="w-full" onClick={handleLogout}>
          <LogOut className="w-4 h-4 mr-2" /> Logout
        </Button>
      </div>

      <BottomNav />
    </div>
  );
}
