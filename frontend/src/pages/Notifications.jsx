import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Bell,
  BellOff,
  ShoppingBag,
  MessageCircle,
  Truck,
  CreditCard,
  Info,
  CheckCheck,
} from 'lucide-react';
import { useNotificationStore } from '@/store/notificationStore';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'orders', label: 'Orders', types: ['new_order', 'order_status'] },
  { key: 'messages', label: 'Messages', types: ['new_message'] },
  { key: 'payments', label: 'Payments', types: ['payment_update'] },
  { key: 'delivery', label: 'Delivery', types: ['delivery_update'] },
  { key: 'system', label: 'System', types: ['system'] },
];

function formatTimeAgo(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHrs = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return date.toLocaleDateString();
}

function getNotifIcon(type) {
  switch (type) {
    case 'new_order':
    case 'order_status':
      return { icon: ShoppingBag, className: 'bg-blue-500/15 text-blue-600 dark:text-blue-300' };
    case 'new_message':
      return { icon: MessageCircle, className: 'bg-green-500/15 text-green-600 dark:text-green-300' };
    case 'payment_update':
      return { icon: CreditCard, className: 'bg-amber-500/15 text-amber-600 dark:text-amber-300' };
    case 'delivery_update':
      return { icon: Truck, className: 'bg-purple-500/15 text-purple-600 dark:text-purple-300' };
    default:
      return { icon: Info, className: 'bg-slate-500/15 text-slate-600 dark:text-slate-300' };
  }
}

function getNotifLink(notif) {
  const data = notif.data || {};
  if (data.orderId) return '/orders';
  if (data.chatRoomId) return `/chat?room=${data.chatRoomId}`;
  return null;
}

function Notifications() {
  const [activeFilter, setActiveFilter] = useState('all');
  const navigate = useNavigate();
  const { notifications, unreadCount, fetchNotifications, fetchUnreadCount, markAsRead, markAllRead } =
    useNotificationStore();

  useEffect(() => {
    fetchNotifications();
    fetchUnreadCount();
  }, [fetchNotifications, fetchUnreadCount]);

  const filtered = useMemo(() => {
    if (activeFilter === 'all') return notifications;
    const filterDef = FILTERS.find((f) => f.key === activeFilter);
    return notifications.filter((n) => filterDef?.types?.includes(n.type));
  }, [activeFilter, notifications]);

  const handleClick = async (notif) => {
    if (!notif.isRead) {
      await markAsRead(notif._id);
    }
    const link = getNotifLink(notif);
    if (link) navigate(link);
  };

  return (
    <>
      <div className="container py-8 md:py-10 max-w-4xl">
        <div className="endfield-card endfield-gradient p-5 md:p-7 mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-primary mb-2">Inbox</p>
            <h1 className="text-3xl font-bold flex items-center gap-2">
              <Bell className="h-7 w-7 text-primary" />
              Notifications
            </h1>
            <p className="text-muted-foreground mt-1">Track order, payment, chat, and system updates.</p>
          </div>

          {unreadCount > 0 && (
            <Button onClick={markAllRead} className="gap-2 w-full md:w-auto">
              <CheckCheck className="h-4 w-4" />
              Mark all as read ({unreadCount})
            </Button>
          )}
        </div>

        <div className="flex flex-wrap gap-2 mb-6">
          {FILTERS.map((filter) => (
            <Button
              key={filter.key}
              type="button"
              size="sm"
              variant={activeFilter === filter.key ? 'default' : 'outline'}
              onClick={() => setActiveFilter(filter.key)}
            >
              {filter.label}
            </Button>
          ))}
        </div>

        {filtered.length === 0 ? (
          <Card className="endfield-card py-10">
            <CardContent className="text-center">
              <BellOff className="h-12 w-12 mx-auto mb-3 text-muted-foreground" />
              <p className="text-muted-foreground">No notifications</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {filtered.map((notif) => {
              const { icon: Icon, className } = getNotifIcon(notif.type);
              return (
                <Card
                  key={notif._id}
                  className={`endfield-card cursor-pointer transition-colors hover:border-primary/40 ${
                    notif.isRead ? '' : 'border-primary/40 bg-primary/5'
                  }`}
                  onClick={() => handleClick(notif)}
                >
                  <CardContent className="p-4 flex items-start gap-3">
                    <div className={`h-10 w-10 rounded-lg flex items-center justify-center ${className}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-semibold text-foreground line-clamp-1">{notif.title}</p>
                        {!notif.isRead && <Badge className="text-[10px] px-2 py-0.5">NEW</Badge>}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{notif.message}</p>
                      <p className="text-xs text-muted-foreground mt-2">{formatTimeAgo(notif.createdAt)}</p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </>
  );
}

export default Notifications;
