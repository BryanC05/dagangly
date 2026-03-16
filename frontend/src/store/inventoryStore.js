import { create } from 'zustand';
import api from '../utils/api';

export const useInventoryStore = create((set) => ({
  inventory: [],
  lowStock: [],
  loading: false,
  error: null,

  fetchInventory: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/products/my-products');
      set({ inventory: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchLowStock: async (threshold = 10) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/products/low-stock?threshold=${threshold}`);
      set({ lowStock: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  updateStock: async (productId, quantity) => {
    set({ loading: true, error: null });
    try {
      const res = await api.put(`/products/${productId}`, { stock: quantity });
      set((state) => ({
        inventory: state.inventory.map((p) =>
          p._id === productId ? { ...p, stock: quantity } : p
        ),
        loading: false,
      }));
      return { success: true, data: res.data };
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to update stock', loading: false });
      return { success: false, error: err.response?.data?.error };
    }
  },

  adjustStock: async (productId, adjustment, reason) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post(`/products/${productId}/adjust-stock`, {
        adjustment,
        reason,
      });
      const newStock = res.data.newStock;
      set((state) => ({
        inventory: state.inventory.map((p) =>
          p._id === productId ? { ...p, stock: newStock } : p
        ),
        loading: false,
      }));
      return { success: true, data: res.data };
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to adjust stock', loading: false });
      return { success: false, error: err.response?.data?.error };
    }
  },
}));
