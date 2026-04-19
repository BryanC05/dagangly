import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useSellerAnalyticsStore } from '../store/sellerAnalyticsStore';
import { BarChart3, DollarSign, Package, Star, Users, ShoppingBag, Send, Bot, Calendar, ArrowUpRight, TrendingUp, ChevronDown, Activity, Terminal } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 15 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' } }
};

const AIConsultantWidget = ({ period, analytics, sales, customers, products }) => {
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [chatHistory, isChatLoading]);

  const handleAskAI = async () => {
    if (!chatQuery.trim()) return;

    const userMsg = { role: 'user', content: chatQuery };
    setChatHistory((prev) => [...prev, userMsg]);
    setChatQuery('');
    setIsChatLoading(true);

    try {
      const analyticsContext = { period, analytics, sales, customers, products };
      const res = await api.post('/ai/financial-consultant', {
        query: userMsg.content,
        analytics: analyticsContext
      });
      setChatHistory((prev) => [...prev, { role: 'ai', content: res.data.response }]);
    } catch (err) {
      console.error('Failed to ask AI:', err);
      setChatHistory((prev) => [...prev, { role: 'ai', content: 'Connection Error: API Unreachable.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <motion.div variants={itemVariants} className="bg-[#1e1e1e] rounded-xl overflow-hidden mt-8 border border-gray-800 shadow-xl flex flex-col h-[500px] text-gray-300 font-mono">
      <div className="bg-[#121212] px-4 py-3 border-b border-gray-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Terminal className="h-5 w-5 text-emerald-500" />
          <h2 className="text-sm font-semibold text-white tracking-widest uppercase">AI Financial Advisor</h2>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-gray-500 uppercase tracking-widest">System Online</span>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 custom-scrollbar bg-[#1a1a1a]"
      >
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center opacity-50">
            <Bot className="h-10 w-10 mb-3" />
            <p className="text-sm uppercase tracking-widest">Awaiting Query Input...</p>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {chatHistory.map((msg, idx) => (
              <motion.div 
                key={idx}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[90%] md:max-w-[80%] p-4 rounded-lg ${
                  msg.role === 'user' 
                    ? 'bg-blue-600/20 border border-blue-500/30 text-blue-100' 
                    : 'bg-[#252525] border border-gray-700 text-gray-300'
                }`}>
                  {msg.role === 'user' ? (
                    <p className="text-sm">{msg.content}</p>
                  ) : (
                    <div className="prose prose-sm prose-invert max-w-none text-sm prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-gray-700 font-sans">
                      <ReactMarkdown>{msg.content}</ReactMarkdown>
                    </div>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
        
        {isChatLoading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex justify-start"
          >
            <div className="bg-[#252525] border border-gray-700 p-4 rounded-lg text-xs uppercase tracking-widest text-emerald-500">
              Processing data...
            </div>
          </motion.div>
        )}
      </div>

      <div className="p-4 bg-[#121212] border-t border-gray-800">
        <div className="relative flex items-center">
          <span className="absolute left-4 text-emerald-500">{">"}</span>
          <input
            type="text"
            value={chatQuery}
            onChange={(e) => setChatQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
            placeholder="Enter analysis query..."
            className="w-full bg-[#1a1a1a] border border-gray-700 text-white rounded-md pl-10 pr-12 py-3 focus:outline-none focus:border-emerald-500 transition-colors placeholder:text-gray-600 text-sm"
          />
          <button
            onClick={handleAskAI}
            disabled={isChatLoading || !chatQuery.trim()}
            className="absolute right-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white p-2 rounded transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

const SellerAnalyticsPage = () => {
  const { t } = useTranslation();
  const [period, setPeriod] = useState('30');

  const {
    analytics,
    sales,
    customers,
    products,
    loading,
    fetchSellerAnalytics,
    fetchSales,
    fetchCustomers,
    fetchProductPerformance,
  } = useSellerAnalyticsStore();

  useEffect(() => {
    fetchSellerAnalytics(period);
    fetchSales(period);
    fetchCustomers();
    fetchProductPerformance();
  }, [period]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  const chartData = (sales?.recentDays || []).slice(0, 7).reverse().map(day => ({
    name: `${day._id?.day}/${day._id?.month}`,
    revenue: day.revenue || 0
  }));

  const stats = [
    {
      label: t('analytics.totalRevenue') || 'Gross Volume',
      value: analytics?.totalRevenue ? formatCurrency(analytics.totalRevenue) : formatCurrency(0),
      icon: DollarSign,
      color: 'text-emerald-500',
      bgClass: 'bg-emerald-500/10'
    },
    {
      label: t('analytics.orders') || 'Total Orders',
      value: analytics?.orderCount || 0,
      icon: ShoppingBag,
      color: 'text-blue-500',
      bgClass: 'bg-blue-500/10'
    },
    {
      label: t('analytics.products') || 'Active SKUs',
      value: analytics?.productCount || 0,
      icon: Package,
      color: 'text-purple-500',
      bgClass: 'bg-purple-500/10'
    },
    {
      label: t('analytics.rating') || 'Avg Rating',
      value: analytics?.avgRating ? analytics.avgRating.toFixed(1) : '0.0',
      icon: Star,
      color: 'text-amber-500',
      bgClass: 'bg-amber-500/10'
    },
  ];

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white dark:bg-[#1e1e1e] border border-gray-200 dark:border-gray-800 p-3 rounded shadow-lg">
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">{label}</p>
          <p className="font-mono font-bold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(payload[0].value)}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-[#0a0a0a] text-gray-900 dark:text-gray-100 pb-20 font-sans">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
              <Activity className="h-7 w-7 text-emerald-500" />
              {t('analytics.title') || 'Performance Overview'}
            </h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">Real-time metrics and financial data</p>
          </div>
          
          <div className="relative inline-flex items-center bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-md p-1 shadow-sm">
            <Calendar className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="appearance-none bg-transparent pl-9 pr-10 py-1.5 text-sm font-semibold focus:outline-none cursor-pointer dark:text-white"
            >
              <option value="7">7 Days</option>
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
            </select>
            <ChevronDown className="absolute right-3 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-6"
        >
          {/* Top Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm"
              >
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</p>
                  <div className={`p-2 rounded-lg ${stat.bgClass}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl md:text-3xl font-bold font-mono tracking-tight">{stat.value}</h3>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Revenue Chart */}
            <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex flex-col min-h-[350px]">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-emerald-500" />
                  <h2 className="text-lg font-bold">Revenue Trend</h2>
                </div>
              </div>
              
              <div className="flex-1 w-full h-full">
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.3} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(val) => `Rp${(val/1000).toFixed(0)}k`} />
                      <Tooltip content={<CustomTooltip />} />
                      <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full opacity-50">
                    <BarChart3 className="h-10 w-10 text-gray-500 mb-3" />
                    <p className="text-sm">No data available for this period.</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Top Products */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
              <div className="flex items-center gap-2 mb-6">
                <Star className="h-5 w-5 text-amber-500" />
                <h2 className="text-lg font-bold">Top Performing SKUs</h2>
              </div>
              
              <div className="space-y-0">
                {analytics?.topProducts?.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-bold text-gray-400 w-4">{index + 1}</span>
                      <div>
                        <p className="font-semibold text-sm line-clamp-1">{product.name || 'Product'}</p>
                        <p className="text-xs text-gray-500 mt-0.5">{product.totalSold || 0} units</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-mono font-bold text-sm text-emerald-600 dark:text-emerald-400">
                        {formatCurrency(product.revenue || 0)}
                      </p>
                    </div>
                  </div>
                ))}
                {(!analytics?.topProducts || analytics.topProducts.length === 0) && (
                  <div className="text-center py-8 opacity-50">
                    <p className="text-sm">No products sold yet.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Customer Breakdown */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm md:col-span-2">
              <div className="flex items-center gap-2 mb-6">
                <Users className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-bold">Customer Retention</h3>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="flex-1 w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 p-5 rounded-lg flex flex-col justify-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">New Customers</p>
                  <p className="text-3xl font-mono font-bold text-gray-900 dark:text-white">
                    {customers?.newCustomers || 0}
                  </p>
                </div>
                <div className="flex-1 w-full bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 p-5 rounded-lg flex flex-col justify-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Returning Customers</p>
                  <div className="flex items-center gap-3">
                    <p className="text-3xl font-mono font-bold text-gray-900 dark:text-white">
                      {customers?.returningCustomers || 0}
                    </p>
                    {customers?.returningCustomers > 0 && (
                      <span className="flex items-center text-xs font-bold text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        Loyal
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </motion.div>

            {/* Orders By Status */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
              <h3 className="text-lg font-bold mb-6">Order Status</h3>
              <div className="space-y-3">
                {Object.entries(analytics?.ordersByStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center text-sm py-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        status === 'completed' || status === 'delivered' ? 'bg-emerald-500' :
                        status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
                      }`} />
                      <span className="capitalize font-semibold text-gray-700 dark:text-gray-300">{status}</span>
                    </div>
                    <span className="font-mono font-bold">{count}</span>
                  </div>
                ))}
                {Object.keys(analytics?.ordersByStatus || {}).length === 0 && (
                  <p className="text-sm text-center opacity-50 py-4">No order statuses.</p>
                )}
              </div>
            </motion.div>
          </div>

          {/* Product Performance Table */}
          <motion.div variants={itemVariants} className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-gray-200 dark:border-gray-800">
              <h2 className="text-lg font-bold flex items-center gap-2">
                <Package className="h-5 w-5 text-gray-400" />
                Inventory Ledger
              </h2>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-[#1a1a1a] text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4">Item</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Sold</th>
                    <th className="px-6 py-4 text-right">Revenue</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {(products || []).map((product, index) => (
                    <tr key={index} className="hover:bg-gray-50 dark:hover:bg-[#161616] transition-colors">
                      <td className="px-6 py-4 font-semibold text-gray-900 dark:text-gray-100">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 font-mono text-gray-500 dark:text-gray-400">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                          product.stock > 10 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 
                          product.stock > 0 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 
                          'bg-red-500/10 text-red-600 dark:text-red-400'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 font-mono">
                        {product.soldCount}
                      </td>
                      <td className="px-6 py-4 font-mono font-bold text-emerald-600 dark:text-emerald-400 text-right">
                        {formatCurrency(product.revenue)}
                      </td>
                    </tr>
                  ))}
                  {(!products || products.length === 0) && (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                        No ledger data available.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          {/* AI Financial Consultant Section */}
          <AIConsultantWidget period={period} analytics={analytics} sales={sales} customers={customers} products={products} />

        </motion.div>
      </div>
    </div>
  );
};

export default SellerAnalyticsPage;
