import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, ShoppingBag, MessageCircle, Truck, CreditCard, Info, BellOff } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotificationStore } from '../store/notificationStore';
import './NotificationBell.css';

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
            return { icon: <ShoppingBag size={16} />, className: 'order' };
        case 'new_message':
            return { icon: <MessageCircle size={16} />, className: 'message' };
        case 'payment_update':
            return { icon: <CreditCard size={16} />, className: 'payment' };
        case 'delivery_update':
            return { icon: <Truck size={16} />, className: 'delivery' };
        default:
            return { icon: <Info size={16} />, className: 'system' };
    }
}

function getNotifLink(notif) {
    const data = notif.data || {};
    if (data.orderId) return `/orders`;
    if (data.chatRoomId) return `/chat?room=${data.chatRoomId}`;
    return '/notifications';
}

function NotificationBell() {
    const [open, setOpen] = useState(false);
    const dropdownRef = useRef(null);
    const navigate = useNavigate();

    const {
        notifications,
        unreadCount,
        fetchNotifications,
        markAsRead,
        markAllRead,
    } = useNotificationStore();

    useEffect(() => {
        if (open) {
            fetchNotifications();
        }
    }, [open, fetchNotifications]);

    const handleClickNotif = async (notif) => {
        if (!notif.isRead) {
            await markAsRead(notif._id);
        }
        setOpen(false);
        navigate(getNotifLink(notif));
    };

    const displayNotifs = notifications.slice(0, 10);

    return (
        <div style={{ position: 'relative' }} ref={dropdownRef}>
            <button
                className={`relative h-9 w-9 p-0 bg-transparent text-black hover:bg-black/10 rounded-none flex items-center justify-center cursor-pointer transition-colors ${open ? 'bg-black/10' : ''}`}
                onClick={() => setOpen(!open)}
                aria-label="Notifications"
            >
                <Bell size={20} />
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 flex h-4 min-w-4 px-1 items-center justify-center rounded-none bg-black text-[10px] text-primary font-black border border-white">
                        {unreadCount > 99 ? '99+' : unreadCount}
                    </span>
                )}
            </button>

            <AnimatePresence>
                {open && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="notification-overlay"
                            onClick={() => setOpen(false)}
                        />
                        <motion.div
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            className="absolute top-full right-0 mt-3 w-80 sm:w-96 max-h-[480px] bg-white dark:bg-[#1a1505] border-3 border-black dark:border-[#FACC15] rounded-lg shadow-[5px_5px_0px_0px_#F97316] z-[999] flex flex-col overflow-hidden transform -skew-x-6 origin-top-right"
                        >
                            <div className="flex justify-between items-center px-4 py-3 border-b-2 border-border bg-neutral-900 text-white transform skew-x-6">
                                <h3 className="text-xs font-black uppercase tracking-widest text-[#FACC15]">Notifications</h3>
                                {unreadCount > 0 && (
                                    <button 
                                        onClick={() => markAllRead()}
                                        className="text-[10px] font-black uppercase tracking-wider text-primary hover:text-white transition-colors cursor-pointer bg-transparent border-0 p-0"
                                    >
                                        Mark all read
                                    </button>
                                )}
                            </div>

                            <div className="overflow-y-auto flex-1 max-h-[360px] p-1.5 space-y-1 transform skew-x-6">
                                {displayNotifs.length === 0 ? (
                                    <div className="py-12 text-center text-neutral-500 font-black uppercase text-xs">
                                        <BellOff size={32} className="mx-auto mb-2 opacity-50 text-neutral-400 animate-bounce" />
                                        <p>No notifications yet</p>
                                    </div>
                                ) : (
                                    displayNotifs.map((notif) => {
                                        const { icon } = getNotifIcon(notif.type);
                                        const isUnread = !notif.isRead;
                                        return (
                                            <div
                                                key={notif._id}
                                                className={`group cursor-pointer p-2.5 rounded-md flex items-start gap-3 transition-all transform hover:-translate-x-1 border-2 border-transparent hover:border-black dark:hover:border-primary text-black dark:text-foreground hover:bg-[#FACC15] hover:text-black ${
                                                    isUnread 
                                                        ? 'bg-neutral-100 dark:bg-[#2e260e] border-l-4 border-l-[#F97316] dark:border-l-primary' 
                                                        : 'bg-transparent'
                                                }`}
                                                onClick={() => handleClickNotif(notif)}
                                            >
                                                <div className="relative shrink-0 w-8 h-8 rounded-none border border-black dark:border-neutral-700 bg-black flex items-center justify-center text-white transform -skew-x-12 shadow-[1px_1px_0px_#000] overflow-hidden">
                                                    <span className="transform skew-x-12">{icon}</span>
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <p className="text-xs font-black uppercase tracking-wide truncate flex items-center gap-1.5">
                                                        {isUnread && (
                                                            <span className="text-[#F97316] dark:text-primary animate-pulse">★</span>
                                                        )}
                                                        {notif.title}
                                                    </p>
                                                    <p className="text-[10px] text-neutral-600 dark:text-neutral-400 group-hover:text-black/85 font-medium truncate">
                                                        {notif.message}
                                                    </p>
                                                    <span className="text-[9px] text-neutral-400 dark:text-neutral-500 group-hover:text-black/70 font-bold block mt-1 uppercase">
                                                        {formatTimeAgo(notif.createdAt)}
                                                    </span>
                                                </div>
                                                {isUnread && (
                                                    <span className="text-[8px] bg-[#F97316] text-white px-1.5 py-0.5 rounded font-black italic shrink-0">NEW</span>
                                                )}
                                            </div>
                                        );
                                    })
                                )}
                            </div>

                            {notifications.length > 0 && (
                                <div className="p-3 border-t-2 border-border text-center bg-neutral-900 text-white transform skew-x-6">
                                    <Link 
                                        to="/notifications" 
                                        onClick={() => setOpen(false)}
                                        className="text-xs font-black uppercase tracking-widest text-primary hover:text-white transition-colors block"
                                    >
                                        View all notifications
                                    </Link>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}

export default NotificationBell;
