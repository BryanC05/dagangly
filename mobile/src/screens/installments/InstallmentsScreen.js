import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeStore } from '../../theme/ThemeContext';
import api from '../../api/api';

const InstallmentsScreen = () => {
  const { t } = useTranslation();
  const { colors } = useThemeStore();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCalculator, setShowCalculator] = useState(false);
  const [amount, setAmount] = useState('');
  const [tenure, setTenure] = useState('6');
  const [interestRate, setInterestRate] = useState('12');
  const [calculation, setCalculation] = useState(null);

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    try {
      const res = await api.get('/installments/my');
      setPlans(res.data || []);
    } catch (err) {
      console.error('Failed to fetch installments:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCalculate = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    try {
      const res = await api.post('/installments/calculate', {
        amount: parseFloat(amount),
        tenure: parseInt(tenure),
        interestRate: parseFloat(interestRate) / 100,
      });
      setCalculation(res.data);
    } catch (err) {
      Alert.alert('Error', 'Failed to calculate');
    }
  };

  const handlePay = async (planId) => {
    try {
      await api.post(`/installments/plan/${planId}/pay`);
      Alert.alert('Success', 'Payment successful');
      fetchPlans();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Payment failed');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
    }).format(value || 0);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (loading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <ScrollView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>{t('installments')}</Text>
      </View>

      <TouchableOpacity
        style={[styles.calculatorButton, { backgroundColor: colors.card }]}
        onPress={() => setShowCalculator(true)}
      >
        <Ionicons name="calculator" size={24} color={colors.primary} />
        <Text style={[styles.calculatorText, { color: colors.text }]}>
          {t('installmentCalculator')}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
      </TouchableOpacity>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('installmentPlans')}
        </Text>
        {plans.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('noInstallmentPlans')}
          </Text>
        ) : (
          plans.map((planData) => {
            const plan = planData.plan;
            const payments = planData.payments || [];
            const nextPayment = payments.find((p) => p.status === 'pending');

            return (
              <View key={plan._id} style={[styles.planCard, { backgroundColor: colors.card }]}>
                <View style={styles.planHeader}>
                  <Text style={[styles.planTitle, { color: colors.text }]}>
                    {t('plan')} #{plan._id?.slice(-8)}
                  </Text>
                  <View
                    style={[
                      styles.statusBadge,
                      {
                        backgroundColor:
                          plan.status === 'active'
                            ? colors.success + '20'
                            : plan.status === 'completed'
                            ? colors.primary + '20'
                            : colors.error + '20',
                      },
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        { color: plan.status === 'active' ? colors.success : plan.status === 'completed' ? colors.primary : colors.error },
                      ]}
                    >
                      {plan.status}
                    </Text>
                  </View>
                </View>

                <View style={styles.planStats}>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      {t('totalAmount')}
                    </Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {formatCurrency(plan.totalAmount)}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      {t('paid')}
                    </Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {formatCurrency(plan.totalAmount - plan.remainingAmount)}
                    </Text>
                  </View>
                  <View style={styles.statItem}>
                    <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
                      {t('remaining')}
                    </Text>
                    <Text style={[styles.statValue, { color: colors.text }]}>
                      {formatCurrency(plan.remainingAmount)}
                    </Text>
                  </View>
                </View>

                {plan.status === 'active' && nextPayment && (
                  <View style={[styles.paymentSection, { borderTopColor: colors.border }]}>
                    <View>
                      <Text style={[styles.nextPaymentLabel, { color: colors.textSecondary }]}>
                        {t('nextPayment')}
                      </Text>
                      <Text style={[styles.nextPaymentAmount, { color: colors.text }]}>
                        {formatCurrency(nextPayment.amount)} - {formatDate(nextPayment.dueDate)}
                      </Text>
                    </View>
                    <TouchableOpacity
                      style={[styles.payButton, { backgroundColor: colors.primary }]}
                      onPress={() => handlePay(plan._id)}
                    >
                      <Text style={styles.payButtonText}>{t('payNow')}</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            );
          })
        )}
      </View>

      {/* Calculator Modal */}
      <Modal visible={showCalculator} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('installmentCalculator')}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
              placeholder={t('amount')}
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <View style={styles.selectRow}>
              <Text style={[styles.selectLabel, { color: colors.text }]}>{t('tenure')}:</Text>
              <View style={styles.selectButtons}>
                {['3', '6', '12', '24'].map((m) => (
                  <TouchableOpacity
                    key={m}
                    style={[
                      styles.selectButton,
                      {
                        backgroundColor:
                          tenure === m ? colors.primary : colors.input,
                      },
                    ]}
                    onPress={() => setTenure(m)}
                  >
                    <Text
                      style={{
                        color: tenure === m ? '#fff' : colors.text,
                      }}
                    >
                      {m} {t('months')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
              placeholder={`${t('interestRate')} (%)`}
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={interestRate}
              onChangeText={setInterestRate}
            />
            <TouchableOpacity
              style={[styles.calculateButton, { backgroundColor: colors.primary }]}
              onPress={handleCalculate}
            >
              <Text style={styles.calculateButtonText}>{t('calculate')}</Text>
            </TouchableOpacity>

            {calculation && (
              <View style={[styles.resultBox, { backgroundColor: colors.input }]}>
                <View style={styles.resultRow}>
                  <Text style={{ color: colors.textSecondary }}>{t('monthlyPayment')}:</Text>
                  <Text style={[styles.resultValue, { color: colors.text }]}>
                    {formatCurrency(calculation.monthlyPayment)}
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={{ color: colors.textSecondary }}>{t('totalPayment')}:</Text>
                  <Text style={[styles.resultValue, { color: colors.text }]}>
                    {formatCurrency(calculation.totalPayment)}
                  </Text>
                </View>
                <View style={styles.resultRow}>
                  <Text style={{ color: colors.textSecondary }}>{t('totalInterest')}:</Text>
                  <Text style={[styles.resultValue, { color: colors.error }]}>
                    {formatCurrency(calculation.totalInterest)}
                  </Text>
                </View>
              </View>
            )}

            <TouchableOpacity
              style={[styles.closeButton, { borderColor: colors.border }]}
              onPress={() => setShowCalculator(false)}
            >
              <Text style={{ color: colors.text }}>{t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    padding: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  calculatorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    padding: 16,
    borderRadius: 12,
    gap: 12,
  },
  calculatorText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  emptyText: {
    textAlign: 'center',
    padding: 24,
  },
  planCard: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '500',
  },
  planStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  statItem: {
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  paymentSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  nextPaymentLabel: {
    fontSize: 12,
  },
  nextPaymentAmount: {
    fontSize: 14,
    fontWeight: '600',
  },
  payButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  payButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
    fontSize: 16,
  },
  selectRow: {
    marginBottom: 12,
  },
  selectLabel: {
    fontSize: 14,
    marginBottom: 8,
  },
  selectButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  selectButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  calculateButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 12,
  },
  calculateButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  resultBox: {
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  resultRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  resultValue: {
    fontWeight: '600',
  },
  closeButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
});

export default InstallmentsScreen;
