import { create } from 'zustand';
import api from '../utils/api';

export const useSellerAnalyticsStore = create((set) => ({
  analytics: null,
  sales: [],
  customers: [],
  products: [],
  loading: false,
  error: null,

  fetchSellerAnalytics: async (period = '30') => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/analytics/seller?period=${period}`);
      set({ analytics: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchSales: async (period = '30') => {
    set({ loading: true });
    try {
      const res = await api.get(`/analytics/sales?period=${period}`);
      set({ sales: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchCustomers: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/analytics/customers');
      set({ customers: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchProductPerformance: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/analytics/products');
      set({ products: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },
}));
