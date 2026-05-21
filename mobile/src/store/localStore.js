import AsyncStorage from "@react-native-async-storage/async-storage";

const STORAGE_KEYS = {
  AUTH_TOKEN: "auth_token",
  USER_PROFILE: "user_profile",
  LAST_PRODUCTS_SYNC: "last_products_sync",
  LAST_ORDERS_SYNC: "last_orders_sync",
  LAST_BUSINESSES_SYNC: "last_businesses_sync",
  APP_SETTINGS: "app_settings",
  CACHED_PRODUCTS: "cached_products",
  CACHED_CATEGORIES: "cached_categories",
  PENDING_SYNC_COUNT: "pending_sync_count",
};

function createLocalStore() {
  async function setItem(key, value) {
    try {
      const jsonValue = JSON.stringify(value);
      await AsyncStorage.setItem(key, jsonValue);
      return true;
    } catch (error) {
      console.error("LocalStore setItem error:", error);
      return false;
    }
  }

  async function getItem(key) {
    try {
      const jsonValue = await AsyncStorage.getItem(key);
      return jsonValue != null ? JSON.parse(jsonValue) : null;
    } catch (error) {
      console.error("LocalStore getItem error:", error);
      return null;
    }
  }

  async function removeItem(key) {
    try {
      await AsyncStorage.removeItem(key);
      return true;
    } catch (error) {
      console.error("LocalStore removeItem error:", error);
      return false;
    }
  }

  async function clear() {
    try {
      const keys = Object.values(STORAGE_KEYS);
      await AsyncStorage.multiRemove(keys);
      return true;
    } catch (error) {
      console.error("LocalStore clear error:", error);
      return false;
    }
  }

  async function getAllKeys() {
    try {
      return await AsyncStorage.getAllKeys();
    } catch (error) {
      console.error("LocalStore getAllKeys error:", error);
      return [];
    }
  }

  async function setAuthToken(token) {
    return setItem(STORAGE_KEYS.AUTH_TOKEN, token);
  }

  async function getAuthToken() {
    return getItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  async function removeAuthToken() {
    return removeItem(STORAGE_KEYS.AUTH_TOKEN);
  }

  async function setUserProfile(profile) {
    return setItem(STORAGE_KEYS.USER_PROFILE, profile);
  }

  async function getUserProfile() {
    return getItem(STORAGE_KEYS.USER_PROFILE);
  }

  async function removeUserProfile() {
    return removeItem(STORAGE_KEYS.USER_PROFILE);
  }

  async function setLastProductsSync(timestamp) {
    return setItem(STORAGE_KEYS.LAST_PRODUCTS_SYNC, timestamp);
  }

  async function getLastProductsSync() {
    return getItem(STORAGE_KEYS.LAST_PRODUCTS_SYNC);
  }

  async function setLastOrdersSync(timestamp) {
    return setItem(STORAGE_KEYS.LAST_ORDERS_SYNC, timestamp);
  }

  async function getLastOrdersSync() {
    return getItem(STORAGE_KEYS.LAST_ORDERS_SYNC);
  }

  async function setLastBusinessesSync(timestamp) {
    return setItem(STORAGE_KEYS.LAST_BUSINESSES_SYNC, timestamp);
  }

  async function getLastBusinessesSync() {
    return getItem(STORAGE_KEYS.LAST_BUSINESSES_SYNC);
  }

  async function setAppSettings(settings) {
    return setItem(STORAGE_KEYS.APP_SETTINGS, settings);
  }

  async function getAppSettings() {
    return getItem(STORAGE_KEYS.APP_SETTINGS);
  }

  async function setCachedProducts(products) {
    return setItem(STORAGE_KEYS.CACHED_PRODUCTS, products);
  }

  async function getCachedProducts() {
    return getItem(STORAGE_KEYS.CACHED_PRODUCTS);
  }

  async function setCachedCategories(categories) {
    return setItem(STORAGE_KEYS.CACHED_CATEGORIES, categories);
  }

  async function getCachedCategories() {
    return getItem(STORAGE_KEYS.CACHED_CATEGORIES);
  }

  async function setPendingSyncCount(count) {
    return setItem(STORAGE_KEYS.PENDING_SYNC_COUNT, count);
  }

  async function getPendingSyncCount() {
    const count = await getItem(STORAGE_KEYS.PENDING_SYNC_COUNT);
    return count || 0;
  }

  async function isCacheExpired(key, maxAgeMs) {
    maxAgeMs = maxAgeMs || (24 * 60 * 60 * 1000);
    const timestamp = await getItem(key);
    if (!timestamp) return true;
    return Date.now() - timestamp > maxAgeMs;
  }

  return {
    setItem,
    getItem,
    removeItem,
    clear,
    getAllKeys,
    setAuthToken,
    getAuthToken,
    removeAuthToken,
    setUserProfile,
    getUserProfile,
    removeUserProfile,
    setLastProductsSync,
    getLastProductsSync,
    setLastOrdersSync,
    getLastOrdersSync,
    setLastBusinessesSync,
    getLastBusinessesSync,
    setAppSettings,
    getAppSettings,
    setCachedProducts,
    getCachedProducts,
    setCachedCategories,
    getCachedCategories,
    setPendingSyncCount,
    getPendingSyncCount,
    isCacheExpired,
  };
}

export const localStore = createLocalStore();
export { STORAGE_KEYS };
export default localStore;
