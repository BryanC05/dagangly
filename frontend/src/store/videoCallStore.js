import { create } from 'zustand';
import api from '../utils/api';

export const useVideoCallStore = create((set) => ({
  rooms: [],
  currentRoom: null,
  upcomingCalls: [],
  loading: false,
  error: null,

  createRoom: async (participantId, scheduledTime, duration) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/video-call/room', {
        participantId,
        scheduledTime,
        duration,
      });
      set((state) => ({
        rooms: [res.data.room, ...state.rooms],
        loading: false,
      }));
      return { success: true, room: res.data };
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to create room', loading: false });
      return { success: false, error: err.response?.data?.error };
    }
  },

  fetchRooms: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/video-call/rooms');
      set({ rooms: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchRoom: async (roomId) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/video-call/room/${roomId}`);
      set({ currentRoom: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchUpcomingCalls: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/video-call/upcoming');
      set({ upcomingCalls: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  updateRoomStatus: async (roomId, status) => {
    try {
      await api.put(`/video-call/room/${roomId}/status`, { status });
      set((state) => ({
        rooms: state.rooms.map((r) => (r.roomId === roomId ? { ...r, status } : r)),
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  endRoom: async (roomId) => {
    try {
      await api.post(`/video-call/room/${roomId}/end`);
      set((state) => ({
        rooms: state.rooms.map((r) => (r.roomId === roomId ? { ...r, status: 'ended' } : r)),
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },
}));
