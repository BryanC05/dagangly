import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal,
    ActivityIndicator, Alert, KeyboardAvoidingView, Platform, ScrollView
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import financeDB from '../../services/FinanceDB';

const EXPENSE_CATEGORIES = [
    { id: 'supplies', name: 'Bahan Baku', nameEn: 'Supplies', icon: 'cube-outline' },
    { id: 'utilities', name: 'Utilitas', nameEn: 'Utilities', icon: 'flash-outline' },
    { id: 'transport', name: 'Transportasi', nameEn: 'Transport', icon: 'car-outline' },
    { id: 'marketing', name: 'Pemasaran', nameEn: 'Marketing', icon: 'megaphone-outline' },
    { id: 'equipment', name: 'Peralatan', nameEn: 'Equipment', icon: 'construct-outline' },
    { id: 'rent', name: 'Sewa', nameEn: 'Rent', icon: 'business-outline' },
    { id: 'other', name: 'Lainnya', nameEn: 'Other', icon: 'ellipsis-horizontal-outline' },
];

export default function FinanceExpensesScreen({ navigation }) {
    const { colors } = useThemeStore();
    const { t, language } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [expenses, setExpenses] = useState([]);
    const [modalVisible, setModalVisible] = useState(false);
    const [editingExpense, setEditingExpense] = useState(null);
    const [form, setForm] = useState({ amount: '', category: 'supplies', description: '', date: new Date().toISOString().split('T')[0] });
    const [saving, setSaving] = useState(false);

    const loadExpenses = useCallback(async () => {
        try {
            const data = await financeDB.getExpenses();
            setExpenses(data);
        } catch (error) {
            console.error('Failed to load expenses:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadExpenses();
    }, [loadExpenses]);

    const openModal = (expense = null) => {
        if (expense) {
            setEditingExpense(expense);
            setForm({
                amount: String(expense.amount),
                category: expense.category,
                description: expense.description || '',
                date: expense.date
            });
        } else {
            setEditingExpense(null);
            setForm({ amount: '', category: 'supplies', description: '', date: new Date().toISOString().split('T')[0] });
        }
        setModalVisible(true);
    };

    const closeModal = () => {
        setModalVisible(false);
        setEditingExpense(null);
        setForm({ amount: '', category: 'supplies', description: '', date: new Date().toISOString().split('T')[0] });
    };

    const saveExpense = async () => {
        if (!form.amount || parseFloat(form.amount) <= 0) {
            Alert.alert('Error', language === 'id' ? 'Masukkan jumlah yang valid' : 'Enter a valid amount');
            return;
        }
        
        setSaving(true);
        try {
            if (editingExpense) {
                await financeDB.updateExpense(editingExpense.id, {
                    amount: parseFloat(form.amount),
                    category: form.category,
                    description: form.description,
                    date: form.date
                });
            } else {
                await financeDB.addExpense({
                    amount: parseFloat(form.amount),
                    category: form.category,
                    description: form.description,
                    date: form.date
                });
            }
            closeModal();
            loadExpenses();
        } catch (error) {
            Alert.alert('Error', language === 'id' ? 'Gagal menyimpan' : 'Failed to save');
        } finally {
            setSaving(false);
        }
    };

    const deleteExpense = (expense) => {
        Alert.alert(
            language === 'id' ? 'Hapus Pengeluaran' : 'Delete Expense',
            language === 'id' ? 'Yakin hapus?' : 'Are you sure?',
            [
                { text: language === 'id' ? 'Batal' : 'Cancel', style: 'cancel' },
                {
                    text: language === 'id' ? 'Hapus' : 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await financeDB.deleteExpense(expense.id);
                        loadExpenses();
                    }
                }
            ]
        );
    };

    const formatCurrency = (amount) => 'Rp ' + (amount || 0).toLocaleString('id-ID');

    const getCategoryName = (catId) => {
        const cat = EXPENSE_CATEGORIES.find(c => c.id === catId);
        return language === 'id' ? (cat?.name || catId) : (cat?.nameEn || catId);
    };

    const renderItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.expenseItem, { backgroundColor: colors.card }]}
            onPress={() => openModal(item)}
            onLongPress={() => deleteExpense(item)}
        >
            <View style={[styles.expenseIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name={EXPENSE_CATEGORIES.find(c => c.id === item.category)?.icon || 'cash-outline'} size={20} color={colors.primary} />
            </View>
            <View style={styles.expenseInfo}>
                <Text style={[styles.expenseCategory, { color: colors.text }]}>{getCategoryName(item.category)}</Text>
                <Text style={[styles.expenseDesc, { color: colors.textSecondary }]} numberOfLines={1}>
                    {item.description || '-'}
                </Text>
                <Text style={[styles.expenseDate, { color: colors.textSecondary }]}>{item.date}</Text>
            </View>
            <Text style={[styles.expenseAmount, { color: colors.text }]}>{formatCurrency(item.amount)}</Text>
        </TouchableOpacity>
    );

    const renderEmpty = () => (
        <View style={styles.empty}>
            <Ionicons name="receipt-outline" size={48} color={colors.textSecondary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                {language === 'id' ? 'Belum ada pengeluaran' : 'No expenses yet'}
            </Text>
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>{t.expenses || 'Expenses'}</Text>
                <TouchableOpacity style={[styles.addBtn, { backgroundColor: colors.primary }]} onPress={() => openModal()}>
                    <Ionicons name="add" size={24} color="#fff" />
                </TouchableOpacity>
            </View>

            {loading ? (
                <ActivityIndicator size="large" color={colors.primary} style={{ marginTop: 40 }} />
            ) : (
                <FlatList
                    data={expenses}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    ListEmptyComponent={renderEmpty}
                    contentContainerStyle={styles.list}
                />
            )}

            <Modal visible={modalVisible} animationType="slide" transparent>
                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { backgroundColor: colors.background }]}>
                        <View style={styles.modalHeader}>
                            <Text style={[styles.modalTitle, { color: colors.text }]}>
                                {editingExpense ? (language === 'id' ? 'Edit Pengeluaran' : 'Edit Expense') : (language === 'id' ? 'Tambah Pengeluaran' : 'Add Expense')}
                            </Text>
                            <TouchableOpacity onPress={closeModal}>
                                <Ionicons name="close" size={24} color={colors.text} />
                            </TouchableOpacity>
                        </View>

                        <ScrollView>
                            <Text style={[styles.label, { color: colors.text }]}>{language === 'id' ? 'Jumlah' : 'Amount'}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                                placeholder="0"
                                placeholderTextColor={colors.textSecondary}
                                keyboardType="numeric"
                                value={form.amount}
                                onChangeText={(text) => setForm({ ...form, amount: text })}
                            />

                            <Text style={[styles.label, { color: colors.text }]}>{language === 'id' ? 'Kategori' : 'Category'}</Text>
                            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryRow}>
                                {EXPENSE_CATEGORIES.map((cat) => (
                                    <TouchableOpacity
                                        key={cat.id}
                                        style={[
                                            styles.categoryChip,
                                            { backgroundColor: form.category === cat.id ? colors.primary : colors.card }
                                        ]}
                                        onPress={() => setForm({ ...form, category: cat.id })}
                                    >
                                        <Ionicons
                                            name={cat.icon}
                                            size={16}
                                            color={form.category === cat.id ? '#fff' : colors.textSecondary}
                                        />
                                        <Text style={[
                                            styles.categoryChipText,
                                            { color: form.category === cat.id ? '#fff' : colors.textSecondary }
                                        ]}>
                                            {language === 'id' ? cat.name : cat.nameEn}
                                        </Text>
                                    </TouchableOpacity>
                                ))}
                            </ScrollView>

                            <Text style={[styles.label, { color: colors.text }]}>{language === 'id' ? 'Deskripsi' : 'Description'}</Text>
                            <TextInput
                                style={[styles.input, styles.textArea, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                                placeholder={language === 'id' ? 'Keterangan (opsional)' : 'Description (optional)'}
                                placeholderTextColor={colors.textSecondary}
                                multiline
                                value={form.description}
                                onChangeText={(text) => setForm({ ...form, description: text })}
                            />

                            <Text style={[styles.label, { color: colors.text }]}>{language === 'id' ? 'Tanggal' : 'Date'}</Text>
                            <TextInput
                                style={[styles.input, { backgroundColor: colors.card, color: colors.text, borderColor: colors.border }]}
                                placeholder="YYYY-MM-DD"
                                placeholderTextColor={colors.textSecondary}
                                value={form.date}
                                onChangeText={(text) => setForm({ ...form, date: text })}
                            />
                        </ScrollView>

                        <TouchableOpacity
                            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                            onPress={saveExpense}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color="#fff" />
                            ) : (
                                <Text style={styles.saveBtnText}>
                                    {language === 'id' ? 'Simpan' : 'Save'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16 },
    title: { fontSize: 24, fontWeight: '700' },
    addBtn: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
    list: { padding: 16, paddingTop: 0 },
    expenseItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8 },
    expenseIcon: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    expenseInfo: { flex: 1, marginLeft: 12 },
    expenseCategory: { fontSize: 14, fontWeight: '600' },
    expenseDesc: { fontSize: 12, marginTop: 2 },
    expenseDate: { fontSize: 11, marginTop: 2 },
    expenseAmount: { fontSize: 16, fontWeight: '600' },
    empty: { alignItems: 'center', paddingVertical: 40 },
    emptyText: { marginTop: 8, fontSize: 14 },
    modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
    modalContent: { borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, maxHeight: '80%' },
    modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
    modalTitle: { fontSize: 18, fontWeight: '600' },
    label: { fontSize: 14, fontWeight: '500', marginBottom: 8, marginTop: 12 },
    input: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 14 },
    textArea: { height: 80, textAlignVertical: 'top' },
    categoryRow: { flexDirection: 'row', marginBottom: 8 },
    categoryChip: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, marginRight: 8 },
    categoryChipText: { fontSize: 12, marginLeft: 4 },
    saveBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 20 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
});