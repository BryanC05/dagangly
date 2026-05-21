import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";

const QUEUE_KEY = "offline_queue";
const MAX_RETRIES = 3;

export const QUEUE_TYPES = {
  ORDER: "order",
  PRODUCT: "product",
  MESSAGE: "message",
  REVIEW: "review",
  CART: "cart",
};

export const QUEUE_ACTIONS = {
  CREATE: "create",
  UPDATE: "update",
  DELETE: "delete",
};

export const QUEUE_STATUS = {
  PENDING: "pending",
  PROCESSING: "processing",
  FAILED: "failed",
  COMPLETED: "completed",
};

function createOfflineQueue() {
  let queue = [];
  let isProcessing = false;
  let listeners = [];

  async function initialize() {
    try {
      const stored = await AsyncStorage.getItem(QUEUE_KEY);
      queue = stored ? JSON.parse(stored) : [];
      console.log("[OfflineQueue] Initialized with " + queue.length + " items");
      return queue;
    } catch (error) {
      console.error("[OfflineQueue] Failed to initialize:", error);
      queue = [];
      return [];
    }
  }

  async function persist() {
    try {
      await AsyncStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
    } catch (error) {
      console.error("[OfflineQueue] Failed to persist:", error);
    }
  }

  async function addItem(type, action, payload) {
    const item = {
      id: uuidv4(),
      type,
      action,
      payload,
      createdAt: Date.now(),
      retryCount: 0,
      status: QUEUE_STATUS.PENDING,
      error: null,
    };

    queue.push(item);
    await persist();
    notifyListeners();
    
    console.log("[OfflineQueue] Added item " + item.id + " (" + type + ":" + action + ")");
    return item;
  }

  async function removeItem(id) {
    const index = queue.findIndex(function(item) { return item.id === id; });
    if (index !== -1) {
      queue.splice(index, 1);
      await persist();
      notifyListeners();
      return true;
    }
    return false;
  }

  async function getItem(id) {
    return queue.find(function(item) { return item.id === id; });
  }

  async function getAllItems() {
    return [].concat(queue);
  }

  async function getItemsByType(type) {
    return queue.filter(function(item) { return item.type === type; });
  }

  async function getPendingItems() {
    return queue.filter(function(item) { return item.status === QUEUE_STATUS.PENDING; });
  }

  async function getFailedItems() {
    return queue.filter(function(item) { return item.status === QUEUE_STATUS.FAILED; });
  }

  async function getItemCount() {
    return queue.length;
  }

  async function getPendingCount() {
    return queue.filter(function(item) { return item.status === QUEUE_STATUS.PENDING; }).length;
  }

  async function updateItemStatus(id, status, error) {
    const item = queue.find(function(q) { return q.id === id; });
    if (item) {
      item.status = status;
      if (error) {
        item.error = error;
        item.retryCount = (item.retryCount || 0) + 1;
      }
      await persist();
      notifyListeners();
      return item;
    }
    return null;
  }

  async function incrementRetry(id) {
    const item = queue.find(function(q) { return q.id === id; });
    if (item) {
      item.retryCount = (item.retryCount || 0) + 1;
      if (item.retryCount >= MAX_RETRIES) {
        item.status = QUEUE_STATUS.FAILED;
      } else {
        item.status = QUEUE_STATUS.PENDING;
      }
      await persist();
      notifyListeners();
      return item;
    }
    return null;
  }

  async function clearCompleted() {
    const before = queue.length;
    queue = queue.filter(function(item) { return item.status !== QUEUE_STATUS.COMPLETED; });
    if (queue.length !== before) {
      await persist();
      notifyListeners();
    }
    return before - queue.length;
  }

  async function clearAll() {
    queue = [];
    await persist();
    notifyListeners();
  }

  async function clearFailed() {
    const before = queue.length;
    queue = queue.filter(function(item) { return item.status !== QUEUE_STATUS.FAILED; });
    if (queue.length !== before) {
      await persist();
      notifyListeners();
    }
    return before - queue.length;
  }

  function addListener(callback) {
    listeners.push(callback);
    return function() {
      listeners = listeners.filter(function(cb) { return cb !== callback; });
    };
  }

  function notifyListeners() {
    listeners.forEach(function(callback) {
      try {
        callback(queue);
      } catch (error) {
        console.error("[OfflineQueue] Listener error:", error);
      }
    });
  }

  async function queueOrder(payload) {
    return addItem(QUEUE_TYPES.ORDER, QUEUE_ACTIONS.CREATE, payload);
  }

  async function queueOrderUpdate(orderId, payload) {
    return addItem(QUEUE_TYPES.ORDER, QUEUE_ACTIONS.UPDATE, Object.assign({ id: orderId }, payload));
  }

  async function queueProductCreate(payload) {
    return addItem(QUEUE_TYPES.PRODUCT, QUEUE_ACTIONS.CREATE, payload);
  }

  async function queueProductUpdate(productId, payload) {
    return addItem(QUEUE_TYPES.PRODUCT, QUEUE_ACTIONS.UPDATE, Object.assign({ id: productId }, payload));
  }

  async function queueProductDelete(productId) {
    return addItem(QUEUE_TYPES.PRODUCT, QUEUE_ACTIONS.DELETE, { id: productId });
  }

  async function queueMessage(payload) {
    return addItem(QUEUE_TYPES.MESSAGE, QUEUE_ACTIONS.CREATE, payload);
  }

  async function queueReview(payload) {
    return addItem(QUEUE_TYPES.REVIEW, QUEUE_ACTIONS.CREATE, payload);
  }

  async function getOrdersQueue() {
    return getItemsByType(QUEUE_TYPES.ORDER);
  }

  async function getProductsQueue() {
    return getItemsByType(QUEUE_TYPES.PRODUCT);
  }

  return {
    initialize,
    addItem,
    removeItem,
    getItem,
    getAllItems,
    getItemsByType,
    getPendingItems,
    getFailedItems,
    getItemCount,
    getPendingCount,
    updateItemStatus,
    incrementRetry,
    clearCompleted,
    clearAll,
    clearFailed,
    addListener,
    queueOrder,
    queueOrderUpdate,
    queueProductCreate,
    queueProductUpdate,
    queueProductDelete,
    queueMessage,
    queueReview,
    getOrdersQueue,
    getProductsQueue,
  };
}

export const offlineQueue = createOfflineQueue();
export default offlineQueue;
