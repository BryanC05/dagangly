import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';

export default function FinanceCashFlowScreen({ navigation }) {
    const { colors } = useThemeStore();
    const { t, language } = useTranslation();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Cash Flow</Text>
            </View>
            <View style={[styles.placeholder, { backgroundColor: colors.card }]}>
                <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
                    {language === 'id' 
                        ? 'Coming soon - Lihat aliran masuk & keluar'
                        : 'Coming soon - Track income & expenses'}
                </Text>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 16 },
    title: { fontSize: 24, fontWeight: '700' },
    placeholder: { margin: 16, padding: 24, borderRadius: 12, alignItems: 'center' },
    placeholderText: { fontSize: 14 },
});