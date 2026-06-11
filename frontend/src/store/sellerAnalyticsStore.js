import { create } from 'zustand';
import api from '../utils/api';

const DEFAULT_SELLER_EMAIL = 'rani.summarecon@marketplace.test';

export const useSellerAnalyticsStore = create((set) => ({
  analytics: null,
  sales: null,
  customers: null,
  products: null,
  loading: false,
  error: null,
  useMockData: false,
  mockSellerEmail: DEFAULT_SELLER_EMAIL,

  fetchSellerAnalytics: async (period = '30', sellerEmail = DEFAULT_SELLER_EMAIL) => {
    set({ loading: true, error: null });
    
    // Get current API URL to debug
    import('@/config').then(({ getApiUrl }) => {
      console.log('Current API URL:', getApiUrl());
    });
    
    try {
      const params = sellerEmail ? `?period=${period}&email=${encodeURIComponent(sellerEmail)}` : `?period=${period}`;
      console.log('Calling API: /analytics/seller' + params);
      const res = await api.get(`/analytics/seller${params}`);
      console.log('API response:', res.data);
      set({ analytics: res.data, loading: false, useMockData: false });
    } catch (err) {
      console.error('Failed to fetch seller analytics:', err.message);
      set({ analytics: null, loading: false, useMockData: false, error: err.message });
    }
  },

  fetchSales: async (period = '30', sellerEmail = DEFAULT_SELLER_EMAIL) => {
    set({ loading: true, error: null });
    
    try {
      const params = sellerEmail ? `?period=${period}&email=${encodeURIComponent(sellerEmail)}` : `?period=${period}`;
      const res = await api.get(`/analytics/sales${params}`);
      set({ sales: res.data, loading: false });
    } catch (err) {
      console.error('Failed to fetch sales analytics:', err.message);
      set({ sales: null, loading: false, useMockData: false, error: err.message });
    }
  },

  fetchCustomers: async (sellerEmail = DEFAULT_SELLER_EMAIL) => {
    set({ loading: true, error: null });
    
    try {
      const params = sellerEmail ? `?email=${encodeURIComponent(sellerEmail)}` : '';
      const res = await api.get(`/analytics/customers${params}`);
      set({ customers: res.data, loading: false });
    } catch (err) {
      console.error('Failed to fetch customers:', err);
      set({ customers: null, loading: false, error: err.message });
    }
  },

  fetchProductPerformance: async (sellerEmail = DEFAULT_SELLER_EMAIL) => {
    set({ loading: true, error: null });
    
    try {
      const params = sellerEmail ? `?email=${encodeURIComponent(sellerEmail)}` : '';
      const res = await api.get(`/analytics/products${params}`);
      set({ products: res.data, loading: false });
    } catch (err) {
      console.error('Failed to fetch product performance:', err);
      set({ products: null, loading: false, error: err.message });
    }
  }
}));
