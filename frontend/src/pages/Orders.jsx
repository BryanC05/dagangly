import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import {
  Package, Clock, CheckCircle, XCircle, MapPin, Phone,
  ShoppingBag, Truck, ChefHat, CreditCard, Banknote, Store,
  Smartphone, Building2, ChevronDown, ChevronUp, Calendar,
  Navigation, FileText, Flag, User, ArrowLeft
} from 'lucide-react';
import api from '../utils/api';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from '../hooks/useTranslation';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { resolveImageUrl } from '@/utils/imageUrl';
import { OrdersListSkeleton } from '@/components/ui/skeleton';
import './Orders.css';

const statusConfig = {
  pending: { icon: Clock, color: 'var(--status-pending)', bg: 'var(--status-pending-bg)', label: 'Pending' },
  payment_pending: { icon: Clock, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.1)', label: 'Payment Pending' },
  confirmed: { icon: CheckCircle, color: 'var(--status-confirmed)', bg: 'var(--status-confirmed-bg)', label: 'Accepted' },
  preparing: { icon: ChefHat, color: 'var(--status-preparing)', bg: 'var(--status-preparing-bg)', label: 'Preparing' },
  ready: { icon: Package, color: 'var(--status-ready)', bg: 'var(--status-ready-bg)', label: 'Ready' },
  delivered: { icon: Truck, color: 'var(--status-delivered)', bg: 'var(--status-delivered-bg)', label: 'Completed' },
  cancelled: { icon: XCircle, color: 'var(--status-cancelled)', bg: 'var(--status-cancelled-bg)', label: 'Cancelled' },
  completed: { icon: CheckCircle, color: 'var(--status-delivered)', bg: 'var(--status-delivered-bg)', label: 'Order is Completed' },
};

// Helper to get status config with dynamic labels for pickup orders
const getStatusConfig = (order, user) => {
  const isPickup = order.deliveryType === 'pickup';
  const isBuyer = order.buyer?._id === user?.id;
  const config = statusConfig[order.status] || statusConfig.pending;
  
  if (order.status === 'delivered') {
    const label = isPickup ? 'Picked Up' : 'Delivered';
    // Show "Order is Completed" to buyer when pickup order is delivered
    const displayLabel = (isBuyer && isPickup) ? 'Order is Completed' : label;
    return { ...config, label: displayLabel, icon: isPickup ? CheckCircle : Truck };
  }
  
  return config;
};

// Creator email for fraud reports
const CREATOR_EMAIL = 'admin@umkm-marketplace.com';

const paymentIcons = {
  cash: { icon: Banknote, label: 'Cash on Delivery' },
  qris: { icon: Smartphone, label: 'QRIS' },
  ewallet: { icon: Smartphone, label: 'E-Wallet' },
  bank_transfer: { icon: Building2, label: 'Bank Transfer' },
  credit_card: { icon: CreditCard, label: 'Credit Card' },
};

const normalizeOrdersPayload = (payload) => {
  if (Array.isArray(payload)) return payload;
  if (Array.isArray(payload?.orders)) return payload.orders;
  return [];
};

const resolveOrderId = (order, fallback = '') => {
  if (!order) return fallback;
  if (typeof order._id === 'string') return order._id;
  if (typeof order?.id === 'string') return order.id;
  if (typeof order?._id?.$oid === 'string') return order._id.$oid;
  return fallback;
};

