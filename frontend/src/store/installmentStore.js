import { create } from 'zustand';
import api from '../utils/api';

export const useInstallmentStore = create((set) => ({
  plans: [],
  currentPlan: null,
  loading: false,
  error: null,

  calculateInstallment: async (amount, tenure, interestRate) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/installments/calculate', {
        amount,
        tenure,
        interestRate,
      });
      set({ loading: false });
      return { success: true, data: res.data };
    } catch (err) {
      set({ error: err.message, loading: false });
      return { success: false, error: err.message };
    }
  },

  createPlan: async (orderId, amount, tenure, interestRate) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/installments/create-plan', {
        orderId,
        amount,
        tenure,
        interestRate,
      });
      set((state) => ({
        plans: [res.data.plan, ...state.plans],
        loading: false,
      }));
      return { success: true, plan: res.data.plan };
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to create plan', loading: false });
      return { success: false, error: err.response?.data?.error };
    }
  },

  fetchMyInstallments: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/installments/my');
      set({ plans: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  fetchPlan: async (planId) => {
    set({ loading: true, error: null });
    try {
      const res = await api.get(`/installments/plan/${planId}`);
      set({ currentPlan: res.data, loading: false });
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  payInstallment: async (planId) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post(`/installments/plan/${planId}/pay`);
      set({ loading: false });
      return { success: true, data: res.data };
    } catch (err) {
      set({ error: err.response?.data?.error || 'Payment failed', loading: false });
      return { success: false, error: err.response?.data?.error };
    }
  },
}));
