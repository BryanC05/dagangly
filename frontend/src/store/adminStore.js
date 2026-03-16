import { create } from 'zustand';
import api from '../utils/api';

export const useAdminStore = create((set) => ({
  stats: null,
  users: [],
  products: [],
  orders: [],
  disputes: [],
  revenue: null,
  loading: false,
  error: null,
  pagination: { page: 1, limit: 20, total: 0 },

  fetchStats: async () => {
    set({ loading: true });
    try {
      const res = await api.get('/admin/dashboard');
      set({ stats: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchUsers: async (page = 1, role, search) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (role) params.append('role', role);
      if (search) params.append('search', search);
      const res = await api.get(`/admin/users?${params}`);
      set({
        users: res.data.users,
        pagination: { page: res.data.page, limit: res.data.limit, total: res.data.total },
        loading: false,
      });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchProducts: async (page = 1, status, search) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (status) params.append('status', status);
      if (search) params.append('search', search);
      const res = await api.get(`/admin/products?${params}`);
      set({
        products: res.data.products,
        pagination: { page: res.data.page, limit: res.data.limit, total: res.data.total },
        loading: false,
      });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchOrders: async (page = 1, status) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (status) params.append('status', status);
      const res = await api.get(`/admin/orders?${params}`);
      set({
        orders: res.data.orders,
        pagination: { page: res.data.page, limit: res.data.limit, total: res.data.total },
        loading: false,
      });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchDisputes: async (page = 1, status) => {
    set({ loading: true });
    try {
      const params = new URLSearchParams({ page, limit: 20 });
      if (status) params.append('status', status);
      const res = await api.get(`/admin/disputes?${params}`);
      set({
        disputes: res.data.disputes,
        pagination: { page: res.data.page, limit: res.data.limit, total: res.data.total },
        loading: false,
      });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchRevenue: async (period = 'monthly') => {
    set({ loading: true });
    try {
      const res = await api.get(`/admin/revenue?period=${period}`);
      set({ revenue: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  updateUserRole: async (userId, role) => {
    try {
      await api.put(`/admin/users/${userId}/role`, { role });
      set((state) => ({
        users: state.users.map((u) => (u._id === userId ? { ...u, role } : u)),
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  banUser: async (userId, banned, reason) => {
    try {
      await api.post(`/admin/users/${userId}/ban`, { banned, reason });
      set((state) => ({
        users: state.users.map((u) => (u._id === userId ? { ...u, isBanned: banned } : u)),
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  approveProduct: async (productId) => {
    try {
      await api.post(`/admin/products/${productId}/approve`);
      set((state) => ({
        products: state.products.map((p) => (p._id === productId ? { ...p, status: 'active' } : p)),
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  rejectProduct: async (productId, reason) => {
    try {
      await api.post(`/admin/products/${productId}/reject`, { reason });
      set((state) => ({
        products: state.products.map((p) => (p._id === productId ? { ...p, status: 'rejected' } : p)),
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  deleteProduct: async (productId) => {
    try {
      await api.delete(`/admin/products/${productId}`);
      set((state) => ({
        products: state.products.filter((p) => p._id !== productId),
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  updateOrderStatus: async (orderId, status) => {
    try {
      await api.put(`/admin/orders/${orderId}/status`, { status });
      set((state) => ({
        orders: state.orders.map((o) => (o._id === orderId ? { ...o, status } : o)),
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },

  resolveDispute: async (disputeId, resolution, action) => {
    try {
      await api.put(`/admin/disputes/${disputeId}/resolve`, { resolution, action });
      set((state) => ({
        disputes: state.disputes.map((d) => (d._id === disputeId ? { ...d, status: 'resolved' } : d)),
      }));
    } catch (err) {
      set({ error: err.message });
    }
  },
}));
