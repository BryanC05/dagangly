import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet, RefreshControl, Alert, Modal, Image, TextInput } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import api from '../../api/api';
import { useAuthStore } from '../../store/authStore';
import LoadingSpinner from '../../components/LoadingSpinner';
import { formatPrice } from '../../utils/helpers';
import { useTranslation } from '../../hooks/useTranslation';
import { useThemeStore } from '../../store/themeStore';
import { useNavigation } from '@react-navigation/native';

const MOCK_ANALYTICS = {
    period: '30',
    totalRevenue: 4906000,
    orderCount: 10,
    productCount: 4,
    avgRating: 4.8,
    totalReviews: 134,
    revenueByDay: {},
    ordersByStatus: { delivered: 6, completed: 2, pending: 1, cancelled: 1 },
};

const MOCK_PRODUCTS = [
    { _id: 'mock-1', name: 'Nasi Goreng Special', price: 45000, stock: 25, status: 'active', images: [] },
    { _id: 'mock-2', name: 'Mie Ayam Jamur', price: 35000, stock: 18, status: 'active', images: [] },
    { _id: 'mock-3', name: 'Soto Ayam Kudus', price: 40000, stock: 12, status: 'active', images: [] },
    { _id: 'mock-4', name: 'Bakso Granada', price: 38000, stock: 20, status: 'active', images: [] },
];

const FORCE_MOCK = true;

