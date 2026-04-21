import React, { createContext, useContext, useEffect, useState } from 'react';
import { wsService } from '@/services/websocket';
import { useAuthStore } from '@/store/authStore';

const WebSocketContext = createContext(null);

export const useWebSocket = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocket must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [activeRooms, setActiveRooms] = useState([]);
  const { isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    if (isAuthenticated && user?._id) {
      const token = localStorage.getItem('token');
      if (token) {
        wsService.connect(token, user._id);
      }
    }

    const handleConnected = () => {
      setIsConnected(true);
    };

    const handleDisconnected = ({ reason }) => {
      setIsConnected(false);
    };

    wsService.on('connected', handleConnected);
    wsService.on('disconnected', handleDisconnected);

    return () => {
      wsService.off('connected', handleConnected);
      wsService.off('disconnected', handleDisconnected);
    };
  }, [isAuthenticated, user?._id]);

  useEffect(() => {
    const updateRooms = () => {
      setActiveRooms(wsService.getActiveRooms());
    };

    wsService.on('message', updateRooms);
    wsService.on('connected', updateRooms);

    return () => {
      wsService.off('message', updateRooms);
      wsService.off('connected', updateRooms);
    };
  }, []);

  const joinRoom = (roomID) => {
    wsService.joinRoom(roomID);
    setActiveRooms(wsService.getActiveRooms());
  };

  const leaveRoom = (roomID) => {
    wsService.leaveRoom(roomID);
    setActiveRooms(wsService.getActiveRooms());
  };

  const sendMessage = (roomID, content) => {
    wsService.sendMessage(roomID, content);
  };

  const sendTyping = (roomID) => {
    wsService.sendTyping(roomID);
  };

  const stopTyping = (roomID) => {
    wsService.stopTyping(roomID);
  };

  const joinOrderTracking = (orderID) => {
    wsService.joinOrderTracking(orderID);
  };

  const onMessage = (callback) => {
    wsService.on('message', callback);
    return () => wsService.off('message', callback);
  };

  const onTyping = (callback) => {
    wsService.on('typing', callback);
    return () => wsService.off('typing', callback);
  };

  const onStopTyping = (callback) => {
    wsService.on('stop-typing', callback);
    return () => wsService.off('stop-typing', callback);
  };

  const onNewOrder = (callback) => {
    wsService.on('new-order', callback);
    return () => wsService.off('new-order', callback);
  };

  const onOrderStatus = (callback) => {
    wsService.on('order-status', callback);
    return () => wsService.off('order-status', callback);
  };

  const value = {
    isConnected,
    activeRooms,
    joinRoom,
    leaveRoom,
    sendMessage,
    sendTyping,
    stopTyping,
    joinOrderTracking,
    onMessage,
    onTyping,
    onStopTyping,
    onNewOrder,
    onOrderStatus,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketContext;