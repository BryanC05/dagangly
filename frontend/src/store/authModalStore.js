import { create } from 'zustand';

export const useAuthModalStore = create((set) => ({
  isOpen: false,
  mode: 'login', // 'login' | 'register'
  redirectTo: null,

  openLogin: (redirectTo = null) => set({ isOpen: true, mode: 'login', redirectTo }),
  openRegister: (redirectTo = null) => set({ isOpen: true, mode: 'register', redirectTo }),
  closeModal: () => set({ isOpen: false, redirectTo: null }),
  switchMode: () => set((state) => ({ 
    mode: state.mode === 'login' ? 'register' : 'login',
    redirectTo: null 
  })),
}));
