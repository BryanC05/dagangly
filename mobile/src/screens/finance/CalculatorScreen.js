import React, { useState, useEffect, useCallback } from 'react';
import {
    View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';

export default function FinanceCalculatorScreen({ navigation }) {
    const { colors } = useThemeStore();
    const { t, language } = useTranslation();
    
    const [form, setForm] = useState({
        cost: '',
        markup: '30',
        quantity: '1',
    });
    const [result, setResult] = useState({
        sellingPrice: 0,
        profit: 0,
        margin: 0,
        totalRevenue: 0,
        totalProfit: 0,
    });

    const calculate = useCallback(() => {
        const cost = parseFloat(form.cost) || 0;
        const markup = parseFloat(form.markup) || 0;
        const quantity = parseFloat(form.quantity) || 1;
        
        if (cost <= 0 || markup < 0) {
            setResult({ sellingPrice: 0, profit: 0, margin: 0, totalRevenue: 0, totalProfit: 0 });
            return;
        }
        
        const sellingPrice = cost * (1 + markup / 100);
        const profit = sellingPrice - cost;
        const margin = (profit / sellingPrice) * 100;
        const totalRevenue = sellingPrice * quantity;
        const totalProfit = profit * quantity;
        
        setResult({
            sellingPrice: Math.round(sellingPrice),
            profit: Math.round(profit),
            margin: margin.toFixed(1),
            totalRevenue: Math.round(totalRevenue),
            totalProfit: Math.round(totalProfit),
        });
    }, [form.cost, form.markup, form.quantity]);

    useEffect(() => {
        calculate();
    }, [calculate]);

    const formatCurrency = (amount) => 'Rp ' + (amount || 0).toLocaleString('id-ID');

    const renderResult = (label, value, isPositive = true) => (
        <View style={[styles.resultItem, { backgroundColor: colors.card }]}>
            <Text style={[styles.resultLabel, { color: colors.textSecondary }]}>{label}</Text>
            <Text style={[
                styles.resultValue,
                { color: isPositive ? (value >= 0 ? '#22c55e' : '#ef4444') : colors.text }
            ]}>
                {formatCurrency(value)}
            </Text>
        </View>
    );

    return (
        <ScrollView
            style={[styles.container, { backgroundColor: colors.background }]}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
        >
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>{t.calculator || 'Calculator'}</Text>
                <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                    {language === 'id' ? 'Kalkulator harga jual' : 'Selling price calculator'}
                </Text>
            </View>

            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
                <View style={[styles.card, { backgroundColor: colors.card }]}>
                    <Text style={[styles.label, { color: colors.text }]}>
                        {language === 'id' ? 'Biaya Produksi' : 'Production Cost'}
                    </Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        placeholder="0"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                        value={form.cost}
                        onChangeText={(text) => setForm({ ...form, cost: text })}
                    />

                    <Text style={[styles.label, { color: colors.text }]}>
                        {language === 'id' ? 'Markup (%)' : 'Markup (%)'}
                    </Text>
                    <View style={styles.markupRow}>
                        {[15, 20, 25, 30, 40, 50].map((pct) => (
                            <TouchableOpacity
                                key={pct}
                                style={[
                                    styles.markupBtn,
                                    { 
                                        backgroundColor: form.markup === String(pct) ? colors.primary : colors.background,
                                        borderColor: form.markup === String(pct) ? colors.primary : colors.border 
                                    }
                                ]}
                                onPress={() => setForm({ ...form, markup: String(pct) })}
                            >
                                <Text style={[
                                    styles.markupBtnText,
                                    { color: form.markup === String(pct) ? '#fff' : colors.text }
                                ]}>
                                    {pct}%
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <Text style={[styles.label, { color: colors.text }]}>
                        {language === 'id' ? 'Jumlah' : 'Quantity'}
                    </Text>
                    <TextInput
                        style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: colors.border }]}
                        placeholder="1"
                        placeholderTextColor={colors.textSecondary}
                        keyboardType="numeric"
                        value={form.quantity}
                        onChangeText={(text) => setForm({ ...form, quantity: text })}
                    />
                </View>
            </KeyboardAvoidingView>

            <View style={styles.resultsSection}>
                <Text style={[styles.sectionTitle, { color: colors.text }]}>
                    {language === 'id' ? 'Hasil Perhitungan' : 'Results'}
                </Text>
                
                <View style={[styles.mainResult, { backgroundColor: colors.primary }]}>
                    <Text style={styles.mainResultLabel}>
                        {language === 'id' ? 'Harga Jual per Unit' : 'Selling Price per Unit'}
                    </Text>
                    <Text style={styles.mainResultValue}>
                        {formatCurrency(result.sellingPrice)}
                    </Text>
                </View>

                <View style={styles.resultsRow}>
                    {renderResult(
                        language === 'id' ? 'Laba per Unit' : 'Profit per Unit',
                        result.profit,
                        true
                    )}
                    {renderResult(
                        language === 'id' ? 'Margin' : 'Margin',
                        parseFloat(result.margin),
                        true
                    )}
                </View>

                <Text style={[styles.sectionTitle, { color: colors.text, marginTop: 20 }]}>
                    {language === 'id' ? 'Total (x' + form.quantity + ')' : 'Total (x' + form.quantity + ')'}
                </Text>

                <View style={styles.resultsRow}>
                    {renderResult(
                        language === 'id' ? 'Total Pendapatan' : 'Total Revenue',
                        result.totalRevenue,
                        true
                    )}
                    {renderResult(
                        language === 'id' ? 'Total Laba' : 'Total Profit',
                        result.totalProfit,
                        true
                    )}
                </View>
            </View>

            <View style={[styles.tipsCard, { backgroundColor: colors.card }]}>
                <Ionicons name="bulb-outline" size={20} color={colors.primary} />
                <Text style={[styles.tipsText, { color: colors.text }]}>
                    {language === 'id' 
                        ? 'Tip: Markup yang umum untuk bisnis kecil adalah 20-40%'
                        : 'Tip: Common markup for small business is 20-40%'}
                </Text>
            </View>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    content: { padding: 16, paddingBottom: 32 },
    header: { marginBottom: 20 },
    title: { fontSize: 24, fontWeight: '700' },
    subtitle: { fontSize: 14, marginTop: 4 },
    card: { borderRadius: 16, padding: 16 },
    label: { fontSize: 14, fontWeight: '500', marginBottom: 8, marginTop: 12 },
    input: { borderWidth: 1, borderRadius: 10, padding: 14, fontSize: 16 },
    markupRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
    markupBtn: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 8, borderWidth: 1 },
    markupBtnText: { fontSize: 14, fontWeight: '500' },
    resultsSection: { marginTop: 24 },
    sectionTitle: { fontSize: 16, fontWeight: '600', marginBottom: 12 },
    mainResult: { borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 12 },
    mainResultLabel: { color: 'rgba(255,255,255,0.8)', fontSize: 14 },
    mainResultValue: { color: '#fff', fontSize: 28, fontWeight: '700', marginTop: 4 },
    resultsRow: { flexDirection: 'row', gap: 12 },
    resultItem: { flex: 1, borderRadius: 12, padding: 16 },
    resultLabel: { fontSize: 12 },
    resultValue: { fontSize: 18, fontWeight: '600', marginTop: 4 },
    tipsCard: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 16, marginTop: 20, gap: 12 },
    tipsText: { flex: 1, fontSize: 13 },
});