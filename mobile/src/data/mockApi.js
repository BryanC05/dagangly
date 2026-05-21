import AsyncStorage from "@react-native-async-storage/async-storage";
import { v4 as uuidv4 } from "uuid";
import { MOCK_PRODUCTS, MOCK_CATEGORIES, MOCK_BUSINESSES, MOCK_ORDERS } from "./mockData";
import { getMockUserById } from "./mockAuth";

const CART_STORAGE_KEY = "mock_cart_storage";
const ORDERS_STORAGE_KEY = "mock_orders_storage";
const USER_STORAGE_KEY = "mock_user_data";
const ADDRESSES_STORAGE_KEY = "mock_addresses_storage";

let mockCart = [];
let mockOrders = [...MOCK_ORDERS];
let mockUserData = null;
let mockAddresses = [];

export async function initializeMockData() {
  try {
    const storedCart = await AsyncStorage.getItem(CART_STORAGE_KEY);
    mockCart = storedCart ? JSON.parse(storedCart) : [];

    const storedOrders = await AsyncStorage.getItem(ORDERS_STORAGE_KEY);
    const stored = storedOrders ? JSON.parse(storedOrders) : [];
    mockOrders = [...MOCK_ORDERS, ...stored.filter(o => !MOCK_ORDERS.find(m => m.id === o.id))];

    const storedUser = await AsyncStorage.getItem(USER_STORAGE_KEY);
    mockUserData = storedUser ? JSON.parse(storedUser) : null;

    const storedAddresses = await AsyncStorage.getItem(ADDRESSES_STORAGE_KEY);
    mockAddresses = storedAddresses ? JSON.parse(storedAddresses) : getDefaultAddresses();

    console.log("[MockApi] Initialized:", mockCart.length, "cart items,", mockOrders.length, "orders");
  } catch (error) {
    console.error("[MockApi] Failed to initialize mock data:", error);
    mockAddresses = getDefaultAddresses();
  }
}

function getDefaultAddresses() {
  return [
    {
      id: "addr_1",
      label: "Rumah",
      address: "Jl. Boulevard Ahmad Yani No. 123, Summarecon Bekasi",
      city: "Bekasi",
      state: "Jawa Barat",
      postalCode: "17142",
      isDefault: true,
    },
    {
      id: "addr_2",
      label: "Kantor",
      address: "Ruko Emerald Commercial, Summarecon Bekasi",
      city: "Bekasi",
      state: "Jawa Barat",
      postalCode: "17142",
      isDefault: false,
    },
  ];
}

export async function saveMockCart() {
  try {
    await AsyncStorage.setItem(CART_STORAGE_KEY, JSON.stringify(mockCart));
  } catch (error) {
    console.error("[MockApi] Failed to save cart:", error);
  }
}

export async function saveMockOrders() {
  try {
    const localOrders = mockOrders.filter(o => o.localOnly);
    await AsyncStorage.setItem(ORDERS_STORAGE_KEY, JSON.stringify(localOrders));
  } catch (error) {
    console.error("[MockApi] Failed to save orders:", error);
  }
}

export async function saveMockUserData() {
  try {
    if (mockUserData) {
      await AsyncStorage.setItem(USER_STORAGE_KEY, JSON.stringify(mockUserData));
    }
  } catch (error) {
    console.error("[MockApi] Failed to save user data:", error);
  }
}

export async function saveMockAddresses() {
  try {
    await AsyncStorage.setItem(ADDRESSES_STORAGE_KEY, JSON.stringify(mockAddresses));
  } catch (error) {
    console.error("[MockApi] Failed to save addresses:", error);
  }
}

export function getProducts(options = {}) {
  const { category, search, page = 1, limit = 20 } = options;
  let products = [...MOCK_PRODUCTS];

  if (category && category !== "all") {
    products = products.filter(p => p.category === category);
  }

  if (search) {
    const searchLower = search.toLowerCase();
    products = products.filter(p =>
      p.name.toLowerCase().includes(searchLower) ||
            p.description.toLowerCase().includes(searchLower) ||
            p.tags.some(tag => tag.toLowerCase().includes(searchLower))
    );
  }

  const start = (page - 1) * limit;
  const end = start + limit;
  const paginatedProducts = products.slice(start, end);

  return {
    products: paginatedProducts.map(p => ({ ...p, _id: p.id })),
    total: products.length,
    page,
    limit,
    hasMore: end < products.length,
  };
}

