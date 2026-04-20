import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Plus, Edit2, Trash2, Package, TrendingUp, DollarSign, ShoppingBag, Save, X, AlertTriangle, 
  BarChart3, Crown, CreditCard, CheckCircle, Clock, Sparkles, Send, Bot, Calendar, ArrowUpRight, 
  ChevronDown, Activity, Terminal, Star, Users, Building2
} from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../hooks/useTranslation';
import { useSellerAnalyticsStore } from '../store/sellerAnalyticsStore';
import api from '../utils/api';
import { resolveImageUrl } from '@/utils/imageUrl';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import PromoManager from '@/components/PromoManager';
import ReactMarkdown from 'react-markdown';
import { motion, AnimatePresence } from 'framer-motion';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';

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
    <motion.div variants={itemVariants} className="bg-[#1e1e1e] rounded-xl overflow-hidden mb-8 border border-gray-800 shadow-xl flex flex-col h-[500px] text-gray-300 font-mono">
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

function SellerDashboard() {
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const sellerId = user?._id || user?.id;

  const [period, setPeriod] = useState('30');
  const {
    analytics,
    sales,
    customers,
    products: analyticsProducts,
    fetchSellerAnalytics,
    fetchSales,
    fetchCustomers,
    fetchProductPerformance,
  } = useSellerAnalyticsStore();

  useEffect(() => {
    // Always fetch analytics - use mock data if not logged in as seller
    fetchSellerAnalytics(period);
    fetchSales(period);
    fetchCustomers();
    fetchProductPerformance();
  }, [period]);

  // Edit state
  const [editingProduct, setEditingProduct] = useState(null);
  const [editValues, setEditValues] = useState({ price: 0, stock: 0 });
  const [confirmModal, setConfirmModal] = useState({ show: false, productId: null, productName: '' });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['sellerProducts', sellerId],
    queryFn: async () => {
      if (!sellerId) return [];
      const response = await api.get(`/products/seller/${sellerId}`);
      return response.data;
    },
    enabled: !!sellerId,
  });

  const { data: orders } = useQuery({
    queryKey: ['sellerOrders', sellerId],
    queryFn: async () => {
      const response = await api.get('/orders/my-orders');
      return response.data;
    },
    enabled: !!sellerId,
  });

  const { data: membership, refetch: refetchMembership } = useQuery({
    queryKey: ['membership'],
    queryFn: async () => {
      const response = await api.get('/users/membership/status');
      return response.data;
    },
  });

  const { data: wallet, refetch: refetchWallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await api.get('/wallet');
      return response.data;
    },
  });

  const [showBankDialog, setShowBankDialog] = useState(false);
  const [bankDetails, setBankDetails] = useState({ bankName: '', accountNumber: '', accountHolder: '' });

  const updateBankMutation = useMutation({
    mutationFn: async (data) => {
      const response = await api.put('/wallet/bank-account', data);
      return response.data;
    },
    onSuccess: () => {
      setShowBankDialog(false);
      refetchWallet();
      setBankDetails({ bankName: '', accountNumber: '', accountHolder: '' });
    },
    onError: (error) => {
      alert(`Failed to save bank details: ${error.response?.data?.error || error.message}`);
    },
  });

  const deleteBankMutation = useMutation({
    mutationFn: async () => {
      await api.delete('/wallet/bank-account');
    },
    onSuccess: () => {
      refetchWallet();
    },
    onError: (error) => {
      alert(`Failed to remove bank details: ${error.response?.data?.error || error.message}`);
    },
  });

  const handleBankSubmit = (e) => {
    e.preventDefault();
    updateBankMutation.mutate(bankDetails);
  };

  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [paymentFile, setPaymentFile] = useState(null);

  const uploadPaymentMutation = useMutation({
    mutationFn: async (formData) => {
      const response = await api.post('/users/membership/payment', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      setShowPaymentDialog(false);
      setPaymentFile(null);
      refetchMembership();
      alert('Payment submitted! Please wait for admin approval.');
    },
    onError: (error) => {
      alert(`Failed to upload: ${error.response?.data?.error || error.message}`);
    },
  });

  const handlePaymentSubmit = (e) => {
    e.preventDefault();
    if (!paymentFile) {
      alert('Please select a payment proof image');
      return;
    }
    const formData = new FormData();
    formData.append('paymentProof', paymentFile);
    uploadPaymentMutation.mutate(formData);
  };

  const deleteMutation = useMutation({
    mutationFn: async (productId) => {
      await api.delete(`/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellerProducts', sellerId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ productId, data }) => {
      const response = await api.put(`/products/${productId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellerProducts', sellerId] });
      setEditingProduct(null);
      setConfirmModal({ show: false, productId: null, productName: '' });
    },
    onError: (error) => {
      alert(`Failed to update: ${error.response?.data?.message || error.message}`);
    },
  });

  const startEditing = (product) => {
    setEditingProduct(product._id);
    setEditValues({ price: product.price, stock: product.stock });
  };

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      await api.put(`/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellerOrders', sellerId] });
      queryClient.invalidateQueries({ queryKey: ['sellerProductTracking', sellerId] });
    },
    onError: (error) => {
      alert(`Failed to update status: ${error.response?.data?.message || error.message}`);
    },
  });

  const getNextStatus = (currentStatus) => {
    const statusFlow = ['pending', 'confirmed', 'preparing', 'ready', 'delivered'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex < statusFlow.length - 1) {
      return statusFlow[currentIndex + 1];
    }
    return null;
  };

  const getStatusLabel = (status) => {
    const labels = {
      pending: 'Pending',
      confirmed: 'Confirmed',
      preparing: 'Preparing',
      ready: 'Ready',
      delivered: 'Delivered',
      cancelled: 'Cancelled'
    };
    return labels[status] || status;
  };

  const cancelEditing = () => {
    setEditingProduct(null);
    setEditValues({ price: 0, stock: 0 });
  };

  const showConfirmation = (productId, productName) => {
    setConfirmModal({ show: true, productId, productName });
  };

  const confirmUpdate = () => {
    updateMutation.mutate({
      productId: confirmModal.productId,
      data: {
        price: Number(editValues.price),
        stock: Number(editValues.stock),
      },
    });
  };

  if (!user) {
    return (
      <div className="access-denied container py-12 text-center">
        <h2 className="text-2xl font-bold mb-4">{t('seller.pleaseLogin')}</h2>
        <p className="mb-4">{t('seller.loginRequired')}</p>
        <Link to="/login" className="inline-flex items-center px-4 py-2 rounded-md bg-primary text-primary-foreground hover:bg-primary/90">
          {t('auth.login')}
        </Link>
      </div>
    );
  }

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(amount || 0);

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
      {/* Confirmation Modal */}
      {confirmModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-lg p-6 max-w-md w-full shadow-2xl">
            <div className="flex justify-center mb-4 text-orange-500">
              <AlertTriangle size={48} />
            </div>
            <h3 className="text-xl font-bold text-center mb-2">{t('seller.confirmChanges')}</h3>
            <p className="text-center text-gray-500 dark:text-gray-400 mb-4">{t('seller.aboutToUpdate')} <strong className="text-gray-900 dark:text-white">{confirmModal.productName}</strong>:</p>
            <div className="bg-gray-100 dark:bg-[#121212] p-4 rounded-md mb-4 space-y-2 border border-gray-200 dark:border-gray-800">
              <div className="flex justify-between">
                <span className="text-gray-500">Price:</span>
                <strong className="font-mono text-emerald-600">{formatCurrency(editValues.price)}</strong>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-500">Stock:</span>
                <strong className="font-mono text-blue-500">{editValues.stock} units</strong>
              </div>
            </div>
            <p className="text-sm text-gray-500 text-center mb-6">{t('seller.updateWarning')}</p>
            <div className="flex gap-4">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setConfirmModal({ show: false, productId: null, productName: '' })}
                disabled={updateMutation.isPending}
              >
                Cancel
              </Button>
              <Button
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white"
                onClick={confirmUpdate}
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? 'Updating...' : 'Confirm'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto p-4 md:p-8">
        
        {/* Header & Membership */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-emerald-500 mb-1">Seller Command Center</p>
              <h1 className="text-3xl font-bold tracking-tight">Welcome, {user.businessName || user.name}!</h1>
            </div>
            <div className="flex gap-2 flex-wrap">
              <Link to="/seller/product-tracking" className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#252525] rounded-md transition-colors shadow-sm">
                <BarChart3 size={16} /> Deliveries
              </Link>
              <Link to="/logo-generator" className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#252525] rounded-md transition-colors shadow-sm">
                <Sparkles size={16} /> Logo
                {!membership?.isMember && <Crown size={12} className="text-amber-500" />}
              </Link>
              <Link to="/automation" className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1a1a1a] hover:bg-gray-50 dark:hover:bg-[#252525] rounded-md transition-colors shadow-sm">
                <Activity size={16} /> Automation
                {!membership?.isMember && <Crown size={12} className="text-amber-500" />}
              </Link>
              <Link to="/seller/add-product" className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-500 shadow-sm transition-colors">
                <Plus size={16} /> Add Product
              </Link>
            </div>
          </div>

          <Card className={membership?.isMember ? "border-amber-500/50 bg-amber-50 dark:bg-amber-900/10 shadow-sm" : "border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-900/10 shadow-sm"}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Crown className={`h-6 w-6 ${membership?.isMember ? 'text-amber-500' : 'text-gray-400'}`} />
                  <CardTitle className="text-lg">
                    {membership?.isMember ? 'Premium Member' : 'Upgrade to Premium'}
                  </CardTitle>
                </div>
                {membership?.isMember && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-amber-500 text-white shadow-sm">
                    <CheckCircle className="h-3 w-3" /> Active
                  </span>
                )}
                {!membership?.isMember && membership?.membershipStatus === 'pending' && (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded text-xs font-bold bg-orange-500 text-white shadow-sm">
                    <Clock className="h-3 w-3" /> Pending Approval
                  </span>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {membership?.isMember ? (
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-300">
                      Your membership is active until <span className="font-bold">{new Date(membership.memberExpiry).toLocaleDateString()}</span>
                    </p>
                  </div>
                  <div className="text-sm font-bold text-amber-600 dark:text-amber-500">
                    Unlimited product listings enabled
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                    Upgrade to premium for <span className="font-bold text-gray-900 dark:text-white">Rp 10.000/month</span> to unlock unlimited listings and priority search.
                  </p>
                  <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
                    <DialogTrigger asChild>
                      <Button className="gap-2 bg-blue-600 hover:bg-blue-500 text-white">
                        <CreditCard className="h-4 w-4" /> Pay Rp 10.000
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="dark:bg-[#1a1a1a] dark:border-gray-800">
                      <DialogHeader>
                        <DialogTitle>Submit Payment Proof</DialogTitle>
                      </DialogHeader>
                      <form onSubmit={handlePaymentSubmit} className="space-y-4">
                        <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-lg border border-amber-200 dark:border-amber-900/50">
                          <p className="text-sm font-medium mb-2 text-gray-700 dark:text-gray-300">Transfer to:</p>
                          <p className="text-xl font-bold font-mono text-gray-900 dark:text-white">Bank BCA 1234567890</p>
                          <p className="text-sm text-gray-500">a/n MSME Marketplace</p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium mb-2">Upload Payment Proof</label>
                          <input type="file" accept="image/*" onChange={(e) => setPaymentFile(e.target.files[0])} className="w-full border dark:border-gray-700 rounded-md p-2 bg-transparent" required />
                        </div>
                        <Button type="submit" className="w-full" disabled={uploadPaymentMutation.isPending}>
                          {uploadPaymentMutation.isPending ? 'Submitting...' : 'Submit Payment Proof'}
                        </Button>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              )}
            </CardContent>
          </Card>
        </motion.div>

        {/* Unified Analytics Section */}
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold flex items-center gap-2">
            <Activity className="h-5 w-5 text-emerald-500" /> Financial Overview
          </h2>
          <div className="relative inline-flex items-center bg-white dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 rounded-md p-1 shadow-sm">
            <Calendar className="absolute left-3 h-4 w-4 text-gray-400 pointer-events-none" />
            <select value={period} onChange={(e) => setPeriod(e.target.value)} className="appearance-none bg-transparent pl-9 pr-10 py-1 text-sm font-semibold focus:outline-none cursor-pointer dark:text-white">
              <option value="7">7 Days</option>
              <option value="30">30 Days</option>
              <option value="90">90 Days</option>
            </select>
            <ChevronDown className="absolute right-3 h-4 w-4 text-gray-400 pointer-events-none" />
          </div>
        </div>

        <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6 mb-8">
          {/* Top Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => (
              <motion.div key={index} variants={itemVariants} className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{stat.label}</p>
                  <div className={`p-2 rounded-lg ${stat.bgClass}`}>
                    <stat.icon className={`h-4 w-4 ${stat.color}`} />
                  </div>
                </div>
                <div className="flex items-end gap-2">
                  <h3 className="text-2xl font-bold font-mono tracking-tight">{stat.value}</h3>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Revenue Chart */}
            <motion.div variants={itemVariants} className="lg:col-span-2 bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex flex-col min-h-[350px]">
              <div className="flex items-center gap-2 mb-6">
                <TrendingUp className="h-5 w-5 text-emerald-500" />
                <h3 className="text-lg font-bold">Revenue Trend</h3>
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
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#333" opacity={0.2} />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} dy={10} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#888' }} tickFormatter={(val) => `Rp${(val/1000).toFixed(0)}k`} />
                      <RechartsTooltip content={<CustomTooltip />} />
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

            {/* Customer Breakdown */}
            <motion.div variants={itemVariants} className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm flex flex-col">
              <div className="flex items-center gap-2 mb-6">
                <Users className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-bold">Customer Retention</h3>
              </div>
              <div className="space-y-4 flex-1 flex flex-col justify-center">
                <div className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 p-5 rounded-lg flex flex-col items-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">New Customers</p>
                  <p className="text-3xl font-mono font-bold text-gray-900 dark:text-white">
                    {customers?.newCustomers || 0}
                  </p>
                </div>
                <div className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 p-5 rounded-lg flex flex-col items-center relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-2 opacity-20"><Star className="h-12 w-12 text-emerald-500" /></div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">Returning Customers</p>
                  <p className="text-3xl font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {customers?.returningCustomers || 0}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
          <motion.div variants={itemVariants} className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm mt-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-500" />
                <h3 className="text-lg font-bold">Payout Settings</h3>
              </div>
              {wallet?.bankAccount ? (
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" onClick={() => {
                    setBankDetails(wallet.bankAccount);
                    setShowBankDialog(true);
                  }}>Edit</Button>
                  <Button variant="destructive" size="sm" onClick={() => {
                    if (confirm('Are you sure you want to remove your payout details?')) {
                      deleteBankMutation.mutate();
                    }
                  }}>Remove</Button>
                </div>
              ) : (
                <Button size="sm" className="bg-blue-600 hover:bg-blue-500 text-white" onClick={() => setShowBankDialog(true)}>Add Details</Button>
              )}
            </div>

            {wallet?.bankAccount ? (
              <div className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 p-4 rounded-lg flex items-center gap-4">
                <div className="h-12 w-12 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded flex items-center justify-center shrink-0">
                  <CreditCard className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white uppercase">{wallet.bankAccount.bankName}</p>
                  <p className="font-mono text-gray-600 dark:text-gray-400">{wallet.bankAccount.accountNumber}</p>
                  <p className="text-sm text-gray-500 mt-1">A/N: {wallet.bankAccount.accountHolder}</p>
                </div>
              </div>
            ) : (
              <div className="bg-gray-50 dark:bg-[#1a1a1a] border border-gray-200 dark:border-gray-800 p-6 rounded-lg text-center">
                <p className="text-sm text-gray-500">No payout details added. Add your bank account to receive withdrawals.</p>
              </div>
            )}

            <Dialog open={showBankDialog} onOpenChange={setShowBankDialog}>
              <DialogContent className="dark:bg-[#1a1a1a] dark:border-gray-800">
                <DialogHeader>
                  <DialogTitle>Payout Settings</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleBankSubmit} className="space-y-4 mt-2">
                  <div>
                    <label className="block text-sm font-medium mb-1">Bank Name</label>
                    <select
                      className="w-full border dark:border-gray-700 rounded-md p-2 bg-transparent focus:outline-none focus:border-blue-500 uppercase"
                      value={bankDetails.bankName}
                      onChange={(e) => setBankDetails({...bankDetails, bankName: e.target.value})}
                      required
                    >
                      <option value="">Select Bank</option>
                      <option value="BCA">BCA</option>
                      <option value="BNI">BNI</option>
                      <option value="BRI">BRI</option>
                      <option value="Mandiri">Mandiri</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Account Number</label>
                    <input
                      type="text"
                      className="w-full border dark:border-gray-700 rounded-md p-2 bg-transparent focus:outline-none focus:border-blue-500 font-mono"
                      value={bankDetails.accountNumber}
                      onChange={(e) => setBankDetails({...bankDetails, accountNumber: e.target.value})}
                      required
                      placeholder="e.g. 1234567890"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">Account Holder Name</label>
                    <input
                      type="text"
                      className="w-full border dark:border-gray-700 rounded-md p-2 bg-transparent focus:outline-none focus:border-blue-500"
                      value={bankDetails.accountHolder}
                      onChange={(e) => setBankDetails({...bankDetails, accountHolder: e.target.value})}
                      required
                      placeholder="e.g. John Doe"
                    />
                  </div>
                  <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white" disabled={updateBankMutation.isPending}>
                    {updateBankMutation.isPending ? 'Saving...' : 'Save Payout Details'}
                  </Button>
                </form>
              </DialogContent>
            </Dialog>
          </motion.div>
        </motion.div>

        {/* AI Financial Consultant */}
        <AIConsultantWidget period={period} analytics={analytics} sales={sales} customers={customers} products={analyticsProducts} />

        <PromoManager />

        {/* Active Products Management */}
        <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden mb-8 mt-8">
          <div className="p-6 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center">
            <h2 className="text-lg font-bold flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-400" />
              Inventory Management
            </h2>
          </div>
          
          {productsLoading ? (
            <div className="py-12 text-center text-sm text-gray-500">Loading inventory data...</div>
          ) : products?.length === 0 ? (
            <div className="text-center py-12">
              <p className="mb-4 text-gray-500">No active products found.</p>
              <Link to="/seller/add-product" className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-500 text-sm font-semibold">
                <Plus size={16} /> Add First Product
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-sm text-left">
                <thead className="bg-gray-50 dark:bg-[#1a1a1a] text-xs uppercase tracking-wider font-semibold text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-800">
                  <tr>
                    <th className="px-6 py-4">Item</th>
                    <th className="px-6 py-4">Price</th>
                    <th className="px-6 py-4">Stock</th>
                    <th className="px-6 py-4">Status</th>
                    <th className="px-6 py-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-800">
                  {products?.map((product) => (
                    <tr key={product._id} className={`hover:bg-gray-50 dark:hover:bg-[#161616] transition-colors ${editingProduct === product._id ? 'bg-blue-50/50 dark:bg-blue-900/10' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded border dark:border-gray-700 overflow-hidden shrink-0 bg-gray-100 dark:bg-gray-800">
                            {product.images?.[0] ? (
                              <img src={resolveImageUrl(product.images[0])} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-xs text-gray-400">N/A</div>
                            )}
                          </div>
                          <span className="font-semibold text-gray-900 dark:text-gray-100">{product.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-mono">
                        {editingProduct === product._id ? (
                          <input
                            type="number"
                            className="w-24 p-1 border dark:border-gray-600 rounded bg-white dark:bg-[#252525] text-gray-900 dark:text-white"
                            value={editValues.price}
                            onChange={(e) => setEditValues({ ...editValues, price: e.target.value })}
                            min="0" step="0.01"
                          />
                        ) : (
                          formatCurrency(product.price)
                        )}
                      </td>
                      <td className="px-6 py-4">
                        {editingProduct === product._id ? (
                          <input
                            type="number"
                            className="w-20 p-1 border dark:border-gray-600 rounded bg-white dark:bg-[#252525] text-gray-900 dark:text-white"
                            value={editValues.stock}
                            onChange={(e) => setEditValues({ ...editValues, stock: e.target.value })}
                            min="0"
                          />
                        ) : (
                          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${
                            product.stock > 10 ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 
                            product.stock > 0 ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 
                            'bg-red-500/10 text-red-600 dark:text-red-400'
                          }`}>
                            {product.stock} Units
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-bold ${product.isAvailable ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                          {product.isAvailable ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex justify-end gap-2">
                          {editingProduct === product._id ? (
                            <>
                              <button className="p-1.5 text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 rounded transition-colors" onClick={() => showConfirmation(product._id, product.name)}>
                                <Save size={16} />
                              </button>
                              <button className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" onClick={cancelEditing}>
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button className="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition-colors" onClick={() => startEditing(product)}>
                                <Edit2 size={16} />
                              </button>
                              <button className="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors" onClick={() => {
                                if (confirm('Delete this product?')) deleteMutation.mutate(product._id);
                              }}>
                                <Trash2 size={16} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Recent Orders Action List */}
        {orders && orders.length > 0 && (
          <div className="bg-white dark:bg-[#121212] border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm p-6">
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ShoppingBag className="h-5 w-5 text-gray-400" /> Recent Orders
            </h2>
            <div className="space-y-3">
              {orders.slice(0, 5).map((order) => (
                <div key={order._id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-gray-200 dark:border-gray-800 rounded-lg bg-gray-50 dark:bg-[#1a1a1a] gap-4">
                  <div>
                    <span className="font-mono text-sm font-bold block">ORD-{order._id.slice(-8).toUpperCase()}</span>
                    <span className={`text-xs font-bold uppercase tracking-wider ${
                      order.status === 'delivered' ? 'text-emerald-500' :
                      order.status === 'cancelled' ? 'text-red-500' : 'text-amber-500'
                    }`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </div>
                  <div className="text-left md:text-right flex-1 md:flex-none">
                    <span className="block text-sm text-gray-500">{order.products.length} Items</span>
                    <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">{formatCurrency(order.totalAmount)}</span>
                  </div>
                  {getNextStatus(order.status) && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full md:w-auto text-xs font-semibold"
                      onClick={() => updateStatusMutation.mutate({ orderId: order._id, status: getNextStatus(order.status) })}
                      disabled={updateStatusMutation.isPending}
                    >
                      Mark {getStatusLabel(getNextStatus(order.status))}
                    </Button>
                  )}
                </div>
              ))}
            </div>
            <Link to="/orders" className="block mt-6 text-center text-sm font-semibold text-blue-600 hover:text-blue-500">View All Order History &rarr;</Link>
          </div>
        )}
      </div>
    </div>
  );
}

export default SellerDashboard;
