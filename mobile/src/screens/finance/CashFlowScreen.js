import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../api/api';
import financeDB from '../../services/FinanceDB';

const MONTHS_EN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const MONTHS_ID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

export default function FinanceCashFlowScreen({ navigation }) {
    const { colors } = useThemeStore();
    const { t, language } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [period, setPeriod] = useState('thisMonth');
    const [data, setData] = useState({
        income: 0,
        expenses: 0,
        net: 0,
        incomeChange: 0,
        expenseChange: 0,
    });
    const [dailyData, setDailyData] = useState([]);

    const months = language === 'id' ? MONTHS_ID : MONTHS_EN;

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const now = new Date();
            let startDate, endDate;

            if (period === 'thisMonth') {
                startDate = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
                endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
            } else if (period === 'lastMonth') {
                startDate = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
                endDate = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
            } else {
                startDate = new Date(now.getFullYear(), 0, 1).toISOString().split('T')[0];
                endDate = new Date(now.getFullYear(), 11, 31).toISOString().split('T')[0];
            }

            const ordersRes = await api.get('/orders/my-orders', { params: { limit: 500 } });
            const orders = ordersRes.data.orders || [];

            const periodIncome = orders
                .filter(o => {
                    const date = o.createdAt?.split('T')[0];
                    return date >= startDate && date <= endDate && 
                           (o.status === 'delivered' || o.status === 'completed');
                })
                .reduce((sum, o) => sum + (o.total || 0), 0);

            const expenses = await financeDB.getExpensesByDateRange(startDate, endDate);
            const periodExpenses = expenses.reduce((sum, e) => sum + (e.amount || 0), 0);

            const prevNow = new Date(now.getFullYear(), now.getMonth() - 1, 1);
            let prevStart, prevEnd;
            
            if (period === 'thisMonth') {
                prevStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString().split('T')[0];
                prevEnd = new Date(now.getFullYear(), now.getMonth(), 0).toISOString().split('T')[0];
            } else if (period === 'lastMonth') {
                prevStart = new Date(now.getFullYear(), now.getMonth() - 2, 1).toISOString().split('T')[0];
                prevEnd = new Date(now.getFullYear(), now.getMonth() - 1, 0).toISOString().split('T')[0];
            } else {
                prevStart = new Date(now.getFullYear() - 1, 0, 1).toISOString().split('T')[0];
                prevEnd = new Date(now.getFullYear() - 1, 11, 31).toISOString().split('T')[0];
            }

            const prevOrders = orders.filter(o => {
                const date = o.createdAt?.split('T')[0];
                return date >= prevStart && date <= prevEnd && 
                       (o.status === 'delivered' || o.status === 'completed');
            });
            const prevIncome = prevOrders.reduce((sum, o) => sum + (o.total || 0), 0);

            const prevExpenses = await financeDB.getExpensesByDateRange(prevStart, prevEnd);
            const prevExpenseTotal = prevExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);

            const incomeChange = prevIncome > 0 ? ((periodIncome - prevIncome) / prevIncome * 100) : 0;
            const expenseChange = prevExpenseTotal > 0 ? ((periodExpenses - prevExpenseTotal) / prevExpenseTotal * 100) : 0;

            setData({
                income: periodIncome,
                expenses: periodExpenses,
                net: periodIncome - periodExpenses,
                incomeChange,
                expenseChange,
            });

            const dailyMap = {};
            const expenseByDate = {};
            expenses.forEach(e => {
                expenseByDate[e.date] = (expenseByDate[e.date] || 0) + e.amount;
            });
            orders.forEach(o => {
                if (o.status === 'delivered' || o.status === 'completed') {
                    const date = o.createdAt?.split('T')[0];
                    if (date >= startDate && date <= endDate) {
                        dailyMap[date] = (dailyMap[date] || 0) + (o.total || 0);
                    }
                }
            });

            const daily = [];
            let currDate = new Date(startDate);
            const endD = new Date(endDate);
            while (currDate <= endD) {
                const dateStr = currDate.toISOString().split('T')[0];
                daily.push({
                    date: dateStr,
                    income: dailyMap[dateStr] || 0,
                    expenses: expenseByDate[dateStr] || 0,
                });
                currDate.setDate(currDate.getDate() + 1);
            }
            setDailyData(daily.slice(-14));

        } catch (error) {
            console.error('Failed to load cash flow:', error);
        } finally {
            setLoading(false);
        }
    }, [period]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const formatCurrency = (amount) => 'Rp ' + (amount || 0).toLocaleString('id-ID');

    const getMonthLabel = () => {
        const now = new Date();
        if (period === 'thisMonth') {
            return months[now.getMonth()] + ' ' + now.getFullYear();
        } else if (period === 'lastMonth') {
            return months[(now.getMonth() + 11) % 12] + ' ' + now.getFullYear();
        } else {
            return now.getFullYear().toString();
        }
    };

    const maxValue = Math.max(...dailyData.map(d => Math.max(d.income, d.expenses)), 1);

    const renderBar = (value, max, isIncome) => {
        const height = (value / max) * 60;
        return (
            <View style={[styles.barWrapper]}>
                <View 
                    style={[
                        styles.bar, 
                        { 
                            height: Math.max(height, 2),
                            backgroundColor: isIncome ? '#22c55e' : '#ef4444'
                        }
                    ]} 
                />
            </View>
        );
    };

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
        >
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Cash Flow</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {language === 'id' ? 'Aliran masuk & keluar' : 'Income & expenses'}
                </Text>
            </View>

            <View style={styles.periodTabs}>
                <TouchableOpacity 
                    style={[styles.periodTab, period === 'thisMonth' && { backgroundColor: colors.primary }]}
                    onPress={() => setPeriod('thisMonth')}
                >
                    <Text style={[styles.periodTabText, period === 'thisMonth' && { color: '#fff' }]}>
                        {language === 'id' ? 'Bulan Ini' : 'This Month'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.periodTab, period === 'lastMonth' && { backgroundColor: colors.primary }]}
                    onPress={() => setPeriod('lastMonth')}
                >
                    <Text style={[styles.periodTabText, period === 'lastMonth' && { color: '#fff' }]}>
                        {language === 'id' ? 'Bulan Lalu' : 'Last Month'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity 
                    style={[styles.periodTab, period === 'year' && { backgroundColor: colors.primary }]}
                    onPress={() => setPeriod('year')}
                >
                    <Text style={[styles.periodTabText, period === 'year' && { color: '#fff' }]}>
                        {language === 'id' ? 'Tahun Ini' : 'This Year'}
                    </Text>
                </TouchableOpacity>
            </View>

            <View style={[styles.summaryCard, { backgroundColor: colors.card }]}>
                <Text style={[styles.periodLabel, { color: colors.textSecondary }]}>{getMonthLabel()}</Text>
                
                <View style={styles.row}>
                    <View style={styles.col}>
                        <View style={[styles.iconWrap, { backgroundColor: '#22c55e20' }]}>
                            <Ionicons name="arrow-down" size={16} color="#22c55e" />
                        </View>
                        <Text style={[styles.colLabel, { color: colors.textSecondary }]}>
                            {language === 'id' ? 'Pemasukan' : 'Income'}
                        </Text>
                        <Text style={[styles.colValue, { color: '#22c55e' }]}>{formatCurrency(data.income)}</Text>
                        <Text style={[
                            styles.changeText, 
                            { color: data.incomeChange >= 0 ? '#22c55e' : '#ef4444' }
                        ]}>
                            {data.incomeChange >= 0 ? '+' : ''}{data.incomeChange.toFixed(1)}%
                        </Text>
                    </View>

                    <View style={styles.divider} />

                    <View style={styles.col}>
                        <View style={[styles.iconWrap, { backgroundColor: '#ef444420' }]}>
                            <Ionicons name="arrow-up" size={16} color="#ef4444" />
                        </View>
                        <Text style={[styles.colLabel, { color: colors.textSecondary }]}>
                            {language === 'id' ? 'Pengeluaran' : 'Expenses'}
                        </Text>
                        <Text style={[styles.colValue, { color: '#ef4444' }]}>{formatCurrency(data.expenses)}</Text>
                        <Text style={[
                            styles.changeText, 
                            { color: data.expenseChange >= 0 ? '#ef4444' : '#22c55e' }
                        ]}>
                            {data.expenseChange >= 0 ? '+' : ''}{data.expenseChange.toFixed(1)}%
                        </Text>
                    </View>
                </View>

                <View style={[styles.netRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.netLabel, { color: colors.textSecondary }]}>
                        {language === 'id' ? 'Saldo Bersih' : 'Net Balance'}
                    </Text>
                    <Text style={[
                        styles.netValue, 
                        { color: data.net >= 0 ? '#22c55e' : '#ef4444' }
                    ]}>
                        {formatCurrency(data.net)}
                    </Text>
                </View>
            </View>

            <View style={styles.chartSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {language === 'id' ? 'TREN 14 HARI' : 'LAST 14 DAYS'}
                </Text>
                <View style={[styles.chartCard, { backgroundColor: colors.card }]}>
                    <View style={styles.chart}>
                        {dailyData.map((d, i) => (
                            <View key={d.date} style={styles.barColumn}>
                                {renderBar(d.income, maxValue, true)}
                                {renderBar(d.expenses, maxValue, false)}
                            </View>
                        ))}
                    </View>
                    <View style={styles.chartLegend}>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#22c55e' }]} />
                            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                                {language === 'id' ? 'Pemasukan' : 'Income'}
                            </Text>
                        </View>
                        <View style={styles.legendItem}>
                            <View style={[styles.legendDot, { backgroundColor: '#ef4444' }]} />
                            <Text style={[styles.legendText, { color: colors.textSecondary }]}>
                                {language === 'id' ? 'Pengeluaran' : 'Expenses'}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>

            <View style={styles.tips}>
                <Ionicons name="bulb-outline" size={20} color={colors.primary} />
                <Text style={[styles.tipsText, { color: colors.text }]}>
                    {data.net >= 0 
                        ? (language === 'id' 
                            ? 'Bisnis kamu profitabel! Tetap catat pengeluaran untuk tracking lebih akurat.'
                            : 'Your business is profitable! Keep tracking expenses for accurate insights.')
                        : (language === 'id'
                            ? 'Pengeluaran lebih tinggi dari income. Coba kurangi biaya operate.'
                            : 'Expenses exceed income. Consider reducing operating costs.')}
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loading: { justifyContent: 'center', alignItems: 'center' },
    content: { padding: 16, paddingBottom: 32 },
    header: { marginBottom: 16 },
    title: { fontSize: 24, fontWeight: '700' },
    subtitle: { fontSize: 14, marginTop: 4 },
    periodTabs: { flexDirection: 'row', gap: 8, marginBottom: 16 },
    periodTab: { flex: 1, paddingVertical: 10, borderRadius: 8, backgroundColor: '#f0f0f0', alignItems: 'center' },
    periodTabText: { fontSize: 13, fontWeight: '500', color: '#666' },
    summaryCard: { borderRadius: 16, padding: 16, marginBottom: 16 },
    periodLabel: { fontSize: 12, marginBottom: 12 },
    row: { flexDirection: 'row' },
    col: { flex: 1, alignItems: 'center' },
    iconWrap: { width: 32, height: 32, borderRadius: 8, justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
    colLabel: { fontSize: 12 },
    colValue: { fontSize: 18, fontWeight: '700', marginTop: 4 },
    changeText: { fontSize: 11, marginTop: 2 },
    divider: { width: 1, backgroundColor: '#e0e0e0', marginHorizontal: 16 },
    netRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 16, paddingTop: 16, borderTopWidth: 1 },
    netLabel: { fontSize: 14, fontWeight: '500' },
    netValue: { fontSize: 20, fontWeight: '700' },
    chartSection: { marginBottom: 16 },
    sectionTitle: { fontSize: 12, fontWeight: '600', marginBottom: 12 },
    chartCard: { borderRadius: 16, padding: 16 },
    chart: { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-around', height: 80 },
    barColumn: { flex: 1, alignItems: 'center', gap: 4 },
    barWrapper: { height: 60, justifyContent: 'flex-end' },
    bar: { width: 12, borderRadius: 4 },
    chartLegend: { flexDirection: 'row', justifyContent: 'center', gap: 16, marginTop: 12 },
    legendItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
    legendDot: { width: 8, height: 8, borderRadius: 4 },
    legendText: { fontSize: 11 },
    tips: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#f5f5f5', padding: 16, borderRadius: 12 },
    tipsText: { flex: 1, fontSize: 13, lineHeight: 18 },
});