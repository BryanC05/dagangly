import mockData from '../../docs/mock-finance-data.json';

export const getSellers = () => {
  return mockData.sellers.map(s => ({
    sellerId: s.sellerId,
    sellerName: s.sellerName,
    email: s.email,
  }));
};

export const loadMockFinanceData = (sellerId) => {
  if (sellerId) {
    const seller = mockData.sellers.find(s => s.sellerId === sellerId);
    if (!seller) return null;
    
    const completedOrders = seller.orders.filter(
      o => o.status === 'delivered' || o.status === 'completed'
    );
    
    return {
      sellerId: seller.sellerId,
      sellerName: seller.sellerName,
      summary: {
        totalSales: seller.totalRevenue,
        totalExpenses: seller.totalExpense,
        netProfit: seller.totalRevenue - seller.totalExpense,
        orderCount: completedOrders.length,
      },
      orders: completedOrders,
      expenses: seller.expenses,
      products: seller.products,
      revenueTrend: seller.revenueTrend,
    };
  }

  const allCompletedOrders = mockData.sellers.flatMap(s => 
    s.orders.filter(o => o.status === 'delivered' || o.status === 'completed')
  );
  
  const allExpenses = mockData.sellers.flatMap(s => s.expenses);
  
  return {
    summary: mockData.summary,
    orders: allCompletedOrders,
    expenses: allExpenses,
    products: mockData.sellers.flatMap(s => s.products),
    revenueTrend: {
      weekly: mockData.sellers.reduce((acc, s) => {
        s.revenueTrend.weekly.forEach((d, i) => {
          acc[i] = acc[i] || { day: d.day, revenue: 0 };
          acc[i].revenue += d.revenue;
        });
        return acc;
      }, []),
      monthly: mockData.sellers.reduce((acc, s) => {
        s.revenueTrend.monthly.forEach((d, i) => {
          acc[i] = acc[i] || { month: d.month, revenue: 0, expenses: 0 };
          acc[i].revenue += d.revenue;
          acc[i].expenses += d.expenses;
        });
        return acc;
      }, []),
    },
    sellers: getSellers(),
  };
};

export const getProductAnalysis = (productName, sellerId) => {
  const sellers = sellerId 
    ? mockData.sellers.filter(s => s.sellerId === sellerId)
    : mockData.sellers;
  
  for (const seller of sellers) {
    const product = seller.products.find(
      p => p.name.toLowerCase().includes(productName.toLowerCase())
    );
    
    if (!product) continue;
    
    const cost = product.cost;
    const platformFeeAmount = product.price * (cost.platformFee / 100);
    const totalCost = cost.material + cost.labor + cost.shipping + platformFeeAmount + cost.other;
    const profit = product.price - totalCost;
    const margin = (profit / product.price) * 100;
    
    const productOrders = seller.orders.filter(
      o => o.product === product.name && (o.status === 'delivered' || o.status === 'completed')
    );
    const unitsSold = productOrders.reduce((sum, o) => sum + o.quantity, 0);
    const revenue = product.price * unitsSold;
    const totalCostAll = totalCost * unitsSold;
    const grossProfit = revenue - totalCostAll;

    return {
      product,
      sellerName: seller.sellerName,
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
  }
  
  return null;
};

export const getInvoices = (sellerId) => {
  const sellers = sellerId 
    ? mockData.sellers.filter(s => s.sellerId === sellerId)
    : mockData.sellers;
  
  const invoices = [];
  let invoiceNum = 1;
  
  for (const seller of sellers) {
    const completedOrders = seller.orders.filter(
      o => o.status === 'delivered' || o.status === 'completed'
    );
    
    for (const order of completedOrders) {
      const isPaid = Math.random() > 0.3;
      invoices.push({
        invoiceId: `INV-${String(invoiceNum).padStart(4, '0')}`,
        orderId: order.orderId,
        sellerId: seller.sellerId,
        sellerName: seller.sellerName,
        product: order.product,
        quantity: order.quantity,
        customer: order.customer,
        amount: order.total,
        date: order.date,
        status: isPaid ? 'paid' : 'unpaid',
      });
      invoiceNum++;
    }
  }
  
  return invoices.sort((a, b) => new Date(b.date) - new Date(a.date));
};

export const getRevenueTrend = (sellerId, period = 'monthly') => {
  if (sellerId) {
    const seller = mockData.sellers.find(s => s.sellerId === sellerId);
    if (!seller) return [];
    return seller.revenueTrend[period] || [];
  }

  const allSellers = mockData.sellers;
  
  if (period === 'monthly') {
    return allSellers[0].revenueTrend.monthly.map((_, i) => ({
      month: allSellers[0].revenueTrend.monthly[i].month,
      revenue: allSellers.reduce((sum, s) => sum + s.revenueTrend.monthly[i].revenue, 0),
      expenses: allSellers.reduce((sum, s) => sum + s.revenueTrend.monthly[i].expenses, 0),
    }));
  }
  
  if (period === 'weekly' || period === 'daily30') {
    return allSellers[0].revenueTrend[period].map((d, i) => ({
      day: d.day,
      revenue: allSellers.reduce((sum, s) => sum + (s.revenueTrend[period][i]?.revenue || 0), 0),
    }));
  }
  
  return [];
};

export const getExpensesByCategory = (sellerId) => {
  const sellers = sellerId 
    ? mockData.sellers.filter(s => s.sellerId === sellerId)
    : mockData.sellers;
  
  const categoryTotals = {};
  
  for (const seller of sellers) {
    for (const expense of seller.expenses) {
      categoryTotals[expense.category] = (categoryTotals[expense.category] || 0) + expense.amount;
    }
  }
  
  return Object.entries(categoryTotals).map(([category, amount]) => ({
    category,
    amount,
  }));
};

export default {
  getSellers,
  loadMockFinanceData,
  getProductAnalysis,
  getInvoices,
  getRevenueTrend,
  getExpensesByCategory,
};