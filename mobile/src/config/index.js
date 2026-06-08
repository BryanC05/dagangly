import Constants from 'expo-constants';

// EXPO_PUBLIC_API_HOST should be set via environment variable (from .env file)
// For local development, set EXPO_PUBLIC_API_HOST=http://localhost:5000
// Default falls back to production

// ============================================
// OFFLINE TESTING MODE
// Set to true for offline testing without backend
// ============================================
const rawOfflineTesting = process.env.EXPO_PUBLIC_OFFLINE_TESTING || Constants.expoConfig?.extra?.EXPO_PUBLIC_OFFLINE_TESTING;
export const OFFLINE_TESTING_MODE = rawOfflineTesting === "true" || false;
console.log("[Config] Offline Testing Mode:", OFFLINE_TESTING_MODE);

// ============================================
// FIREBASE AUTH MODE
// When true, uses Firebase Auth (signInWithEmailAndPassword)
// instead of JWT-based API auth.
// Set EXPO_PUBLIC_USE_FIREBASE_AUTH=true to enable.
// ============================================
const rawFirebaseAuth = process.env.EXPO_PUBLIC_USE_FIREBASE_AUTH || Constants.expoConfig?.extra?.EXPO_PUBLIC_USE_FIREBASE_AUTH;
export const USE_FIREBASE_AUTH = rawFirebaseAuth === "true" || false;
console.log("[Config] Firebase Auth Mode:", USE_FIREBASE_AUTH);

// ============================================
// API Configuration
// ============================================

// Primary (local development)
const LOCAL_API_HOST = "http://localhost:5000";

// Fallback (production Render)
const RENDER_API_HOST = "https://dagangly-api.onrender.com";

// Get from env or use local by default for development
const RAW_API_HOST = process.env.EXPO_PUBLIC_API_HOST || Constants.expoConfig?.extra?.EXPO_PUBLIC_API_HOST || LOCAL_API_HOST;
const isUsingLocal = RAW_API_HOST.startsWith("http://localhost") || 
                     RAW_API_HOST.includes("10.38.54.13") || 
                     RAW_API_HOST.includes("192.168.") ||
                     RAW_API_HOST.includes("127.0.0.1");

export const API_HOST = RAW_API_HOST.replace(/\/+$/, "");
export const API_URL = `${API_HOST}/api`;
export const SOCKET_URL = API_HOST;

// Fallback configuration
export const FALLBACK_API_HOST = RENDER_API_HOST;
export const FALLBACK_API_URL = `${RENDER_API_HOST}/api`;
export const FALLBACK_SOCKET_URL = RENDER_API_HOST;

export const isLocalApi = () => isUsingLocal;
export { isUsingLocal };

// Get active API URL
export const getActiveApiUrl = () => OFFLINE_TESTING_MODE ? null : API_URL;

// Get fallback API URL
export const getFallbackApiUrl = () => FALLBACK_API_URL;

// ============================================
// Offline Mode Utilities
// ============================================
export const isOfflineMode = () => OFFLINE_TESTING_MODE;

// English categories (default)
export const CATEGORIES_EN = [
  { id: "all", name: "All Categories", icon: "📦" },
  { id: "food", name: "Food & Beverages", icon: "🍜" },
  { id: "handicrafts", name: "Handicrafts", icon: "🎨" },
  { id: "clothing", name: "Fashion & Apparel", icon: "👗" },
  { id: "beauty", name: "Health & Beauty", icon: "🌿" },
  { id: "home", name: "Home & Living", icon: "🏠" },
  { id: "electronics", name: "Electronics", icon: "📱" },
  { id: "agriculture", name: "Agriculture", icon: "🌾" },
];

// Indonesian categories
export const CATEGORIES_ID = [
  { id: "all", name: "Semua Kategori", icon: "📦" },
  { id: "food", name: "Makanan & Minuman", icon: "🍜" },
  { id: "handicrafts", name: "Kerajinan", icon: "🎨" },
  { id: "clothing", name: "Fashion & Pakaian", icon: "👗" },
  { id: "beauty", name: "Kesehatan & Kecantikan", icon: "🌿" },
  { id: "home", name: "Rumah & Kehidupan", icon: "🏠" },
  { id: "electronics", name: "Elektronik", icon: "📱" },
  { id: "agriculture", name: "Pertanian", icon: "🌾" },
];

export const SORT_OPTIONS_EN = [
  { id: "newest", name: "Newest" },
  { id: "price-low", name: "Price: Low to High" },
  { id: "price-high", name: "Price: High to Low" },
  { id: "rating", name: "Highest Rated" },
];

export const SORT_OPTIONS_ID = [
  { id: "newest", name: "Terbaru" },
  { id: "price-low", name: "Harga: Rendah ke Tinggi" },
  { id: "price-high", name: "Harga: Tinggi ke Rendah" },
  { id: "rating", name: "Rating Tertinggi" },
];

// Default exports (for backward compatibility)
export const CATEGORIES = CATEGORIES_EN;
export const SORT_OPTIONS = SORT_OPTIONS_EN;
