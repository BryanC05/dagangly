import mockData from '../../docs/mock-finance-data.json';

// Mock Finance Service for testing
// Use this to test finance features without backend

export const loadMockFinanceData = () => {
  // Calculate totals
  const completedOrders = mockData.orders.filter(
    o => o.status === 'delivered' || o.status === 'completed'
  );
  
  const totalSales = completedOrders.reduce((sum, o) => sum + o.total, 0);
  const totalExpenses = mockData.expenses.reduce((sum, e) => sum + e.amount, 0);
  const orderCount = completedOrders.length;

  return {
    summary: {
      totalSales,
      totalExpenses,
      netProfit: totalSales - totalExpenses,
      orderCount,
    },
    orders: completedOrders,
    expenses: mockData.expenses,
    products: mockData.products,
    monthlySummary: mockData.monthlySummary,
  };
};

export const getProductAnalysis = (productName) => {
  const product = mockData.products.find(
    p => p.name.toLowerCase().includes(productName.toLowerCase())
  );
  
  if (!product) return null;
  
  const cost = product.cost;
  const platformFeeAmount = product.price * (cost.platformFee / 100);
  const totalCost = cost.material + cost.labor + cost.shipping + platformFeeAmount + cost.other;
  const profit = product.price - totalCost;
  const margin = (profit / product.price) * 100;
  
  // Find orders for this product
  const productOrders = mockData.orders.filter(
    o => o.product === productName && (o.status === 'delivered' || o.status === 'completed')
  );
  const unitsSold = productOrders.reduce((sum, o) => sum + o.quantity, 0);
  const revenue = product.price * unitsSold;
  const totalCostAll = totalCost * unitsSold;
  const grossProfit = revenue - totalCostAll;

  return {
    product,
    costPerUnit: {
      material: cost.material,
      labor: cost.labor,
      shipping: cost.shipping,
      platformFee: platformFeeAmount,
      other: cost.other,
      total: totalCost,
    },
    metrics: {
      sellingPrice: product.price,
      profitPerUnit: profit,
      marginPercent: margin.toFixed(1),
      unitsSold,
      revenue,
      totalCost: totalCostAll,
      grossProfit,
    },
  };
};

export default {
  loadMockFinanceData,
  getProductAnalysis,
};