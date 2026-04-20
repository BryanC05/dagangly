import { create } from 'zustand';
import { loadMockFinanceData, getRevenueTrend } from '../utils/mockFinance';

const RANI_SELLER_EMAIL = 'rani.summarecon@marketplace.test';

// Force use mock data for demo
const FORCE_MOCK = true;

const generateMockAnalytics = (period, sellerEmail = RANI_SELLER_EMAIL) => {
  console.log('Generating mock analytics for:', sellerEmail);
  const mockData = loadMockFinanceData(sellerEmail);
  console.log('Mock data loaded:', mockData?.sellerName, mockData?.summary);
  
  const days = parseInt(period) || 30;
  
  const sellerData = mockData || { summary: { totalSales: 8276000, orderCount: 10 }, products: [], orders: [], revenueTrend: {} };
  
  // Generate revenue by day based on period
  const revenueByDay = {};
  const trendData = days <= 7 
    ? (sellerData.revenueTrend?.weekly || [])
    : (sellerData.revenueTrend?.monthly || []);
  
  if (trendData && trendData.length > 0) {
    trendData.slice(0, Math.min(days, trendData.length)).forEach(d => {
      const key = d.day || d.month;
      revenueByDay[key] = d.revenue || 0;
    });
  }

  const completedOrders = sellerData.orders?.filter(o => o.status === 'delivered' || o.status === 'completed').length || 0;
  
  // Generate realistic mock data
  const mockAnalytics = {
    period: period,
    totalRevenue: sellerData.summary?.totalSales || 8276000,
    orderCount: completedOrders || 10,
    productCount: sellerData.products?.length || 4,
    avgRating: 4.7,
    totalReviews: 92,
    revenueByDay,
    ordersByStatus: { 
      delivered: Math.floor((completedOrders || 10) * 0.6),
      completed: Math.floor((completedOrders || 10) * 0.15),
      pending: Math.floor((completedOrders || 10) * 0.15),
      cancelled: Math.floor((completedOrders || 10) * 0.1)
    },
    topProducts: (sellerData.products || []).slice(0, 5).map((p, i) => ({
      _id: `prod-${i}`,
      name: p.name,
      totalSold: Math.floor(Math.random() * 30) + 15,
      revenue: p.price * (Math.floor(Math.random() * 30) + 15),
    })),
  };

  console.log('Mock analytics:', mockAnalytics);
  return mockAnalytics;
};

const generateMockSales = (period, sellerEmail = RANI_SELLER_EMAIL) => {
  const mockData = loadMockFinanceData(sellerEmail);
  const sellerData = mockData || { orders: [], revenueTrend: {}, products: [] };
  
  const completedOrders = sellerData.orders?.filter(o => o.status === 'delivered' || o.status === 'completed') || [];
  const trendData = sellerData.revenueTrend?.weekly || [];
  
  const mockSales = {
    period: period,
    totalRevenue: sellerData.summary?.totalSales || 8276000,
    completedOrders: completedOrders.length || 10,
    pendingOrders: Math.floor((completedOrders.length || 10) * 0.25),
    recentDays: trendData.slice(0, 7).map(d => ({
      date: d.day,
      label: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: d.revenue || 0,
    })),
    topProducts: (sellerData.products || []).slice(0, 5).map((p, i) => ({
      name: p.name,
      totalSold: Math.floor(Math.random() * 30) + 15,
      revenue: p.price * (Math.floor(Math.random() * 30) + 15),
    })),
  };

  return mockSales;
};

const generateMockCustomers = () => {
  return {
    newCustomers: 18,
    returningCustomers: 8,
    totalSpent: 4250000,
    avgOrderValue: 145000,
  };
};

