import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, TouchableOpacity, StyleSheet, Alert, RefreshControl } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import api from '../../api/api';
import LoadingSpinner from '../../components/LoadingSpinner';
import { useThemeStore } from '../../store/themeStore';

export default function AdminUsersScreen() {
    const { colors } = useThemeStore();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    const fetchUsers = async () => {
        try {
            const res = await api.get('/admin/users');
            setUsers(res.data);
        } catch (error) {
            console.error('Failed to fetch users:', error);
            Alert.alert('Error', 'Failed to load users');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchUsers();
    }, []);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchUsers();
        setRefreshing(false);
    };

    const handleToggleRole = async (id, currentRole) => {
        const newRole = currentRole === 'admin' ? 'user' : 'admin';
        Alert.alert(
            'Confirm Role Change',
            `Change this user's role to ${newRole}?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Change',
                    onPress: async () => {
                        try {
                            await api.put(`/admin/users/${id}/role`, { role: newRole });
                            fetchUsers();
                        } catch (error) {
                            Alert.alert('Error', error.response?.data?.error || 'Failed to update role');
                        }
                    },
                },
            ]
        );
    };

    const handleBan = async (id) => {
        Alert.alert(
            'Confirm Ban',
            'Are you sure you want to ban this user?',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Ban',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.post(`/admin/users/${id}/ban`, { reason: 'Banned by admin' });
                            fetchUsers();
                        } catch (error) {
                            Alert.alert('Error', error.response?.data?.error || 'Failed to ban user');
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
            backgroundColor: '#3b82f615', justifyContent: 'center', alignItems: 'center',
        },
        info: { flex: 1 },
        name: { fontSize: 16, fontWeight: '600', color: colors.text },
        email: { fontSize: 14, color: colors.textSecondary, marginTop: 2 },
        role: { fontSize: 12, fontWeight: '700', color: '#3b82f6', marginTop: 4, textTransform: 'uppercase' },
        actions: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', marginTop: 10, gap: 8 },
        roleBtn: {
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
            borderWidth: 1, borderColor: '#3b82f6',
        },
        roleText: { color: '#3b82f6', fontWeight: '600', fontSize: 13 },
        banBtn: {
            paddingHorizontal: 12, paddingVertical: 6, borderRadius: 6,
            backgroundColor: '#ef4444',
        },
        banText: { color: '#fff', fontWeight: '600', fontSize: 13 },
        empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 40 },
        emptyText: { fontSize: 16, color: colors.textTertiary, marginTop: 12 },
    });

    const renderItem = ({ item }) => (
        <View style={styles.card}>
            <View style={styles.cardHeader}>
                <View style={styles.avatar}>
                    <Ionicons name="person" size={24} color="#3b82f6" />
                </View>
                <View style={styles.info}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text style={styles.email}>{item.email}</Text>
                    <Text style={styles.role}>{item.role || 'User'}</Text>
                </View>
            </View>

            <View style={styles.actions}>
                <TouchableOpacity
                    style={styles.roleBtn}
                    onPress={() => handleToggleRole(item._id, item.role || 'user')}
                >
                    <Text style={styles.roleText}>
                        Make {item.role === 'admin' ? 'User' : 'Admin'}
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={styles.banBtn}
                    onPress={() => handleBan(item._id)}
                >
                    <Text style={styles.banText}>Ban User</Text>
                </TouchableOpacity>
            </View>
        </View>
    );

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>User Management</Text>
                <Text style={styles.subtitle}>
                    {users.length} total user{users.length !== 1 ? 's' : ''}
                </Text>
            </View>

            {users.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="people" size={64} color="#d1d5db" />
                    <Text style={styles.emptyText}>No users found</Text>
                </View>
            ) : (
                <FlatList
                    data={users}
                    renderItem={renderItem}
                    keyExtractor={(item) => item._id}
                    contentContainerStyle={styles.list}
                    refreshControl={
                        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#3b82f6" />
                    }
                />
            )}
        </View>
    );
}
