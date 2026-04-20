import { create } from 'zustand';
import api from '../utils/api';
import { loadMockFinanceData, getSellers, getRevenueTrend } from '../utils/mockFinance';

const generateMockAnalytics = (period) => {
  const mockData = loadMockFinanceData();
  const days = parseInt(period) || 30;
  
  // Generate revenue by day based on period
  const revenueByDay = {};
  const trendData = days <= 7 ? getRevenueTrend(undefined, 'weekly') : getRevenueTrend(undefined, 'monthly');
  
  if (trendData && trendData.length > 0) {
    trendData.slice(0, Math.min(days, trendData.length)).forEach(d => {
      const key = d.day || d.month;
      revenueByDay[key] = d.revenue || 0;
    });
  }

  // Generate realistic mock data
  const mockAnalytics = {
    period: period,
    totalRevenue: mockData.summary.totalSales,
    orderCount: mockData.summary.orderCount,
    productCount: mockData.products.length,
    avgRating: 4.5,
    totalReviews: 128,
    revenueByDay,
    ordersByStatus: { 
      delivered: Math.floor(mockData.summary.orderCount * 0.6), 
      completed: Math.floor(mockData.summary.orderCount * 0.15),
      pending: Math.floor(mockData.summary.orderCount * 0.15),
      cancelled: Math.floor(mockData.summary.orderCount * 0.1)
    },
    topProducts: mockData.products.slice(0, 5).map((p, i) => ({
      _id: `mock-prod-${i}`,
      name: p.name,
      totalSold: Math.floor(Math.random() * 30) + 15,
      revenue: p.price * (Math.floor(Math.random() * 30) + 15),
    })),
  };

  return mockAnalytics;
};

const generateMockSales = (period) => {
  const mockData = loadMockFinanceData();
  const trendData = getRevenueTrend(undefined, 'weekly');
  
  const mockSales = {
    period: period,
    totalRevenue: mockData.summary.totalSales,
    completedOrders: Math.floor(mockData.summary.orderCount * 0.75),
    pendingOrders: Math.floor(mockData.summary.orderCount * 0.25),
    recentDays: trendData.slice(0, 7).map(d => ({
      date: d.day,
      label: new Date(d.day).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      revenue: d.revenue || 0,
    })),
    topProducts: mockData.products.slice(0, 5).map((p, i) => ({
      name: p.name,
      totalSold: Math.floor(Math.random() * 30) + 15,
      revenue: p.price * (Math.floor(Math.random() * 30) + 15),
    })),
  };

  return mockSales;
};

const generateMockCustomers = () => {
  return {
    newCustomers: 24,
    returningCustomers: 12,
    totalSpent: 3250000,
    avgOrderValue: 125000,
  };
};

const generateMockProducts = () => {
  const mockData = loadMockFinanceData();
  return mockData.products.map((p, i) => ({
    _id: `mock-prod-${i}`,
    name: p.name,
    price: p.price,
    stock: Math.floor(Math.random() * 80) + 20,
    totalSold: Math.floor(Math.random() * 40) + 10,
    revenue: p.price * (Math.floor(Math.random() * 40) + 10),
    rating: (Math.random() * 0.5 + 4.3).toFixed(1),
  }));
};

export const useSellerAnalyticsStore = create((set, get) => ({
  analytics: null,
  sales: [],
  customers: [],
  products: [],
  loading: false,
  error: null,
  useMockData: false,

  fetchSellerAnalytics: async (period = '30', sellerId = null) => {
    set({ loading: true, error: null });
    try {
      const params = sellerId ? `?period=${period}&sellerId=${sellerId}` : `?period=${period}`;
      const res = await api.get(`/analytics/seller${params}`);
      set({ analytics: res.data, loading: false, useMockData: false });
    } catch (err) {
      console.log('Analytics API failed, using mock data:', err.message);
      const mockAnalytics = generateMockAnalytics(period);
      set({ analytics: mockAnalytics, loading: false, useMockData: true });
    }
  },

  fetchSales: async (period = '30', sellerId = null) => {
    set({ loading: true });
    try {
      const params = sellerId ? `?period=${period}&sellerId=${sellerId}` : `?period=${period}`;
      const res = await api.get(`/analytics/sales${params}`);
      set({ sales: res.data, loading: false });
    } catch (err) {
      console.log('Sales API failed, using mock data:', err.message);
      const mockSales = generateMockSales(period);
      set({ sales: mockSales, loading: false });
    }
  },

  fetchCustomers: async (sellerId = null) => {
    set({ loading: true, error: null });
    try {
      const params = sellerId ? `?sellerId=${sellerId}` : '';
      const res = await api.get(`/analytics/customers${params}`);
      set({ customers: res.data, loading: false });
    } catch (err) {
      console.log('Customers API failed, using mock data:', err.message);
      const mockCustomers = generateMockCustomers();
      set({ customers: mockCustomers, loading: false });
    }
  },

  fetchProductPerformance: async (sellerId = null) => {
    set({ loading: true, error: null });
    try {
      const params = sellerId ? `?sellerId=${sellerId}` : '';
      const res = await api.get(`/analytics/products${params}`);
      set({ products: res.data, loading: false });
    } catch (err) {
      console.log('Products API failed, using mock data:', err.message);
      const mockProducts = generateMockProducts();
      set({ products: mockProducts, length: 0 });
    }
  },
}));