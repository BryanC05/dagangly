import { useEffect, useCallback, useRef } from "react";
import { useNetwork } from "../context/NetworkContext";
import { offlineQueue } from "../store/offlineQueue";
import { localDatabase } from "../store/localDatabase";
import { localStore } from "../store/localStore";
import { apiService } from "../services/apiService";
import {
  MOCK_PRODUCTS,
  MOCK_CATEGORIES,
  MOCK_BUSINESSES,
} from "../data/mockData";

const SYNC_INTERVAL = parseInt(process.env.EXPO_PUBLIC_SYNC_INTERVAL || "30000");

export function useOfflineSync() {
  const network = useNetwork();
  const syncIntervalRef = useRef(null);
  const isSyncingRef = useRef(false);

  const isConnected = network.isConnected;
  const isInternetReachable = network.isInternetReachable;
  const isOffline = network.isOffline;
  const pendingCount = network.pendingCount;
  const lastOnlineAt = network.lastOnlineAt;
  const manualSync = network.manualSync;

  const syncProducts = useCallback(async function() {
    try {
      const result = await apiService.getProducts({ forceOnline: true });
      if (result.products && result.products.length > 0) {
        await localDatabase.insertProducts(result.products);
        await localStore.setLastProductsSync(Date.now());
        console.log("[useOfflineSync] Synced " + result.products.length + " products");
        return true;
      }
    } catch (error) {
      console.error("[useOfflineSync] Failed to sync products:", error);
    }
    return false;
  }, []);

  const syncCategories = useCallback(async function() {
    try {
      const result = await apiService.getCategories(true);
      if (result.categories && result.categories.length > 0) {
        await localStore.setCachedCategories(result.categories);
        console.log("[useOfflineSync] Synced categories");
        return true;
      }
    } catch (error) {
      console.error("[useOfflineSync] Failed to sync categories:", error);
    }
    return false;
  }, []);

  const syncOrders = useCallback(async function() {
    try {
      await apiService.syncPendingOrders();
      return true;
    } catch (error) {
      console.error("[useOfflineSync] Failed to sync orders:", error);
      return false;
    }
  }, []);

  const loadMockData = useCallback(async function() {
    try {
      const stats = await localDatabase.getStats();
      if (stats.productsCount === 0) {
        await localDatabase.insertProducts(MOCK_PRODUCTS);
        console.log("[useOfflineSync] Loaded mock products");
      }
      if (stats.businessesCount === 0) {
        for (let i = 0; i < MOCK_BUSINESSES.length; i++) {
          await localDatabase.insertBusiness(MOCK_BUSINESSES[i]);
        }
        console.log("[useOfflineSync] Loaded mock businesses");
      }
      return true;
    } catch (error) {
      console.error("[useOfflineSync] Failed to load mock data:", error);
      return false;
    }
  }, []);

  const performSync = useCallback(async function() {
    if (isSyncingRef.current || isOffline) {
      return;
    }

    isSyncingRef.current = true;

    try {
      await Promise.all([
        syncProducts(),
        syncCategories(),
        syncOrders(),
      ]);
    } finally {
      isSyncingRef.current = false;
    }
  }, [isOffline, syncProducts, syncCategories, syncOrders]);

  useEffect(function() {
    if (isConnected && isInternetReachable) {
      performSync();
    }
  }, [isConnected, isInternetReachable, performSync]);

  useEffect(function() {
    syncIntervalRef.current = setInterval(function() {
      if (isConnected && isInternetReachable) {
        performSync();
      }
    }, SYNC_INTERVAL);

    return function() {
      if (syncIntervalRef.current) {
        clearInterval(syncIntervalRef.current);
      }
    };
  }, [isConnected, isInternetReachable, performSync]);

  const preloadOfflineData = useCallback(async function() {
    try {
      await localDatabase.initialize();
      await loadMockData();
    } catch (error) {
      console.error("[useOfflineSync] Failed to preload offline data:", error);
    }
  }, [loadMockData]);

  const getTimeSinceLastOnline = useCallback(function() {
    if (!lastOnlineAt) return null;
    const diff = Date.now() - lastOnlineAt;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (days > 0) return days + "d ago";
    if (hours > 0) return hours + "h ago";
    if (minutes > 0) return minutes + "m ago";
    return "Just now";
  }, [lastOnlineAt]);

  return {
    isOffline: isOffline,
    pendingCount: pendingCount,
    lastOnlineAt: lastOnlineAt,
    getTimeSinceLastOnline: getTimeSinceLastOnline,
    performSync: performSync,
    preloadOfflineData: preloadOfflineData,
    manualSync: manualSync,
  };
}

export default useOfflineSync;
