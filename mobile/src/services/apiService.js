import axios from "axios";
import { API_URL, FALLBACK_API_URL, isLocalApi } from "../config";
import { localStore } from "../store/localStore";
import { localDatabase } from "../store/localDatabase";
import { offlineQueue, QUEUE_TYPES, QUEUE_ACTIONS } from "../store/offlineQueue";
import {
  MOCK_PRODUCTS,
  MOCK_CATEGORIES,
  MOCK_ORDERS,
  getMockProductsByCategory,
  getMockProductById,
  searchMockProducts,
} from "../data/mockData";

const CACHE_DURATION = {
  PRODUCTS: parseInt(process.env.EXPO_PUBLIC_CACHE_DURATION_PRODUCTS || "86400000"),
  BUSINESSES: parseInt(process.env.EXPO_PUBLIC_CACHE_DURATION_BUSINESSES || "604800000"),
  CATEGORIES: parseInt(process.env.EXPO_PUBLIC_CACHE_DURATION_CATEGORIES || "3600000"),
};

function createApiClient(baseURL) {
  const client = axios.create({
    baseURL,
    timeout: 15000,
    headers: {
      "Content-Type": "application/json",
    },
  });

  client.interceptors.request.use(
    async function(config) {
      const token = await localStore.getAuthToken();
      if (token) {
        config.headers.Authorization = "Bearer " + token;
      }
      return config;
    },
    function(error) { return Promise.reject(error); }
  );

  client.interceptors.response.use(
    function(response) { return response; },
    function(error) {
      if (error.code === "ECONNABORTED" || !error.response) {
        error.isNetworkError = true;
      }
      return Promise.reject(error);
    }
  );

  return client;
}

const apiClient = createApiClient(API_URL);
const fallbackClient = createApiClient(FALLBACK_API_URL);

