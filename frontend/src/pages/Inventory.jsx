import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useInventoryStore } from '../store/inventoryStore';
import { Package, AlertTriangle, Plus, Minus, Search, Filter } from 'lucide-react';

const InventoryPage = () => {
  const { t } = useTranslation();
  const {
    inventory,
    loading,
    fetchInventory,
    updateStock,
    adjustStock,
  } = useInventoryStore();

  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState('all');
  const [showAdjustModal, setShowAdjustModal] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const filteredInventory = inventory.filter((product) => {
    const matchesSearch = product.name?.toLowerCase().includes(search.toLowerCase());
    if (!matchesSearch) return false;

    if (filter === 'all') return true;
    if (filter === 'low') return product.stock > 0 && product.stock <= 10;
    if (filter === 'out') return product.stock === 0;
    if (filter === 'in') return product.stock > 10;
    return true;
  });

  const handleUpdateStock = async (productId, newStock) => {
    await updateStock(productId, parseInt(newStock));
  };

  const handleAdjustStock = async (productId) => {
    const result = await adjustStock(productId, parseInt(adjustAmount), adjustReason);
    if (result.success) {
      setShowAdjustModal(null);
      setAdjustAmount('');
      setAdjustReason('');
      fetchInventory();
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(value);
  };

  const lowStockCount = inventory.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = inventory.filter((p) => p.stock === 0).length;
  const inStockCount = inventory.filter((p) => p.stock > 10).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 flex items-center gap-2">
          <Package className="h-6 w-6" />
          {t('inventory.title')}
        </h1>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('inventory.inStock')}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{inStockCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-yellow-600" />
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('inventory.lowStock')}</span>
            </div>
            <p className="text-2xl font-bold text-yellow-600">{lowStockCount}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-600" />
              <span className="text-sm text-gray-500 dark:text-gray-400">{t('inventory.outOfStock')}</span>
            </div>
            <p className="text-2xl font-bold text-red-600">{outOfStockCount}</p>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder={t('inventory.search')}
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                />
              </div>
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
              >
                <option value="all">{t('inventory.all')}</option>
                <option value="in">{t('inventory.inStock')}</option>
                <option value="low">{t('inventory.lowStock')}</option>
                <option value="out">{t('inventory.outOfStock')}</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    Product
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    {t('inventory.price')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    {t('inventory.stock')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    {t('inventory.status')}
                  </th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-500 dark:text-gray-300">
                    {t('inventory.actions')}
                  </th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.map((product) => (
                  <tr
                    key={product._id}
                    className="border-t border-gray-100 dark:border-gray-700"
                  >
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-900 dark:text-white">
                        {product.name}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {product.category}
                      </p>
                    </td>
                    <td className="px-4 py-3 text-gray-900 dark:text-white">
                      {formatCurrency(product.price)}
                    </td>
                    <td className="px-4 py-3">
                      <input
                        type="number"
                        value={product.stock}
                        onChange={(e) => handleUpdateStock(product._id, e.target.value)}
                        className="w-20 px-2 py-1 border border-gray-300 dark:border-gray-600 rounded dark:bg-gray-700 dark:text-white"
                        min="0"
                      />
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${
                          product.stock === 0
                            ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                            : product.stock <= 10
                            ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                            : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                        }`}
                      >
                        {product.stock === 0
                          ? t('inventory.outOfStock')
                          : product.stock <= 10
                          ? t('inventory.lowStock')
                          : t('inventory.inStock')}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <button
                        onClick={() => setShowAdjustModal(product)}
                        className="text-blue-600 hover:underline text-sm"
                      >
                        {t('inventory.adjust')}
                      </button>
                    </td>
                  </tr>
                ))}
                {filteredInventory.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                      {t('inventory.noProducts')}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showAdjustModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('inventory.adjustStock')} - {showAdjustModal.name}
              </h3>
              <div className="mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('inventory.adjustment')}
                </label>
                <div className="flex gap-2">
                  <button
                    onClick={() => setAdjustAmount(String(-1))}
                    className="flex-1 py-2 bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-200 rounded-lg"
                  >
                    <Minus className="h-4 w-4 mx-auto" />
                  </button>
                  <input
                    type="number"
                    value={adjustAmount}
                    onChange={(e) => setAdjustAmount(e.target.value)}
                    placeholder="+ / -"
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white text-center"
                  />
                  <button
                    onClick={() => setAdjustAmount('1')}
                    className="flex-1 py-2 bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-200 rounded-lg"
                  >
                    <Plus className="h-4 w-4 mx-auto" />
                  </button>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                  Current: {showAdjustModal.stock} → New: {showAdjustModal.stock + parseInt(adjustAmount || 0)}
                </p>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {t('inventory.reason')}
                </label>
                <select
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                >
                  <option value="">{t('inventory.selectReason')}</option>
                  <option value="restock">{t('inventory.restock')}</option>
                  <option value="sale">{t('inventory.sale')}</option>
                  <option value="return">{t('inventory.return')}</option>
                  <option value="damaged">{t('inventory.damaged')}</option>
                  <option value="lost">{t('inventory.lost')}</option>
                  <option value="correction">{t('inventory.correction')}</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => setShowAdjustModal(null)}
                  className="flex-1 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
                >
                  {t('common.cancel')}
                </button>
                <button
                  onClick={() => handleAdjustStock(showAdjustModal._id)}
                  disabled={!adjustAmount || !adjustReason}
                  className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                >
                  {t('common.save')}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InventoryPage;
