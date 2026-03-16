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

const InventoryScreen = () => {
  const { t } = useTranslation();
  const { colors } = useThemeStore();
  const [inventory, setInventory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showAdjust, setShowAdjust] = useState(null);
  const [adjustAmount, setAdjustAmount] = useState('');
  const [adjustReason, setAdjustReason] = useState('');

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    try {
      const res = await api.get('/products/my-products');
      setInventory(res.data || []);
    } catch (err) {
      console.error('Failed to fetch inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStock = async (productId, newStock) => {
    try {
      await api.put(`/products/${productId}`, { stock: parseInt(newStock) });
      fetchInventory();
    } catch (err) {
      Alert.alert('Error', 'Failed to update stock');
    }
  };

  const handleAdjustStock = async () => {
    if (!adjustAmount || !adjustReason) {
      Alert.alert('Error', 'Please enter amount and reason');
      return;
    }
    try {
      await api.post(`/products/${showAdjust._id}/adjust-stock`, {
        adjustment: parseInt(adjustAmount),
        reason: adjustReason,
      });
      Alert.alert('Success', t('stockAdjusted'));
      setShowAdjust(null);
      setAdjustAmount('');
      setAdjustReason('');
      fetchInventory();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.error || 'Failed to adjust stock');
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const filteredInventory = inventory.filter((product) => {
    if (filter === 'all') return true;
    if (filter === 'in') return product.stock > 10;
    if (filter === 'low') return product.stock > 0 && product.stock <= 10;
    if (filter === 'out') return product.stock === 0;
    return true;
  });

  const inStockCount = inventory.filter((p) => p.stock > 10).length;
  const lowStockCount = inventory.filter((p) => p.stock > 0 && p.stock <= 10).length;
  const outOfStockCount = inventory.filter((p) => p.stock === 0).length;

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
        <Text style={styles.headerTitle}>{t('inventoryManagement')}</Text>
      </View>

      <View style={styles.statsRow}>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: colors.success + '20' }]}
          onPress={() => setFilter('in')}
        >
          <Text style={[styles.statValue, { color: colors.success }]}>{inStockCount}</Text>
          <Text style={[styles.statLabel, { color: colors.success }]}>{t('inStock')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: colors.warning + '20' }]}
          onPress={() => setFilter('low')}
        >
          <Text style={[styles.statValue, { color: colors.warning }]}>{lowStockCount}</Text>
          <Text style={[styles.statLabel, { color: colors.warning }]}>{t('lowStock')}</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.statCard, { backgroundColor: colors.error + '20' }]}
          onPress={() => setFilter('out')}
        >
          <Text style={[styles.statValue, { color: colors.error }]}>{outOfStockCount}</Text>
          <Text style={[styles.statLabel, { color: colors.error }]}>{t('outOfStock')}</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.filterRow}>
        {['all', 'in', 'low', 'out'].map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterButton,
              { backgroundColor: filter === f ? colors.primary : colors.card },
            ]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={{
                color: filter === f ? '#fff' : colors.text,
                fontWeight: '500',
              }}
            >
              {f === 'all' ? t('all') : f === 'in' ? t('inStock') : f === 'low' ? t('lowStock') : t('outOfStock')}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.list}>
        {filteredInventory.map((product) => (
          <View
            key={product._id}
            style={[styles.productCard, { backgroundColor: colors.card }]}
          >
            <View style={styles.productInfo}>
              <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
                {product.name}
              </Text>
              <Text style={[styles.productPrice, { color: colors.textSecondary }]}>
                {formatCurrency(product.price)}
              </Text>
            </View>
            <View style={styles.stockControl}>
              <TextInput
                style={[
                  styles.stockInput,
                  { backgroundColor: colors.input, color: colors.text },
                ]}
                value={String(product.stock)}
                keyboardType="numeric"
                onBlur={(e) => handleUpdateStock(product._id, e.nativeEvent.text)}
              />
              <TouchableOpacity
                style={[styles.adjustButton, { backgroundColor: colors.primary }]}
                onPress={() => setShowAdjust(product)}
              >
                <Ionicons name="swap-vertical" size={16} color="#fff" />
              </TouchableOpacity>
            </View>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    product.stock === 0
                      ? colors.error + '20'
                      : product.stock <= 10
                      ? colors.warning + '20'
                      : colors.success + '20',
                },
              ]}
            >
              <Text
                style={[
                  styles.statusText,
                  {
                    color:
                      product.stock === 0
                        ? colors.error
                        : product.stock <= 10
                        ? colors.warning
                        : colors.success,
                  },
                ]}
              >
                {product.stock === 0
                  ? t('outOfStock')
                  : product.stock <= 10
                  ? t('lowStock')
                  : t('inStock')}
              </Text>
            </View>
          </View>
        ))}
      </View>

      {/* Adjust Stock Modal */}
      <Modal visible={!!showAdjust} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              {t('adjustStock')}
            </Text>
            <Text style={[styles.productLabel, { color: colors.textSecondary }]}>
              {showAdjust?.name}
            </Text>

            <View style={styles.adjustRow}>
              <TouchableOpacity
                style={[styles.adjustButton2, { backgroundColor: colors.error }]}
                onPress={() => setAdjustAmount(String(-1))}
              >
                <Ionicons name="remove" size={24} color="#fff" />
              </TouchableOpacity>
              <TextInput
                style={[
                  styles.adjustInput,
                  { backgroundColor: colors.input, color: colors.text },
                ]}
                placeholder="+/-"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                value={adjustAmount}
                onChangeText={setAdjustAmount}
              />
              <TouchableOpacity
                style={[styles.adjustButton2, { backgroundColor: colors.success }]}
                onPress={() => setAdjustAmount('1')}
              >
                <Ionicons name="add" size={24} color="#fff" />
              </TouchableOpacity>
            </View>

            <Text style={[styles.currentStock, { color: colors.textSecondary }]}>
              Current: {showAdjust?.stock} → New: {showAdjust?.stock + parseInt(adjustAmount || 0)}
            </Text>

            <View style={styles.reasonRow}>
              {['restock', 'sale', 'return', 'damaged'].map((r) => (
                <TouchableOpacity
                  key={r}
                  style={[
                    styles.reasonButton,
                    {
                      backgroundColor:
                        adjustReason === r ? colors.primary : colors.input,
                    },
                  ]}
                  onPress={() => setAdjustReason(r)}
                >
                  <Text
                    style={{
                      color: adjustReason === r ? '#fff' : colors.text,
                      fontSize: 12,
                    }}
                  >
                    {t(r)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={[styles.modalButton, { borderColor: colors.border }]}
                onPress={() => setShowAdjust(null)}
              >
                <Text style={{ color: colors.text }}>{t('cancel')}</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modalButton, { backgroundColor: colors.primary }]}
                onPress={handleAdjustStock}
              >
                <Text style={{ color: '#fff' }}>{t('save')}</Text>
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
    fontSize: 20,
    fontWeight: 'bold',
  },
  statsRow: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  statCard: {
    flex: 1,
    padding: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 8,
    marginBottom: 16,
  },
  filterButton: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  list: {
    padding: 16,
    paddingTop: 0,
  },
  productCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  productInfo: {
    flex: 1,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
  },
  productPrice: {
    fontSize: 12,
    marginTop: 2,
  },
  stockControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  stockInput: {
    width: 50,
    padding: 6,
    borderRadius: 6,
    textAlign: 'center',
    fontSize: 14,
  },
  adjustButton: {
    width: 32,
    height: 32,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusBadge: {
    marginLeft: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 10,
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
    textAlign: 'center',
  },
  productLabel: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
  },
  adjustRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  adjustButton2: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  adjustInput: {
    width: 80,
    padding: 12,
    borderRadius: 8,
    textAlign: 'center',
    fontSize: 18,
  },
  currentStock: {
    textAlign: 'center',
    fontSize: 14,
    marginBottom: 12,
  },
  reasonRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    justifyContent: 'center',
    marginBottom: 16,
  },
  reasonButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  modalButton: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
});

export default InventoryScreen;
