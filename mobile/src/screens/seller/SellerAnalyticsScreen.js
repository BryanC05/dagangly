import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from '../hooks/useTranslation';
import { useThemeStore } from '../theme/ThemeContext';
import api from '../api/api';

const SellerAnalyticsScreen = () => {
  const { t } = useTranslation();
  const { colors } = useThemeStore();
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const fetchAnalytics = async () => {
    try {
      const res = await api.get(`/analytics/seller?period=${period}`);
      setAnalytics(res.data);
    } catch (err) {
      console.error('Failed to fetch analytics:', err);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (value) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const stats = [
    {
      label: t('totalRevenue'),
      value: analytics?.totalRevenue ? formatCurrency(analytics.totalRevenue) : formatCurrency(0),
      icon: 'wallet',
      color: colors.success,
    },
    {
      label: t('totalOrders'),
      value: analytics?.orderCount || 0,
      icon: 'cart',
      color: colors.primary,
    },
    {
      label: t('totalProducts'),
      value: analytics?.productCount || 0,
      icon: 'cube',
      color: colors.warning,
    },
    {
      label: t('avgRating'),
      value: analytics?.avgRating ? analytics.avgRating.toFixed(1) : '0.0',
      icon: 'star',
      color: '#FFD700',
    },
  ];

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
        <Text style={styles.headerTitle}>{t('sellerAnalytics')}</Text>
      </View>

      <View style={styles.periodSelector}>
        {[
          { value: '7', label: '7D' },
          { value: '30', label: '30D' },
          { value: '90', label: '90D' },
        ].map((p) => (
          <TouchableOpacity
            key={p.value}
            style={[
              styles.periodButton,
              {
                backgroundColor: period === p.value ? colors.primary : colors.card,
              },
            ]}
            onPress={() => setPeriod(p.value)}
          >
            <Text
              style={{
                color: period === p.value ? '#fff' : colors.text,
                fontWeight: '600',
              }}
            >
              {p.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.statsGrid}>
        {stats.map((stat, index) => (
          <View key={index} style={[styles.statCard, { backgroundColor: colors.card }]}>
            <Ionicons name={stat.icon} size={24} color={stat.color} />
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>
              {stat.label}
            </Text>
            <Text style={[styles.statValue, { color: colors.text }]}>
              {stat.value}
            </Text>
          </View>
        ))}
      </View>

      {analytics?.topProducts?.length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('topProducts')}
          </Text>
          <View style={[styles.listCard, { backgroundColor: colors.card }]}>
            {analytics.topProducts.map((product, index) => (
              <View
                key={index}
                style={[styles.listItem, { borderBottomColor: colors.border }]}
              >
                <View style={styles.listItemLeft}>
                  <Text style={[styles.rank, { color: colors.primary }]}>#{index + 1}</Text>
                  <View>
                    <Text style={[styles.productName, { color: colors.text }]}>
                      {product.name || 'Product'}
                    </Text>
                    <Text style={[styles.productSold, { color: colors.textSecondary }]}>
                      {product.totalSold || 0} sold
                    </Text>
                  </View>
                </View>
                <Text style={[styles.productRevenue, { color: colors.success }]}>
                  {formatCurrency(product.revenue)}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {analytics?.ordersByStatus && Object.keys(analytics.ordersByStatus).length > 0 && (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>
            {t('ordersByStatus')}
          </Text>
          <View style={[styles.listCard, { backgroundColor: colors.card }]}>
            {Object.entries(analytics.ordersByStatus).map(([status, count]) => (
              <View
                key={status}
                style={[styles.statusItem, { borderBottomColor: colors.border }]}
              >
                <Text style={[styles.statusName, { color: colors.text }]}>
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </Text>
                <Text style={[styles.statusCount, { color: colors.primary }]}>
                  {count}
                </Text>
              </View>
            ))}
          </View>
        </View>
      )}
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
  periodSelector: {
    flexDirection: 'row',
    padding: 16,
    gap: 8,
  },
  periodButton: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 8,
    gap: 8,
  },
  statCard: {
    width: '48%',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 8,
  },
  statLabel: {
    fontSize: 12,
    marginTop: 8,
  },
  statValue: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 4,
  },
  section: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  listCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
  },
  listItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  rank: {
    fontSize: 16,
    fontWeight: 'bold',
    width: 30,
  },
  productName: {
    fontSize: 14,
    fontWeight: '500',
  },
  productSold: {
    fontSize: 12,
    marginTop: 2,
  },
  productRevenue: {
    fontSize: 14,
    fontWeight: '600',
  },
  statusItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 12,
    borderBottomWidth: 1,
  },
  statusName: {
    fontSize: 14,
  },
  statusCount: {
    fontSize: 14,
    fontWeight: '600',
  },
});

export default SellerAnalyticsScreen;
