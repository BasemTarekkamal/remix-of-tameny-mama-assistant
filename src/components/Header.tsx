
import React from 'react';
import { Bell, User, ChevronRight, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';

interface HeaderProps {
  title: string;
  showIcons?: boolean;
  showBack?: boolean;
  onBack?: () => void;
}

const Header = ({ title, showIcons = true, showBack = false, onBack }: HeaderProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [showNotifications, setShowNotifications] = React.useState(false);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [unreadCount, setUnreadCount] = React.useState(0);

  React.useEffect(() => {
    if (user && showIcons) {
      fetchNotifications();

      // Subscribe to new notifications
      const channel = supabase
        .channel('schema-db-changes')
        .on(
          'postgres_changes',
          { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` },
          (payload) => {
            setNotifications(prev => [payload.new, ...prev]);
            setUnreadCount(prev => prev + 1);
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user, showIcons]);

  const fetchNotifications = async () => {
    const { data } = await (supabase
      .from('notifications' as any)
      .select('*')
      .eq('user_id', user?.id)
      .order('created_at', { ascending: false })
      .limit(5) as any);

    if (data) {
      setNotifications(data);
      setUnreadCount(data.filter((n: any) => !n.is_read).length);
    }
  };

  const markAsRead = async () => {
    if (!user) return;
    await (supabase
      .from('notifications' as any)
      .update({ is_read: true })
      .eq('user_id', user.id)
      .eq('is_read', false) as any);
    setUnreadCount(0);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const handleBack = () => {
    if (onBack) onBack();
    else navigate(-1);
  };

  return (
    <header className="relative flex items-center justify-between mb-6 pt-2">
      <div className="flex-1 flex items-center">
        {showBack ? (
          <button
            onClick={handleBack}
            className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors"
          >
            <ChevronRight className="text-foreground" size={24} />
          </button>
        ) : (
          showIcons && (
            <Link to={user ? "/profile" : "/auth"}>
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors border border-primary/20">
                <User className="text-primary" size={20} />
              </div>
            </Link>
          )
        )}
      </div>

      <h1 className="text-lg font-bold text-center flex-[2] truncate px-2">{title}</h1>

      <div className="flex-1 flex justify-end relative">
        {showIcons && (
          <div className="relative">
            <button
              onClick={() => {
                setShowNotifications(!showNotifications);
                if (!showNotifications) markAsRead();
              }}
              className="w-10 h-10 rounded-full bg-white shadow-sm flex items-center justify-center hover:bg-gray-50 transition-colors relative"
            >
              <Bell className="text-muted-foreground" size={20} />
              {unreadCount > 0 && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white animate-pulse" />
              )}
            </button>

            <AnimatePresence>
              {showNotifications && (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-40"
                    onClick={() => setShowNotifications(false)}
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute top-12 left-0 w-72 bg-white rounded-2xl shadow-xl border border-gray-100 z-50 overflow-hidden"
                  >
                    <div className="p-4 border-b border-gray-50 flex items-center justify-between">
                      <h3 className="font-bold text-sm">التنبيهات</h3>
                      <button onClick={() => setShowNotifications(false)}>
                        <X size={16} className="text-muted-foreground" />
                      </button>
                    </div>
                    <div className="max-h-64 overflow-y-auto">
                      {notifications.length > 0 ? (
                        notifications.map((n) => (
                          <div key={n.id} className="p-4 border-b border-gray-50 last:border-0 hover:bg-gray-50 transition-colors">
                            <h4 className="font-bold text-xs mb-1">{n.title}</h4>
                            <p className="text-xs text-muted-foreground leading-relaxed">{n.message}</p>
                            <span className="text-[10px] text-gray-400 mt-2 block">
                              {new Date(n.created_at).toLocaleTimeString('ar-EG', { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="p-8 text-center">
                          <p className="text-xs text-muted-foreground">لا توجد تنبيهات حالياً</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
