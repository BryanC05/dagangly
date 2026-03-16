import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useAdminStore } from '../store/adminStore';

const AdminDashboard = () => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [search, setSearch] = useState('');
  
  const {
    stats,
    users,
    products,
    orders,
    disputes,
    revenue,
    loading,
    fetchStats,
    fetchUsers,
    fetchProducts,
    fetchOrders,
    fetchDisputes,
    fetchRevenue,
    updateUserRole,
    banUser,
    approveProduct,
    rejectProduct,
    deleteProduct,
    updateOrderStatus,
    resolveDispute,
  } = useAdminStore();

  useEffect(() => {
    fetchStats();
    fetchRevenue();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers(1, '', search);
    if (activeTab === 'products') fetchProducts(1, '', search);
    if (activeTab === 'orders') fetchOrders(1, '');
    if (activeTab === 'disputes') fetchDisputes(1, '');
  }, [activeTab]);

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(value);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleRoleChange = async (userId, role) => {
    await updateUserRole(userId, role);
  };

  const handleBan = async (userId, banned) => {
    await banUser(userId, banned, 'Admin action');
  };

  const handleApproveProduct = async (productId) => {
    await approveProduct(productId);
  };

  const handleRejectProduct = async (productId) => {
    const reason = prompt('Rejection reason:');
    if (reason) await rejectProduct(productId, reason);
  };

  const handleDeleteProduct = async (productId) => {
    if (window.confirm('Delete this product?')) {
      await deleteProduct(productId);
    }
  };

  const handleOrderStatus = async (orderId, status) => {
    await updateOrderStatus(orderId, status);
  };

  const handleResolveDispute = async (disputeId) => {
    const resolution = prompt('Resolution:');
    const action = prompt('Action taken:');
    if (resolution) await resolveDispute(disputeId, resolution, action);
  };

  const tabs = [
    { id: 'dashboard', label: t('admin.dashboard') },
    { id: 'users', label: t('admin.users') },
    { id: 'products', label: t('admin.products') },
    { id: 'orders', label: t('admin.orders') },
    { id: 'disputes', label: t('admin.disputes') },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {t('admin.title')}
        </h1>

        <div className="flex gap-2 mb-6 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'dashboard' && (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.totalUsers')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalUsers || 0}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.totalSellers')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalSellers || 0}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.totalProducts')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalProducts || 0}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.totalOrders')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats?.totalOrders || 0}
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm col-span-2">
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.monthlyRevenue')}</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(revenue?.totalRevenue || stats?.monthlyRevenue || 0)}
              </p>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                placeholder={t('admin.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                      {t('admin.role')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                      {t('admin.status')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                      {t('admin.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user._id} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{user.name}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{user.email}</td>
                      <td className="px-4 py-3">
                        <select
                          value={user.role}
                          onChange={(e) => handleRoleChange(user._id, e.target.value)}
                          className="px-2 py-1 border rounded dark:bg-gray-700 dark:text-white"
                        >
                          <option value="buyer">Buyer</option>
                          <option value="seller">Seller</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            user.isBanned
                              ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                              : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          }`}
                        >
                          {user.isBanned ? 'Banned' : 'Active'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <button
                          onClick={() => handleBan(user._id, !user.isBanned)}
                          className="text-blue-600 hover:underline text-sm"
                        >
                          {user.isBanned ? t('admin.unban') : t('admin.ban')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'products' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <input
                type="text"
                placeholder={t('admin.search')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              />
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                      Seller
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                      {t('admin.status')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                      {t('admin.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product._id} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-3 text-gray-900 dark:text-white">{product.name}</td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {product.seller?.name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            product.status === 'active'
                              ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                              : product.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                              : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                          }`}
                        >
                          {product.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 space-x-2">
                        {product.status !== 'active' && (
                          <button
                            onClick={() => handleApproveProduct(product._id)}
                            className="text-green-600 hover:underline text-sm"
                          >
                            {t('admin.approve')}
                          </button>
                        )}
                        {product.status === 'pending' && (
                          <button
                            onClick={() => handleRejectProduct(product._id)}
                            className="text-red-600 hover:underline text-sm"
                          >
                            {t('admin.reject')}
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteProduct(product._id)}
                          className="text-red-600 hover:underline text-sm"
                        >
                          {t('common.delete')}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'orders' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                      Order ID
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                      Buyer
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                      Total
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                      {t('admin.status')}
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                      {t('admin.actions')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((order) => (
                    <tr key={order._id} className="border-t border-gray-200 dark:border-gray-700">
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {order._id.slice(-8)}
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {order.buyer?.name || 'Unknown'}
                      </td>
                      <td className="px-4 py-3 text-gray-900 dark:text-white">
                        {formatCurrency(order.totalAmount)}
                      </td>
                      <td className="px-4 py-3">
                        <select
                          value={order.status}
                          onChange={(e) => handleOrderStatus(order._id, e.target.value)}
                          className="px-2 py-1 border rounded text-sm dark:bg-gray-700 dark:text-white"
                        >
                          <option value="pending">Pending</option>
                          <option value="confirmed">Confirmed</option>
                          <option value="preparing">Preparing</option>
                          <option value="ready">Ready</option>
                          <option value="delivered">Delivered</option>
                          <option value="completed">Completed</option>
                          <option value="cancelled">Cancelled</option>
                        </select>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                        {formatDate(order.createdAt)}
                      </td>
                      <td className="px-4 py-3">
                        <button className="text-blue-600 hover:underline text-sm">
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'disputes' && (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            {disputes.length === 0 ? (
              <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                {t('admin.noDisputes')}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                        ID
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                        Type
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                        Description
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                        {t('admin.status')}
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                        {t('admin.actions')}
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {disputes.map((dispute) => (
                      <tr
                        key={dispute._id}
                        className="border-t border-gray-200 dark:border-gray-700"
                      >
                        <td className="px-4 py-3 text-gray-900 dark:text-white">
                          {dispute._id.slice(-8)}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          {dispute.type}
                        </td>
                        <td className="px-4 py-3 text-gray-500 dark:text-gray-400">
                          {dispute.description?.slice(0, 50)}...
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`px-2 py-1 rounded text-xs ${
                              dispute.status === 'resolved'
                                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            }`}
                          >
                            {dispute.status}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {dispute.status !== 'resolved' && (
                            <button
                              onClick={() => handleResolveDispute(dispute._id)}
                              className="text-blue-600 hover:underline text-sm"
                            >
                              {t('admin.resolve')}
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
