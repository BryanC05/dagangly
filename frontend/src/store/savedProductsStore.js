import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import api from '@/utils/api';

export const useSavedProductsStore = create(
  persist(
    (set, get) => ({
      savedProducts: [],
      savedProductIds: new Set(),
      isLoading: false,
      error: null,

      // Fetch all saved products
      fetchSavedProducts: async () => {
        try {
          set({ isLoading: true, error: null });
          const response = await api.get('/users/saved-products');
          const products = response.data;
          const ids = new Set(products.map(p => p._id));
          set({ 
            savedProducts: products, 
            savedProductIds: ids,
            isLoading: false 
          });
          return products;
        } catch (error) {
          set({ 
            error: error.response?.data?.message || 'Failed to fetch saved products',
            isLoading: false 
          });
          return [];
        }
      },

      // Save a product
      saveProduct: async (productId) => {
        try {
          set({ isLoading: true, error: null });
          await api.post(`/users/saved-products/${productId}`);
          
          // Refresh saved products list
          await get().fetchSavedProducts();
          set({ isLoading: false });
          return true;
        } catch (error) {
          set({ 
            error: error.response?.data?.message || 'Failed to save product',
            isLoading: false 
          });
          return false;
        }
      },

      // Unsave a product
      unsaveProduct: async (productId) => {
        try {
          set({ isLoading: true, error: null });
          await api.delete(`/users/saved-products/${productId}`);
          
          // Update local state
          const currentIds = get().savedProductIds;
          currentIds.delete(productId);
          
          const currentProducts = get().savedProducts;
          const updatedProducts = currentProducts.filter(p => p._id !== productId);
          
          set({ 
            savedProducts: updatedProducts,
            savedProductIds: currentIds,
            isLoading: false 
          });
          return true;
        } catch (error) {
          set({ 
            error: error.response?.data?.message || 'Failed to unsave product',
            isLoading: false 
          });
          return false;
        }
      },

      // Toggle save/unsave
      toggleSaveProduct: async (productId) => {
        const isSaved = get().savedProductIds.has(productId);
        if (isSaved) {
          return await get().unsaveProduct(productId);
        } else {
          return await get().saveProduct(productId);
        }
      },

      // Check if product is saved (optimistic)
      isProductSaved: (productId) => {
        return get().savedProductIds.has(productId);
      },

      // Clear saved products (on logout)
      clearSavedProducts: () => {
        set({ 
          savedProducts: [], 
          savedProductIds: new Set(),
          error: null 
        });
      }
    }),
    {
      name: 'saved-products-storage',
      partialize: (state) => ({ 
        savedProductIds: Array.from(state.savedProductIds) 
      }),
      onRehydrateStorage: () => (state) => {
        // Convert array back to Set after rehydration
        if (state && state.savedProductIds) {
          state.savedProductIds = new Set(state.savedProductIds);
        }
      }
    }
  )
);