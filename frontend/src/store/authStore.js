import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,

      setAuth: (user, token) => {
        set({ user, token, isAuthenticated: true });
        localStorage.setItem('token', token);
      },

      setUser: (user) => {
        set({ user });
      },

      logout: () => {
        set({ user: null, token: null, isAuthenticated: false });
        localStorage.removeItem('token');
        // Clear saved products from localStorage
        localStorage.removeItem('saved-products-storage');
      },

      initializeAuth: () => {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            const base64Url = token.split('.')[1];
            const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
            const jsonPayload = decodeURIComponent(
              atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
            );
            const payload = JSON.parse(jsonPayload);

            if (payload.exp * 1000 > Date.now()) {
              set({ token, isAuthenticated: true });
            } else {
              localStorage.removeItem('token');
            }
          } catch {
            localStorage.removeItem('token');
          }
        }
      },
    }),
    {
      name: 'auth-storage',
    }
  )
);

export const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],
      sellerId: null,

      addToCart: (product, quantity = 1) => {
        const { items, sellerId } = get();

        if (sellerId && sellerId !== product.seller._id) {
          if (!confirm('Adding this item will clear your current cart. Continue?')) {
            return;
          }
        }

        const existingItem = items.find(item => item.product._id === product._id);

        if (existingItem) {
          set({
            items: items.map(item =>
              item.product._id === product._id
                ? { ...item, quantity: item.quantity + quantity }
                : item
            ),
            sellerId: product.seller._id,
          });
        } else {
          set({
            items: [...items, { product, quantity }],
            sellerId: product.seller._id,
          });
        }
      },

      removeFromCart: (productId) => {
        const { items } = get();
        const newItems = items.filter(item => item.product._id !== productId);
        set({
          items: newItems,
          sellerId: newItems.length > 0 ? get().sellerId : null,
        });
      },

      updateQuantity: (productId, quantity) => {
        const { items } = get();
        if (quantity <= 0) {
          get().removeFromCart(productId);
          return;
        }
        set({
          items: items.map(item =>
            item.product._id === productId
              ? { ...item, quantity }
              : item
          ),
        });
      },

      clearCart: () => {
        set({ items: [], sellerId: null });
      },

      getTotalItems: () => {
        return get().items.reduce((total, item) => total + item.quantity, 0);
      },

      getTotalPrice: () => {
        return get().items.reduce((total, item) => total + (item.product.price * item.quantity), 0);
      },
    }),
    {
      name: 'cart-storage',
    }
  )
);