export function getProductById(id) {
  return MOCK_PRODUCTS.find(p => p.id === id) || null;
}

export function getCategories() {
  return { categories: MOCK_CATEGORIES };
}

export function getBusinesses() {
  return { businesses: MOCK_BUSINESSES };
}

export function getBusinessById(id) {
  return MOCK_BUSINESSES.find(b => b.id === id) || null;
}

export async function getCart() {
  return {
    items: mockCart.map(item => {
      const product = getProductById(item.productId);
      return {
        ...item,
        product: product || { name: "Unknown Product", price: 0, images: [] },
      };
    }),
    subtotal: mockCart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
  };
}

export async function addToCart(product, quantity = 1) {
  const existingIndex = mockCart.findIndex(item => item.productId === product.id);

  if (existingIndex >= 0) {
    mockCart[existingIndex].quantity += quantity;
  } else {
    mockCart.push({
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images?.[0] || null,
      quantity,
      sellerId: product.seller?.id || "",
      sellerName: product.seller?.name || "",
    });
  }

  await saveMockCart();
  return { success: true, cart: await getCart() };
}

export async function updateCartItem(productId, quantity) {
  const index = mockCart.findIndex(item => item.productId === productId);

  if (index >= 0) {
    if (quantity <= 0) {
      mockCart.splice(index, 1);
    } else {
      mockCart[index].quantity = quantity;
    }
    await saveMockCart();
  }

  return { success: true, cart: await getCart() };
}

export async function removeFromCart(productId) {
  mockCart = mockCart.filter(item => item.productId !== productId);
  await saveMockCart();
  return { success: true, cart: await getCart() };
}

export async function clearCart() {
  mockCart = [];
  await saveMockCart();
  return { success: true };
}

export async function createOrder(orderData) {
  const orderId = `mock_order_${uuidv4()}`;
  const orderNumber = `ORD-${Date.now().toString(36).toUpperCase()}`;
    
  const subtotal = orderData.subtotal || mockCart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const shippingFee = orderData.shippingFee || 15000;
  const discountAmount = orderData.discountAmount || 0;
    
  const order = {
    id: orderId,
    orderNumber,
    buyerId: orderData.buyerId || "mock_buyer_1",
    buyerName: orderData.buyerName || "Test Buyer",
    products: orderData.products || [...mockCart],
    subtotal,
    shippingFee,
    discountAmount,
    totalAmount: subtotal + shippingFee - discountAmount,
    status: "pending",
    paymentMethod: orderData.paymentMethod || "COD",
    paymentStatus: "pending",
    deliveryAddress: orderData.deliveryAddress || mockAddresses.find(a => a.isDefault) || mockAddresses[0],
    notes: orderData.notes || "",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    syncStatus: "pending",
    localOnly: true,
  };

  mockOrders.unshift(order);
  await saveMockOrders();

  if (!orderData.keepCart) {
    mockCart = [];
    await saveMockCart();
  }

  return { order, success: true };
}

export async function getOrders(buyerId) {
  if (buyerId) {
    return {
      orders: mockOrders.filter(o => o.buyerId === buyerId),
    };
  }
  return { orders: mockOrders };
}

export async function getOrderById(orderId) {
  return mockOrders.find(o => o.id === orderId) || null;
}

export async function updateOrderStatus(orderId, status) {
  const order = mockOrders.find(o => o.id === orderId);
  if (order) {
    order.status = status;
    order.updatedAt = new Date().toISOString();
    await saveMockOrders();
  }
  return { success: !!order };
}

export function getUserProfile(userId) {
  return getMockUserById(userId);
}

export async function updateUserProfile(userId, updates) {
  if (mockUserData) {
    mockUserData = { ...mockUserData, ...updates };
    await saveMockUserData();
  }
  return { success: true, user: { ...getMockUserById(userId), ...updates } };
}

export function getMyProducts(sellerId) {
  return {
    products: MOCK_PRODUCTS.filter(p => p.seller?.id === sellerId || p.seller?._id === sellerId || p.businessId === sellerId),
  };
}

export function getProductsByBusiness(businessId) {
  return MOCK_PRODUCTS.filter(p => p.businessId === businessId);
}

