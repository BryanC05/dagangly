import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet,
    RefreshControl, ActivityIndicator, Alert, Dimensions
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../api/api';

const { width } = Dimensions.get('window');

export default function AdminDashboardScreen({ navigation }) {
    const { colors, isDarkMode } = useThemeStore();
    const { t } = useTranslation();
    const [stats, setStats] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchStats = useCallback(async () => {
        try {
            const response = await api.get('/admin/dashboard');
            setStats(response.data);
        } catch (error) {
            console.error('Error fetching admin stats:', error);
            Alert.alert('Error', 'Failed to load dashboard data');
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    useEffect(() => {
        fetchStats();
    }, [fetchStats]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchStats();
    };

    const formatCurrency = (amount) => {
        return `Rp${(amount || 0).toLocaleString('id-ID')}`;
    };

    if (loading) {
        return (
            <View style={[styles.center, { backgroundColor: isDarkMode ? '#0f172a' : '#f3f5f7' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const StatCard = ({ title, value, icon, color, subtitle }) => (
        <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={[styles.iconBox, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={24} color={color} />
            </View>
            <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
            <Text style={[styles.statTitle, { color: colors.textSecondary }]}>{title}</Text>
            {subtitle && (
                <Text style={[styles.statSubtitle, { color: color }]}>{subtitle}</Text>
            )}
        </View>
    );

    const ActionButton = ({ title, icon, color, route }) => (
        <TouchableOpacity 
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => navigation.navigate(route)}
        >
            <View style={[styles.actionIcon, { backgroundColor: `${color}15` }]}>
                <Ionicons name={icon} size={20} color={color} />
            </View>
            <Text style={[styles.actionText, { color: colors.text }]}>{title}</Text>
            <Ionicons name="chevron-forward" size={16} color={colors.textSecondary} />
        </TouchableOpacity>
    );

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: isDarkMode ? '#0f172a' : '#f3f5f7' }]}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}
        >
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Admin Dashboard</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>Platform Overview</Text>
            </View>

            {stats && (
                <View style={styles.statsGrid}>
                    <StatCard 
                        title="Total Users" 
                        value={stats.totalUsers || 0} 
                        icon="people" 
                        color="#3b82f6" 
                    />
                    <StatCard 
                        title="Total Sellers" 
                        value={stats.totalSellers || 0} 
                        icon="storefront" 
                        color="#10b981" 
                    />
                    <StatCard 
                        title="Total Revenue" 
                        value={formatCurrency(stats.totalRevenue)} 
                        icon="wallet" 
                        color="#f59e0b" 
                        subtitle="Platform Income"
                    />
                    <StatCard 
                        title="Total Orders" 
                        value={stats.totalOrders || 0} 
                        icon="cart" 
                        color="#8b5cf6" 
                    />
                    <StatCard 
                        title="Total Products" 
                        value={stats.totalProducts || 0} 
                        icon="cube" 
                        color="#ef4444" 
                    />
                    <StatCard 
                        title="Pending Disputes" 
                        value={stats.pendingDisputes || 0} 
                        icon="warning" 
                        color="#f43f5e" 
                    />
                </View>
            )}

            <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Management Tools</Text>
                <View style={styles.actionGrid}>
                    <ActionButton 
                        title="Membership Approvals" 
                        icon="shield-checkmark" 
                        color={colors.primary} 
                        route="AdminMembership" 
                    />
                    <ActionButton 
                        title="Business Registrations" 
                        icon="business" 
                        color="#10b981" 
                        route="AdminRegistrations" 
                    />
                    <ActionButton 
                        title="Manage Disputes" 
                        icon="alert-circle" 
                        color="#f43f5e" 
                        route="AdminDisputes" 
                    />
                    <ActionButton 
                        title="User Management" 
                        icon="people-circle" 
                        color="#3b82f6" 
                        route="AdminUsers" 
                    />
                </View>
            </View>
            <View style={{ height: 40 }} />
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    center: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        padding: 20,
        paddingTop: 30,
        marginBottom: 10,
    },
    title: {
        fontSize: 28,
        fontWeight: '800',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        fontWeight: '500',
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 12,
        justifyContent: 'space-between',
    },
    statCard: {
        width: (width - 44) / 2,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        marginBottom: 12,
    },
    iconBox: {
        width: 48,
        height: 48,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 12,
    },
    statValue: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 4,
    },
    statTitle: {
        fontSize: 13,
        fontWeight: '500',
    },
    statSubtitle: {
        fontSize: 11,
        fontWeight: '600',
        marginTop: 4,
    },
    section: {
        padding: 20,
        marginTop: 10,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        marginBottom: 16,
    },
    actionGrid: {
        gap: 12,
    },
    actionBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
    },
    actionIcon: {
        width: 40,
        height: 40,
        borderRadius: 10,
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: 16,
    },
    actionText: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
    },
});