function createApiService() {
  let isInitialized = false;
  let db = null;

  async function initialize() {
    if (isInitialized) return;

    try {
      db = await localDatabase.initialize();
      isInitialized = true;
      console.log("[ApiService] Initialized");
    } catch (error) {
      console.error("[ApiService] Failed to initialize:", error);
    }
  }

  async function getActiveClient() {
    if (isLocalApi()) {
      return apiClient;
    }
    try {
      await apiClient.get("/health");
      return apiClient;
    } catch (error) {
      console.log("[ApiService] Primary API unavailable, using fallback");
      return fallbackClient;
    }
  }

  async function fetchWithFallback(endpoint, options) {
    options = options || {};
    const method = options.method || "GET";
    const data = options.data;
    const useCache = options.useCache !== false;

    try {
      const client = await getActiveClient();
      const response = await client.request({
        url: endpoint,
        method: method,
        data: data,
      });
      return { data: response.data, error: null, source: "api" };
    } catch (error) {
      console.log("[ApiService] API error for " + endpoint + ":", error.message);
      return { data: null, error: error, source: "error" };
    }
  }

  async function getProducts(options) {
    options = options || {};
    const category = options.category;
    const search = options.search;
    const page = options.page || 1;
    const limit = options.limit || 20;
    const forceOnline = options.forceOnline || false;

    await initialize();

    if (!forceOnline) {
      const cachedProducts = await getCachedProducts(category, search);
      if (cachedProducts.length > 0) {
        return { products: cachedProducts, fromCache: true };
      }

      const mockProducts = getMockProducts(category, search);
      if (mockProducts.length > 0) {
        return { products: mockProducts, fromCache: true, isMock: true };
      }
    }

    const result = await fetchWithFallback(
      "/products?page=" + page + "&limit=" + limit + (category && category !== "all" ? "&category=" + category : "") + (search ? "&search=" + encodeURIComponent(search) : ""),
      { useCache: false }
    );

    if (result.data && result.data.products) {
      await cacheProducts(result.data.products);
      return { products: result.data.products, fromCache: false };
    }

    const mockProducts = getMockProducts(category, search);
    return { products: mockProducts, fromCache: true, isMock: true };
  }

  async function getCachedProducts(category, search) {
    if (!db) return [];

    try {
      const products = await db.getProducts({ category: category, search: search });
      return products;
    } catch (error) {
      console.error("[ApiService] Failed to get cached products:", error);
      return [];
    }
  }

  async function cacheProducts(products) {
    if (!db) return;

    try {
      await db.insertProducts(products);
      await localStore.setLastProductsSync(Date.now());
    } catch (error) {
      console.error("[ApiService] Failed to cache products:", error);
    }
  }

  function getMockProducts(category, search) {
    if (search) {
      return searchMockProducts(search);
    }
    return getMockProductsByCategory(category);
  }

  async function getProductById(productId) {
    await initialize();

    const result = await fetchWithFallback("/products/" + productId, { useCache: false });

    if (result.data) {
      return result.data;
    }

    return getMockProductById(productId);
  }

  async function getCategories(forceOnline) {
    await initialize();

    const cached = await localStore.getCachedCategories();
    if (cached && !forceOnline) {
      return { categories: cached, fromCache: true };
    }

    const result = await fetchWithFallback("/categories", { useCache: false });

    if (result.data) {
      const categories = Array.isArray(result.data) ? result.data : (result.data.categories || []);
      await localStore.setCachedCategories(categories);
      return { categories: categories, fromCache: false };
    }

    return { categories: MOCK_CATEGORIES, fromCache: true, isMock: true };
  }

  async function createOrder(orderData) {
    await initialize();

    const localOrderId = "local_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);

    const localOrder = {
      id: localOrderId,
      server_id: null,
      buyer_id: orderData.buyerId || "",
      buyer_name: orderData.buyerName || "",
      seller_id: orderData.sellerId || "",
      seller_name: orderData.sellerName || "",
      products: orderData.products,
      subtotal: orderData.subtotal || 0,
      shipping_fee: orderData.shippingFee || 0,
      discount_amount: orderData.discountAmount || 0,
      total_amount: orderData.totalAmount || 0,
      status: "pending",
      payment_method: orderData.paymentMethod || "COD",
      payment_status: "pending",
      delivery_address: orderData.deliveryAddress,
      notes: orderData.notes || "",
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      sync_status: "pending",
      local_only: true,
    };

    try {
      await db.insertOrder(localOrder);

      const result = await fetchWithFallback("/orders", {
        method: "POST",
        data: orderData,
        useCache: false,
      });

      if (result.data && !result.error) {
        await db.updateOrderSyncStatus(
          localOrderId,
          result.data._id || result.data.id,
          "synced"
        );
        return { order: Object.assign({}, localOrder, result.data), local: false };
      }

      await offlineQueue.queueOrder(Object.assign({}, orderData, { localOrderId: localOrderId }));

      return { order: localOrder, local: true };
    } catch (error) {
      console.error("[ApiService] Failed to create order:", error);

      await offlineQueue.queueOrder(Object.assign({}, orderData, { localOrderId: localOrderId }));

      return { order: localOrder, local: true };
    }
  }

  async function getOrders(buyerId) {
    await initialize();

    const localOrders = await db.getOrders(buyerId);
    const pendingOrders = await db.getPendingOrders();

    const result = await fetchWithFallback(
      buyerId ? "/orders?buyerId=" + buyerId : "/orders",
      { useCache: false }
    );

    if (result.data && result.data.orders) {
      return [].concat(pendingOrders).concat(result.data.orders);
    }

    return [].concat(pendingOrders).concat(localOrders).concat(MOCK_ORDERS);
  }

  async function getOrderById(orderId) {
    await initialize();

    const localOrder = await db.getOrderById(orderId);
    if (localOrder) {
      return localOrder;
    }

    const result = await fetchWithFallback("/orders/" + orderId, { useCache: false });
    return result.data || null;
  }

  async function login(email, password) {
    const result = await fetchWithFallback("/auth/login", {
      method: "POST",
      data: { email: email, password: password },
      useCache: false,
    });

    if (result.data && result.data.token) {
      await localStore.setAuthToken(result.data.token);
      await localStore.setUserProfile(result.data.user);
      return { user: result.data.user, token: result.data.token };
    }

    return { error: result.error };
  }

  async function register(userData) {
    const result = await fetchWithFallback("/auth/register", {
      method: "POST",
      data: userData,
      useCache: false,
    });

    if (result.data && result.data.token) {
      await localStore.setAuthToken(result.data.token);
      await localStore.setUserProfile(result.data.user);
      return { user: result.data.user, token: result.data.token };
    }

    return { error: result.error };
  }

  async function logout() {
    await localStore.removeAuthToken();
    await localStore.removeUserProfile();
    await localDatabase.clearAll();
    await offlineQueue.clearAll();
  }

  async function getCurrentUser() {
    const profile = await localStore.getUserProfile();
    return profile;
  }

  async function syncPendingOrders() {
    const pendingOrders = await db.getPendingOrders();

    for (const order of pendingOrders) {
      try {
        const result = await fetchWithFallback("/orders", {
          method: "POST",
          data: {
            products: order.products,
            deliveryAddress: order.delivery_address,
            notes: order.notes,
            paymentMethod: order.payment_method,
          },
          useCache: false,
        });

        if (result.data && !result.error) {
          await db.updateOrderSyncStatus(
            order.id,
            result.data._id || result.data.id,
            "synced"
          );
        }
      } catch (error) {
        console.error("[ApiService] Failed to sync order " + order.id + ":", error);
      }
    }
  }

  async function preloadData() {
    await initialize();

    try {
      const productsResult = await getProducts({ limit: 100 });
      const categoriesResult = await getCategories(true);

      if (productsResult.products && productsResult.products.length > 0) {
        await cacheProducts(productsResult.products);
      }

      if (categoriesResult.categories && categoriesResult.categories.length > 0) {
        await localStore.setCachedCategories(categoriesResult.categories);
      }

      console.log("[ApiService] Preloaded data");
      return true;
    } catch (error) {
      console.error("[ApiService] Failed to preload data:", error);
      return false;
    }
  }

  return {
    initialize: initialize,
    getProducts: getProducts,
    getProductById: getProductById,
    getCategories: getCategories,
    createOrder: createOrder,
    getOrders: getOrders,
    getOrderById: getOrderById,
    login: login,
    register: register,
    logout: logout,
    getCurrentUser: getCurrentUser,
    syncPendingOrders: syncPendingOrders,
    preloadData: preloadData,
  };
}

export const apiService = createApiService();
export default apiService;
