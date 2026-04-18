import React from 'react';
import { View, Text, StyleSheet, Switch } from 'react-native';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';

export default function FinanceSettingsScreen({ navigation }) {
    const { colors } = useThemeStore();
    const { t, language } = useTranslation();

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>Settings</Text>
            </View>
            <View style={[styles.card, { backgroundColor: colors.card }]}>
                <View style={styles.settingRow}>
                    <View>
                        <Text style={[styles.settingLabel, { color: colors.text }]}>Sync to Cloud</Text>
                        <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                            {language === 'id' 
                                ? 'Sinkronkan data ke server' 
                                : 'Sync data to server'}
                        </Text>
                    </View>
                    <Switch value={false} trackColor={{ true: colors.primary }} />
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 16 },
    title: { fontSize: 24, fontWeight: '700' },
    card: { margin: 16, borderRadius: 12, padding: 16 },
    settingRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    settingLabel: { fontSize: 16, fontWeight: '500' },
    settingDesc: { fontSize: 12, marginTop: 2 },
});