import React, { useState, useEffect } from 'react';
import { Bell, X, CheckCircle, DollarSign, Link, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { databaseAdapter } from '@/lib/databaseAdapter';
import { useSecureAuth } from '@/hooks/useSecureAuth';

interface Notification {
  id: string;
  type: 'earning' | 'asset_linking' | 'new_feature';
  title: string;
  message: string;
  is_read: boolean;
  created_at: string;
  metadata?: {
    amount?: number;
    asset_name?: string;
    feature_name?: string;
  };
}

const NotificationBell: React.FC = () => {
  const { user } = useSecureAuth();
  const { toast } = useToast();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user?.id) {
      fetchNotifications();
    }
  }, [user?.id]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      
      // Fetch notifications from database
      const { data, error } = await databaseAdapter.supabase
        .from('user_notifications')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching notifications:', error);
        // Show mock notifications for development
        setNotifications(getMockNotifications());
        return;
      }

      setNotifications(data || []);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      setNotifications(getMockNotifications());
    } finally {
      setLoading(false);
    }
  };

  const getMockNotifications = (): Notification[] => {
    return [
      {
        id: '1',
        type: 'earning',
        title: 'First Earning Released! 🎉',
        message: 'Your first earning of 10.50 has been released to your account and linked to the Solar Energy Initiative.',
        is_read: false,
        created_at: new Date().toISOString(),
        metadata: {
          amount: 10.50,
          asset_name: 'Solar Energy Initiative'
        }
      },
      {
        id: '2',
        type: 'new_feature',
        title: 'New Feature: NFT Evolution',
        message: 'You can now evolve your loyalty NFT to unlock 3D rewards and higher earning ratios!',
        is_read: false,
        created_at: new Date(Date.now() - 86400000).toISOString(),
        metadata: {
          feature_name: 'NFT Evolution'
        }
      },
      {
        id: '3',
        type: 'asset_linking',
        title: 'Earnings Linked to Asset',
        message: 'Your recent earnings have been successfully linked to the Green Energy Fund.',
        is_read: true,
        created_at: new Date(Date.now() - 172800000).toISOString(),
        metadata: {
          asset_name: 'Green Energy Fund'
        }
      }
    ];
  };

  const markAsRead = async (notificationId: string) => {
    try {
      await databaseAdapter.supabase
        .from('user_notifications')
        .update({ is_read: true })
        .eq('id', notificationId);

      setNotifications(prev => 
        prev.map(notif => 
          notif.id === notificationId ? { ...notif, is_read: true } : notif
        )
      );
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      const unreadIds = notifications.filter(n => !n.is_read).map(n => n.id);
      
      if (unreadIds.length > 0) {
        await databaseAdapter.supabase
          .from('user_notifications')
          .update({ is_read: true })
          .in('id', unreadIds);

        setNotifications(prev => 
          prev.map(notif => ({ ...notif, is_read: true }))
        );
      }
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'earning':
        return <DollarSign className="h-4 w-4 text-green-500" />;
      case 'asset_linking':
        return <Link className="h-4 w-4 text-blue-500" />;
      case 'new_feature':
        return <Sparkles className="h-4 w-4 text-purple-500" />;
      default:
        return <Bell className="h-4 w-4 text-gray-500" />;
    }
  };

  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'earning':
        return 'border-l-green-500 bg-green-50/10';
      case 'asset_linking':
        return 'border-l-blue-500 bg-blue-50/10';
      case 'new_feature':
        return 'border-l-purple-500 bg-purple-50/10';
      default:
        return 'border-l-gray-500 bg-gray-50/10';
    }
  };

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <div className="relative">
      <Button 
        variant="ghost" 
        size="sm" 
        className="text-gray-400 hover:text-white relative"
        onClick={() => setIsOpen(!isOpen)}
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge 
            variant="destructive" 
            className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs"
          >
            {unreadCount > 9 ? '9+' : unreadCount}
          </Badge>
        )}
      </Button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Notification Panel */}
          <Card className="absolute right-0 top-12 w-80 z-50 bg-black/90 backdrop-blur-xl border-white/10 shadow-2xl">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-white text-lg">Notifications</CardTitle>
                <div className="flex items-center space-x-2">
                  {unreadCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={markAllAsRead}
                      className="text-xs text-blue-400 hover:text-blue-300"
                    >
                      Mark all read
                    </Button>
                  )}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setIsOpen(false)}
                    className="text-gray-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="p-0">
              <ScrollArea className="h-96">
                {loading ? (
                  <div className="flex items-center justify-center p-6">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    <span className="ml-2 text-white/70">Loading...</span>
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="flex flex-col items-center justify-center p-6 text-center">
                    <Bell className="h-8 w-8 text-gray-400 mb-2" />
                    <p className="text-white/70">No notifications yet</p>
                    <p className="text-white/50 text-sm">We'll notify you about earnings and new features</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className={`p-4 border-l-4 ${getNotificationColor(notification.type)} ${
                          !notification.is_read ? 'bg-white/5' : 'bg-transparent'
                        } hover:bg-white/10 transition-colors cursor-pointer`}
                        onClick={() => markAsRead(notification.id)}
                      >
                        <div className="flex items-start space-x-3">
                          <div className="flex-shrink-0 mt-0.5">
                            {getNotificationIcon(notification.type)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <p className={`text-sm font-medium ${
                                !notification.is_read ? 'text-white' : 'text-white/80'
                              }`}>
                                {notification.title}
                              </p>
                              {!notification.is_read && (
                                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0" />
                              )}
                            </div>
                            <p className="text-xs text-white/70 mt-1">
                              {notification.message}
                            </p>
                            <p className="text-xs text-white/50 mt-1">
                              {new Date(notification.created_at).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
