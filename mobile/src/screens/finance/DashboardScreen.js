import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, RefreshControl, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../api/api';
import financeDB from '../../services/FinanceDB';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export default function FinanceDashboardScreen({ navigation }) {
    const { colors } = useThemeStore();
    const { t, language } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [stats, setStats] = useState({
        totalSales: 0,
        totalExpenses: 0,
        netProfit: 0,
        orderCount: 0,
        thisMonth: 0,
        lastMonth: 0
    });
    const [recentOrders, setRecentOrders] = useState([]);

    const loadData = useCallback(async () => {
        try {
            const ordersRes = await api.get('/orders/my-orders', { params: { limit: 50 } });
            const orders = ordersRes.data.orders || [];
            
            const totalSales = orders
                .filter(o => o.status === 'delivered' || o.status === 'completed')
                .reduce((sum, o) => sum + (o.total || 0), 0);
            
            const orderCount = orders.filter(o => o.status === 'delivered' || o.status === 'completed').length;
            
            const now = new Date();
            const thisMonth = now.toISOString().slice(0, 7);
            const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().slice(0, 7);
            
            const thisMonthSales = orders
                .filter(o => {
                    const date = o.createdAt?.slice(0, 7);
                    return date === thisMonth && (o.status === 'delivered' || o.status === 'completed');
                })
                .reduce((sum, o) => sum + (o.total || 0), 0);
            
            const lastMonthSales = orders
                .filter(o => {
                    const date = o.createdAt?.slice(0, 7);
                    return date === lastMonth && (o.status === 'delivered' || o.status === 'completed');
                })
                .reduce((sum, o) => sum + (o.total || 0), 0);
            
            const expenses = await financeDB.getTotalExpenses();
            
            setStats({
                totalSales,
                totalExpenses: expenses,
                netProfit: totalSales - expenses,
                orderCount,
                thisMonth: thisMonthSales,
                lastMonth: lastMonthSales
            });
            
            setRecentOrders(orders.slice(0, 5));
        } catch (error) {
            console.error('Failed to load finance data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const onRefresh = useCallback(async () => {
        setRefreshing(true);
        await loadData();
        setRefreshing(false);
    }, [loadData]);

    const formatCurrency = (amount) => {
        return 'Rp ' + ((amount || 0)).toLocaleString('id-ID');
    };

    const getMonthName = (monthStr) => {
        if (!monthStr) return '-';
        const month = parseInt(monthStr.split('-')[1]) - 1;
        return MONTHS[month];
    };

    const renderCard = (title, value, subtitle, icon, color) => (
        <View style={[styles.card, { backgroundColor: colors.card }]}>
            <View style={[styles.cardIcon, { backgroundColor: color + '20' }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text style={[styles.cardTitle, { color: colors.textSecondary }]}>{title}</Text>
            <Text style={[styles.cardValue, { color: colors.text }]}>{value}</Text>
            {subtitle && <Text style={[styles.cardSubtitle, { color: colors.textSecondary }]}>{subtitle}</Text>}
        </View>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.loading, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
            refreshControl={
                <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
            }
        >
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>{t.finance || 'Finance'}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {language === 'id' ? 'Ringkasan bisnismu' : 'Business overview'}
                </Text>
            </View>

            <View style={styles.summaryRow}>
                <View style={[styles.mainCard, { backgroundColor: colors.primary }]}>
                    <Text style={styles.mainCardLabel}>
                        {language === 'id' ? 'Total Penjualan' : 'Total Sales'}
                    </Text>
                    <Text style={styles.mainCardValue}>{formatCurrency(stats.totalSales)}</Text>
                    <Text style={styles.mainCardSublabel}>
                        {stats.orderCount} {language === 'id' ? 'pesanan' : 'orders'}
                    </Text>
                </View>
            </View>

            <View style={styles.cardsRow}>
                {renderCard(
                    language === 'id' ? 'Pengeluaran' : 'Expenses',
                    formatCurrency(stats.totalExpenses),
                    null,
                    'trending-down',
                    '#ef4444'
                )}
                {renderCard(
                    language === 'id' ? 'Laba Bersih' : 'Net Profit',
                    formatCurrency(stats.netProfit),
                    stats.netProfit >= 0 ? null : language === 'id' ? 'Rugi' : 'Loss',
                    'trending-up',
                    stats.netProfit >= 0 ? '#22c55e' : '#ef4444'
                )}
            </View>

            <View style={styles.quickActions}>
                <TouchableOpacity 
                    style={[styles.quickAction, { backgroundColor: colors.card }]}
                    onPress={() => navigation.navigate('FinanceExpenses')}
                >
                    <Ionicons name="receipt-outline" size={24} color={colors.primary} />
                    <Text style={[styles.quickActionText, { color: colors.text }]}>
                        {language === 'id' ? 'Pengeluaran' : 'Expenses'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.quickAction, { backgroundColor: colors.card }]}
                    onPress={() => navigation.navigate('FinanceCashFlow')}
                >
                    <Ionicons name="trending-up-outline" size={24} color={colors.primary} />
                    <Text style={[styles.quickActionText, { color: colors.text }]}>
                        {language === 'id' ? 'Aliran Dana' : 'Cash Flow'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.quickAction, { backgroundColor: colors.card }]}
                    onPress={() => navigation.navigate('FinanceCalculator')}
                >
                    <Ionicons name="calculator-outline" size={24} color={colors.primary} />
                    <Text style={[styles.quickActionText, { color: colors.text }]}>
                        {language === 'id' ? 'Kalkulator' : 'Calculator'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.quickAction, { backgroundColor: colors.card }]}
                    onPress={() => navigation.navigate('FinanceInvoices')}
                >
                    <Ionicons name="document-text-outline" size={24} color={colors.primary} />
                    <Text style={[styles.quickActionText, { color: colors.text }]}>
                        {language === 'id' ? 'Invoice' : 'Invoices'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {language === 'id' ? 'Bulan Ini' : 'This Month'}
                </Text>
                <View style={[styles.monthCard, { backgroundColor: colors.card }]}>
                    <View style={styles.monthItem}>
                        <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>
                            {getMonthName(stats.thisMonth)}
                        </Text>
                        <Text style={[styles.monthValue, { color: colors.text }]}>
                            {formatCurrency(stats.thisMonth)}
                        </Text>
                    </View>
                    <View style={styles.monthItem}>
                        <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>
                            {language === 'id' ? 'Bulan Lalu' : 'Last Month'}
                        </Text>
                        <Text style={[styles.monthValue, { color: colors.text }]}>
                            {formatCurrency(stats.lastMonth)}
                        </Text>
                    </View>
                    <View style={styles.monthItem}>
                        <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>
                            {language === 'id' ? 'Pertumbuhan' : 'Growth'}
                        </Text>
                        <Text style={[
                            styles.monthValue,
                            { color: stats.lastMonth > 0 ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100 >= 0 ? '#22c55e' : '#ef4444') : colors.text }
                        ]}>
                            {stats.lastMonth > 0
                                ? ((stats.thisMonth - stats.lastMonth) / stats.lastMonth * 100).toFixed(1) + '%'
                                : '-'}
                        </Text>
                    </View>
                </View>
            </View>

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {language === 'id' ? 'Pesanan Terbaru' : 'Recent Orders'}
                </Text>
                {recentOrders.length === 0 ? (
                    <View style={[styles.emptyCard, { backgroundColor: colors.card }]}>
                        <Ionicons name="receipt-outline" size={32} color={colors.textSecondary} />
                        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                            {language === 'id' ? 'Belum ada pesanan' : 'No orders yet'}
                        </Text>
                    </View>
                ) : (
                    recentOrders.map((order, index) => (
                        <View key={order._id || index} style={[styles.orderCard, { backgroundColor: colors.card }]}>
                            <View style={styles.orderHeader}>
                                <Text style={[styles.orderId, { color: colors.text }]}>
                                    #{order.orderId?.slice(-6) || order._id?.slice(-6)}
                                </Text>
                                <Text style={[styles.orderStatus, { color: colors.primary }]}>
                                    {order.status}
                                </Text>
                            </View>
                            <Text style={[styles.orderCustomer, { color: colors.textSecondary }]}>
                                {order.customer?.name || order.shippingAddress?.name || '-'}
                            </Text>
                            <Text style={[styles.orderTotal, { color: colors.text }]}>
                                {formatCurrency(order.total)}
                            </Text>
                        </View>
                    ))
                )}
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loading: { justifyContent: 'center', alignItems: 'center' },
    content: { padding: 16, paddingBottom: 32 },
    header: { marginBottom: 20 },
    title: { fontSize: 24, fontWeight: '700' },
    subtitle: { fontSize: 14, marginTop: 4 },
    summaryRow: { marginBottom: 16 },
    mainCard: {
        borderRadius: 16,
        padding: 20,
    },
    mainCardLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    mainCardValue: { color: '#fff', fontSize: 28, fontWeight: '700', marginVertical: 8 },
    mainCardSublabel: { color: 'rgba(255,255,255,0.7)', fontSize: 12 },
    cardsRow: { flexDirection: 'row', gap: 12, marginBottom: 20 },
    card: { flex: 1, borderRadius: 12, padding: 16 },
    cardIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
    cardTitle: { fontSize: 12 },
    cardValue: { fontSize: 18, fontWeight: '600', marginTop: 4 },
    cardSubtitle: { fontSize: 11, marginTop: 2 },
    section: { marginBottom: 20 },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
    monthCard: { borderRadius: 12, padding: 16 },
    monthItem: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
    monthLabel: { fontSize: 14 },
    monthValue: { fontSize: 14, fontWeight: '600' },
    emptyCard: { borderRadius: 12, padding: 24, alignItems: 'center' },
    emptyText: { marginTop: 8, fontSize: 14 },
    orderCard: { borderRadius: 12, padding: 16, marginBottom: 8 },
    orderHeader: { flexDirection: 'row', justifyContent: 'space-between' },
    orderId: { fontSize: 14, fontWeight: '600' },
    orderStatus: { fontSize: 12 },
    orderCustomer: { fontSize: 12, marginTop: 2 },
    orderTotal: { fontSize: 16, fontWeight: '600', marginTop: 8 },
    quickActions: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
    quickAction: { width: '31%', borderRadius: 12, padding: 16, alignItems: 'center' },
    quickActionText: { fontSize: 11, marginTop: 6, textAlign: 'center' },
});