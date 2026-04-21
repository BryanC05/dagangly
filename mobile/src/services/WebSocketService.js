import { useEffect, useRef, useCallback, useState } from 'react';
import { AppState } from 'react-native';
import io from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { API_URL } from '../config';

class WebSocketService {
    constructor() {
        this.socket = null;
        this.connected = false;
        this.listeners = new Map();
        this.activeRooms = [];
        this.maxActiveRooms = 3;
        this.reconnectAttempts = 0;
        this.maxReconnectAttempts = 5;
        this.reconnectDelay = 1000;
    }

    async connect() {
        if (this.socket?.connected) {
            return this.socket;
        }

        const token = await SecureStore.getItemAsync('token');
        if (!token) {
            return null;
        }

        return new Promise((resolve, reject) => {
            const wsUrl = API_URL.replace('/api', '').replace(/^http/, 'ws');
            this.socket = io(wsUrl + '/ws', {
                transports: ['websocket'],
                auth: { token },
                query: { token },
                reconnection: false,
            });

            this.socket.on('connect', () => {
                this.connected = true;
                this.reconnectAttempts = 0;
                this.reconnectDelay = 1000;
                console.log('Socket.IO connected');

                this.emitEvent('connected', {});

                this.rejoinActiveRooms();

                if (this.pingInterval) clearInterval(this.pingInterval);
                this.pingInterval = setInterval(() => {
                    if (this.socket?.connected) {
                        this.socket.emit('ping', { timestamp: Date.now() });
                    }
                }, 25000);

                resolve(this.socket);
            });

            this.socket.on('disconnect', (reason) => {
                this.connected = false;
                if (this.pingInterval) clearInterval(this.pingInterval);
                console.log('Socket.IO disconnected:', reason);
                this.emitEvent('disconnected', { reason });
                this.handleReconnect();
            });

            this.socket.on('connect_error', (error) => {
                console.error('WebSocket connection error:', error);
                this.handleReconnect();
                reject(error);
            });

            this.socket.on('receive-message', (data) => {
                this.emitEvent('message', data);
            });

            this.socket.on('user-typing', (data) => {
                this.emitEvent('typing', data);
            });

            this.socket.on('user-stop-typing', (data) => {
                this.emitEvent('stop-typing', data);
            });

            this.socket.on('driver-location-update', (data) => {
                this.emitEvent('driver-location', data);
            });

            this.socket.on('order-status-update', (data) => {
                this.emitEvent('order-status', data);
            });

            this.socket.on('new-order', (data) => {
                this.emitEvent('new-order', data);
            });

            setTimeout(() => {
                if (!this.connected) {
                    reject(new Error('Connection timeout'));
                }
            }, 10000);
        });
    }

    async handleReconnect() {
        if (this.reconnectAttempts >= this.maxReconnectAttempts) {
            console.log('Max reconnection attempts reached');
            return;
        }

        const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
        console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

        setTimeout(() => {
            this.reconnectAttempts++;
            this.connect().catch(() => {});
        }, delay);
    }

    emitEvent(event, data) {
        const listeners = this.listeners.get(event) || [];
        listeners.forEach(cb => cb(data));
    }

    disconnect() {
        if (this.pingInterval) {
            clearInterval(this.pingInterval);
            this.pingInterval = null;
        }
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.connected = false;
        }
    }

    joinRoom(roomId) {
        if (!this.socket?.connected || !roomId) return;

        const index = this.activeRooms.indexOf(roomId);
        if (index > -1) return;

        if (this.activeRooms.length >= this.maxActiveRooms) {
            const removedRoom = this.activeRooms.shift();
            this.socket.emit('leave-room', { roomId: removedRoom });
        }

        this.activeRooms.push(roomId);
        this.socket.emit('join-room', { roomId });
    }

    leaveRoom(roomId) {
        if (!this.socket?.connected || !roomId) return;

        const index = this.activeRooms.indexOf(roomId);
        if (index > -1) {
            this.activeRooms.splice(index, 1);
            this.socket.emit('leave-room', { roomId });
        }
    }

    rejoinActiveRooms() {
        if (!this.socket?.connected || this.activeRooms.length === 0) return;

        this.activeRooms.forEach(roomId => {
            this.socket.emit('join-room', { roomId });
        });
    }

    sendMessage(roomId, content) {
        if (!this.socket?.connected || !roomId) return;

        this.socket.emit('send-message', {
            roomId,
            data: { content },
        });
    }

    sendTyping(roomId) {
        if (!this.socket?.connected || !roomId) return;
        this.socket.emit('typing', { roomId });
    }

    stopTyping(roomId) {
        if (!this.socket?.connected || !roomId) return;
        this.socket.emit('stop-typing', { roomId });
    }

    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }

    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }

    emit(event, data) {
        if (this.socket?.connected) {
            this.socket.emit(event, data);
        }
    }

    joinOrderTracking(orderId) {
        this.emit('join-order-tracking', orderId);
    }

    leaveOrderTracking(orderId) {
        this.emit('leave-order-tracking', orderId);
    }

    updateDriverLocation(orderId, latitude, longitude) {
        this.emit('driver-location', {
            orderId,
            latitude,
            longitude,
        });
    }

    getActiveRooms() {
        return this.activeRooms;
    }
}

