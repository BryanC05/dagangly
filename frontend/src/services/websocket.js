import { io } from 'socket.io-client';
import { getBackendUrl } from '@/config';

class WebSocketService {
  constructor() {
    this.socket = null;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectDelay = 1000;
    this.listeners = new Map();
    this.isConnected = false;
    this.activeRooms = [];
    this.userID = null;
  }

  connect(token, userID) {
    if (this.socket?.connected) {
      return;
    }

    this.userID = userID;
    const backendUrl = getBackendUrl();
    const wsUrl = backendUrl ? `${backendUrl.replace(/^http/, 'ws')}/ws` : 'ws://localhost:5000/ws';

    this.socket = io(wsUrl, {
      query: { token },
      transports: ['websocket'],
      reconnection: false,
    });

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.isConnected = true;
      this.reconnectAttempts = 0;
      this.reconnectDelay = 1000;
      this.emit('connected', {});
      this.rejoinActiveRooms();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('WebSocket disconnected:', reason);
      this.isConnected = false;
      this.emit('disconnected', { reason });
      this.handleReconnect(token);
    });

    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.handleReconnect(token);
    });

    this.socket.on('receive-message', (data) => {
      this.emit('message', data);
    });

    this.socket.on('user-typing', (data) => {
      this.emit('typing', data);
    });

    this.socket.on('user-stop-typing', (data) => {
      this.emit('stop-typing', data);
    });

    this.socket.on('driver-location-update', (data) => {
      this.emit('driver-location', data);
    });

    this.socket.on('order-status-update', (data) => {
      this.emit('order-status', data);
    });

    this.socket.on('new-order', (data) => {
      this.emit('new-order', data);
    });
  }

  handleReconnect(token) {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    setTimeout(() => {
      this.reconnectAttempts++;
      if (this.userID) {
        const token = localStorage.getItem('token');
        this.connect(token, this.userID);
      }
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.isConnected = false;
    }
  }

  joinRoom(roomID) {
    if (!this.socket?.connected) return;
    
    if (!this.activeRooms.includes(roomID)) {
      if (this.activeRooms.length >= 3) {
        const removedRoom = this.activeRooms.shift();
        this.socket.emit('leave-room', { roomId: removedRoom });
      }
      this.activeRooms.push(roomID);
      this.socket.emit('join-room', { roomId: roomID });
    }
  }

  leaveRoom(roomID) {
    if (!this.socket?.connected) return;
    
    const index = this.activeRooms.indexOf(roomID);
    if (index > -1) {
      this.activeRooms.splice(index, 1);
      this.socket.emit('leave-room', { roomId: roomID });
    }
  }

  rejoinActiveRooms() {
    if (!this.socket?.connected || this.activeRooms.length === 0) return;
    
    this.activeRooms.forEach(roomID => {
      this.socket.emit('join-room', { roomId: roomID });
    });
  }

  sendMessage(roomID, content) {
    if (!this.socket?.connected) return;
    
    this.socket.emit('send-message', {
      roomId: roomID,
      data: { content },
    });
  }

  sendTyping(roomID) {
    if (!this.socket?.connected) return;
    this.socket.emit('typing', { roomId: roomID });
  }

  stopTyping(roomID) {
    if (!this.socket?.connected) return;
    this.socket.emit('stop-typing', { roomId: roomID });
  }

  joinOrderTracking(orderID) {
    if (!this.socket?.connected) return;
    this.socket.emit('join-order-tracking', { orderId: orderID });
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index > -1) {
      callbacks.splice(index, 1);
    }
  }

  emit(event, data) {
    if (!this.listeners.has(event)) return;
    this.listeners.get(event).forEach(callback => callback(data));
  }

  getActiveRooms() {
    return this.activeRooms;
  }

  getConnectionStatus() {
    return this.isConnected;
  }
}

export const wsService = new WebSocketService();
export default wsService;