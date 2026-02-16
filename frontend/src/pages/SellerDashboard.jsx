import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Edit2, Trash2, Package, TrendingUp, DollarSign, ShoppingBag, Save, X, AlertTriangle, Map, BarChart3 } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import api from '../utils/api';
import Layout from '@/components/layout/Layout';
import './SellerDashboard.css';

function SellerDashboard() {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();

  // Edit state - stores product id being edited and its temp values
  const [editingProduct, setEditingProduct] = useState(null);
  const [editValues, setEditValues] = useState({ price: 0, stock: 0 });

  // Confirmation modal state
  const [confirmModal, setConfirmModal] = useState({ show: false, productId: null, productName: '' });

  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['sellerProducts', user?.id],
    queryFn: async () => {
      const response = await api.get(`/products/seller/${user.id}`);
      return response.data;
    },
    enabled: !!user?.id,
  });

  const { data: orders } = useQuery({
    queryKey: ['sellerOrders', user?.id],
    queryFn: async () => {
      const response = await api.get('/orders/my-orders');
      return response.data;
    },
    enabled: !!user?.id,
  });

  const deleteMutation = useMutation({
    mutationFn: async (productId) => {
      await api.delete(`/products/${productId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellerProducts', user?.id] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ productId, data }) => {
      const response = await api.put(`/products/${productId}`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sellerProducts', user?.id] });
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
      <Layout>
        <div className="access-denied container py-12 text-center">
          <h2 className="text-2xl font-bold mb-4">Please Login</h2>
          <p className="mb-4">You need to be logged in to access your dashboard.</p>
          <Link to="/login" className="btn-primary">
            Login
          </Link>
        </div>
      </Layout>
    );
  }

  const totalSales = orders?.reduce((sum, order) =>
    order.status === 'delivered' ? sum + order.totalAmount : sum, 0
  ) || 0;

  const pendingOrders = orders?.filter(order =>
    ['pending', 'confirmed', 'preparing'].includes(order.status)
  ).length || 0;

  return (
    <Layout>
      <div className="seller-dashboard container py-8">
        {/* Confirmation Modal */}
        {confirmModal.show && (
          <div className="modal-overlay fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="confirm-modal bg-card border rounded-lg p-6 max-w-md w-full shadow-lg">
              <div className="modal-icon warning flex justify-center mb-4 text-warning">
                <AlertTriangle size={48} />
              </div>
              <h3 className="text-xl font-bold text-center mb-2">Confirm Changes</h3>
              <p className="text-center text-muted-foreground mb-4">You are about to update <strong>{confirmModal.productName}</strong>:</p>
              <div className="change-summary bg-muted p-4 rounded-md mb-4 space-y-2">
                <div className="change-item flex justify-between">
                  <span>New Price:</span>
                  <strong>Rp {editValues.price}</strong>
                </div>
                <div className="change-item flex justify-between">
                  <span>New Stock:</span>
                  <strong>{editValues.stock} units</strong>
                </div>
              </div>
              <p className="warning-text text-sm text-muted-foreground text-center mb-6">This action will update the product information visible to all customers.</p>
              <div className="modal-actions flex gap-4">
                <button
                  className="btn-cancel flex-1 py-2 border rounded-md hover:bg-muted"
                  onClick={() => setConfirmModal({ show: false, productId: null, productName: '' })}
                  disabled={updateMutation.isPending}
                >
                  Cancel
                </button>
                <button
                  className="btn-confirm flex-1 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                  onClick={confirmUpdate}
                  disabled={updateMutation.isPending}
                >
                  {updateMutation.isPending ? 'Updating...' : 'Confirm Update'}
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="dashboard-header flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold">Seller Dashboard</h1>
            <p className="text-muted-foreground">Welcome back, {user.businessName || user.name}!</p>
          </div>
          <div className="flex gap-3">
            <Link
              to="/seller/product-tracking"
              className="btn-secondary inline-flex items-center gap-2 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md transition-colors"
            >
              <BarChart3 size={20} />
              Product Tracking
            </Link>
            <Link to="/seller/add-product" className="btn-primary inline-flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90">
              <Plus size={20} />
              Add Product
            </Link>
          </div>
        </div>

        <div className="stats-grid grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="stat-card p-6 border rounded-lg bg-card shadow-sm">
            <div className="stat-icon products mb-2 text-primary">
              <Package size={24} />
            </div>
            <div className="stat-info">
              <h3 className="text-2xl font-bold">{products?.length || 0}</h3>
              <p className="text-sm text-muted-foreground">Products</p>
            </div>
          </div>
          <div className="stat-card p-6 border rounded-lg bg-card shadow-sm">
            <div className="stat-icon orders mb-2 text-blue-500">
              <ShoppingBag size={24} />
            </div>
            <div className="stat-info">
              <h3 className="text-2xl font-bold">{orders?.length || 0}</h3>
              <p className="text-sm text-muted-foreground">Total Orders</p>
            </div>
          </div>
          <div className="stat-card p-6 border rounded-lg bg-card shadow-sm">
            <div className="stat-icon pending mb-2 text-orange-500">
              <TrendingUp size={24} />
            </div>
            <div className="stat-info">
              <h3 className="text-2xl font-bold">{pendingOrders}</h3>
              <p className="text-sm text-muted-foreground">Pending Orders</p>
            </div>
          </div>
          <div className="stat-card p-6 border rounded-lg bg-card shadow-sm">
            <div className="stat-icon revenue mb-2 text-green-500">
              <DollarSign size={24} />
            </div>
            <div className="stat-info">
              <h3 className="text-2xl font-bold">Rp {totalSales.toFixed(2)}</h3>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
            </div>
          </div>
        </div>

        <div className="dashboard-section mb-8">
          <h2 className="text-xl font-semibold mb-4">My Products</h2>
          {productsLoading ? (
            <div className="loading">Loading products...</div>
          ) : products?.length === 0 ? (
            <div className="empty-state text-center py-12 border rounded-lg">
              <p className="mb-4 text-muted-foreground">No products yet. Start by adding your first product!</p>
              <Link to="/seller/add-product" className="btn-primary px-4 py-2 bg-primary text-primary-foreground rounded-md">
                Add Product
              </Link>
            </div>
          ) : (
            <div className="products-table-container overflow-x-auto border rounded-lg">
              <table className="products-table w-full text-left">
                <thead className="bg-muted text-muted-foreground">
                  <tr>
                    <th className="p-4 font-medium">Product</th>
                    <th className="p-4 font-medium">Category</th>
                    <th className="p-4 font-medium">Price</th>
                    <th className="p-4 font-medium">Stock</th>
                    <th className="p-4 font-medium">Status</th>
                    <th className="p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {products?.map((product) => (
                    <tr key={product._id} className={editingProduct === product._id ? 'bg-primary/5' : ''}>
                      <td className="product-cell p-4">
                        <div className="flex items-center gap-3">
                          <div className="product-thumbnail w-12 h-12 rounded border overflow-hidden shrink-0">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt={product.name} className="w-full h-full object-cover" />
                            ) : (
                              <div className="placeholder w-full h-full bg-muted flex items-center justify-center text-xs">📷</div>
                            )}
                          </div>
                          <span className="font-medium">{product.name}</span>
                        </div>
                      </td>
                      <td className="p-4 capitalize">{product.category}</td>
                      <td className="p-4">
                        {editingProduct === product._id ? (
                          <input
                            type="number"
                            className="edit-input w-24 p-1 border rounded bg-background text-foreground"
                            value={editValues.price}
                            onChange={(e) => setEditValues({ ...editValues, price: e.target.value })}
                            min="0"
                            step="0.01"
                          />
                        ) : (
                          `Rp ${product.price}`
                        )}
                      </td>
                      <td className="p-4">
                        {editingProduct === product._id ? (
                          <input
                            type="number"
                            className="edit-input w-20 p-1 border rounded bg-background text-foreground"
                            value={editValues.stock}
                            onChange={(e) => setEditValues({ ...editValues, stock: e.target.value })}
                            min="0"
                          />
                        ) : (
                          product.stock
                        )}
                      </td>
                      <td className="p-4">
                        <span className={`status-badge px-2 py-1 rounded-full text-xs font-medium ${product.isAvailable ? 'bg-green-500/15 text-green-600 dark:bg-green-500/20 dark:text-green-400' : 'bg-red-500/15 text-red-600 dark:bg-red-500/20 dark:text-red-400'}`}>
                          {product.isAvailable ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="p-4">
                        <div className="action-buttons flex gap-2">
                          {editingProduct === product._id ? (
                            <>
                              <button
                                className="btn-save p-1 text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 rounded"
                                onClick={() => showConfirmation(product._id, product.name)}
                                title="Save changes"
                              >
                                <Save size={16} />
                              </button>
                              <button
                                className="btn-cancel-edit p-1 text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded"
                                onClick={cancelEditing}
                                title="Cancel editing"
                              >
                                <X size={16} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="btn-edit p-1 text-primary hover:text-primary/80 rounded"
                                onClick={() => startEditing(product)}
                                title="Edit price & stock"
                              >
                                <Edit2 size={16} />
                              </button>
                              <button
                                className="btn-delete p-1 text-destructive hover:text-destructive/80 rounded"
                                onClick={() => {
                                  if (confirm('Are you sure you want to delete this product?')) {
                                    deleteMutation.mutate(product._id);
                                  }
                                }}
                                title="Delete product"
                              >
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

        {orders && orders.length > 0 && (
          <div className="dashboard-section">
            <h2 className="text-xl font-semibold mb-4">Recent Orders</h2>
            <div className="orders-list space-y-4">
              {orders.slice(0, 5).map((order) => (
                <div key={order._id} className="order-card p-4 border rounded-lg flex justify-between items-center bg-card">
                  <div className="order-info">
                    <span className="order-id font-medium block">Order #{order._id.slice(-8)}</span>
                    <span className={`order-status text-sm ${order.status === 'delivered' ? 'text-green-600 dark:text-green-400' :
                      order.status === 'cancelled' ? 'text-red-600 dark:text-red-400' : 'text-orange-600 dark:text-orange-400'
                      }`}>{order.status}</span>
                  </div>
                  <div className="order-details text-right">
                    <span className="block">{order.products.length} items</span>
                    <span className="order-amount font-bold text-primary">Rp {order.totalAmount}</span>
                  </div>
                </div>
              ))}
            </div>
            <Link to="/orders" className="view-all block mt-4 text-center text-primary hover:underline">View All Orders</Link>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default SellerDashboard;