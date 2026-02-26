import { create } from 'zustand';
import api from '../api/api';

const NOTIFICATION_TIMEOUT_MS = 20000;

const getNotificationRequestConfig = () => ({
    timeout: NOTIFICATION_TIMEOUT_MS,
    _skipRetry: true,
    _suppressGlobalErrors: true,
});

const getNotificationErrorMessage = (err) => {
    if (err?.code === 'ECONNABORTED') {
        return 'Request timed out. Please try again.';
    }
    if (err?.response?.data?.error) {
        return err.response.data.error;
    }
    if (err?.response?.data?.message) {
        return err.response.data.message;
    }
    return 'Unable to reach notification service.';
};

export const useNotificationStore = create((set) => ({
    notifications: [],
    unreadCount: 0,
    lastError: null,

    fetchNotifications: async () => {
        try {
            const res = await api.get('/notifications', getNotificationRequestConfig());
            set({ notifications: res.data, lastError: null });
            return { success: true };
        } catch (err) {
            const message = getNotificationErrorMessage(err);
            console.error('Failed to fetch notifications:', message, err);
            set({ lastError: message });
            return { success: false, error: message };
        }
    },

    fetchUnreadCount: async () => {
        try {
            const res = await api.get('/notifications/unread-count', getNotificationRequestConfig());
            set({ unreadCount: res.data.count, lastError: null });
            return { success: true };
        } catch (err) {
            const message = getNotificationErrorMessage(err);
            console.error('Failed to fetch unread count:', message, err);
            set({ lastError: message });
            return { success: false, error: message };
        }
    },

    markAsRead: async (id) => {
        try {
            await api.put(`/notifications/${id}/read`, null, getNotificationRequestConfig());
            set((state) => ({
                notifications: state.notifications.map((n) =>
                    n._id === id ? { ...n, isRead: true } : n
                ),
                unreadCount: Math.max(0, state.unreadCount - 1),
                lastError: null,
            }));
            return { success: true };
        } catch (err) {
            const message = getNotificationErrorMessage(err);
            console.error('Failed to mark notification as read:', message, err);
            set({ lastError: message });
            return { success: false, error: message };
        }
    },

    markAllRead: async () => {
        try {
            await api.put('/notifications/read-all', null, getNotificationRequestConfig());
            set((state) => ({
                notifications: state.notifications.map((n) => ({ ...n, isRead: true })),
                unreadCount: 0,
                lastError: null,
            }));
            return { success: true };
        } catch (err) {
            const message = getNotificationErrorMessage(err);
            console.error('Failed to mark all as read:', message, err);
            set({ lastError: message });
            return { success: false, error: message };
        }
    },

    addNotification: (notification) => {
        set((state) => ({
            notifications: [notification, ...state.notifications].slice(0, 50),
            unreadCount: state.unreadCount + 1,
        }));
    },

    deleteNotification: async (id) => {
        try {
            await api.delete(`/notifications/${id}`, getNotificationRequestConfig());
            set((state) => {
                const notif = state.notifications.find((n) => n._id === id);
                return {
                    notifications: state.notifications.filter((n) => n._id !== id),
                    unreadCount: notif && !notif.isRead
                        ? Math.max(0, state.unreadCount - 1)
                        : state.unreadCount,
                    lastError: null,
                };
            });
            return { success: true };
        } catch (err) {
            const message = getNotificationErrorMessage(err);
            console.error('Failed to delete notification:', message, err);
            set({ lastError: message });
            return { success: false, error: message };
        }
    },

    deleteAllNotifications: async () => {
        try {
            await api.delete('/notifications/delete-all', getNotificationRequestConfig());
            set({
                notifications: [],
                unreadCount: 0,
                lastError: null,
            });
            return { success: true };
        } catch (err) {
            const message = getNotificationErrorMessage(err);
            console.error('Failed to delete all notifications:', message, err);
            set({ lastError: message });
            return { success: false, error: message };
        }
    },
}));