const generateMockProducts = (sellerEmail = RANI_SELLER_EMAIL) => {
  const mockData = loadMockFinanceData(sellerEmail);
  const products = mockData?.products || [];
  
  return products.map((p, i) => ({
    _id: `prod-${i}`,
    name: p.name,
    price: p.price,
    stock: Math.floor(Math.random() * 80) + 20,
    totalSold: Math.floor(Math.random() * 40) + 10,
    revenue: p.price * (Math.floor(Math.random() * 40) + 10),
    rating: (Math.random() * 0.5 + 4.3).toFixed(1),
  }));
};

export const useSellerAnalyticsStore = create((set) => ({
  analytics: null,
  sales: [],
  customers: [],
  products: [],
  loading: false,
  error: null,
  useMockData: false,
  mockSellerEmail: RANI_SELLER_EMAIL,

  fetchSellerAnalytics: async (period = '30', sellerEmail = RANI_SELLER_EMAIL) => {
    set({ loading: true, error: null });
    
    // Always use mock data for demo
    if (FORCE_MOCK) {
      console.log('Using FORCE_MOCK for analytics');
      const mockAnalytics = generateMockAnalytics(period, sellerEmail);
      set({ analytics: mockAnalytics, loading: false, useMockData: true });
      return;
    }
    
    try {
      const params = sellerEmail ? `?period=${period}&email=${encodeURIComponent(sellerEmail)}` : `?period=${period}`;
      const res = await api.get(`/analytics/seller${params}`);
      set({ analytics: res.data, loading: false, useMockData: false });
    } catch (err) {
      console.log('Using mock analytics for Rani (Dapur Summarecon)');
      const mockAnalytics = generateMockAnalytics(period, sellerEmail);
      set({ analytics: mockAnalytics, loading: false, useMockData: true });
    }
  },

  fetchSales: async (period = '30', sellerEmail = RANI_SELLER_EMAIL) => {
    set({ loading: true });
    
    // Always use mock data for demo
    if (FORCE_MOCK) {
      const mockSales = generateMockSales(period, sellerEmail);
      set({ sales: mockSales, loading: false });
      return;
    }
    
    try {
      const params = sellerEmail ? `?period=${period}&email=${encodeURIComponent(sellerEmail)}` : `?period=${period}`;
      const res = await api.get(`/analytics/sales${params}`);
      set({ sales: res.data, loading: false });
    } catch (err) {
      console.log('Using mock sales for Rani (Dapur Summarecon)');
      const mockSales = generateMockSales(period, sellerEmail);
      set({ sales: mockSales, loading: false });
    }
  },

  fetchCustomers: async (sellerEmail = RANI_SELLER_EMAIL) => {
    set({ loading: true, error: null });
    
    // Always use mock data for demo
    if (FORCE_MOCK) {
      const mockCustomers = generateMockCustomers();
      set({ customers: mockCustomers, loading: false });
      return;
    }
    
    try {
      const params = sellerEmail ? `?email=${encodeURIComponent(sellerEmail)}` : '';
      const res = await api.get(`/analytics/customers${params}`);
      set({ customers: res.data, loading: false });
    } catch (err) {
      console.log('Using mock customers for Rani (Dapur Summarecon)');
      const mockCustomers = generateMockCustomers();
      set({ customers: mockCustomers, loading: false });
    }
  },

  fetchProductPerformance: async (sellerEmail = RANI_SELLER_EMAIL) => {
    set({ loading: true, error: null });
    
    // Always use mock data for demo
    if (FORCE_MOCK) {
      const mockProducts = generateMockProducts(sellerEmail);
      set({ products: mockProducts, loading: false });
      return;
    }
    
    try {
      const params = sellerEmail ? `?email=${encodeURIComponent(sellerEmail)}` : '';
      const res = await api.get(`/analytics/products${params}`);
      set({ products: res.data, loading: false });
    } catch (err) {
      console.log('Using mock products for Rani (Dapur Summarecon)');
      const mockProducts = generateMockProducts(sellerEmail);
      set({ products: mockProducts, loading: false });
    }
  },
}));