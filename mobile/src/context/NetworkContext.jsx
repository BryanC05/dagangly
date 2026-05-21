import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import NetInfo from "@react-native-community/netinfo";
import { localStore } from "../store/localStore";
import { offlineQueue, QUEUE_STATUS } from "../store/offlineQueue";
import { OFFLINE_TESTING_MODE } from "../config";

const NetworkContext = createContext(null);

export const NETWORK_STATES = {
  UNKNOWN: "unknown",
  NONE: "none",
  WIFI: "wifi",
  CELLULAR: "cellular",
  BLUETOOTH: "bluetooth",
  ETHERNET: "ethernet",
  WIMAX: "wimax",
  VPN: "vpn",
};

export const CONNECTIVITY_STATES = {
  CHECKING: "checking",
  CONNECTED: "connected",
  DISCONNECTED: "disconnected",
};

export function NetworkProvider({ children }) {
  const [isConnected, setIsConnected] = useState(!OFFLINE_TESTING_MODE);
  const [isInternetReachable, setIsInternetReachable] = useState(!OFFLINE_TESTING_MODE);
  const [connectionType, setConnectionType] = useState(NETWORK_STATES.WIFI);
  const [connectionSubtype, setConnectionSubtype] = useState(null);
  const [isWifiEnabled, setIsWifiEnabled] = useState(true);
  const [isCellularEnabled, setIsCellularEnabled] = useState(true);
  const [lastOnlineAt, setLastOnlineAt] = useState(Date.now());
  const [isInitialized, setIsInitialized] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  
  const syncInProgressRef = useRef(false);
  const retryTimeoutRef = useRef(null);

  const updatePendingCount = useCallback(async function() {
    try {
      const count = await offlineQueue.getPendingCount();
      setPendingCount(count);
      await localStore.setPendingSyncCount(count);
    } catch (error) {
      console.error("[NetworkContext] Failed to update pending count:", error);
    }
  }, []);

  const handleConnectivityChange = useCallback(async function(state) {
    // In offline testing mode, always report as connected
    if (OFFLINE_TESTING_MODE) {
      return;
    }
    
    const wasConnected = isConnected;
    const newIsConnected = state.isConnected || false;
    const newIsInternetReachable = state.isInternetReachable !== false;
    const newConnectionType = state.type || NETWORK_STATES.UNKNOWN;

    setIsConnected(newIsConnected);
    setIsInternetReachable(newIsInternetReachable);
    setConnectionType(newConnectionType);
    setConnectionSubtype(state.details && state.details.isConnectionExpensive ? "expensive" : null);
    setIsWifiEnabled(state.isWifiEnabled !== false);
    setIsCellularEnabled(state.isCellularEnabled !== false);

    if (newIsConnected && newIsInternetReachable) {
      setLastOnlineAt(Date.now());
      
      if (wasConnected !== newIsConnected) {
        console.log("[NetworkContext] Connection restored, processing queue...");
        triggerSync();
      }
    } else {
      console.log("[NetworkContext] Connection lost");
    }

    await updatePendingCount();
  }, [isConnected, updatePendingCount]);

  const triggerSync = useCallback(async function() {
    if (syncInProgressRef.current) {
      console.log("[NetworkContext] Sync already in progress");
      return;
    }

    syncInProgressRef.current = true;

    try {
      const pendingItems = await offlineQueue.getPendingItems();
      
      if (pendingItems.length === 0) {
        console.log("[NetworkContext] No pending items to sync");
        return;
      }

      console.log("[NetworkContext] Syncing " + pendingItems.length + " items...");

      for (const item of pendingItems) {
        try {
          await offlineQueue.updateItemStatus(item.id, QUEUE_STATUS.PROCESSING);
          
          const success = await processQueueItem(item);
          
          if (success) {
            await offlineQueue.removeItem(item.id);
            console.log("[NetworkContext] Synced item " + item.id);
          } else {
            await offlineQueue.incrementRetry(item.id);
          }
        } catch (error) {
          console.error("[NetworkContext] Failed to sync item " + item.id + ":", error);
          await offlineQueue.incrementRetry(item.id);
        }
      }

      await updatePendingCount();
    } finally {
      syncInProgressRef.current = false;
    }
  }, [updatePendingCount]);

  async function processQueueItem(item) {
    return true;
  }

  useEffect(function() {
    const initialize = async function() {
      try {
        await offlineQueue.initialize();
        await updatePendingCount();

        // Skip NetInfo in offline testing mode
        if (!OFFLINE_TESTING_MODE) {
          const subscription = NetInfo.addEventListener(handleConnectivityChange);
          
          const state = await NetInfo.fetch();
          await handleConnectivityChange(state);

          setIsInitialized(true);

          return function() {
            subscription();
            if (retryTimeoutRef.current) {
              clearTimeout(retryTimeoutRef.current);
            }
          };
        } else {
          setIsInitialized(true);
        }
      } catch (error) {
        console.error("[NetworkContext] Initialization error:", error);
        setIsInitialized(true);
      }
    };

    initialize();
  }, [handleConnectivityChange, updatePendingCount]);

  useEffect(function() {
    const removeListener = offlineQueue.addListener(updatePendingCount);
    return removeListener;
  }, [updatePendingCount]);

  const manualSync = useCallback(async function() {
    if (isConnected && isInternetReachable) {
      await triggerSync();
      return true;
    }
    return false;
  }, [isConnected, isInternetReachable, triggerSync]);

  const retryFailed = useCallback(async function() {
    const failedItems = await offlineQueue.getFailedItems();
    for (const item of failedItems) {
      await offlineQueue.updateItemStatus(item.id, QUEUE_STATUS.PENDING);
    }
    await triggerSync();
  }, [triggerSync]);

  const clearFailedItems = useCallback(async function() {
    const cleared = await offlineQueue.clearFailed();
    await updatePendingCount();
    return cleared;
  }, [updatePendingCount]);

  const value = {
    isConnected,
    isInternetReachable,
    isOffline: !isConnected || !isInternetReachable,
    connectionType,
    connectionSubtype,
    isWifiEnabled,
    isCellularEnabled,
    lastOnlineAt,
    isInitialized,
    pendingCount,
    manualSync,
    retryFailed,
    clearFailedItems,
    updatePendingCount,
    triggerSync,
  };

  return React.createElement(NetworkContext.Provider, { value: value }, children);
}

export function useNetwork() {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error("useNetwork must be used within a NetworkProvider");
  }
  return context;
}

export default NetworkContext;
