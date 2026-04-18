import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, Share, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../api/api';
import financeDB from '../../services/FinanceDB';

export default function FinanceInvoicesScreen() {
    const { colors } = useThemeStore();
    const { t, language } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [invoices, setInvoices] = useState([]);
    const [orders, setOrders] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);
    const [generating, setGenerating] = useState(false);

    const loadData = useCallback(async () => {
        try {
            const [invoicesRes, ordersRes] = await Promise.all([
                financeDB.getInvoices(),
                api.get('/orders/my-orders', { params: { limit: 100 } })
            ]);
            setInvoices(invoicesRes);
            setOrders(ordersRes.data.orders || []);
        } catch (error) {
            console.error('Failed to load data:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const createInvoice = async (order) => {
        setGenerating(true);
        try {
            const items = order.items?.map(item => ({
                name: item.product?.name || item.name || 'Product',
                quantity: item.quantity || 1,
                price: item.price || item.product?.price || 0,
            })) || [];

            const result = await financeDB.addInvoice({
                orderId: order._id,
                customerName: order.shippingAddress?.name || order.customer?.name || '-',
                items: items,
                total: order.total,
            });

            await loadData();
            setModalVisible(false);
            Alert.alert(
                language === 'id' ? 'Berhasil' : 'Success',
                language === 'id' 
                    ? `Invoice ${result.invoiceNumber} telah dibuat`
                    : `Invoice ${result.invoiceNumber} created`
            );
        } catch (error) {
            Alert.alert('Error', language === 'id' ? 'Gagal membuat invoice' : 'Failed to create invoice');
        } finally {
            setGenerating(false);
        }
    };

    const deleteInvoice = (invoice) => {
        Alert.alert(
            language === 'id' ? 'Hapus Invoice' : 'Delete Invoice',
            language === 'id' ? 'Yakin hapus?' : 'Are you sure?',
            [
                { text: language === 'id' ? 'Batal' : 'Cancel', style: 'cancel' },
                { text: language === 'id' ? 'Hapus' : 'Delete', style: 'destructive', onPress: async () => {
                    await financeDB.deleteInvoice(invoice.id);
                    loadData();
                }}
            ]
        );
    };

    const shareInvoice = async (invoice) => {
        const items = JSON.parse(invoice.items || '[]');
        let text = `INVOICE\n${invoice.invoiceNumber}\n\n`;
        text += `Customer: ${invoice.customerName}\n`;
        text += `Date: ${invoice.createdAt?.split('T')[0]}\n\n`;
        text += `Items:\n`;
        items.forEach(item => {
            text += `- ${item.name} x${item.quantity} = Rp ${(item.price * item.quantity).toLocaleString('id-ID')}\n`;
        });
        text += `\nTotal: Rp ${(invoice.total || 0).toLocaleString('id-ID')}`;
        
        try {
            await Share.share({ message: text });
        } catch (error) {
            console.log('Share error:', error);
        }
    };

    const formatCurrency = (amount) => 'Rp ' + (amount || 0).toLocaleString('id-ID');

    const unInvoicedOrders = orders.filter(o => 
        !invoices.some(inv => inv.orderId === o._id) && 
        (o.status === 'delivered' || o.status === 'completed')
    );

    const renderInvoice = ({ item }) => (
        <TouchableOpacity
            style={[styles.card, { backgroundColor: colors.card }]}
            onLongPress={() => deleteInvoice(item)}
        >
            <View style={styles.cardHeader}>
                <Text style={[styles.invoiceNumber, { color: colors.primary }]}>{item.invoiceNumber}</Text>
                <TouchableOpacity onPress={() => shareInvoice(item)}>
                    <Ionicons name="share-outline" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>
            <Text style={[styles.customerName, { color: colors.text }]}>{item.customerName}</Text>
            <Text style={[styles.date, { color: colors.textSecondary }]}>{item.createdAt?.split('T')[0]}</Text>
            <Text style={[styles.total, { color: colors.text }]}>{formatCurrency(item.total)}</Text>
        </TouchableOpacity>
    );

    const renderOrder = ({ item }) => (
        <TouchableOpacity
            style={[styles.orderCard, { backgroundColor: colors.card }]}
            onPress={() => { setSelectedOrder(item); setModalVisible(true); }}
        >
            <Text style={[styles.orderId, { color: colors.text }]}>#{item.orderId?.slice(-6) || item._id?.slice(-6)}</Text>
            <Text style={[styles.orderName, { color: colors.textSecondary }]}>
                {item.shippingAddress?.name || item.customer?.name || '-'}
            </Text>
            <Text style={[styles.orderTotal, { color: colors.text }]}>{formatCurrency(item.total)}</Text>
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.loading, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>{t.invoices || 'Invoices'}</Text>
                {unInvoicedOrders.length > 0 && (
                    <TouchableOpacity 
                        style={[styles.newBtn, { backgroundColor: colors.primary }]}
                        onPress={() => setModalVisible(true)}
                    >
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={styles.newBtnText}>
                            {language === 'id' ? 'Buat Invoice' : 'Create Invoice'}
                        </Text>
                    </TouchableOpacity>
                )}
            </View>

            {invoices.length === 0 ? (
                <View style={styles.empty}>
                    <Ionicons name="document-outline" size={48} color={colors.textSecondary} />
                    <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                        {language === 'id' ? 'Belum ada invoice' : 'No invoices yet'}
                    </Text>
                    {unInvoicedOrders.length > 0 && (
                        <TouchableOpacity 
                            style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
                            onPress={() => setModalVisible(true)}
                        >
                            <Text style={styles.emptyBtnText}>
                                {language === 'id' ? 'Buat dari pesanan' : 'Create from orders'}
                            </Text>
                        </TouchableOpacity>
                    )}
                </View>
            ) : (
                <FlatList
                    data={invoices}
                    keyExtractor={(item) => item.id}
                    renderItem={renderInvoice}
                    contentContainerStyle={styles.list}
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                {language === 'id' ? 'Pilih Pesanan' : 'Select Order'}
                            </Text>
                            <TouchableOpacity onPress={() => setModalVisible(false)}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        {unInvoicedOrders.length === 0 ? (
                            <View style={styles.modalEmpty}>
                                <Text style={{ color: colors.textSecondary }}>
                                    {language === 'id' ? 'Tidak ada pesanan' : 'No orders available'}
                                </Text>
                            </View>
                        ) : (
                            <FlatList
                                data={unInvoicedOrders}
                                keyExtractor={(item) => item._id}
                                renderItem={renderOrder}
                            />
                        )}

                        <TouchableOpacity 
                            style={[styles.cancelBtn, { borderColor: colors.border }]}
                            onPress={() => setModalVisible(false)}
                        >
                            <Text style={{ color: colors.text }}>{language === 'id' ? 'Batal' : 'Cancel'}</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loading: { justifyContent: 'center', alignItems: 'center' },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    title: { fontSize: 24, fontWeight: '700' },
    newBtn: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, gap: 6 },
    newBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
    list: { padding: 16, paddingTop: 0 },
    card: { borderRadius: 12, padding: 16, marginBottom: 10 },
    cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    invoiceNumber: { fontSize: 14, fontWeight: '600' },
    customerName: { fontSize: 14, marginTop: 4 },
    date: { fontSize: 12, marginTop: 2 },
    total: { fontSize: 18, fontWeight: '600', marginTop: 8 },
    empty: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 32 },
    emptyText: { marginTop: 12, fontSize: 16 },
    emptyBtn: { marginTop: 16, paddingHorizontal: 20, paddingVertical: 12, borderRadius: 8 },
    emptyBtnText: { color: '#fff', fontSize: 14, fontWeight: '500' },
    orderCard: { borderRadius: 12, padding: 16, marginBottom: 8 },
    orderId: { fontSize: 14, fontWeight: '600' },
    orderName: { fontSize: 12, marginTop: 2 },
    orderTotal: { fontSize: 16, fontWeight: '600', marginTop: 4 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
    modalTitle: { fontSize: 18, fontWeight: '600' },
    modalEmpty: { padding: 32, alignItems: 'center' },
    cancelBtn: { borderWidth: 1, borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
});