const wsService = new WebSocketService();

export function useWebSocket() {
    const [isConnected, setIsConnected] = useState(false);

    const connect = useCallback(async () => {
        try {
            await wsService.connect();
            return true;
        } catch (error) {
            console.error('Failed to connect WebSocket:', error);
            return false;
        }
    }, []);

    const disconnect = useCallback(() => {
        wsService.disconnect();
    }, []);

    useEffect(() => {
        const handleConnected = () => setIsConnected(true);
        const handleDisconnected = () => setIsConnected(false);

        wsService.on('connected', handleConnected);
        wsService.on('disconnected', handleDisconnected);

        const subscription = AppState.addEventListener('change', nextAppState => {
            if (nextAppState === 'active' && !wsService.connected) {
                console.log('🔄 [Socket.IO] App awakened, forcing reconnect...');
                connect();
            }
        });

        return () => {
            wsService.off('connected', handleConnected);
            wsService.off('disconnected', handleDisconnected);
            subscription.remove();
        };
    }, [connect]);

    return {
        connect,
        disconnect,
        socket: wsService.socket,
        isConnected,
        wsService,
        joinRoom: wsService.joinRoom.bind(wsService),
        leaveRoom: wsService.leaveRoom.bind(wsService),
        sendMessage: wsService.sendMessage.bind(wsService),
        sendTyping: wsService.sendTyping.bind(wsService),
        stopTyping: wsService.stopTyping.bind(wsService),
    };
}

export function useChatWebSocket(roomId) {
    const { isConnected, joinRoom, leaveRoom, sendMessage, sendTyping, stopTyping, wsService } = useWebSocket();
    const [messages, setMessages] = useState([]);
    const [typingUser, setTypingUser] = useState(null);

    useEffect(() => {
        if (!isConnected || !roomId) return;

        joinRoom(roomId);

        const handleMessage = (message) => {
            setMessages(prev => [...prev, message]);
        };

        const handleTyping = (data) => {
            setTypingUser(data);
            setTimeout(() => setTypingUser(null), 3000);
        };

        const handleStopTyping = () => {
            setTypingUser(null);
        };

        wsService.on('message', handleMessage);
        wsService.on('typing', handleTyping);
        wsService.on('stop-typing', handleStopTyping);

        return () => {
            leaveRoom(roomId);
            wsService.off('message', handleMessage);
            wsService.off('typing', handleTyping);
            wsService.off('stop-typing', handleStopTyping);
        };
    }, [isConnected, roomId, joinRoom, leaveRoom, wsService]);

    const send = useCallback((content) => {
        if (roomId) {
            sendMessage(roomId, content);
        }
    }, [roomId, sendMessage]);

    const typing = useCallback(() => {
        if (roomId) {
            sendTyping(roomId);
        }
    }, [roomId, sendTyping]);

    const stopTypingCallback = useCallback(() => {
        if (roomId) {
            stopTyping(roomId);
        }
    }, [roomId, stopTyping]);

    return {
        messages,
        typingUser,
        sendMessage: send,
        sendTyping: typing,
        stopTyping: stopTypingCallback,
    };
}

export function useDriverTracking(orderId) {
    const [driverLocation, setDriverLocation] = useState(null);
    const { connect, wsService } = useWebSocket();

    useEffect(() => {
        if (!orderId) return;

        const setupTracking = async () => {
            await connect();
            wsService.joinOrderTracking(orderId);
        };

        setupTracking();

        const handleLocationUpdate = (data) => {
            if (data.orderId === orderId) {
                setDriverLocation({
                    latitude: data.latitude,
                    longitude: data.longitude,
                    timestamp: data.timestamp,
                });
            }
        };

        wsService.on('driver-location', handleLocationUpdate);

        return () => {
            wsService.off('driver-location', handleLocationUpdate);
            wsService.leaveOrderTracking(orderId);
        };
    }, [orderId, connect, wsService]);

    return { driverLocation };
}

export function useDriverLocationBroadcast(orderId) {
    const { connect, wsService } = useWebSocket();
    const lastSent = useRef(0);

    useEffect(() => {
        connect();
    }, [connect]);

    const broadcastLocation = useCallback((latitude, longitude) => {
        const now = Date.now();
        if (now - lastSent.current < 5000) {
            return;
        }
        lastSent.current = now;
        wsService.updateDriverLocation(orderId, latitude, longitude);
    }, [orderId, wsService]);

    return { broadcastLocation };
}

export default wsService;
