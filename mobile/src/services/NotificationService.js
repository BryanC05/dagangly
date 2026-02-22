import React from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api from '../api/api';

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: true,
    }),
});

class NotificationService {
    constructor() {
        this.expoPushToken = null;
        this.notificationListener = null;
        this.responseListener = null;
    }

    async registerForPushNotifications() {
        let token;

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#3b82f6',
            });
        }

        if (Device.isDevice) {
            const { status: existingStatus } = await Notifications.getPermissionsAsync();
            let finalStatus = existingStatus;

            if (existingStatus !== 'granted') {
                const { status } = await Notifications.requestPermissionsAsync();
                finalStatus = status;
            }

            if (finalStatus !== 'granted') {
                console.log('Push notification permission not granted');
                return null;
            }

            try {
                const tokenData = await Notifications.getExpoPushTokenAsync({
                    projectId: 'your-project-id',
                });
                token = tokenData.data;
                this.expoPushToken = token;

                await this.saveTokenToServer(token);
            } catch (error) {
                console.error('Error getting push token:', error);
            }
        } else {
            console.log('Must use physical device for Push Notifications');
        }

        return token;
    }

    async saveTokenToServer(token) {
        try {
            await api.put('/driver/push-token', { pushToken: token });
        } catch (error) {
            console.error('Failed to save push token:', error);
        }
    }

    async getStoredToken() {
        try {
            return await AsyncStorage.getItem('pushToken');
        } catch {
            return null;
        }
    }

    setupNotificationListeners(onNotification, onResponse) {
        this.notificationListener = Notifications.addNotificationReceivedListener(notification => {
            console.log('Notification received:', notification);
            if (onNotification) {
                onNotification(notification);
            }
        });

        this.responseListener = Notifications.addNotificationResponseReceivedListener(response => {
            console.log('Notification response:', response);
            if (onResponse) {
                onResponse(response);
            }
        });

        return () => {
            if (this.notificationListener) {
                this.notificationListener.remove();
            }
            if (this.responseListener) {
                this.responseListener.remove();
            }
        };
    }

    async scheduleLocalNotification(title, body, data = {}, seconds = 1) {
        await Notifications.scheduleNotificationAsync({
            content: {
                title,
                body,
                data,
                sound: true,
            },
            trigger: { seconds },
        });
    }

    async sendNewOrderNotificationToDrivers(orderData, nearbyDriverTokens) {
        if (!nearbyDriverTokens || nearbyDriverTokens.length === 0) {
            return;
        }

        const message = {
            to: nearbyDriverTokens,
            sound: 'default',
            title: 'New Delivery Available!',
            body: `Rp ${orderData.deliveryFee?.toLocaleString('id-ID')} - ${orderData.distance?.toFixed(1)}km - ${orderData.storeName}`,
            data: {
                type: 'new_order',
                orderId: orderData.orderId,
            },
        };

        try {
            await fetch('https://exp.host/--/api/v2/push/send', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(message),
            });
        } catch (error) {
            console.error('Failed to send push notification:', error);
        }
    }

    async clearAllNotifications() {
        await Notifications.cancelAllScheduledNotificationsAsync();
        await Notifications.dismissAllNotificationsAsync();
    }

    async setBadgeCount(count) {
        await Notifications.setBadgeCountAsync(count);
    }
}

const notificationService = new NotificationService();
export default notificationService;

export function usePushNotifications() {
    const [token, setToken] = React.useState(null);
    const [notification, setNotification] = React.useState(null);

    React.useEffect(() => {
        const register = async () => {
            const pushToken = await notificationService.registerForPushNotifications();
            setToken(pushToken);
        };

        register();

        const cleanup = notificationService.setupNotificationListeners(
            (notif) => setNotification(notif),
            (response) => {
                const data = response.notification.request.content.data;
                if (data?.type === 'new_order' && data?.orderId) {
                    // Navigate to order details or available orders
                }
            }
        );

        return cleanup;
    }, []);

    return {
        token,
        notification,
        scheduleNotification: notificationService.scheduleLocalNotification,
        clearNotifications: notificationService.clearAllNotifications,
    };
}
