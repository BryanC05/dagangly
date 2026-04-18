import React, { useState, useEffect } from 'react';
import {
    View, Text, StyleSheet, Switch, TouchableOpacity, Alert, ActivityIndicator
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import financeDB from '../../services/FinanceDB';
import financeSync from '../../services/FinanceSync';

export default function FinanceSettingsScreen({ navigation }) {
    const { colors } = useThemeStore();
    const { t, language } = useTranslation();
    const [syncEnabled, setSyncEnabled] = useState(false);
    const [syncing, setSyncing] = useState(false);

    useEffect(() => {
        loadSettings();
    }, []);

    const loadSettings = async () => {
        const enabled = await financeDB.getSetting('syncEnabled');
        setSyncEnabled(enabled === 'true');
    };

    const toggleSync = async (value) => {
        setSyncEnabled(value);
        await financeDB.setSetting('syncEnabled', value ? 'true' : 'false');
        
        if (value) {
            Alert.alert(
                language === 'id' ? 'Sinkronisasi' : 'Sync',
                language === 'id' 
                    ? 'Data akan disinkronkan saat online'
                    : 'Data will sync when online',
                [{ text: 'OK' }]
            );
        }
    };

    const triggerSync = async () => {
        setSyncing(true);
        try {
            const result = await financeSync.autoSync();
            if (result.synced) {
                Alert.alert(
                    language === 'id' ? 'Berhasil' : 'Success',
                    language === 'id' ? 'Data disinkronkan' : 'Data synced'
                );
            } else {
                Alert.alert(
                    language === 'id' ? 'Gagal' : 'Failed',
                    result.error || 'Unknown error'
                );
            }
        } catch (error) {
            Alert.alert(
                language === 'id' ? 'Error' : 'Error',
                error.message
            );
        } finally {
            setSyncing(false);
        }
    };

    const exportData = async () => {
        try {
            const data = await financeDB.exportData();
            Alert.alert(
                language === 'id' ? 'Data Diekspor' : 'Data Exported',
                language === 'id' ? ' Cek console untuk data' : 'Check console for data'
            );
            console.log('Finance data export:', data);
        } catch (error) {
            Alert.alert('Error', error.message);
        }
    };

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={styles.header}>
                <Text style={[styles.title, { color: colors.text }]}>
                    {language === 'id' ? 'Pengaturan' : 'Settings'}
                </Text>
            </View>

            <View style={[styles.section, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    {language === 'id' ? 'CLOUD SYNC' : 'CLOUD SYNC'}
                </Text>
                
                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <View style={[styles.iconWrap, { backgroundColor: colors.primary + '20' }]}>
                            <Ionicons name="cloud-outline" size={20} color={colors.primary} />
                        </View>
                        <View>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>
                                {language === 'id' ? 'Sinkron ke Cloud' : 'Sync to Cloud'}
                            </Text>
                            <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                                {language === 'id' 
                                    ? 'Simpan data di server untuk akses multi-device'
                                    : 'Store data on server for multi-device access'}
                            </Text>
                        </View>
                    </View>
                    <Switch
                        value={syncEnabled}
                        onValueChange={toggleSync}
                        trackColor={{ true: colors.primary }}
                    />
                </View>

                {syncEnabled && (
                    <TouchableOpacity 
                        style={[styles.syncBtn, { borderColor: colors.border }]}
                        onPress={triggerSync}
                        disabled={syncing}
                    >
                        {syncing ? (
                            <ActivityIndicator size="small" color={colors.primary} />
                        ) : (
                            <>
                                <Ionicons name="sync-outline" size={18} color={colors.primary} />
                                <Text style={[styles.syncBtnText, { color: colors.primary }]}>
                                    {language === 'id' ? 'Sinkronkan Sekarang' : 'Sync Now'}
                                </Text>
                            </>
                        )}
                    </TouchableOpacity>
                )}
            </View>

            <View style={[styles.section, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    {language === 'id' ? 'DATA' : 'DATA'}
                </Text>
                
                <TouchableOpacity style={styles.settingRow} onPress={exportData}>
                    <View style={styles.settingInfo}>
                        <View style={[styles.iconWrap, { backgroundColor: '#22c55e20' }]}>
                            <Ionicons name="download-outline" size={20} color="#22c55e" />
                        </View>
                        <View>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>
                                {language === 'id' ? 'Ekspor Data' : 'Export Data'}
                            </Text>
                            <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                                {language === 'id' 
                                    ? 'Download semua data expenses & invoices'
                                    : 'Download all expenses & invoices'}
                            </Text>
                        </View>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>

            <View style={[styles.section, { backgroundColor: colors.card }]}>
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
                    {language === 'id' ? 'TENTANG' : 'ABOUT'}
                </Text>
                
                <View style={styles.settingRow}>
                    <View style={styles.settingInfo}>
                        <View style={[styles.iconWrap, { backgroundColor: '#8b5cf620' }]}>
                            <Ionicons name="information-circle-outline" size={20} color="#8b5cf6" />
                        </View>
                        <View>
                            <Text style={[styles.settingLabel, { color: colors.text }]}>
                                Financial Assistant
                            </Text>
                            <Text style={[styles.settingDesc, { color: colors.textSecondary }]}>
                                v1.0.0
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    header: { padding: 16 },
    title: { fontSize: 24, fontWeight: '700' },
    section: { marginHorizontal: 16, marginBottom: 16, borderRadius: 12, overflow: 'hidden' },
    sectionTitle: { fontSize: 12, fontWeight: '600', padding: 16, paddingBottom: 8 },
    settingRow: { 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        padding: 16,
        paddingTop: 8,
    },
    settingInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: 12 },
    iconWrap: { width: 40, height: 40, borderRadius: 10, justifyContent: 'center', alignItems: 'center' },
    settingLabel: { fontSize: 15, fontWeight: '500' },
    settingDesc: { fontSize: 12, marginTop: 2 },
    syncBtn: { 
        flexDirection: 'row', 
        alignItems: 'center', 
        justifyContent: 'center', 
        gap: 8,
        marginHorizontal: 16, 
        marginBottom: 16,
        padding: 12,
        borderRadius: 8,
        borderWidth: 1,
    },
    syncBtnText: { fontSize: 14, fontWeight: '500' },
});