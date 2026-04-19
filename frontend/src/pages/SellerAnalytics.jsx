import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useSellerAnalyticsStore } from '../store/sellerAnalyticsStore';
import { BarChart3, TrendingUp, DollarSign, Package, Star, Users, ShoppingBag, MessageSquare, Send, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import api from '../utils/api';

const AIConsultantWidget = ({ period, analytics, sales, customers, products }) => {
  const [chatQuery, setChatQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [isChatLoading, setIsChatLoading] = useState(false);

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
    <div className="mt-6 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-100 dark:border-gray-700">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
          <Bot className="h-6 w-6 text-purple-600 dark:text-purple-400" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">AI Financial Consultant</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Ask questions about your sales, margins, or inventory.</p>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 h-80 overflow-y-auto mb-4 border border-gray-200 dark:border-gray-700 flex flex-col gap-4">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 dark:text-gray-400">
            <MessageSquare className="h-10 w-10 mb-2 opacity-20" />
            <p>Hello! I am your AI Business Analyst.</p>
            <p className="text-sm">Try asking: "What was my most profitable product this month?"</p>
          </div>
        ) : (
          chatHistory.map((msg, idx) => (
            <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-none shadow-sm'}`}>
                {msg.role === 'user' ? (
                  msg.content
                ) : (
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <ReactMarkdown>{msg.content}</ReactMarkdown>
                  </div>
                )}
              </div>
            </div>
          ))
        )}
        {isChatLoading && (
          <div className="flex justify-start">
            <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-3 rounded-2xl rounded-bl-none shadow-sm">
              <div className="flex gap-1 items-center">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2">
        <input
          type="text"
          value={chatQuery}
          onChange={(e) => setChatQuery(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAskAI()}
          placeholder="Ask me anything about your business..."
          className="flex-1 bg-gray-50 dark:bg-gray-900 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleAskAI}
          disabled={isChatLoading || !chatQuery.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white p-3 rounded-lg flex items-center justify-center transition-colors"
        >
          <Send className="h-5 w-5" />
        </button>
      </div>
    </div>
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
    }).format(value);
  };

  const stats = [
    {
      label: t('analytics.totalRevenue'),
      value: analytics?.totalRevenue ? formatCurrency(analytics.totalRevenue) : formatCurrency(0),
      icon: DollarSign,
      color: 'text-green-600',
    },
    {
      label: t('analytics.orders'),
      value: analytics?.orderCount || 0,
      icon: ShoppingBag,
      color: 'text-blue-600',
    },
    {
      label: t('analytics.products'),
      value: analytics?.productCount || 0,
      icon: Package,
      color: 'text-purple-600',
    },
    {
      label: t('analytics.rating'),
      value: analytics?.avgRating ? analytics.avgRating.toFixed(1) : '0.0',
      icon: Star,
      color: 'text-yellow-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6" />
            {t('analytics.title')}
          </h1>
          <select
            value={period}
            onChange={(e) => setPeriod(e.target.value)}
            className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
          >
            <option value="7">{t('analytics.7days')}</option>
            <option value="30">{t('analytics.30days')}</option>
            <option value="90">{t('analytics.90days')}</option>
          </select>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {stats.map((stat, index) => (
            <div
              key={index}
              className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm"
            >
              <div className="flex items-center justify-between mb-2">
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{stat.label}</p>
              <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              {t('analytics.revenueChart')}
            </h2>
            <div className="space-y-2">
              {(sales || []).slice(0, 7).map((day, index) => (
                <div key={index} className="flex items-center gap-2">
                  <span className="text-sm text-gray-500 dark:text-gray-400 w-20">
                    {day._id?.month}/{day._id?.day}
                  </span>
                  <div className="flex-1 h-6 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded"
                      style={{
                        width: `${Math.min((day.revenue / (analytics?.totalRevenue || 1)) * 100 * 7, 100)}%`,
                      }}
                    />
                  </div>
                  <span className="text-sm text-gray-900 dark:text-white w-24 text-right">
                    {formatCurrency(day.revenue || 0)}
                  </span>
                </div>
              ))}
              {sales.length === 0 && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  {t('analytics.noData')}
                </p>
              )}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <Users className="h-5 w-5" />
              {t('analytics.topProducts')}
            </h2>
            <div className="space-y-3">
              {analytics?.topProducts?.map((product, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between p-2 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {product.name || 'Product'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {product.totalSold || 0} sold
                    </p>
                  </div>
                  <p className="font-semibold text-green-600 dark:text-green-400">
                    {formatCurrency(product.revenue || 0)}
                  </p>
                </div>
              ))}
              {(!analytics?.topProducts || analytics.topProducts.length === 0) && (
                <p className="text-gray-500 dark:text-gray-400 text-center py-4">
                  {t('analytics.noData')}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('analytics.productPerformance')}
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    Product
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    Price
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    Stock
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    Sold
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    Revenue
                  </th>
                  <th className="px-4 py-2 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    Views
                  </th>
                </tr>
              </thead>
              <tbody>
                {(products || []).map((product, index) => (
                  <tr
                    key={index}
                    className="border-t border-gray-100 dark:border-gray-700"
                  >
                    <td className="px-4 py-2 text-gray-900 dark:text-white">
                      {product.name}
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-white">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-white">
                      {product.stock}
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-white">
                      {product.soldCount}
                    </td>
                    <td className="px-4 py-2 text-green-600 dark:text-green-400">
                      {formatCurrency(product.revenue)}
                    </td>
                    <td className="px-4 py-2 text-gray-900 dark:text-white">
                      {product.viewCount}
                    </td>
                  </tr>
                ))}
                {products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="px-4 py-4 text-center text-gray-500 dark:text-gray-400">
                      {t('analytics.noData')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {t('analytics.ordersByStatus')}
            </h3>
            <div className="space-y-2">
              {Object.entries(analytics?.ordersByStatus || {}).map(([status, count]) => (
                <div key={status} className="flex justify-between text-sm">
                  <span className="text-gray-500 dark:text-gray-400 capitalize">{status}</span>
                  <span className="font-medium text-gray-900 dark:text-white">{count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm md:col-span-2">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-2">
              {t('analytics.customerBreakdown')}
            </h3>
            <div className="flex items-center gap-4">
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('analytics.newCustomers')}</p>
                <p className="text-2xl font-bold text-blue-600">{customers?.newCustomers || 0}</p>
              </div>
              <div className="flex-1">
                <p className="text-sm text-gray-500 dark:text-gray-400">{t('analytics.returningCustomers')}</p>
                <p className="text-2xl font-bold text-green-600">{customers?.returningCustomers || 0}</p>
              </div>
            </div>
          </div>
        </div>

        {/* AI Financial Consultant Section */}
        <AIConsultantWidget period={period} analytics={analytics} sales={sales} customers={customers} products={products} />

      </div>
    </div>
  );
};

export default SellerAnalyticsPage;
