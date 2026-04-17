import React from 'react';
import { Platform, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import api from '../api/api';

let notificationHandlerSet = false;
let isExpoGo = Constants.appOwnership === 'expo';

class NotificationService {
    constructor() {
        this.expoPushToken = null;
        this.notificationListener = null;
        this.responseListener = null;
        this.initialized = false;
        this._notifications = null;
        this._device = null;
    }

    get Notifications() {
        if (isExpoGo) return null;
        if (!this._notifications) {
            try {
                this._notifications = require('expo-notifications');
                this._device = require('expo-device');
            } catch (e) {
                console.log('📱 Notifications module failed to load:', e.message);
                this._notifications = null;
            }
        }
        return this._notifications;
    }

    get Device() {
        if (isExpoGo) return null;
        if (!this._device) {
            try {
                this._device = require('expo-device');
            } catch (e) {
                this._device = null;
            }
        }
        return this._device;
    }

    async initialize() {
        if (this.initialized) return true;

        if (isExpoGo) {
            console.log('📱 Running in Expo Go - notifications skipped');
            this.initialized = true;
            return true;
        }

        const Notifications = this.Notifications;
        if (!Notifications) {
            console.log('📱 Notifications not available');
            this.initialized = true;
            return true;
        }

        try {
            await Notifications.setNotificationHandler({
                handleNotification: async () => ({
                    shouldShowAlert: true,
                    shouldPlaySound: true,
                    shouldSetBadge: true,
                    priority: Notifications.AndroidNotificationPriority.MAX,
                }),
            });

            const Device = this.Device;
            if (Device?.isDevice) {
                const { status: existingStatus } = await Notifications.getPermissionsAsync();
                console.log('📱 Current notification permission status:', existingStatus);

                if (existingStatus !== 'granted') {
                    const { status } = await Notifications.requestPermissionsAsync({
                        ios: {
                            allowAlert: true,
                            allowBadge: true,
                            allowSound: true,
                        },
                    });
                    console.log('📱 Notification permission requested, new status:', status);

                    if (status !== 'granted') {
                        console.log('⚠️ Notification permissions not granted');
                        return false;
                    }
                }
            }

            notificationHandlerSet = true;
            this.initialized = true;
            console.log('✅ Notification handler initialized successfully');
            return true;
        } catch (error) {
            console.log('📱 Notifications init failed:', error.message);
            this.initialized = true;
            return true;
        }
    }

    async registerForPushNotifications() {
        if (isExpoGo) {
            console.log('📱 Push notifications not available in Expo Go');
            return null;
        }

        const Notifications = this.Notifications;
        if (!Notifications) {
            console.log('📱 Notifications not available');
            return null;
        }

        const initialized = await this.initialize();
        if (!initialized) {
            console.log('Notifications not supported in this environment');
            return null;
        }

        let token;

        try {
            const Device = this.Device;
            if (Platform.OS === 'android') {
                await Notifications.setNotificationChannelAsync('high_importance_channel', {
                    name: 'High Importance Notifications',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#14b8a6',
                });
            }

            if (Device?.isDevice) {
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

                if (Constants.appOwnership !== 'expo') {
                    try {
                        const tokenData = await Notifications.getExpoPushTokenAsync({
                            projectId: Constants?.expoConfig?.extra?.eas?.projectId,
                        });
                        token = tokenData.data;
                        this.expoPushToken = token;

                        await this.saveTokenToServer(token);
                    } catch (error) {
                        console.log('Skipped fetching push token:', error.message);
                    }
                }
            } else {
                console.log('Must use physical device for Push Notifications');
            }
        } catch (error) {
            console.log('Push notification registration failed:', error.message);
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
        if (!notificationHandlerSet) return () => { };
        const Notifications = this.Notifications;
        if (!Notifications) return () => { };

        try {
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
        } catch (error) {
            console.log('Setup notification listeners failed:', error.message);
        }

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
        console.log('🔔 [LocalNotification] Triggering locally:', title, body);

        const Notifications = this.Notifications;
        if (!Notifications) {
            console.log('📱 Notifications not available');
            return;
        }

        if (!notificationHandlerSet) {
            console.log('🔔 [LocalNotification] Initializing notification handler...');
            const initialized = await this.initialize();
            if (!initialized) {
                console.log('❌ Notifications not available - handler could not be initialized');
                return;
            }
            console.log('🔔 [LocalNotification] Handler initialized');
        }

        if (Platform.OS === 'android') {
            try {
                await Notifications.setNotificationChannelAsync('default', {
                    name: 'Default Notifications',
                    importance: Notifications.AndroidImportance.MAX,
                    vibrationPattern: [0, 250, 250, 250],
                    lightColor: '#14b8a6',
                });
            } catch (channelError) {
                console.log('Channel setup (may already exist):', channelError.message);
            }
        }

        try {
            console.log('🔔 [LocalNotification] Scheduling notification...');
            const notificationId = await Notifications.scheduleNotificationAsync({
                content: {
                    title,
                    body,
                    data: { ...data, receivedAt: new Date().toISOString() },
                    sound: 'default',
                    priority: Platform.OS === 'android' ? Notifications.AndroidNotificationPriority.MAX : undefined,
                },
                trigger: null,
            });
            console.log('🔔 [LocalNotification] Scheduled successfully, ID:', notificationId);
        } catch (error) {
            console.error('🔔 [LocalNotification] Schedule notification failed:', error.message, error);
        }
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
        const Notifications = this.Notifications;
        if (!Notifications) return;
        try {
            await Notifications.cancelAllScheduledNotificationsAsync();
            await Notifications.dismissAllNotificationsAsync();
        } catch (error) {
            console.log('Clear notifications failed:', error.message);
        }
    }

    async setBadgeCount(count) {
        const Notifications = this.Notifications;
        if (!Notifications) return;
        try {
            await Notifications.setBadgeCountAsync(count);
        } catch (error) {
            console.log('Set badge count failed:', error.message);
        }
    }
}

const notificationService = new NotificationService();
export default notificationService;

export function usePushNotifications() {
    const [token, setToken] = React.useState(null);
    const [notification, setNotification] = React.useState(null);
    const [initialized, setInitialized] = React.useState(false);

    React.useEffect(() => {
        let cleanup = null;

        const init = async () => {
            try {
                const isInitialized = await notificationService.initialize();
                setInitialized(isInitialized);

                if (!isInitialized) {
                    console.log('Notifications not available on this device');
                    return;
                }

                try {
                    const pushToken = await notificationService.registerForPushNotifications();
                    setToken(pushToken);
                } catch (error) {
                    console.log('Push registration error:', error.message);
                }
            } catch (initError) {
                console.log('Notification init error:', initError.message);
            }
        };

        init();

        return () => {
            if (cleanup) {
                cleanup();
            }
        };
    }, []);

    React.useEffect(() => {
        if (!initialized) return;

        const cleanup = notificationService.setupNotificationListeners(
            (notif) => {
                try {
                    setNotification(notif);
                } catch (e) {
                    console.log('Notification callback error:', e.message);
                }
            },
            (response) => {
                try {
                    const data = response.notification.request.content.data;
                    if (data?.type === 'new_order' && data?.orderId) {
                    }
                } catch (e) {
                    console.log('Notification response error:', e.message);
                }
            }
        );

        return () => {
            if (cleanup) {
                cleanup();
            }
        };
    }, [initialized]);

    return {
        token,
        notification,
        initialized,
        scheduleNotification: notificationService.scheduleLocalNotification,
        clearNotifications: notificationService.clearAllNotifications,
    };
}