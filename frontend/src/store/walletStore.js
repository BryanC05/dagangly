import { create } from 'zustand';
import api from '../utils/api';

export const useWalletStore = create((set, get) => ({
  wallet: null,
  transactions: [],
  loading: false,
  error: null,

  fetchWallet: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/wallet');
      set({ wallet: res.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to fetch wallet', loading: false });
    }
  },

  fetchTransactions: async () => {
    set({ loading: true, error: null });
    try {
      const res = await api.get('/wallet/transactions');
      set({ transactions: res.data, loading: false });
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to fetch transactions', loading: false });
    }
  },

  addFunds: async (amount, paymentId) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/wallet/add-funds', { amount, paymentId });
      set((state) => ({
        wallet: { ...state.wallet, balance: res.data.balance },
        loading: false,
      }));
      return { success: true, balance: res.data.balance };
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to add funds', loading: false });
      return { success: false, error: err.response?.data?.error };
    }
  },

  deductFunds: async (amount, reference, description) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/wallet/deduct', { amount, reference, description });
      set((state) => ({
        wallet: { ...state.wallet, balance: res.data.balance },
        loading: false,
      }));
      return { success: true, balance: res.data.balance };
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to deduct funds', loading: false });
      return { success: false, error: err.response?.data?.error };
    }
  },

  transferToBank: async (amount, bankName, accountNumber, accountHolder) => {
    set({ loading: true, error: null });
    try {
      const res = await api.post('/wallet/transfer-bank', {
        amount,
        bankName,
        accountNumber,
        accountHolder,
      });
      set((state) => ({
        wallet: { ...state.wallet, balance: res.data.balance },
        loading: false,
      }));
      return { success: true, balance: res.data.balance };
    } catch (err) {
      set({ error: err.response?.data?.error || 'Failed to transfer', loading: false });
      return { success: false, error: err.response?.data?.error };
    }
  },
}));
