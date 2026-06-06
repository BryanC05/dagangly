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
    this.token = null;
  }

  connect(token, userID) {
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.userID = userID;
    this.token = token;
    const backendUrl = getBackendUrl();
    // Replaces http:// with ws:// and https:// with wss://
    const wsUrl = backendUrl 
      ? `${backendUrl.replace(/^http/, 'ws')}/ws?token=${token}` 
      : `ws://localhost:5000/ws?token=${token}`;

    console.log('Connecting to WebSocket:', wsUrl.replace(token, '***'));

    try {
      this.socket = new WebSocket(wsUrl);

      this.socket.onopen = () => {
        console.log('WebSocket connected');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.reconnectDelay = 1000;
        this.emit('connected', {});
        this.rejoinActiveRooms();
      };

      this.socket.onclose = (event) => {
        console.log('WebSocket disconnected:', event.reason);
        this.isConnected = false;
        this.emit('disconnected', { reason: event.reason });
        
        // Don't reconnect if it was a clean close
        if (!event.wasClean) {
          this.handleReconnect();
        }
      };

      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        // Onerror is usually followed by onclose
      };

      this.socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          this.handleIncomingMessage(message);
        } catch (err) {
          console.error('Failed to parse WebSocket message:', err);
        }
      };
    } catch (err) {
      console.error('Failed to create WebSocket connection:', err);
      this.handleReconnect();
    }
  }

  handleIncomingMessage(message) {
    const { type, data, roomId } = message;

    switch (type) {
      case 'receive-message':
      case 'message':
        this.emit('message', data);
        break;
      case 'user-typing':
      case 'typing':
        this.emit('typing', { ...data, roomId });
        break;
      case 'user-stop-typing':
      case 'stop-typing':
        this.emit('stop-typing', { ...data, roomId });
        break;
      case 'driver-location-update':
      case 'driver-location':
        this.emit('driver-location', data);
        break;
      case 'order-status-update':
      case 'order-status':
        this.emit('order-status', data);
        break;
      case 'new-order':
        this.emit('new-order', data);
        break;
      case 'error':
        console.error('Server WebSocket error:', data);
        break;
      default:
        // Try generic emit for other types
        this.emit(type, data);
    }
  }

  handleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('Max reconnection attempts reached');
      return;
    }

    const delay = this.reconnectDelay * Math.pow(2, this.reconnectAttempts);
    console.log(`Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts + 1})`);

    setTimeout(() => {
      this.reconnectAttempts++;
      if (this.token && this.userID) {
        this.connect(this.token, this.userID);
      }
    }, delay);
  }

  disconnect() {
    if (this.socket) {
      this.socket.close(1000, 'User logged out');
      this.socket = null;
      this.isConnected = false;
    }
  }

  send(type, data) {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send message: WebSocket not connected');
      return;
    }

    const payload = JSON.stringify({ type, ...data });
    this.socket.send(payload);
  }

  joinRoom(roomID) {
    if (!this.isConnected) {
      // Store for later if not connected
      if (!this.activeRooms.includes(roomID)) {
        this.activeRooms.push(roomID);
      }
      return;
    }
    
    if (!this.activeRooms.includes(roomID)) {
      if (this.activeRooms.length >= 3) {
        const removedRoom = this.activeRooms.shift();
        this.send('leave-room', { roomId: removedRoom });
      }
      this.activeRooms.push(roomID);
      this.send('join-room', { roomId: roomID });
    }
  }

  leaveRoom(roomID) {
    const index = this.activeRooms.indexOf(roomID);
    if (index > -1) {
      this.activeRooms.splice(index, 1);
    }

    if (this.isConnected) {
      this.send('leave-room', { roomId: roomID });
    }
  }

  rejoinActiveRooms() {
    if (!this.isConnected || this.activeRooms.length === 0) return;
    
    this.activeRooms.forEach(roomID => {
      this.send('join-room', { roomId: roomID });
    });
  }

  sendMessage(roomID, content) {
    this.send('send-message', {
      roomId: roomID,
      data: { content },
    });
  }

  sendTyping(roomID) {
    this.send('typing', { roomId: roomID });
  }

  stopTyping(roomID) {
    this.send('stop-typing', { roomId: roomID });
  }

  joinOrderTracking(orderID) {
    this.send('join-order-tracking', { orderId: orderID });
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