export function getProductsByCategory(category) {
  const products = MOCK_PRODUCTS.filter(p => p.category === category);
  return { products, total: products.length };
}

export function getSellerOrders(sellerId) {
  return {
    orders: mockOrders.filter(o => 
      o.products.some(p => p.sellerId === sellerId)
    ),
  };
}

export function getNearbySellers(lat, lng, radius = 10) {
  return { businesses: MOCK_BUSINESSES };
}

export function getMockLocation() {
  return {
    latitude: -6.2088,
    longitude: 106.8456,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };
}

export function getMockSellersLocation() {
  return [
    {
      _id: "biz_dapur_summarecon",
      id: "biz_dapur_summarecon",
      coordinate: { latitude: -6.2253, longitude: 107.0005 },
      title: "Dapur Summarecon",
      description: "Masakan Rumahan",
      rating: 4.8,
      reviewCount: 134,
    },
    {
      _id: "biz_kopi_kita",
      id: "biz_kopi_kita",
      coordinate: { latitude: -6.2310, longitude: 107.0120 },
      title: "Kopi Kita",
      description: "Kopi Lokal Indonesia",
      rating: 4.7,
      reviewCount: 92,
    },
    {
      _id: "biz_brownies_co",
      id: "biz_brownies_co",
      coordinate: { latitude: -6.2280, longitude: 107.0080 },
      title: "Brownies & Co",
      description: "Brownies Premium",
      rating: 4.7,
      reviewCount: 134,
    },
  ];
}

export function getMockDestination() {
  return {
    latitude: -6.2088,
    longitude: 106.8456,
    address: "Jl. Boulevard Ahmad Yani No. 123, Summarecon Bekasi",
    city: "Bekasi",
    state: "Jawa Barat",
  };
}

export function getRecommendations() {
  return { products: MOCK_PRODUCTS.slice(0, 8).map(p => ({ ...p, _id: p.id })) };
}

export function getTrendingProducts() {
  return { products: MOCK_PRODUCTS.slice(0, 6).map(p => ({ ...p, _id: p.id })) };
}

export function searchProducts(query) {
  return getProducts({ search: query });
}

export function getAddresses() {
  return { addresses: mockAddresses };
}

export async function addAddress(address) {
  const newAddress = {
    id: `addr_${uuidv4()}`,
    ...address,
    isDefault: mockAddresses.length === 0,
  };
  mockAddresses.push(newAddress);
  await saveMockAddresses();
  return { success: true, address: newAddress };
}

export async function updateAddress(addressId, updates) {
  const index = mockAddresses.findIndex(a => a.id === addressId);
  if (index >= 0) {
    mockAddresses[index] = { ...mockAddresses[index], ...updates };
    await saveMockAddresses();
  }
  return { success: !!mockAddresses[index] };
}

export async function deleteAddress(addressId) {
  mockAddresses = mockAddresses.filter(a => a.id !== addressId);
  if (mockAddresses.length > 0 && !mockAddresses.some(a => a.isDefault)) {
    mockAddresses[0].isDefault = true;
  }
  await saveMockAddresses();
  return { success: true };
}

export async function setDefaultAddress(addressId) {
  mockAddresses = mockAddresses.map(a => ({
    ...a,
    isDefault: a.id === addressId,
  }));
  await saveMockAddresses();
  return { success: true };
}

export async function saveMockUser(user) {
  mockUserData = user;
  await saveMockUserData();
}

export function getMockUser() {
  return mockUserData;
}

export default {
  initializeMockData,
  getProducts,
  getProductById,
  getCategories,
  getBusinesses,
  getBusinessById,
  getCart,
  addToCart,
  updateCartItem,
  removeFromCart,
  clearCart,
  createOrder,
  getOrders,
  getOrderById,
  updateOrderStatus,
  getUserProfile,
  updateUserProfile,
  getMyProducts,
  getProductsByCategory,
  getSellerOrders,
  getNearbySellers,
  getMockLocation,
  getMockSellersLocation,
  getMockDestination,
  getRecommendations,
  getTrendingProducts,
  searchProducts,
  getAddresses,
  addAddress,
  updateAddress,
  deleteAddress,
  setDefaultAddress,
  saveMockUser,
  getMockUser,
};