export default function SellerDashboardScreen({ navigation }) {
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const { colors, isDarkMode } = useThemeStore();
    
    const [period, setPeriod] = useState('30');
    const [analytics, setAnalytics] = useState(null);
    const [wallet, setWallet] = useState(null);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);

    // Seller check - redirect non-sellers
    useEffect(() => {
        if (!user?.isSeller && !loading) {
            Alert.alert(
                'Seller Access Required',
                'You need to register as a seller to access the dashboard.',
                [{ text: 'OK', onPress: () => navigation.goBack() }]
            );
        }
    }, [user?.isSeller, loading]);

    if (!user?.isSeller && !FORCE_MOCK) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center', padding: 32 }]}>
                <Ionicons name="storefront-outline" size={64} color={colors.primary} style={{ marginBottom: 16 }} />
                <Text style={{ fontSize: 20, fontWeight: '700', color: colors.text, textAlign: 'center', marginBottom: 12 }}>
                    Seller Access Required
                </Text>
                <Text style={{ fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginBottom: 24 }}>
                    You need to register as a seller to access this dashboard.
                </Text>
                <TouchableOpacity
                    style={{ backgroundColor: colors.primary, paddingHorizontal: 32, paddingVertical: 12, borderRadius: 8 }}
                    onPress={() => navigation.goBack()}
                >
                    <Text style={{ color: '#fff', fontWeight: '700' }}>Go Back</Text>
                </TouchableOpacity>
            </View>
        );
    }

    // Membership state
    const [membership, setMembership] = useState(null);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [paymentImage, setPaymentImage] = useState(null);
    const [uploading, setUploading] = useState(false);

    // Bank Account state
    const [showBankModal, setShowBankModal] = useState(false);
    const [bankDetails, setBankDetails] = useState({ bankName: '', accountNumber: '', accountHolder: '' });
    const [savingBank, setSavingBank] = useState(false);

    const fetchData = useCallback(async () => {
        if (FORCE_MOCK) {
            // Use mock data for demo
            setAnalytics(MOCK_ANALYTICS);
            setLoading(false);
            setRefreshing(false);
            return;
        }
        
        if (!user?._id) {
            setLoading(false);
            return;
        }
        
        try {
            const [membershipRes, analyticsRes, walletRes] = await Promise.all([
                api.get('/users/membership/status').catch(() => ({ data: null })),
                api.get(`/analytics/seller?period=${period}`).catch(() => ({ data: null })),
                api.get('/wallet').catch(() => ({ data: null }))
            ]);

            setMembership(membershipRes.data);
            setAnalytics(analyticsRes.data);
            setWallet(walletRes.data);
            
            if (walletRes.data?.bankAccount) {
                setBankDetails(walletRes.data.bankAccount);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, [user?._id, period]);

    useEffect(() => {
        setLoading(true);
        fetchData();
    }, [fetchData]);

    const onRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    const pickImage = async () => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled) {
            setPaymentImage(result.assets[0]);
        }
    };

    const submitPayment = async () => {
        if (!paymentImage) {
            Alert.alert('Error', 'Please select a payment proof image');
            return;
        }

        setUploading(true);
        try {
            const formData = new FormData();
            formData.append('paymentProof', {
                uri: paymentImage.uri,
                name: 'payment.jpg',
                type: 'image/jpeg',
            });

            await api.post('/users/membership/payment', formData, {
                headers: { 'Content-Type': 'multipart/form-data' },
            });

            Alert.alert('Success', 'Payment submitted! Please wait for admin approval.');
            setShowPaymentModal(false);
            setPaymentImage(null);
            fetchData();
        } catch (error) {
            Alert.alert('Error', error.response?.data?.error || 'Failed to submit payment');
        } finally {
            setUploading(false);
        }
    };

    const saveBankDetails = async () => {
        if (!bankDetails.bankName || !bankDetails.accountNumber || !bankDetails.accountHolder) {
            Alert.alert('Error', 'Please fill all bank details');
            return;
        }
        setSavingBank(true);
        try {
            await api.put('/wallet/bank-account', bankDetails);
            Alert.alert('Success', 'Bank details saved successfully');
            setShowBankModal(false);
            fetchData();
        } catch (err) {
            Alert.alert('Error', err.response?.data?.error || 'Failed to save bank details');
        } finally {
            setSavingBank(false);
        }
    };

    const removeBankDetails = async () => {
        Alert.alert('Confirm', 'Remove your payout bank details?', [
            { text: 'Cancel', style: 'cancel' },
            { 
                text: 'Remove', 
                style: 'destructive',
                onPress: async () => {
                    try {
                        await api.delete('/wallet/bank-account');
                        setBankDetails({ bankName: '', accountNumber: '', accountHolder: '' });
                        fetchData();
                    } catch (err) {
                        Alert.alert('Error', 'Failed to remove bank details');
                    }
                }
            }
        ]);
    };

    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: { padding: 20, backgroundColor: colors.card, paddingBottom: 20 },
        title: { fontSize: 24, fontWeight: '800', color: colors.text },
        subtitle: { fontSize: 16, color: colors.textSecondary, marginTop: 4 },
        
        sectionContainer: { paddingHorizontal: 16, marginBottom: 24 },
        sectionTitle: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 12 },
        
        // Membership
        membershipCard: {
            backgroundColor: membership?.isMember ? 'rgba(245, 158, 11, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            borderColor: membership?.isMember ? 'rgba(245, 158, 11, 0.3)' : 'rgba(239, 68, 68, 0.3)',
            borderRadius: 16, padding: 16, borderWidth: 1, marginBottom: 24, marginHorizontal: 16
        },
        membershipHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
        membershipTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
        membershipTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
        activeBadge: { backgroundColor: colors.successLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
        activeBadgeText: { color: colors.success, fontSize: 12, fontWeight: '600' },
        pendingBadge: { backgroundColor: colors.warningLight, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
        pendingBadgeText: { color: colors.warning, fontSize: 12, fontWeight: '600' },
        membershipText: { fontSize: 14, color: colors.textSecondary, marginBottom: 4 },
        membershipSubtext: { fontSize: 13, color: colors.success, marginTop: 4 },
        upgradeBtn: { backgroundColor: '#2563eb', paddingVertical: 12, borderRadius: 10, alignItems: 'center', marginTop: 12 },
        upgradeBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },

        // Period Selector
        periodSelector: { flexDirection: 'row', gap: 8, marginBottom: 16 },
        periodButton: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
        periodButtonActive: { backgroundColor: colors.primary, borderColor: colors.primary },
        periodButtonText: { color: colors.text, fontWeight: '600' },
        periodButtonTextActive: { color: '#fff' },

        // Stats Grid
        statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 24 },
        statCard: {
            width: '48%', backgroundColor: colors.card, borderRadius: 16, padding: 16,
            borderWidth: 1, borderColor: colors.border
        },
        iconBg: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
        statValue: { fontSize: 18, fontWeight: '700', color: colors.text, marginBottom: 2 },
        statLabel: { fontSize: 12, color: colors.textSecondary, textTransform: 'uppercase', fontWeight: '600' },

        // Terminal
        terminalCard: { backgroundColor: '#1e1e1e', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#333' },
        terminalHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
        terminalTitle: { color: '#fff', fontSize: 16, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },
        terminalText: { color: '#10b981', fontSize: 13, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginBottom: 16 },
        terminalBtn: { backgroundColor: '#10b981', padding: 12, borderRadius: 8, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 8 },

        // Customer Retention
        retentionCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border, flexDirection: 'row', gap: 12 },
        retentionBox: { flex: 1, backgroundColor: isDarkMode ? '#1a1a1a' : '#f8fafc', padding: 16, borderRadius: 12, alignItems: 'center' },
        retentionLabel: { fontSize: 11, fontWeight: '700', color: colors.textSecondary, textTransform: 'uppercase', marginBottom: 4 },
        retentionValue: { fontSize: 24, fontWeight: '700', fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' },

        // Payout Settings
        payoutCard: { backgroundColor: colors.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: colors.border },
        payoutHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
        payoutRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: isDarkMode ? '#1a1a1a' : '#f8fafc', padding: 12, borderRadius: 12 },
        payoutIconBox: { width: 48, height: 48, backgroundColor: 'rgba(37, 99, 235, 0.1)', borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
        payoutBankText: { fontSize: 16, fontWeight: '700', color: colors.text, textTransform: 'uppercase' },
        payoutAccText: { fontSize: 14, color: colors.textSecondary, fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace', marginVertical: 2 },
        payoutNameText: { fontSize: 12, color: colors.textSecondary },

        // Actions
        actionBtn: {
            flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
            padding: 16, borderRadius: 16, marginBottom: 12, gap: 14,
            borderWidth: 1, borderColor: colors.border
        },
        actionIcon: { width: 48, height: 48, borderRadius: 14, justifyContent: 'center', alignItems: 'center' },
        actionTitle: { fontSize: 16, fontWeight: '600', color: colors.text },
        actionDesc: { fontSize: 13, color: colors.textSecondary },

        // Modals
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
        modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '90%' },
        modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
        modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
        inputLabel: { fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 8, marginTop: 12 },
        input: { borderWidth: 1, borderColor: colors.border, borderRadius: 10, padding: 12, color: colors.text, backgroundColor: isDarkMode ? '#1a1a1a' : '#fff' },
        submitBtn: { backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 10, alignItems: 'center', marginTop: 24 },
        submitBtnDisabled: { opacity: 0.7 },
        submitBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    }), [colors, isDarkMode, membership]);

    if (loading && !refreshing) return <LoadingSpinner />;

    return (
        <ScrollView style={styles.container} refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />}>
            <View style={styles.header}>
                <Text style={{ fontSize: 12, fontWeight: '800', color: '#10b981', textTransform: 'uppercase', marginBottom: 4 }}>Command Center</Text>
                <Text style={styles.title}>Welcome, {user.businessName || user.name}!</Text>
            </View>

            {/* Membership Banner */}
            <View style={styles.membershipCard}>
                <View style={styles.membershipHeader}>
                    <View style={styles.membershipTitleRow}>
                        <Ionicons name={membership?.isMember ? "star" : "star-outline"} size={24} color={membership?.isMember ? '#f59e0b' : colors.textTertiary} />
                        <Text style={styles.membershipTitle}>
                            {membership?.isMember ? 'Premium Member' : 'Upgrade to Premium'}
                        </Text>
                    </View>
                    {membership?.isMember ? (
                        <View style={styles.activeBadge}><Text style={styles.activeBadgeText}>Active</Text></View>
                    ) : membership?.membershipStatus === 'pending' ? (
                        <View style={styles.pendingBadge}><Text style={styles.pendingBadgeText}>Pending</Text></View>
                    ) : null}
                </View>
                {membership?.isMember ? (
                    <View>
                        <Text style={styles.membershipText}>Active until {new Date(membership.memberExpiry).toLocaleDateString()}</Text>
                        <Text style={styles.membershipSubtext}>✓ Unlimited product listings enabled</Text>
                    </View>
                ) : (
                    <View>
                        <Text style={styles.membershipText}>Rp 10.000/month</Text>
                        <TouchableOpacity style={styles.upgradeBtn} onPress={() => setShowPaymentModal(true)}>
                            <Text style={styles.upgradeBtnText}>Pay Now</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>

            {/* Financial Overview */}
            <View style={styles.sectionContainer}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                    <Ionicons name="stats-chart" size={20} color="#10b981" />
                    <Text style={styles.sectionTitle}>Financial Overview</Text>
                </View>

                <View style={styles.periodSelector}>
                    {[
                        { label: '7 Days', val: '7' },
                        { label: '30 Days', val: '30' },
                        { label: '90 Days', val: '90' }
                    ].map((p) => (
                        <TouchableOpacity 
                            key={p.val} 
                            style={[styles.periodButton, period === p.val && styles.periodButtonActive]}
                            onPress={() => setPeriod(p.val)}
                        >
                            <Text style={[styles.periodButtonText, period === p.val && styles.periodButtonTextActive]}>{p.label}</Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <View style={styles.statsGrid}>
                    <View style={styles.statCard}>
                        <View style={[styles.iconBg, { backgroundColor: 'rgba(16, 185, 129, 0.1)' }]}>
                            <Ionicons name="wallet" size={20} color="#10b981" />
                        </View>
                        <Text style={styles.statValue}>{formatPrice(analytics?.totalRevenue || 0)}</Text>
                        <Text style={styles.statLabel}>Gross Volume</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.iconBg, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                            <Ionicons name="cart" size={20} color="#3b82f6" />
                        </View>
                        <Text style={styles.statValue}>{analytics?.orderCount || 0}</Text>
                        <Text style={styles.statLabel}>Total Orders</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.iconBg, { backgroundColor: 'rgba(168, 85, 247, 0.1)' }]}>
                            <Ionicons name="cube" size={20} color="#a855f7" />
                        </View>
                        <Text style={styles.statValue}>{analytics?.productCount || 0}</Text>
                        <Text style={styles.statLabel}>Active SKUs</Text>
                    </View>
                    <View style={styles.statCard}>
                        <View style={[styles.iconBg, { backgroundColor: 'rgba(245, 158, 11, 0.1)' }]}>
                            <Ionicons name="star" size={20} color="#f59e0b" />
                        </View>
                        <Text style={styles.statValue}>{analytics?.avgRating ? analytics.avgRating.toFixed(1) : '0.0'}</Text>
                        <Text style={styles.statLabel}>Avg Rating</Text>
                    </View>
                </View>

                <Text style={[styles.sectionTitle, { fontSize: 16 }]}>Customer Retention</Text>
                <View style={styles.retentionCard}>
                    <View style={styles.retentionBox}>
                        <Text style={styles.retentionLabel}>New</Text>
                        <Text style={[styles.retentionValue, { color: colors.text }]}>{analytics?.customers?.newCustomers || 0}</Text>
                    </View>
                    <View style={styles.retentionBox}>
                        <Text style={styles.retentionLabel}>Returning</Text>
                        <Text style={[styles.retentionValue, { color: '#10b981' }]}>{analytics?.customers?.returningCustomers || 0}</Text>
                    </View>
                </View>
            </View>

            {/* Payout Settings */}
            <View style={styles.sectionContainer}>
                <View style={styles.payoutCard}>
                    <View style={styles.payoutHeader}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <Ionicons name="business" size={20} color="#3b82f6" />
                            <Text style={[styles.sectionTitle, { marginBottom: 0 }]}>Payout Settings</Text>
                        </View>
                        {wallet?.bankAccount && (
                            <View style={{ flexDirection: 'row', gap: 8 }}>
                                <TouchableOpacity onPress={() => setShowBankModal(true)}>
                                    <Text style={{ color: '#3b82f6', fontWeight: '600' }}>Edit</Text>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={removeBankDetails}>
                                    <Text style={{ color: '#ef4444', fontWeight: '600' }}>Remove</Text>
                                </TouchableOpacity>
                            </View>
                        )}
                    </View>

                    {wallet?.bankAccount ? (
                        <View style={styles.payoutRow}>
                            <View style={styles.payoutIconBox}>
                                <Ionicons name="card" size={24} color="#3b82f6" />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.payoutBankText}>{wallet.bankAccount.bankName}</Text>
                                <Text style={styles.payoutAccText}>{wallet.bankAccount.accountNumber}</Text>
                                <Text style={styles.payoutNameText}>A/N: {wallet.bankAccount.accountHolder}</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={{ alignItems: 'center', padding: 12 }}>
                            <Text style={{ color: colors.textSecondary, marginBottom: 12 }}>No payout details added.</Text>
                            <TouchableOpacity style={{ backgroundColor: '#2563eb', paddingVertical: 8, paddingHorizontal: 16, borderRadius: 8 }} onPress={() => setShowBankModal(true)}>
                                <Text style={{ color: '#fff', fontWeight: '600' }}>Add Bank Details</Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
            </View>

            {/* AI Consultant Widget */}
            <View style={styles.sectionContainer}>
                <View style={styles.terminalCard}>
                    <View style={styles.terminalHeader}>
                        <Ionicons name="terminal" size={20} color="#10b981" />
                        <Text style={styles.terminalTitle}>AI_ADVISOR_TERMINAL</Text>
                    </View>
                    <Text style={styles.terminalText}>$ analyze financial_data --period={period}d</Text>
                    <TouchableOpacity style={styles.terminalBtn} onPress={() => navigation.navigate('AIConsultant', { period })}>
                        <Ionicons name="chatbubbles" size={20} color="#fff" />
                        <Text style={{ color: '#fff', fontWeight: '700', textTransform: 'uppercase' }}>Launch AI Consultant</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Quick Actions */}
            <View style={styles.sectionContainer}>
                <Text style={styles.sectionTitle}>Inventory & Operations</Text>
                
                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('AddProduct')}>
                    <View style={[styles.actionIcon, { backgroundColor: '#2563eb' }]}><Ionicons name="add" size={24} color="#fff" /></View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.actionTitle}>{t.addNewProduct || 'Add Product'}</Text>
                        <Text style={styles.actionDesc}>List a new item for sale</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('MyProducts')}>
                    <View style={[styles.actionIcon, { backgroundColor: isDarkMode ? '#4f46e5' : '#4338ca' }]}><Ionicons name="list" size={24} color="#fff" /></View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.actionTitle}>{t.manageProducts || 'Manage Inventory'}</Text>
                        <Text style={styles.actionDesc}>Edit stock, prices, and status</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>

                <TouchableOpacity style={styles.actionBtn} onPress={() => navigation.navigate('LogoGenerator')}>
                    <View style={[styles.actionIcon, { backgroundColor: '#f59e0b' }]}><Ionicons name="color-palette" size={24} color="#fff" /></View>
                    <View style={{ flex: 1 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <Text style={styles.actionTitle}>Logo Generator</Text>
                            {!membership?.isMember && <Ionicons name="star" size={14} color="#f59e0b" />}
                        </View>
                        <Text style={styles.actionDesc}>Create AI-generated store logos</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
                </TouchableOpacity>
            </View>

            {/* Bank Modal */}
            <Modal visible={showBankModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Payout Settings</Text>
                            <TouchableOpacity onPress={() => setShowBankModal(false)}><Ionicons name="close" size={24} color={colors.textSecondary} /></TouchableOpacity>
                        </View>
                        
                        <Text style={styles.inputLabel}>Bank Name</Text>
                        <TextInput 
                            style={[styles.input, { textTransform: 'uppercase' }]} 
                            placeholder="e.g. BCA, BNI, BRI, Mandiri"
                            placeholderTextColor={colors.textTertiary}
                            value={bankDetails.bankName}
                            onChangeText={(text) => setBankDetails({...bankDetails, bankName: text})}
                        />

                        <Text style={styles.inputLabel}>Account Number</Text>
                        <TextInput 
                            style={[styles.input, { fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace' }]} 
                            placeholder="e.g. 1234567890"
                            placeholderTextColor={colors.textTertiary}
                            keyboardType="number-pad"
                            value={bankDetails.accountNumber}
                            onChangeText={(text) => setBankDetails({...bankDetails, accountNumber: text})}
                        />

                        <Text style={styles.inputLabel}>Account Holder Name</Text>
                        <TextInput 
                            style={styles.input} 
                            placeholder="e.g. John Doe"
                            placeholderTextColor={colors.textTertiary}
                            value={bankDetails.accountHolder}
                            onChangeText={(text) => setBankDetails({...bankDetails, accountHolder: text})}
                        />

                        <TouchableOpacity style={[styles.submitBtn, savingBank && styles.submitBtnDisabled]} onPress={saveBankDetails} disabled={savingBank}>
                            <Text style={styles.submitBtnText}>{savingBank ? 'Saving...' : 'Save Payout Details'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>

            {/* Payment Modal (Membership) */}
            <Modal visible={showPaymentModal} animationType="slide" transparent>
                {/* Same as before */}
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>Submit Payment</Text>
                            <TouchableOpacity onPress={() => setShowPaymentModal(false)}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>
                        <View style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)', padding: 16, borderRadius: 12, marginBottom: 16 }}>
                            <Text style={{ fontSize: 12, color: '#f59e0b' }}>Transfer to:</Text>
                            <Text style={{ fontSize: 18, fontWeight: '700', color: colors.text, marginVertical: 4 }}>Bank BCA 1234567890</Text>
                            <Text style={{ fontSize: 12, color: '#f59e0b' }}>a/n MSME Marketplace</Text>
                            <Text style={{ fontSize: 16, fontWeight: '700', color: colors.text, marginTop: 8 }}>Amount: Rp 10.000</Text>
                        </View>
                        <TouchableOpacity style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: colors.border, borderRadius: 12, overflow: 'hidden', marginBottom: 16 }} onPress={pickImage}>
                            {paymentImage ? (
                                <Image source={{ uri: paymentImage.uri }} style={{ width: '100%', height: 200, resizeMode: 'cover' }} />
                            ) : (
                                <View style={{ padding: 40, alignItems: 'center' }}>
                                    <Ionicons name="camera" size={32} color={colors.textTertiary} />
                                    <Text style={{ marginTop: 8, color: colors.textSecondary, fontSize: 14 }}>Select Payment Proof</Text>
                                </View>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity style={[styles.submitBtn, uploading && styles.submitBtnDisabled]} onPress={submitPayment} disabled={uploading}>
                            <Text style={styles.submitBtnText}>{uploading ? 'Submitting...' : 'Submit Payment'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </ScrollView>
    );
}
