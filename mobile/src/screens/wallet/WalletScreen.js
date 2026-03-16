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
import { useTranslation } from '../hooks/useTranslation';
import { useThemeStore } from '../theme/ThemeContext';
import api from '../api/api';

const WalletScreen = () => {
  const { t } = useTranslation();
  const { colors } = useThemeStore();
  const [wallet, setWallet] = useState(null);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
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

  const fetchWallet = async () => {
    try {
      const res = await api.get('/wallet');
      setWallet(res.data);
    } catch (err) {
      console.error('Failed to fetch wallet:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/wallet/transactions');
      setTransactions(res.data || []);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
    }
  };

  const handleAddFunds = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    try {
      await api.post('/wallet/add-funds', {
        amount: parseFloat(amount),
        paymentId: 'mobile-' + Date.now(),
      });
      Alert.alert('Success', t('addFundsSuccess'));
      setShowAddFunds(false);
      setAmount('');
      fetchWallet();
      fetchTransactions();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to add funds');
    }
  };

  const handleTransfer = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      Alert.alert('Error', 'Please enter a valid amount');
      return;
    }
    if (!bankName || !accountNumber || !accountHolder) {
      Alert.alert('Error', 'Please fill all fields');
      return;
    }
    try {
      await api.post('/wallet/transfer-bank', {
        amount: parseFloat(amount),
        bankName,
        accountNumber,
        accountHolder,
      });
      Alert.alert('Success', t('transferSuccess'));
      setShowTransfer(false);
      setAmount('');
      setBankName('');
      setAccountNumber('');
      setAccountHolder('');
      fetchWallet();
      fetchTransactions();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to transfer');
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
      hour: '2-digit',
      minute: '2-digit',
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
        <Text style={styles.headerTitle}>{t('myWallet')}</Text>
        <Text style={styles.balanceLabel}>{t('walletBalance')}</Text>
        <Text style={styles.balance}>
          {formatCurrency(wallet?.balance)}
        </Text>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.primary }]}
          onPress={() => setShowAddFunds(true)}
        >
          <Ionicons name="add-circle" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>{t('addFunds')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: colors.secondary }]}
          onPress={() => setShowTransfer(true)}
        >
          <Ionicons name="send" size={24} color="#fff" />
          <Text style={styles.actionButtonText}>{t('transferToBank')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>
          {t('transactions')}
        </Text>
        {transactions.length === 0 ? (
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            {t('noTransactions')}
          </Text>
        ) : (
          transactions.slice().reverse().map((tx, index) => (
            <View
              key={index}
              style={[styles.transactionItem, { borderBottomColor: colors.border }]}
            >
              <View>
                <Text style={[styles.txDescription, { color: colors.text }]}>
                  {tx.description}
                </Text>
                <Text style={[styles.txDate, { color: colors.textSecondary }]}>
                  {formatDate(tx.createdAt)}
                </Text>
              </View>
              <Text
                style={[
                  styles.txAmount,
                  { color: tx.type === 'credit' ? colors.success : colors.error },
                ]}
              >
                {tx.type === 'credit' ? '+' : '-'}
                {formatCurrency(tx.amount)}
              </Text>
            </View>
          ))
        )}
      </View>

      {/* Add Funds Modal */}
      <Modal visible={showAddFunds} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('addFunds')}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
              placeholder={t('amount')}
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colors.border }]}
                onPress={() => setShowAddFunds(false)}
              >
                <Text style={{ color: colors.text }}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleAddFunds}
              >
                <Text style={{ color: '#fff' }}>{t('addFunds')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Transfer Modal */}
      <Modal visible={showTransfer} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('transferToBank')}
            </Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
              placeholder={t('amount')}
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={amount}
              onChangeText={setAmount}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
              placeholder={t('bankName')}
              placeholderTextColor={colors.textSecondary}
              value={bankName}
              onChangeText={setBankName}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
              placeholder={t('accountNumber')}
              placeholderTextColor={colors.textSecondary}
              keyboardType="numeric"
              value={accountNumber}
              onChangeText={setAccountNumber}
            />
            <TextInput
              style={[styles.input, { backgroundColor: colors.input, color: colors.text }]}
              placeholder={t('accountHolder')}
              placeholderTextColor={colors.textSecondary}
              value={accountHolder}
              onChangeText={setAccountHolder}
            />
            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colors.border }]}
                onPress={() => setShowTransfer(false)}
              >
                <Text style={{ color: colors.text }}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleTransfer}
              >
                <Text style={{ color: '#fff' }}>{t('transfer')}</Text>
              </TouchableOpacity>
            </View>
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
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
  },
  balanceLabel: {
    color: 'rgba(255,255,255,0.8)',
    fontSize: 14,
  },
  balance: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  actionButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14,
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
  transactionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  txDescription: {
    fontSize: 14,
    fontWeight: '500',
  },
  txDate: {
    fontSize: 12,
    marginTop: 2,
  },
  txAmount: {
    fontSize: 16,
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
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
});

export default WalletScreen;
