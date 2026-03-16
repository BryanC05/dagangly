import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useWalletStore } from '../store/walletStore';
import { useAuthStore } from '../store/authStore';

const Wallet = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const {
    wallet,
    transactions,
    loading,
    fetchWallet,
    fetchTransactions,
    addFunds,
    transferToBank,
  } = useWalletStore();

  const [showAddFunds, setShowAddFunds] = useState(false);
  const [showTransfer, setShowTransfer] = useState(false);
  const [amount, setAmount] = useState('');
  const [bankName, setBankName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountHolder, setAccountHolder] = useState('');

  useEffect(() => {
    fetchWallet();
    fetchTransactions();
  }, []);

  const handleAddFunds = async (e) => {
    e.preventDefault();
    const result = await addFunds(parseFloat(amount));
    if (result.success) {
      setShowAddFunds(false);
      setAmount('');
      fetchWallet();
      fetchTransactions();
    }
  };

  const handleTransfer = async (e) => {
    e.preventDefault();
    const result = await transferToBank(
      parseFloat(amount),
      bankName,
      accountNumber,
      accountHolder
    );
    if (result.success) {
      setShowTransfer(false);
      setAmount('');
      setBankName('');
      setAccountNumber('');
      setAccountHolder('');
      fetchWallet();
      fetchTransactions();
    }
  };

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
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (!user) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p>{t('common.pleaseLogin')}</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">
          {t('wallet.title')}
        </h1>

        <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 mb-6 text-white">
          <p className="text-sm opacity-90 mb-1">{t('wallet.balance')}</p>
          <p className="text-4xl font-bold">
            {wallet ? formatCurrency(wallet.balance) : formatCurrency(0)}
          </p>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setShowAddFunds(true)}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            {t('wallet.addFunds')}
          </button>
          <button
            onClick={() => setShowTransfer(true)}
            className="flex-1 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-900 dark:text-white py-3 px-4 rounded-lg font-medium transition-colors"
          >
            {t('wallet.transferToBank')}
          </button>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            {t('wallet.transactions')}
          </h2>
          {transactions.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">
              {t('wallet.noTransactions')}
            </p>
          ) : (
            <div className="space-y-3">
              {transactions.slice().reverse().map((tx, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-700 last:border-0"
                >
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {tx.description}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(tx.createdAt)}
                    </p>
                  </div>
                  <p
                    className={`font-semibold ${
                      tx.type === 'credit'
                        ? 'text-green-600 dark:text-green-400'
                        : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}
                    {formatCurrency(tx.amount)}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

        {showAddFunds && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('wallet.addFunds')}
              </h3>
              <form onSubmit={handleAddFunds}>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('wallet.amount')}
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                    min="10000"
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowAddFunds(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {loading ? t('common.loading') : t('wallet.addFunds')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showTransfer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('wallet.transferToBank')}
              </h3>
              <form onSubmit={handleTransfer}>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('wallet.amount')}
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                    min="10000"
                    max={wallet?.balance || 0}
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('wallet.bankName')}
                  </label>
                  <input
                    type="text"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('wallet.accountNumber')}
                  </label>
                  <input
                    type="text"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('wallet.accountHolder')}
                  </label>
                  <input
                    type="text"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => setShowTransfer(false)}
                    className="flex-1 py-2 px-4 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={loading || (wallet?.balance || 0) < parseFloat(amount)}
                    className="flex-1 py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                  >
                    {loading ? t('common.loading') : t('wallet.transfer')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Wallet;
