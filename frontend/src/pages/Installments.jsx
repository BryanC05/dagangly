import { useState, useEffect } from 'react';
import { useTranslation } from '@/hooks/useTranslation';
import { useInstallmentStore } from '../store/installmentStore';
import { useAuthStore } from '../store/authStore';
import { CreditCard, Calendar, DollarSign, CheckCircle, Clock, AlertCircle } from 'lucide-react';

const InstallmentsPage = () => {
  const { t } = useTranslation();
  const { user } = useAuthStore();
  const {
    plans,
    loading,
    fetchMyInstallments,
    calculateInstallment,
    payInstallment,
  } = useInstallmentStore();

  const [showCalculator, setShowCalculator] = useState(false);
  const [amount, setAmount] = useState('');
  const [tenure, setTenure] = useState(6);
  const [interestRate, setInterestRate] = useState(12);
  const [calculation, setCalculation] = useState(null);

  useEffect(() => {
    fetchMyInstallments();
  }, []);

  const handleCalculate = async (e) => {
    e.preventDefault();
    const result = await calculateInstallment(parseFloat(amount), tenure, interestRate / 100);
    if (result.success) {
      setCalculation(result.data);
    }
  };

  const handlePay = async (planId) => {
    const result = await payInstallment(planId);
    if (result.success) {
      fetchMyInstallments();
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
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <CreditCard className="h-6 w-6" />
            {t('installment.title')}
          </h1>
          <button
            onClick={() => setShowCalculator(true)}
            className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <DollarSign className="h-4 w-4" />
            {t('installment.calculate')}
          </button>
        </div>

        {plans.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-8 text-center">
            <CreditCard className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">
              {t('installment.noPlans')}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {plans.map((planData) => {
              const plan = planData.plan;
              const payments = planData.payments || [];
              const nextPayment = payments.find((p) => p.status === 'pending');

              return (
                <div
                  key={plan._id}
                  className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {t('installment.plan')} #{plan._id.slice(-8)}
                      </h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {t('installment.tenure')}: {plan.tenure} {t('installment.months')}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-sm ${
                        plan.status === 'active'
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200'
                          : plan.status === 'completed'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                          : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                      }`}
                    >
                      {plan.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-3 gap-4 mb-4">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('installment.total')}</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(plan.totalAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('installment.paid')}</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(plan.totalAmount - plan.remainingAmount)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{t('installment.remaining')}</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(plan.remainingAmount)}
                      </p>
                    </div>
                  </div>

                  <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      {t('installment.payments')}
                    </p>
                    <div className="space-y-2">
                      {payments.slice(0, 6).map((payment) => (
                        <div
                          key={payment._id}
                          className="flex items-center justify-between text-sm"
                        >
                          <div className="flex items-center gap-2">
                            {payment.status === 'paid' ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : payment.status === 'late' ? (
                              <AlertCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <Clock className="h-4 w-4 text-gray-400" />
                            )}
                            <span className="text-gray-600 dark:text-gray-400">
                              {t('installment.period')} {payment.period}
                            </span>
                          </div>
                          <span className="text-gray-900 dark:text-white">
                            {formatCurrency(payment.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {plan.status === 'active' && nextPayment && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('installment.nextPayment')} - {formatCurrency(nextPayment.amount)}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            {t('installment.due')}: {formatDate(nextPayment.dueDate)}
                          </p>
                        </div>
                        <button
                          onClick={() => handlePay(plan._id)}
                          disabled={loading}
                          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg disabled:opacity-50"
                        >
                          {t('installment.payNow')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        {showCalculator && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-lg">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {t('installment.calculator')}
              </h3>
              <form onSubmit={handleCalculate}>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('installment.amount')}
                  </label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                    required
                  />
                </div>
                <div className="mb-3">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('installment.tenureSelect')}
                  </label>
                  <select
                    value={tenure}
                    onChange={(e) => setTenure(parseInt(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  >
                    <option value={3}>3 {t('installment.months')}</option>
                    <option value={6}>6 {t('installment.months')}</option>
                    <option value={12}>12 {t('installment.months')}</option>
                    <option value={24}>24 {t('installment.months')}</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    {t('installment.interestRate')} (% per tahun)
                  </label>
                  <input
                    type="number"
                    value={interestRate}
                    onChange={(e) => setInterestRate(parseFloat(e.target.value))}
                    className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg dark:bg-gray-700 dark:text-white"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50"
                >
                  {t('installment.calculate')}
                </button>
              </form>

              {calculation && (
                <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-gray-500">{t('installment.monthlyPayment')}</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(calculation.monthlyPayment)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">{t('installment.totalPayment')}</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(calculation.totalPayment)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500">{t('installment.totalInterest')}</p>
                      <p className="font-semibold text-gray-900 dark:text-white">
                        {formatCurrency(calculation.totalInterest)}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowCalculator(false)}
                className="mt-4 w-full py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default InstallmentsPage;
