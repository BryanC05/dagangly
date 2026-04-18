import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, FlatList, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../api/api';
import financeDB from '../../services/FinanceDB';

export default function ProductAnalysisScreen({ navigation }) {
    const { colors } = useThemeStore();
    const { t, language } = useTranslation();
    const [loading, setLoading] = useState(true);
    const [products, setProducts] = useState([]);
    const [selectedProduct, setSelectedProduct] = useState(null);
    const [productCosts, setProductCosts] = useState(null);
    const [showProductList, setShowProductList] = useState(false);
    
    const [form, setForm] = useState({
        materialCost: '',
        laborCost: '',
        shippingCost: '',
        platformFee: '',
        platformFeeType: 'percent',
        otherCosts: '',
        sellingPrice: '',
        unitsSold: '',
    });

    const loadProducts = useCallback(async () => {
        try {
            const response = await api.get('/products/my-products', { params: { limit: 100 } });
            const myProducts = response.data.products || [];
            
            const costs = await financeDB.getProductCosts();
            const merged = myProducts.map(p => {
                const savedCost = costs.find(c => c.productId === p._id);
                return {
                    ...p,
                    hasCostData: !!savedCost,
                    savedCost
                };
            });
            setProducts(merged);
        } catch (error) {
            console.error('Failed to load products:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadProducts();
    }, [loadProducts]);

    const selectProduct = (product) => {
        setSelectedProduct(product);
        setShowProductList(false);
        
        if (product.savedCost) {
            setProductCosts(product.savedCost);
            setForm({
                materialCost: String(product.savedCost.materialCost || 0),
                laborCost: String(product.savedCost.laborCost || 0),
                shippingCost: String(product.savedCost.shippingCost || 0),
                platformFee: String(product.savedCost.platformFee || 0),
                platformFeeType: product.savedCost.platformFeeType || 'percent',
                otherCosts: String(product.savedCost.otherCosts || 0),
                sellingPrice: String(product.price || ''),
            });
        } else {
            setProductCosts(null);
            setForm({
                materialCost: '',
                laborCost: '',
                shippingCost: '',
                platformFee: '5',
                platformFeeType: 'percent',
                otherCosts: '',
                sellingPrice: String(product.price || ''),
            });
        }
    };

    const calculatePlatformFee = () => {
        const price = parseFloat(form.sellingPrice) || 0;
        const fee = parseFloat(form.platformFee) || 0;
        
        if (form.platformFeeType === 'percent') {
            return price * (fee / 100);
        }
        return fee;
    };

    const totalCost = () => {
        const material = parseFloat(form.materialCost) || 0;
        const labor = parseFloat(form.laborCost) || 0;
        const shipping = parseFloat(form.shippingCost) || 0;
        const other = parseFloat(form.otherCosts) || 0;
        return material + labor + shipping + calculatePlatformFee() + other;
    };

    const revenue = () => {
        const price = parseFloat(form.sellingPrice) || 0;
        const units = parseFloat(form.unitsSold) || 0;
        return price * units;
    };

    const totalCostAll = () => totalCost() * (parseFloat(form.unitsSold) || 0);

    const grossProfit = () => revenue() - totalCostAll();

    const profitPerUnit = () => {
        const price = parseFloat(form.sellingPrice) || 0;
        return price - totalCost();
    };

    const marginPercent = () => {
        const price = parseFloat(form.sellingPrice) || 0;
        if (price === 0) return 0;
        return (profitPerUnit() / price) * 100;
    };

    const breakEvenUnits = () => {
        const profit = profitPerUnit();
        if (profit <= 0) return '∞';
        const fixedCosts = totalCost();
        const units = Math.ceil(fixedCosts / profit);
        return units;
    };

    const saveCosts = async () => {
        if (!selectedProduct) return;
        
        const costsData = {
            id: productCosts?.id,
            productId: selectedProduct._id,
            productName: selectedProduct.name,
            materialCost: parseFloat(form.materialCost) || 0,
            laborCost: parseFloat(form.laborCost) || 0,
            shippingCost: parseFloat(form.shippingCost) || 0,
            platformFee: parseFloat(form.platformFee) || 0,
            platformFeeType: form.platformFeeType,
            otherCosts: parseFloat(form.otherCosts) || 0,
        };
        
        await financeDB.saveProductCosts(costsData);
        setProductCosts(costsData);
        
        const updatedProducts = products.map(p => 
            p._id === selectedProduct._id 
                ? { ...p, hasCostData: true, savedCost: costsData }
                : p
        );
        setProducts(updatedProducts);
    };

    const formatCurrency = (amount) => 'Rp ' + ((amount || 0)).toLocaleString('id-ID');

    const renderProductItem = ({ item }) => (
        <TouchableOpacity
            style={[styles.productItem, { backgroundColor: colors.card }]}
            onPress={() => selectProduct(item)}
        >
            <View style={styles.productInfo}>
                <Text style={[styles.productName, { color: colors.text }]} numberOfLines={1}>
                    {item.name}
                </Text>
                <Text style={[styles.productPrice, { color: colors.textSecondary }]}>
                    {formatCurrency(item.price)}
                </Text>
            </View>
            {item.hasCostData && (
                <Ionicons name="checkmark-circle" size={20} color="#22c55e" />
            )}
        </TouchableOpacity>
    );

    if (loading) {
        return (
            <View style={[styles.container, styles.loading, { backgroundColor: colors.background }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const hasFormData = selectedProduct && (form.sellingPrice || form.unitsSold);

    return (
        <KeyboardAvoidingView 
            style={[styles.container, { backgroundColor: colors.background }]}
            behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.header}>
                    <Text style={[styles.title, { color: colors.text }]}>
                        {language === 'id' ? 'Analisis Produk' : 'Product Analysis'}
                    </Text>
                    <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                        {language === 'id' 
                            ? 'Hitung profit/rugi per produk' 
                            : 'Calculate profit/loss per product'}
                    </Text>
                </View>

                {!selectedProduct ? (
                    <View>
                        <TouchableOpacity 
                            style={[styles.selectBtn, { backgroundColor: colors.card }]}
                            onPress={() => setShowProductList(true)}
                        >
                            <Text style={{ color: colors.text }}>
                                {language === 'id' ? 'Pilih Produk' : 'Select Product'}
                            </Text>
                            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>
                        
                        <FlatList
                            data={products}
                            keyExtractor={(item) => item._id}
                            renderItem={renderProductItem}
                            style={styles.productList}
                            ListEmptyComponent={
                                <Text style={{ color: colors.textSecondary, textAlign: 'center', marginTop: 20 }}>
                                    {language === 'id' ? 'Tidak ada produk' : 'No products'}
                                </Text>
                            }
                        />
                    </View>
                ) : (
                    <View>
                        <TouchableOpacity 
                            style={[styles.selectedProduct, { backgroundColor: colors.card }]}
                            onPress={() => setShowProductList(true)}
                        >
                            <View>
                                <Text style={[styles.selectedName, { color: colors.text }]}>
                                    {selectedProduct.name}
                                </Text>
                                <Text style={[styles.selectedPrice, { color: colors.textSecondary }]}>
                                    {formatCurrency(selectedProduct.price)}
                                </Text>
                            </View>
                            <Ionicons name="chevron-down" size={20} color={colors.textSecondary} />
                        </TouchableOpacity>

                        <View style={[styles.section, { backgroundColor: colors.card }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                {language === 'id' ? 'Biaya per Unit' : 'Cost per Unit'}
                            </Text>
                            
                            <View style={styles.inputRow}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                        {language === 'id' ? 'Bahan Baku' : 'Material'}
                                    </Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                        placeholder="0"
                                        placeholderTextColor={colors.textSecondary}
                                        keyboardType="numeric"
                                        value={form.materialCost}
                                        onChangeText={(text) => setForm({ ...form, materialCost: text })}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                        {language === 'id' ? 'Tenaga Kerja' : 'Labor'}
                                    </Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                        placeholder="0"
                                        placeholderTextColor={colors.textSecondary}
                                        keyboardType="numeric"
                                        value={form.laborCost}
                                        onChangeText={(text) => setForm({ ...form, laborCost: text })}
                                    />
                                </View>
                            </View>
                            
                            <View style={styles.inputRow}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                        {language === 'id' ? 'Pengiriman' : 'Shipping'}
                                    </Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                        placeholder="0"
                                        placeholderTextColor={colors.textSecondary}
                                        keyboardType="numeric"
                                        value={form.shippingCost}
                                        onChangeText={(text) => setForm({ ...form, shippingCost: text })}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                        {language === 'id' ? 'Biaya Lain' : 'Other'}
                                    </Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                        placeholder="0"
                                        placeholderTextColor={colors.textSecondary}
                                        keyboardType="numeric"
                                        value={form.otherCosts}
                                        onChangeText={(text) => setForm({ ...form, otherCosts: text })}
                                    />
                                </View>
                            </View>
                            
                            <View style={styles.inputRow}>
                                <View style={styles.inputGroupExtra}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                        {language === 'id' ? 'Fee Platform (%)' : 'Platform Fee (%)'}
                                    </Text>
                                    <View style={styles.feeRow}>
                                        <TextInput
                                            style={[styles.input, { flex: 1, backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                            placeholder="5"
                                            placeholderTextColor={colors.textSecondary}
                                            keyboardType="numeric"
                                            value={form.platformFee}
                                            onChangeText={(text) => setForm({ ...form, platformFee: text })}
                                        />
                                        <TouchableOpacity
                                            style={[
                                                styles.feeTypeBtn, 
                                                { backgroundColor: form.platformFeeType === 'percent' ? colors.primary : colors.background }
                                            ]}
                                            onPress={() => setForm({ ...form, platformFeeType: 'percent' })}
                                        >
                                            <Text style={{ color: form.platformFeeType === 'percent' ? '#fff' : colors.text, fontSize: 12 }}>%</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={[
                                                styles.feeTypeBtn, 
                                                { backgroundColor: form.platformFeeType === 'fixed' ? colors.primary : colors.background }
                                            ]}
                                            onPress={() => setForm({ ...form, platformFeeType: 'fixed' })}
                                        >
                                            <Text style={{ color: form.platformFeeType === 'fixed' ? '#fff' : colors.text, fontSize: 10 }}>Rp</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            </View>
                        </View>

                        <View style={[styles.section, { backgroundColor: colors.card }]}>
                            <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                {language === 'id' ? 'Penjualan' : 'Sales'}
                            </Text>
                            
                            <View style={styles.inputRow}>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                        {language === 'id' ? 'Harga Jual' : 'Selling Price'}
                                    </Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                        placeholder="0"
                                        placeholderTextColor={colors.textSecondary}
                                        keyboardType="numeric"
                                        value={form.sellingPrice}
                                        onChangeText={(text) => setForm({ ...form, sellingPrice: text })}
                                    />
                                </View>
                                <View style={styles.inputGroup}>
                                    <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
                                        {language === 'id' ? 'Terjual' : 'Units Sold'}
                                    </Text>
                                    <TextInput
                                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                                        placeholder="0"
                                        placeholderTextColor={colors.textSecondary}
                                        keyboardType="numeric"
                                        value={form.unitsSold}
                                        onChangeText={(text) => setForm({ ...form, unitsSold: text })}
                                    />
                                </View>
                            </View>
                        </View>

                        <TouchableOpacity 
                            style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                            onPress={saveCosts}
                        >
                            <Text style={styles.saveBtnText}>
                                {language === 'id' ? 'Simpan Biaya' : 'Save Costs'}
                            </Text>
                        </TouchableOpacity>

                        {hasFormData && (
                            <View style={[styles.resultsSection, { backgroundColor: colors.card }]}>
                                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                                    {language === 'id' ? 'Hasil Analisis' : 'Analysis Results'}
                                </Text>
                                
                                <View style={styles.resultsGrid}>
                                    <View style={styles.resultItem}>
                                        <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                                            {language === 'id' ? 'Total Biaya/Unit' : 'Cost/Unit'}
                                        </Text>
                                        <Text style={[styles.resultValue, { color: colors.text }]}>
                                            {formatCurrency(totalCost())}
                                        </Text>
                                    </View>
                                    <View style={styles.resultItem}>
                                        <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                                            {language === 'id' ? 'Revenue' : 'Revenue'}
                                        </Text>
                                        <Text style={[styles.resultValue, { color: colors.text }]}>
                                            {formatCurrency(revenue())}
                                        </Text>
                                    </View>
                                    <View style={styles.resultItem}>
                                        <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                                            {language === 'id' ? 'Laba Kotor' : 'Gross Profit'}
                                        </Text>
                                        <Text style={[
                                            styles.resultValue, 
                                            { color: grossProfit() >= 0 ? '#22c55e' : '#ef4444' }
                                        ]}>
                                            {formatCurrency(grossProfit())}
                                        </Text>
                                    </View>
                                    <View style={styles.resultItem}>
                                        <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                                            {language === 'id' ? 'Margin' : 'Margin'}
                                        </Text>
                                        <Text style={[
                                            styles.resultValue, 
                                            { color: marginPercent() >= 0 ? '#22c55e' : '#ef4444' }
                                        ]}>
                                            {marginPercent().toFixed(1)}%
                                        </Text>
                                    </View>
                                    <View style={styles.resultItem}>
                                        <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                                            {language === 'id' ? 'Laba/Unit' : 'Profit/Unit'}
                                        </Text>
                                        <Text style={[
                                            styles.resultValue, 
                                            { color: profitPerUnit() >= 0 ? '#22c55e' : '#ef4444' }
                                        ]}>
                                            {formatCurrency(profitPerUnit())}
                                        </Text>
                                    </View>
                                    <View style={styles.resultItem}>
                                        <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>
                                            {language === 'id' ? 'Break-even' : 'Break-even'}
                                        </Text>
                                        <Text style={[styles.resultValue, { color: colors.text }]}>
                                            {breakEvenUnits()} {language === 'id' ? 'unit' : 'units'}
                                        </Text>
                                    </View>
                                </View>
                                
                                {grossProfit() < 0 && (
                                    <View style={[styles.warningBox, { backgroundColor: '#fef2f2' }]}>
                                        <Ionicons name="warning" size={20} color="#ef4444" />
                                        <Text style={[styles.warningText, { color: '#ef4444' }]}>
                                            {language === 'id' 
                                                ? 'Rug! Naikkan harga atau kurangi biaya.' 
                                                : 'Loss! Increase price or reduce costs.'}
                                        </Text>
                                    </View>
                                )}
                            </View>
                        )}
                    </View>
                )}
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    loading: { justifyContent: 'center', alignItems: 'center' },
    content: { padding: 16, paddingBottom: 32 },
    header: { marginBottom: 20 },
    title: { fontSize: 24, fontWeight: '700' },
    subtitle: { fontSize: 14, marginTop: 4 },
    selectBtn: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12 },
    productList: { marginTop: 12, maxHeight: 300 },
    productItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12, marginBottom: 8 },
    productInfo: { flex: 1 },
    productName: { fontSize: 15, fontWeight: '500' },
    productPrice: { fontSize: 13, marginTop: 2 },
    selectedProduct: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, borderRadius: 12 },
    selectedName: { fontSize: 16, fontWeight: '600' },
    selectedPrice: { fontSize: 14, marginTop: 2 },
    section: { borderRadius: 12, padding: 16, marginTop: 16 },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
    inputRow: { flexDirection: 'row', gap: 12 },
    inputGroup: { flex: 1 },
    inputGroupExtra: { flex: 1, marginRight: 12 },
    inputLabel: { fontSize: 12, marginBottom: 6 },
    input: { borderWidth: 1, borderRadius: 8, padding: 12, fontSize: 14 },
    feeRow: { flexDirection: 'row', gap: 8 },
    feeTypeBtn: { paddingHorizontal: 12, paddingVertical: 12, borderRadius: 8 },
    saveBtn: { borderRadius: 12, padding: 16, alignItems: 'center', marginTop: 16 },
    saveBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
    resultsSection: { borderRadius: 12, padding: 16, marginTop: 16 },
    resultsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
    resultItem: { width: '47%', padding: 12, backgroundColor: '#f5f5f5', borderRadius: 10 },
    resultLabel: { fontSize: 11 },
    resultValue: { fontSize: 16, fontWeight: '600', marginTop: 4 },
    warningBox: { flexDirection: 'row', alignItems: 'center', gap: 8, padding: 12, borderRadius: 10, marginTop: 12 },
    warningText: { flex: 1, fontSize: 13 },
});