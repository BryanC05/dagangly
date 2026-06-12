import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useThemeStore } from '../../store/themeStore';

export default function AdminRegistrationsScreen() {
    const { colors } = useThemeStore();
    const [pendingRegistrations, setPendingRegistrations] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchPending = async () => {
        try {
            const res = await api.get('/admin/registrations/pending');
            setPendingRegistrations(res.data);
        } catch (error) {
            console.error('Failed to fetch pending registrations:', error);
            Alert.alert('Error', 'Failed to load pending registrations');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPending();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchPending();
        setRefreshing(false);
    };

    const handleApprove = async (id) => {
        try {
            await api.post(`/admin/registrations/${id}/approve`);
            Alert.alert('Success', 'Business registration approved!');
            fetchPending();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to approve');
        }
    };

    const handleDeny = async (id) => {
        Alert.alert(
            'Confirm Deny',
            'Are you sure you want to deny this business registration?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Deny',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.post(`/admin/registrations/${id}/deny`, { reason: 'Denied by admin' });
                            fetchPending();
                        } catch (error) {
                            Alert.alert('Error', error.response?.data?.error || 'Failed to deny');
                        }
                    },
                },
            ]
        );
    };

    if (loading) return <LoadingSpinner />;

    const styles = StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: { padding: 20, backgroundColor: colors.card },
        title: { fontSize: 24, fontWeight: '800', color: colors.text },
        subtitle: { fontSize: 14, color: colors.textSecondary, marginTop: 4 },
        list: { padding: 16 },
        card: {
            backgroundColor: colors.card,
            borderRadius: 16, padding: 16, marginBottom: 12,
            shadowColor: '#000', shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05, shadowRadius: 4, elevation: 2,
        },
        cardHeader: { flexDirection: 'row', gap: 12, marginBottom: 12 },
        avatar: {
            width: 48, height: 48, borderRadius: 24,
            backgroundColor: '#10b98115', justifyContent: 'center', alignItems: 'center',
        },
        info: { flex: 1 },
        name: { fontSize: 16, fontWeight: '600', color: colors.text },
        email: { fontSize: 14, color: colors.textSecondary },
        business: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic', marginTop: 4 },
        address: { fontSize: 12, color: colors.textTertiary, marginTop: 4 },
        actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 10 },
        actionBtns: { flexDirection: 'row', gap: 8 },
        rejectBtn: {
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: '#fee2e2', justifyContent: 'center', alignItems: 'center',
        },
        approveBtn: {
            width: 36, height: 36, borderRadius: 18,
            backgroundColor: '#10b981', justifyContent: 'center', alignItems: 'center',
        },
        empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
        emptyText: { fontSize: 16, color: colors.textTertiary, marginTop: 12 },
    });

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <Ionicons name="business" size={24} color="#10b981" />
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                    {item.businessName && (
                        <Text style={styles.business}>{item.businessName} ({item.businessType})</Text>
                    )}
                    {item.businessAddress && (
                        <Text style={styles.address}>{item.businessAddress}</Text>
                    )}
                </View>
            </View>

            <View style={styles.actions}>
                <View style={styles.actionBtns}>
                    <TouchableOpacity
                        style={styles.rejectBtn}
                        onPress={() => handleDeny(item._id)}
                    >
                        <Ionicons name="close" size={18} color="#ef4444" />
                    </TouchableOpacity>
                    <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleApprove(item._id)}
                    >
                        <Ionicons name="checkmark" size={18} color="#fff" />
                    </TouchableOpacity>
                </View>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Business Registrations</Text>
                <Text style={styles.subtitle}>
                    {pendingRegistrations.length} pending request{pendingRegistrations.length !== 1 ? 's' : ''}
                </Text>
            </View>

            {pendingRegistrations.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="checkmark-circle" size={64} color="#d1d5db" />
                    <Text style={styles.emptyText}>No pending registrations</Text>
                </View>
            ) : (
                <FlatList
                    data={pendingRegistrations}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#10b981" />
                    }
                />
            )}
        </View>
    );
}
