import { create } from 'zustand';
import { getApiUrl } from '../config';

const API_URL = getApiUrl();

export const useWishlistStore = create((set, get) => ({
  wishlists: [],
  loading: false,
  error: null,

  fetchWishlists: async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    set({ loading: true, error: null });
    try {
      const res = await fetch(`${API_URL}/wishlists`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        set({ wishlists: data, loading: false });
      } else {
        throw new Error('Failed to fetch wishlists');
      }
    } catch (err) {
      set({ error: err.message, loading: false });
    }
  },

  createWishlist: async (name, isPublic = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const res = await fetch(`${API_URL}/wishlists`, {
        method: 'POST',
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ name, isPublic }),
      });
      if (res.ok) {
        const data = await res.json();
        set((state) => ({ wishlists: [...state.wishlists, data] }));
        return data;
      }
      throw new Error('Failed to create wishlist');
    } catch (err) {
      set({ error: err.message });
      return null;
    }
  },

  deleteWishlist: async (wishlistId) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      const res = await fetch(`${API_URL}/wishlists/${wishlistId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        set((state) => ({ 
          wishlists: state.wishlists.filter(w => w._id !== wishlistId) 
        }));
        return true;
      }
      return false;
    } catch (err) {
      set({ error: err.message });
      return false;
    }
  },

  addToWishlist: async (productId, wishlistId = null, notifyPriceDrop = false) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      let url = `${API_URL}/wishlists/default/items`;
      let method = 'POST';
      
      if (wishlistId) {
        url = `${API_URL}/wishlists/${wishlistId}/items`;
      }
      
      const res = await fetch(url, {
        method,
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ productId, notifyPriceDrop }),
      });
      
      if (res.ok) {
        const data = await res.json();
        await get().fetchWishlists();
        return { success: true, data };
      }
      
      const errorData = await res.json();
      return { success: false, error: errorData.error || 'Failed to add to wishlist' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  removeFromWishlist: async (productId, wishlistId = null) => {
    const token = localStorage.getItem('token');
    if (!token) return;
    
    try {
      let url = `${API_URL}/wishlists/default/items/${productId}`;
      let method = 'DELETE';
      
      if (wishlistId) {
        url = `${API_URL}/wishlists/${wishlistId}/items/${productId}`;
      }
      
      const res = await fetch(url, {
        method,
        headers: { Authorization: `Bearer ${token}` },
      });
      
      if (res.ok) {
        await get().fetchWishlists();
        return true;
      }
      return false;
    } catch (err) {
      set({ error: err.message });
      return false;
    }
  },

  checkProductInWishlists: async (productId) => {
    const token = localStorage.getItem('token');
    if (!token) return { inWishlists: false, wishlistIDs: [] };
    
    try {
      const res = await fetch(`${API_URL}/wishlists/check?productId=${productId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        return await res.json();
      }
      return { inWishlists: false, wishlistIDs: [] };
    } catch (err) {
      return { inWishlists: false, wishlistIDs: [] };
    }
  },

  isProductInWishlist: (productId) => {
    const { wishlists } = get();
    for (const wishlist of wishlists) {
      const found = wishlist.items?.some(
        item => item.productId === productId || item.productId?._id === productId
      );
      if (found) return true;
    }
    return false;
  },

  getWishlistCount: () => {
    const { wishlists } = get();
    return wishlists.reduce((total, wishlist) => total + (wishlist.items?.length || 0), 0);
  },

  clearError: () => set({ error: null }),
}));
