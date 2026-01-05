import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ArrowLeft, User, Mail, Phone, LogOut, Users, Save, Shield, Fingerprint, Settings, ChevronLeft } from 'lucide-react';
import Header from '@/components/Header';
import { Switch } from '@/components/ui/switch';
import LoadingIndicator from '@/components/LoadingIndicator';

interface Profile {
  id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  avatar_url: string | null;
}

const ProfilePage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    phone: '',
  });
  const [biometricsEnabled, setBiometricsEnabled] = useState(false);

  useEffect(() => {
    // Load biometrics setting
    const saved = localStorage.getItem('biometrics_enabled');
    setBiometricsEnabled(saved === 'true');
  }, []);

  const toggleBiometrics = async (enabled: boolean) => {
    if (enabled) {
      // Simulate biometric call
      toast.info('جاري التحقق من البصمة...');
      setTimeout(() => {
        setBiometricsEnabled(true);
        localStorage.setItem('biometrics_enabled', 'true');
        toast.success('تم تفعيل تسجيل الدخول بالبصمة');
      }, 1500);
    } else {
      setBiometricsEnabled(false);
      localStorage.setItem('biometrics_enabled', 'false');
      toast.info('تم تعطيل تسجيل الدخول بالبصمة');
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setProfile(data);
        setFormData({
          full_name: data.full_name || '',
          email: data.email || user.email || '',
          phone: data.phone || '',
        });
      } else {
        // Create profile if doesn't exist
        const newProfile = {
          id: user.id,
          full_name: user.user_metadata?.full_name || '',
          email: user.email || '',
        };
        await supabase.from('profiles').insert(newProfile);
        setFormData({
          full_name: newProfile.full_name,
          email: newProfile.email,
          phone: '',
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('حدث خطأ في تحميل البيانات');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast.success('تم حفظ البيانات بنجاح');
    } catch (error) {
      console.error('Error saving profile:', error);
      toast.error('حدث خطأ في حفظ البيانات');
    } finally {
      setSaving(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingIndicator />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/50 pb-24">
      <Header title="الملف الشخصي" showBack onBack={() => navigate('/')} />

      {/* Avatar */}
      <div className="flex justify-center my-6">
        <div className="w-24 h-24 rounded-full gradient-primary flex items-center justify-center shadow-lg">
          <User className="h-12 w-12 text-primary-foreground" />
        </div>
      </div>

      {/* Form */}
      <div className="px-6 space-y-6">
        <div className="glass-card rounded-3xl p-6 space-y-4">
          <h2 className="font-semibold text-lg mb-4">بيانات الوالد/الوالدة</h2>

          <div className="space-y-2">
            <Label htmlFor="fullName" className="text-sm font-medium">
              الاسم الكامل
            </Label>
            <div className="relative">
              <User className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="fullName"
                type="text"
                placeholder="أدخل اسمك الكامل"
                value={formData.full_name}
                onChange={(e) =>
                  setFormData({ ...formData, full_name: e.target.value })
                }
                className="pr-10 input-field"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email" className="text-sm font-medium">
              البريد الإلكتروني
            </Label>
            <div className="relative">
              <Mail className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="email"
                type="email"
                value={formData.email}
                disabled
                className="pr-10 input-field bg-muted cursor-not-allowed"
                dir="ltr"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              لا يمكن تغيير البريد الإلكتروني
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-sm font-medium">
              رقم الجوال
            </Label>
            <div className="relative">
              <Phone className="absolute right-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                id="phone"
                type="tel"
                placeholder="05xxxxxxxx"
                value={formData.phone}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
                className="pr-10 input-field"
                dir="ltr"
              />
            </div>
          </div>

          <Button
            onClick={handleSave}
            className="w-full btn-primary h-12"
            disabled={saving}
          >
            {saving ? (
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                <span>جاري الحفظ...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Save className="h-5 w-5" />
                <span>حفظ التغييرات</span>
              </div>
            )}
          </Button>
        </div>

        {/* Settings Section */}
        <div className="glass-card rounded-3xl p-6 space-y-4">
          <h2 className="font-semibold text-lg mb-4 flex items-center gap-2">
            <Settings className="h-5 w-5 text-primary" />
            الإعدادات
          </h2>

          <div className="flex items-center justify-between p-4 bg-gray-50/50 rounded-2xl border border-gray-100/50">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">تسجيل الدخول بالبصمة</p>
                <p className="text-[11px] text-muted-foreground">استخدم بصمة الإصبع للدخول بسرعة</p>
              </div>
            </div>
            <Switch
              checked={biometricsEnabled}
              onCheckedChange={toggleBiometrics}
            />
          </div>
        </div>

        {/* Children Link */}
        <Button
          variant="outline"
          onClick={() => navigate('/profile/children')}
          className="w-full h-16 rounded-2xl border-2 border-secondary/20 hover:bg-secondary/5 flex items-center justify-between px-6 transition-all"
        >
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-xl bg-secondary/10 flex items-center justify-center">
              <Users className="h-5 w-5 text-secondary" />
            </div>
            <span className="font-bold">إدارة الأطفال</span>
          </div>
          <ChevronLeft className="h-5 w-5 text-muted-foreground rtl:rotate-0 ltr:rotate-180" />
        </Button>

        {/* Logout */}
        <div className="pt-4 pb-8">
          <Button
            variant="ghost"
            onClick={handleSignOut}
            className="w-full h-14 text-destructive hover:text-destructive hover:bg-destructive/10 rounded-2xl font-bold"
          >
            <LogOut className="h-5 w-5 ml-2" />
            <span>تسجيل الخروج</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