function Orders() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('all');
  const [expandedOrders, setExpandedOrders] = useState({});

  const filterTabs = [
    { key: 'all', label: t('orders.allOrders') },
    { key: 'active', label: t('orders.activeOrders') },
    { key: 'completed', label: t('orders.completedOrders') },
  ];

  const hasToken = !!localStorage.getItem('token');
  const { data: rawOrders, isLoading } = useQuery({
    queryKey: ['orders', user?.id],
    queryFn: async () => {
      const response = await api.get('/orders/my-orders');
      return normalizeOrdersPayload(response.data);
    },
    enabled: !!user?.id && hasToken,
  });
  const orders = normalizeOrdersPayload(rawOrders);

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }) => {
      await api.put(`/orders/${orderId}/status`, { status });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['orders', user?.id] });
      queryClient.invalidateQueries({ queryKey: ['sellerProductTracking', user?.id] });
    },
  });

  const getNextStatus = (currentStatus) => {
    // For payment_pending, next is confirmed (paid)
    if (currentStatus === 'payment_pending') {
      return 'confirmed';
    }
    const statusFlow = ['pending', 'payment_pending', 'confirmed', 'preparing', 'ready', 'delivered'];
    const currentIndex = statusFlow.indexOf(currentStatus);
    if (currentIndex < statusFlow.length - 1) {
      return statusFlow[currentIndex + 1];
    }
    return null;
  };

  const filteredOrders = orders.filter((order) => {
    if (activeFilter === 'active') {
      return !['delivered', 'cancelled'].includes(order.status);
    }
    if (activeFilter === 'completed') {
      return ['delivered', 'cancelled'].includes(order.status);
    }
    return true;
  });

  const activeCount = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
  const completedCount = orders.filter(o => ['delivered', 'cancelled'].includes(o.status)).length;

  const toggleExpand = (orderId) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatCurrency = (amount) => {
    return `Rp ${(amount || 0).toLocaleString('id-ID')}`;
  };

  if (isLoading) {
    return (
      <>
        <div className="orders-page container py-8">
          <OrdersListSkeleton count={4} />
        </div>
      </>
    );
  }

  if (!orders || orders.length === 0) {
    return (
      <>
        <div className="orders-page container py-12">
          <div className="empty-orders">
            <div className="empty-icon-wrapper">
              <ShoppingBag size={48} />
            </div>
            <h2 className="text-lg font-semibold">{t('orders.noOrdersTitle')}</h2>
            <p className="text-sm text-muted-foreground mt-2">{t('orders.startShopping')}</p>
            <Link to="/products">
              <Button className="mt-4 gap-2">
                <ShoppingBag className="h-4 w-4" />
                {t('orders.browseProducts')}
              </Button>
            </Link>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <div className="orders-page container py-8">
        {/* Header */}
        <div 
          className="orders-header flex items-center gap-4 mb-6 cursor-pointer"
          onClick={() => navigate(-1)}
        >
          <button className="inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 hover:bg-accent hover:text-accent-foreground h-10 w-10 shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </button>
          <div>
            <h1>{t('orders.title')}</h1>
            <p className="orders-subtitle">{orders.length} {t('orders.totalOrders')}</p>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="filter-tabs">
          {filterTabs.map(tab => (
            <button
              key={tab.key}
              className={`filter-tab ${activeFilter === tab.key ? 'active' : ''}`}
              onClick={() => setActiveFilter(tab.key)}
            >
              {tab.label}
              <span className="tab-count">
                {tab.key === 'all' ? orders.length : tab.key === 'active' ? activeCount : completedCount}
              </span>
            </button>
          ))}
        </div>

        {/* Orders List */}
        <div className="orders-list">
          {filteredOrders.length === 0 ? (
            <div className="no-filtered-orders">
              <p>
                {activeFilter === 'all' ? t('orders.noOrders') : 
                 activeFilter === 'active' ? t('orders.noFilteredOrdersActive') : 
                 t('orders.noFilteredOrdersCompleted')}
              </p>
            </div>
          ) : (
            filteredOrders.map((order, orderIndex) => {
              const orderId = resolveOrderId(order, `order-${orderIndex}`);
              const status = getStatusConfig(order, user);
              const StatusIcon = status.icon;
              const nextStatus = getNextStatus(order.status);
              const isExpanded = !!expandedOrders[orderId];
              const payment = paymentIcons[order.paymentMethod] || paymentIcons.cash;
              const PaymentIcon = payment.icon;
              const isPickup = order.deliveryType === 'pickup';
              const OrderTypeIcon = isPickup ? Store : Truck;
              const orderTypeLabel = isPickup ? t('checkout.pickup') : t('orders.delivery');

              // Preorder badge
              const isPreorder = order.isPreorder && order.deliveryDate;

              return (
                <div key={`order-wrapper-${orderId}`} style={{ display: 'contents' }}>
                  {isPreorder && (
                    <div key={`preorder-${orderId}`} className="preorder-card">
                      <div className="preorder-header">
                        <div>
                          <div className="preorder-label-row">
                            <Calendar size={20} className="preorder-icon" />
                            <span className="preorder-label">{t('orders.preorder')}</span>
                          </div>
                          <div className="preorder-date">
                            {formatDate(order.deliveryDate)}
                          </div>
                          <div className="preorder-time">
                            {t('orders.at')} {order.preorderTime}
                          </div>
                        </div>
                      </div>
                      <div className="preorder-meta">
                        <Package size={16} className="preorder-icon" />
                        <span>
                          {order.itemsCount || order.products?.reduce((sum, item) => sum + (item.quantity || 1), 0) || 0} {t('orders.items')} | {formatCurrency(order.totalAmount)}
                        </span>
                      </div>
                      {order.requestStatus === 'seller_accepted' && (
                        <Button size="sm" className="preorder-confirm-btn">
                          <CheckCircle size={16} className="mr-1.5" />
                          {t('orders.confirmAndPay')}
                        </Button>
                      )}
                    </div>
                  )}

                  <div
                    key={orderId}
                    className={`order-card ${order.status} ${isExpanded ? 'expanded' : ''} ${isPreorder ? 'preorder' : ''} ${isPickup ? 'pickup' : 'delivery'}`}
                    onClick={() => toggleExpand(orderId)}
                  >
                    {/* Order Header */}
                    <div className="order-header">
                      <div className="order-header-left">
                        <div className="order-id-section">
                          <span className="order-label">{t('orders.order')}</span>
                          {isPreorder && <span className="preorder-pill">PREORDER</span>}
                          <span className="order-id">#{orderId.slice(-8).toUpperCase()}</span>
                        </div>
                        <div className="order-date">
                          <Calendar size={14} />
                          <span>{formatDate(order.createdAt)}</span>
                        </div>
                        <div className={`order-type-chip ${isPickup ? 'pickup' : 'delivery'}`}>
                          <OrderTypeIcon size={13} />
                          <span>{orderTypeLabel}</span>
                        </div>
                      </div>
                      <div className="order-header-right">
                        <div className="order-status-badge" style={{ color: status.color, background: status.bg }}>
                          <StatusIcon size={14} />
                          <span>{status.label}</span>
                        </div>
                        <div className="order-total-compact">
                          {formatCurrency(order.totalAmount)}
                        </div>
                        {/* Seller action - visible status update button */}
                        {order.seller?._id === user?.id && nextStatus && !isExpanded && (
                          <button
                            className="seller-action-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              updateStatusMutation.mutate({
                                orderId,
                                status: nextStatus,
                              });
                            }}
                            disabled={updateStatusMutation.isPending}
                            title={nextStatus === 'payment_pending' ? t('orders.markAsPaid') : `${t('orders.markAs')} ${statusConfig[nextStatus]?.label}`}
                          >
                            {nextStatus === 'payment_pending' ? (
                              <>
                                <CheckCircle size={14} />
                                <span>{t('orders.paid')}</span>
                              </>
                            ) : (
                              <>
                                <ChefHat size={14} />
                                <span>{statusConfig[nextStatus]?.label}</span>
                              </>
                            )}
                          </button>
                        )}
                        <button
                          className="expand-toggle"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleExpand(orderId);
                          }}
                        >
                          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                        </button>
                      </div>
                    </div>

                    {/* Order Body - Expandable */}
                    {isExpanded && (
                      <div className="order-body">
                        {/* Items */}
                        <div className="order-items">
                          {(order.products || []).map((item, itemIndex) => {
                            const itemKey = `${orderId}-${item._id || item.product?._id || 'item'}-${itemIndex}`;
                            return (
                              <div key={itemKey} className="order-item">
                                <div className="item-image">
                                  {item.product?.images?.[0] ? (
                                    <img
                                      src={resolveImageUrl(item.product.images[0])}
                                      alt={item.product.name}
                                      onError={(event) => {
                                        event.currentTarget.style.display = 'none';
                                      }}
                                    />
                                  ) : (
                                    <div className="placeholder">No image</div>
                                  )}
                                </div>
                                <div className="item-details">
                                  <h4>{item.product?.name || 'Product'}</h4>
                                  {item.variantName && (
                                    <p style={{ fontSize: '0.75rem', color: 'var(--primary)', fontWeight: 500 }}>Variant: {item.variantName}</p>
                                  )}
                                  {item.selectedOptions?.length > 0 && (
                                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.25rem', marginTop: '0.15rem' }}>
                                      {item.selectedOptions.map((opt, oi) => (
                                        <span key={`${itemKey}-${opt.groupName || 'option'}-${oi}`} style={{ fontSize: '0.7rem', background: 'var(--muted)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                                          {opt.groupName}: {opt.chosen?.join(', ')}
                                        </span>
                                      ))}
                                    </div>
                                  )}
                                  <p>Qty: {item.quantity} x {formatCurrency(item.price)}</p>
                                </div>
                                <div className="item-total">{formatCurrency(item.quantity * item.price)}</div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Footer Info */}
                        <div className="order-footer">
                          <div className="order-meta">
                            {/* Seller/Buyer Info - Check if user is seller of this order */}
                            {order.seller?._id === user?.id ? (
                              <div className="meta-row">
                                <span className="meta-label">{t('orders.buyer')}</span>
                                <span className="meta-value">
                                  <Link 
                                    to={`/profile/${order.buyer?._id}`} 
                                    className="text-primary hover:underline flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <User size={12} />
                                    {order.buyer?.name}
                                  </Link>
                                  {order.buyer?.phone && (
                                    <span className="contact-inline">
                                      <Phone size={12} /> {order.buyer.phone}
                                    </span>
                                  )}
                                </span>
                              </div>
                            ) : (
                              <div className="meta-row">
                                <span className="meta-label">{t('orders.seller')}</span>
                                <span className="meta-value">
                                  <Link 
                                    to={`/profile/${order.seller?._id}`}
                                    className="text-primary hover:underline flex items-center gap-1"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <Store size={12} />
                                    {order.seller?.businessName || order.seller?.name}
                                  </Link>
                                  {order.seller?.phone && (
                                    <span className="contact-inline">
                                      <Phone size={12} /> {order.seller.phone}
                                    </span>
                                  )}
                                </span>
                              </div>
                            )}

                            {/* Pickup Info */}
                            <div className="meta-row">
                              <span className="meta-label">{t('orders.orderType') || 'Order Type'}</span>
                              <span className={`meta-value order-type-meta ${isPickup ? 'pickup' : 'delivery'}`}>
                                <OrderTypeIcon size={12} />
                                {isPickup ? t('checkout.pickupAtStore') : t('orders.delivery')}
                                {isPickup && order.preorderTime && ` - ${order.preorderTime}`}
                              </span>
                            </div>

                            {/* Pickup Address for Pickup Orders */}
                            {isPickup && order.pickupAddress && (
                              <div className="meta-row">
                                <span className="meta-label">{t('orders.pickupLocation') || 'Pickup Location'}</span>
                                <span className="meta-value">
                                  <MapPin size={12} style={{ marginRight: 4 }} />
                                  {order.pickupAddress}
                                </span>
                              </div>
                            )}

                            {/* Payment Method */}
                            <div className="meta-row">
                              <span className="meta-label">{t('orders.payment')}</span>
                              <span className="meta-value payment-badge">
                                <PaymentIcon size={14} />
                                {payment.label}
                              </span>
                            </div>

                            {/* Notes */}
                            {order.notes && (
                              <div className="meta-row">
                                <span className="meta-label">{t('orders.notes')}</span>
                                <span className="meta-value note-text">{order.notes}</span>
                              </div>
                            )}

                            {/* Track Delivery disabled
                            {order.deliveryType === 'delivery' &&
                              order.status !== 'delivered' &&
                              order.status !== 'cancelled' && (
                                <div className="mt-4">
                                  <Link to={`/tracking/${orderId}`}>
                                    <Button variant="outline" className="w-full gap-2">
                                      <Navigation className="h-4 w-4" />
                                      Track Delivery Live
                                    </Button>
                                  </Link>
                                </div>
                              )}
                            */}

                            {/* View Invoice */}
                            <div className="mt-2 flex gap-2">
                              <Link to={`/invoice/${orderId}`} className="flex-1">
                                <Button variant="outline" size="sm" className="w-full gap-2">
                                  <FileText className="h-4 w-4" />
                                  {t('orders.viewInvoice')}
                                </Button>
                              </Link>
                              {/* Fraud/Scam Reporting - Available to both buyer and seller */}
                              {(order.buyer?._id === user?.id || order.seller?._id === user?.id) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="gap-2 text-red-600 border-red-300 hover:bg-red-50 dark:text-red-400 dark:border-red-900/70 dark:hover:bg-red-950/40"
                                  onClick={async (e) => {
                                    e.stopPropagation();
                                    const reportType = window.confirm(
                                      'Are you reporting fraud/scam?\n\nClick OK to report fraud/scam.\nClick Cancel for general issues.'
                                    );
                                    
                                    if (reportType) {
                                      // Fraud/Scam report - sends to creator email
                                      const fraudDetails = prompt('Please describe the fraudulent activity in detail:');
                                      if (!fraudDetails) return;
                                      
                                      const userRole = order.buyer?._id === user?.id ? 'Buyer' : 'Seller';
                                      const reportData = {
                                        orderId,
                                        reportType: 'FRAUD_REPORT',
                                        reporterId: user?.id,
                                        reporterRole: userRole,
                                        reporterName: user?.name || user?.businessName,
                                        reporterEmail: user?.email,
                                        fraudDetails,
                                        orderDetails: {
                                          orderDate: order.createdAt,
                                          amount: order.totalAmount,
                                          products: order.products?.map(p => p.name).join(', '),
                                          otherParty: userRole === 'Buyer'
                                            ? (order.seller?.businessName || order.seller?.name)
                                            : (order.buyer?.name || order.buyer?.email),
                                        },
                                        toEmail: CREATOR_EMAIL,
                                      };
                                      
                                      try {
                                        await api.post('/reports/fraud', reportData);
                                        alert('Fraud report submitted! The creator has been notified and will investigate this matter.');
                                      } catch (err) {
                                        // Fallback: open email client
                                        const subject = encodeURIComponent(`FRAUD REPORT - Order #${orderId.slice(-8).toUpperCase()}`);
                                        const body = encodeURIComponent(
                                          `FRAUD REPORT\n\n` +
                                          `Order ID: ${orderId}\n` +
                                          `Reporter: ${userRole} - ${user?.name || user?.businessName}\n` +
                                          `Reporter Email: ${user?.email}\n\n` +
                                          `Fraud Details:\n${fraudDetails}\n\n` +
                                          `Order Amount: Rp ${order.totalAmount?.toLocaleString('id-ID')}\n` +
                                          `Products: ${order.products?.map(p => p.name).join(', ')}`
                                        );
                                        window.open(`mailto:${CREATOR_EMAIL}?subject=${subject}&body=${body}`);
                                        alert('Email client opened. Please send the fraud report to the creator.');
                                      }
                                    } else {
                                      // General dispute report
                                      const reason = prompt('Describe the issue with your order:');
                                      if (!reason) return;
                                      try {
                                        await api.post('/disputes/', { orderId, reason, details: reason });
                                        alert('Dispute submitted! We will review it shortly.');
                                      } catch (err) {
                                        alert(err.response?.data?.error || 'Failed to submit dispute');
                                      }
                                    }
                                  }}
                                >
                                  <Flag className="h-4 w-4" />
                                  Report Fraud/Issue
                                </Button>
                              )}
                            </div>
                          </div>

                          {/* Total + Action */}
                          <div className="order-total-section">
                            <div className="total-row">
                              <span>{t('orders.total')}</span>
                              <span className="total-amount">{formatCurrency(order.totalAmount)}</span>
                            </div>

                            {/* Show status update button only if user is the seller of this order */}
                            {order.seller?._id === user?.id && nextStatus && (
                              <Button
                                size="sm"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateStatusMutation.mutate({
                                    orderId,
                                    status: nextStatus,
                                  });
                                }}
                                disabled={updateStatusMutation.isPending}
                                className="update-status-btn"
                              >
                                {nextStatus === 'payment_pending' ? t('orders.markAsPaid') : `${t('orders.markAs')} ${statusConfig[nextStatus].label}`}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </>
  );
}

export default Orders;


