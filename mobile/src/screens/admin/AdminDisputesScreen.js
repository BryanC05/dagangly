import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useThemeStore } from '../../store/themeStore';

export default function AdminDisputesScreen() {
    const { colors } = useThemeStore();
    const [disputes, setDisputes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchDisputes = async () => {
        try {
            const res = await api.get('/admin/disputes');
            setDisputes(res.data);
        } catch (error) {
            console.error('Failed to fetch disputes:', error);
            Alert.alert('Error', 'Failed to load disputes');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchDisputes();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchDisputes();
        setRefreshing(false);
    };

    const handleResolve = async (id) => {
        Alert.alert(
            'Confirm Resolve',
            'Mark this dispute as resolved?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Resolve',
                    style: 'default',
                    onPress: async () => {
                        try {
                            await api.put(`/admin/disputes/${id}/resolve`, { resolution: 'Resolved by admin' });
                            Alert.alert('Success', 'Dispute resolved!');
                            fetchDisputes();
                        } catch (error) {
                            Alert.alert('Error', error.response?.data?.error || 'Failed to resolve');
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
            backgroundColor: '#f43f5e15', justifyContent: 'center', alignItems: 'center',
        },
        info: { flex: 1 },
        orderId: { fontSize: 16, fontWeight: '600', color: colors.text },
        reason: { fontSize: 14, color: colors.textSecondary, fontStyle: 'italic', marginTop: 4 },
        desc: { fontSize: 13, color: colors.textTertiary, marginTop: 4, lineHeight: 18 },
        status: { fontSize: 12, fontWeight: '700', color: '#f43f5e', marginTop: 8, textTransform: 'uppercase' },
        actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 10 },
        resolveBtn: {
            flexDirection: 'row', alignItems: 'center', gap: 6,
            paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8,
            backgroundColor: '#f43f5e',
        },
        resolveText: { color: '#fff', fontWeight: '600', fontSize: 14 },
        empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
        emptyText: { fontSize: 16, color: colors.textTertiary, marginTop: 12 },
    });

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <Ionicons name="warning" size={24} color="#f43f5e" />
                </View>
                <View style={styles.info}>
                    <Text style={styles.orderId}>Order: {item.orderId?.slice(-6) || 'Unknown'}</Text>
                    <Text style={styles.reason}>{item.reason}</Text>
                    <Text style={styles.desc}>{item.description}</Text>
                    <Text style={styles.status}>{item.status}</Text>
                </View>
            </View>

            {item.status !== 'resolved' && (
                <View style={styles.actions}>
                    <TouchableOpacity
                        style={styles.resolveBtn}
                        onPress={() => handleResolve(item._id)}
                    >
                        <Ionicons name="checkmark-circle" size={16} color="#fff" />
                        <Text style={styles.resolveText}>Resolve</Text>
                    </TouchableOpacity>
                </View>
            )}
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Manage Disputes</Text>
                <Text style={styles.subtitle}>
                    {disputes.length} active dispute{disputes.length !== 1 ? 's' : ''}
                </Text>
            </View>

            {disputes.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="checkmark-circle" size={64} color="#d1d5db" />
                    <Text style={styles.emptyText}>No active disputes</Text>
                </View>
            ) : (
                <FlatList
                    data={disputes}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#f43f5e" />
                    }
                />
            )}
        </View>
    );
}
