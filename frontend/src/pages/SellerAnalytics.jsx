import { useState, useEffect, useRef } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useSellerAnalyticsStore } from '../store/sellerAnalyticsStore';
import { BarChart3, TrendingUp, DollarSign, Package, Star, Users, ShoppingBag, MessageSquare, Send, Bot, Calendar, ChevronDown, ChevronUp, Sparkles, Activity } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../utils/api';
import { motion, AnimatePresence } from 'framer-motion';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
    }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' } }
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
      setChatHistory((prev) => [...prev, { role: 'ai', content: 'Sorry, I am having trouble connecting right now. Please try again later.' }]);
    } finally {
      setIsChatLoading(false);
    }
  };

  return (
    <motion.div variants={itemVariants} className="endfield-card bg-card/80 p-0 overflow-hidden mt-8 border border-primary/20 hover:border-primary/40 transition-colors relative">
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-purple-500/5 z-0 pointer-events-none" />
      
      <div className="p-6 md:p-8 relative z-10 flex flex-col h-[500px]">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-border/50">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full animate-pulse-glow" />
            <div className="relative h-12 w-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center border border-primary/30">
              <Sparkles className="h-6 w-6 text-primary" />
            </div>
          </div>
          <div>
            <h2 className="font-display text-xl font-bold tracking-wide flex items-center gap-2">
              AI Financial Consultant
              <span className="text-[10px] font-mono bg-primary/20 text-primary px-2 py-0.5 rounded-full uppercase tracking-wider">Beta</span>
            </h2>
            <p className="text-sm text-muted-foreground mt-1">Chat with your AI assistant to analyze sales, margins, and trends.</p>
          </div>
        </div>

        <div 
          ref={scrollRef}
          className="flex-1 overflow-y-auto pr-2 space-y-4 mb-6 custom-scrollbar"
        >
          {chatHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground opacity-70">
              <Bot className="h-12 w-12 mb-4 opacity-50" />
              <p className="font-medium text-foreground">I'm ready to analyze your data.</p>
              <p className="text-sm mt-1">Try asking: "Which product is generating the most revenue?"</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {chatHistory.map((msg, idx) => (
                <motion.div 
                  key={idx}
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] md:max-w-[75%] p-4 rounded-2xl ${
                    msg.role === 'user' 
                      ? 'bg-primary text-primary-foreground rounded-tr-sm shadow-lg shadow-primary/20' 
                      : 'bg-surface border border-border/50 rounded-tl-sm'
                  }`}>
                    {msg.role === 'user' ? (
                      <p className="text-sm leading-relaxed">{msg.content}</p>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none text-sm leading-relaxed prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-border">
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
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-start"
            >
              <div className="bg-surface border border-border/50 p-4 rounded-2xl rounded-tl-sm flex items-center gap-2">
                <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" />
                <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-1.5 h-1.5 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </motion.div>
          )}
        </div>

        <div className="relative mt-auto">
          <input
            type="text"
            value={chatQuery}
            onChange={(e) => setChatQuery(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
            placeholder="Ask a question about your business..."
            className="w-full bg-surface border border-border/50 text-foreground rounded-xl pl-4 pr-14 py-4 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all placeholder:text-muted-foreground/50 shadow-inner"
          />
          <button
            onClick={handleAskAI}
            disabled={isChatLoading || !chatQuery.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:hover:bg-primary text-primary-foreground p-2 rounded-lg transition-all shadow-md flex items-center justify-center"
          >
            <Send className="h-4 w-4 ml-0.5" />
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

  const stats = [
    {
      label: t('analytics.totalRevenue') || 'Total Revenue',
      value: analytics?.totalRevenue ? formatCurrency(analytics.totalRevenue) : formatCurrency(0),
      icon: DollarSign,
      color: 'from-emerald-400 to-green-600',
      bgClass: 'bg-green-500/10 border-green-500/20 text-green-500'
    },
    {
      label: t('analytics.orders') || 'Total Orders',
      value: analytics?.orderCount || 0,
      icon: ShoppingBag,
      color: 'from-blue-400 to-indigo-600',
      bgClass: 'bg-blue-500/10 border-blue-500/20 text-blue-500'
    },
    {
      label: t('analytics.products') || 'Active Products',
      value: analytics?.productCount || 0,
      icon: Package,
      color: 'from-purple-400 to-purple-600',
      bgClass: 'bg-purple-500/10 border-purple-500/20 text-purple-500'
    },
    {
      label: t('analytics.rating') || 'Store Rating',
      value: analytics?.avgRating ? analytics.avgRating.toFixed(1) : '0.0',
      icon: Star,
      color: 'from-amber-400 to-orange-500',
      bgClass: 'bg-orange-500/10 border-orange-500/20 text-orange-500'
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10"
        >
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold tracking-tight flex items-center gap-3">
              <Activity className="h-8 w-8 text-primary" />
              {t('analytics.title') || 'Analytics Dashboard'}
            </h1>
            <p className="text-muted-foreground mt-2">Track your business performance and AI insights.</p>
          </div>
          
          <div className="relative inline-flex items-center bg-surface border border-border/50 rounded-lg p-1 shadow-sm">
            <Calendar className="absolute left-3 h-4 w-4 text-muted-foreground pointer-events-none" />
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              className="appearance-none bg-transparent pl-9 pr-10 py-2 text-sm font-medium focus:outline-none cursor-pointer"
            >
              <option value="7">{t('analytics.7days') || 'Last 7 Days'}</option>
              <option value="30">{t('analytics.30days') || 'Last 30 Days'}</option>
              <option value="90">{t('analytics.90days') || 'Last 90 Days'}</option>
            </select>
            <ChevronDown className="absolute right-3 h-4 w-4 text-muted-foreground pointer-events-none" />
          </div>
        </motion.div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="space-y-8"
        >
          {/* Top Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
                className="endfield-card bg-card p-6 relative overflow-hidden group cursor-default"
              >
                <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full opacity-20 blur-2xl transition-opacity group-hover:opacity-40 bg-gradient-to-br ${stat.color}`} />
                
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-xl border ${stat.bgClass}`}>
                    <stat.icon className="h-5 w-5" />
                  </div>
                </div>
                
                <p className="text-sm font-medium text-muted-foreground mb-1 tracking-wide">{stat.label}</p>
                <h3 className="font-display text-2xl md:text-3xl font-bold tracking-tight">{stat.value}</h3>
              </motion.div>
            ))}
          </div>

          {/* Charts Row */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Revenue Chart */}
            <motion.div variants={itemVariants} className="lg:col-span-2 endfield-card bg-card p-6 md:p-8 flex flex-col">
              <div className="flex items-center gap-2 mb-8">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="font-display text-xl font-bold tracking-wide">
                  {t('analytics.revenueChart') || 'Revenue Trend'}
                </h2>
              </div>
              
              <div className="flex-1 space-y-5">
                {(sales?.recentDays || []).slice(0, 7).map((day, index) => (
                  <div key={index} className="flex items-center gap-4 group">
                    <span className="text-xs font-mono text-muted-foreground w-16 opacity-70">
                      {day._id?.month}/{day._id?.day}
                    </span>
                    <div className="flex-1 h-3 md:h-4 bg-surface rounded-full overflow-hidden border border-border/50 relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.max(Math.min((day.revenue / (analytics?.totalRevenue || 1)) * 100 * 7, 100), 2)}%` }}
                        transition={{ duration: 1, delay: index * 0.1, ease: "easeOut" }}
                        className="absolute top-0 left-0 h-full bg-gradient-to-r from-primary to-indigo-400 rounded-full group-hover:from-primary group-hover:to-purple-400 transition-colors"
                      />
                    </div>
                    <span className="text-sm font-semibold w-24 text-right tabular-nums">
                      {formatCurrency(day.revenue || 0)}
                    </span>
                  </div>
                ))}
                {(!sales?.recentDays || sales.recentDays.length === 0) && (
                  <div className="flex flex-col items-center justify-center py-10 opacity-50">
                    <BarChart3 className="h-10 w-10 text-muted-foreground mb-3" />
                    <p className="text-sm font-medium">{t('analytics.noData') || 'No sales data available yet.'}</p>
                  </div>
                )}
              </div>
            </motion.div>

            {/* Top Products */}
            <motion.div variants={itemVariants} className="endfield-card bg-card p-6 md:p-8">
              <div className="flex items-center gap-2 mb-6">
                <Star className="h-5 w-5 text-amber-500" />
                <h2 className="font-display text-xl font-bold tracking-wide">
                  {t('analytics.topProducts') || 'Top Sellers'}
                </h2>
              </div>
              
              <div className="space-y-4">
                {analytics?.topProducts?.map((product, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 rounded-xl bg-surface/50 border border-border/30 hover:bg-surface transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary font-bold text-sm">
                        #{index + 1}
                      </div>
                      <div>
                        <p className="font-medium text-sm line-clamp-1">
                          {product.name || 'Product'}
                        </p>
                        <p className="text-xs text-muted-foreground mt-0.5 font-mono">
                          {product.totalSold || 0} units
                        </p>
                      </div>
                    </div>
                    <p className="font-semibold text-sm tracking-tight text-emerald-500">
                      {formatCurrency(product.revenue || 0)}
                    </p>
                  </div>
                ))}
                {(!analytics?.topProducts || analytics.topProducts.length === 0) && (
                  <div className="text-center py-8 opacity-50">
                    <p className="text-sm font-medium">{t('analytics.noData') || 'No products sold yet.'}</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Product Performance Table */}
          <motion.div variants={itemVariants} className="endfield-card bg-card p-0 overflow-hidden">
            <div className="p-6 md:p-8 border-b border-border/50">
              <h2 className="font-display text-xl font-bold tracking-wide flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                {t('analytics.productPerformance') || 'Performance Matrix'}
              </h2>
            </div>
            
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-surface/50 border-b border-border/50">
                    <th className="px-6 py-4 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">Product</th>
                    <th className="px-6 py-4 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">Price</th>
                    <th className="px-6 py-4 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">Stock</th>
                    <th className="px-6 py-4 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">Sold</th>
                    <th className="px-6 py-4 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">Revenue</th>
                    <th className="px-6 py-4 text-left font-mono text-xs uppercase tracking-wider text-muted-foreground">Views</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/30">
                  {(products || []).map((product, index) => (
                    <tr
                      key={index}
                      className="hover:bg-surface/30 transition-colors group"
                    >
                      <td className="px-6 py-4 font-medium text-foreground group-hover:text-primary transition-colors">
                        {product.name}
                      </td>
                      <td className="px-6 py-4 tabular-nums text-muted-foreground">
                        {formatCurrency(product.price)}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${
                          product.stock > 10 ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 
                          product.stock > 0 ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : 
                          'bg-red-500/10 text-red-500 border-red-500/20'
                        }`}>
                          {product.stock}
                        </span>
                      </td>
                      <td className="px-6 py-4 tabular-nums">
                        {product.soldCount}
                      </td>
                      <td className="px-6 py-4 tabular-nums font-semibold text-foreground">
                        {formatCurrency(product.revenue)}
                      </td>
                      <td className="px-6 py-4 tabular-nums text-muted-foreground flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                        {product.viewCount}
                      </td>
                    </tr>
                  ))}
                  {(!products || products.length === 0) && (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-muted-foreground opacity-60">
                        {t('analytics.noData') || 'No product data available for the selected period.'}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Orders By Status */}
            <motion.div variants={itemVariants} className="endfield-card bg-card p-6 md:p-8">
              <h3 className="font-display text-lg font-bold tracking-wide mb-6">
                {t('analytics.ordersByStatus') || 'Order Status'}
              </h3>
              <div className="space-y-4">
                {Object.entries(analytics?.ordersByStatus || {}).map(([status, count]) => (
                  <div key={status} className="flex justify-between items-center text-sm p-3 rounded-lg bg-surface/50 border border-border/30">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        status === 'completed' || status === 'delivered' ? 'bg-emerald-500' :
                        status === 'cancelled' ? 'bg-red-500' : 'bg-amber-500'
                      }`} />
                      <span className="capitalize font-medium">{status}</span>
                    </div>
                    <span className="font-bold bg-background px-2.5 py-0.5 rounded-md border border-border">{count}</span>
                  </div>
                ))}
                {Object.keys(analytics?.ordersByStatus || {}).length === 0 && (
                  <p className="text-sm text-center opacity-50 py-4">No order statuses to display.</p>
                )}
              </div>
            </motion.div>

            {/* Customer Breakdown */}
            <motion.div variants={itemVariants} className="endfield-card bg-card p-6 md:p-8 md:col-span-2 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <h3 className="font-display text-lg font-bold tracking-wide mb-6 relative z-10 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                {t('analytics.customerBreakdown') || 'Customer Insights'}
              </h3>
              <div className="flex flex-col sm:flex-row items-center gap-6 relative z-10">
                <div className="flex-1 w-full bg-surface/80 backdrop-blur-sm border border-border/50 p-6 rounded-2xl flex flex-col items-center justify-center text-center group hover:border-blue-500/30 transition-colors">
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">{t('analytics.newCustomers') || 'New Customers'}</p>
                  <p className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-blue-400 to-blue-600 group-hover:scale-110 transition-transform">
                    {customers?.newCustomers || 0}
                  </p>
                </div>
                <div className="flex-1 w-full bg-surface/80 backdrop-blur-sm border border-border/50 p-6 rounded-2xl flex flex-col items-center justify-center text-center group hover:border-emerald-500/30 transition-colors">
                  <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground mb-2">{t('analytics.returningCustomers') || 'Returning Customers'}</p>
                  <p className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-br from-emerald-400 to-emerald-600 group-hover:scale-110 transition-transform">
                    {customers?.returningCustomers || 0}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* AI Financial Consultant Section */}
          <AIConsultantWidget period={period} analytics={analytics} sales={sales} customers={customers} products={products} />

        </motion.div>
      </div>
    </div>
  );
};

export default SellerAnalyticsPage;
