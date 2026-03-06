import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
    ActivityIndicator, Switch
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import api from '../../api/api';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../theme/ThemeContext';

export default function InstagramScreen({ navigation }) {
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const { colors } = useTheme();
    
    const [accounts, setAccounts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [connecting, setConnecting] = useState(false);
    const [preference, setPreference] = useState({ preference: 'trolitoko', hasOwnAccount: false });
    const [preferenceLoading, setPreferenceLoading] = useState(false);

    useEffect(() => {
        fetchInstagramStatus();
        fetchPreference();
    }, []);

    const fetchInstagramStatus = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users/instagram/status');
            setAccounts(response.data.accounts || []);
        } catch (error) {
            console.error('Failed to fetch Instagram status:', error);
            setAccounts([]);
        } finally {
            setLoading(false);
        }
    };

    const fetchPreference = async () => {
        try {
            const response = await api.get('/users/instagram/preference');
            setPreference(response.data);
        } catch (error) {
            console.error('Failed to fetch preference:', error);
            setPreference({ preference: 'trolitoko', hasOwnAccount: false });
        }
    };

    const handleConnect = async () => {
        setConnecting(true);
        try {
            const response = await api.get('/users/instagram/connect');
            const { authURL } = response.data;
            
            const result = await WebBrowser.openAuthSessionAsync(
                authURL,
                'msmehub://instagram-callback'
            );

            if (result.type === 'success') {
                const url = result.url;
                const codeMatch = url.match(/code=([^&]+)/);
                if (codeMatch) {
                    const callbackResponse = await api.get(`/users/instagram/callback?code=${codeMatch[1]}`);
                    if (callbackResponse.data.success) {
                        Alert.alert(t.success, 'Instagram connected successfully!');
                        await fetchInstagramStatus();
                        await fetchPreference();
                    }
                }
            }
        } catch (error) {
            console.error('Failed to connect Instagram:', error);
            Alert.alert(t.error, error.response?.data?.error || 'Failed to connect Instagram');
        } finally {
            setConnecting(false);
        }
    };

    const handleDisconnect = (username) => {
        Alert.alert(
            t.disconnectInstagram,
            `Remove @${username} from your connected accounts?`,
            [
                { text: t.cancel, style: 'cancel' },
                {
                    text: t.disconnect,
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.post(`/users/instagram/disconnect?username=${username}`);
                            Alert.alert(t.success, 'Instagram disconnected');
                            await fetchInstagramStatus();
                            await fetchPreference();
                        } catch (error) {
                            Alert.alert(t.error, 'Failed to disconnect');
                        }
                    }
                }
            ]
        );
    };

    const handleSetDefault = async (username) => {
        try {
            await api.post(`/users/instagram/set-default?username=${username}`);
            await fetchInstagramStatus();
        } catch (error) {
            Alert.alert(t.error, 'Failed to set default');
        }
    };

    const handlePreferenceChange = async (newPreference) => {
        if (newPreference === 'own' && !preference.hasOwnAccount) {
            Alert.alert(t.error, 'Please connect your Instagram account first');
            return;
        }
        
        setPreferenceLoading(true);
        try {
            await api.post('/users/instagram/preference', { preference: newPreference });
            setPreference(prev => ({ ...prev, preference: newPreference }));
        } catch (error) {
            Alert.alert(t.error, 'Failed to update preference');
        } finally {
            setPreferenceLoading(false);
        }
    };

    const styles = useMemo(() => StyleSheet.create({
        container: { flex: 1, backgroundColor: colors.background },
        header: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingHorizontal: 16, paddingTop: 50, paddingBottom: 16,
            backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
        },
        backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: colors.input, justifyContent: 'center', alignItems: 'center' },
        headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
        content: { flex: 1, padding: 16 },
        
        section: { marginBottom: 24 },
        sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 12 },
        
        // Connected Accounts
        accountCard: {
            backgroundColor: colors.card, borderRadius: 12, padding: 14, marginBottom: 10,
        },
        accountRow: { flexDirection: 'row', alignItems: 'center' },
        accountIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E4405F20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
        accountInfo: { flex: 1 },
        accountUsername: { fontSize: 15, fontWeight: '600', color: colors.text },
        accountBadge: { fontSize: 12, color: colors.textSecondary },
        defaultBadge: { backgroundColor: colors.successLight, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
        defaultBadgeText: { fontSize: 11, color: colors.success, fontWeight: '600' },
        
        accountActions: { flexDirection: 'row', gap: 8, marginTop: 10 },
        setDefaultBtn: { flex: 1, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.input, alignItems: 'center' },
        setDefaultBtnText: { fontSize: 13, fontWeight: '600', color: colors.text },
        disconnectBtn: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 8, backgroundColor: colors.danger + '20', alignItems: 'center' },
        disconnectBtnText: { fontSize: 13, fontWeight: '600', color: colors.danger },
        
        connectBtn: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            backgroundColor: '#E4405F', paddingVertical: 14, borderRadius: 12, gap: 8,
        },
        connectBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
        
        // Posting Preference
        preferenceCard: { backgroundColor: colors.card, borderRadius: 12, padding: 16 },
        preferenceOption: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: colors.border,
        },
        preferenceOptionLast: { borderBottomWidth: 0 },
        preferenceInfo: { flex: 1 },
        preferenceLabel: { fontSize: 15, fontWeight: '600', color: colors.text },
        preferenceDesc: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
        preferenceRadio: {
            width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: colors.border,
            justifyContent: 'center', alignItems: 'center',
        },
        preferenceRadioSelected: { borderColor: '#E4405F' },
        preferenceRadioInner: { width: 12, height: 12, borderRadius: 6, backgroundColor: '#E4405F' },
        
        // Info Card
        infoCard: {
            backgroundColor: colors.primaryLight + '20', borderRadius: 12, padding: 14,
            flexDirection: 'row', alignItems: 'flex-start', gap: 12,
        },
        infoIcon: { marginTop: 2 },
        infoText: { flex: 1, fontSize: 13, color: colors.textSecondary, lineHeight: 20 },
        
        emptyState: { alignItems: 'center', paddingVertical: 32 },
        emptyIcon: { marginBottom: 12, color: colors.textSecondary },
        emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
    }), [colors]);

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Instagram</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {/* Connected Accounts */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Connected Accounts</Text>
                    
                    {accounts.length === 0 ? (
                        <View style={styles.emptyState}>
                            <Ionicons name="logo-instagram" size={48} color={colors.textSecondary} style={styles.emptyIcon} />
                            <Text style={styles.emptyText}>No Instagram account connected</Text>
                        </View>
                    ) : (
                        accounts.map((account) => (
                            <View key={account.username} style={styles.accountCard}>
                                <View style={styles.accountRow}>
                                    <View style={styles.accountIcon}>
                                        <Ionicons name="logo-instagram" size={24} color="#E4405F" />
                                    </View>
                                    <View style={styles.accountInfo}>
                                        <Text style={styles.accountUsername}>@{account.username}</Text>
                                        {account.isDefault && (
                                            <View style={styles.defaultBadge}>
                                                <Text style={styles.defaultBadgeText}>Default</Text>
                                            </View>
                                        )}
                                    </View>
                                </View>
                                <View style={styles.accountActions}>
                                    {!account.isDefault && (
                                        <TouchableOpacity 
                                            style={styles.setDefaultBtn} 
                                            onPress={() => handleSetDefault(account.username)}
                                        >
                                            <Text style={styles.setDefaultBtnText}>Set as Default</Text>
                                        </TouchableOpacity>
                                    )}
                                    <TouchableOpacity 
                                        style={styles.disconnectBtn}
                                        onPress={() => handleDisconnect(account.username)}
                                    >
                                        <Text style={styles.disconnectBtnText}>Disconnect</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        ))
                    )}

                    <TouchableOpacity 
                        style={[styles.connectBtn, { marginTop: 12 }]}
                        onPress={handleConnect}
                        disabled={connecting}
                    >
                        {connecting ? (
                            <ActivityIndicator size="small" color="#fff" />
                        ) : (
                            <>
                                <Ionicons name="add" size={20} color="#fff" />
                                <Text style={styles.connectBtnText}>Connect Instagram</Text>
                            </>
                        )}
                    </TouchableOpacity>
                </View>

                {/* Posting Preference */}
                <View style={styles.section}>
                    <Text style={styles.sectionTitle}>Posting Preference</Text>
                    
                    <View style={styles.preferenceCard}>
                        <TouchableOpacity 
                            style={[styles.preferenceOption, styles.preferenceOptionLast]}
                            onPress={() => !preferenceLoading && handlePreferenceChange('trolitoko')}
                            disabled={preferenceLoading}
                        >
                            <View style={styles.preferenceInfo}>
                                <Text style={styles.preferenceLabel}>TroliToko Official</Text>
                                <Text style={styles.preferenceDesc}>Products will be posted on TroliToko's Instagram</Text>
                            </View>
                            <View style={[
                                styles.preferenceRadio,
                                preference.preference === 'trolitoko' && styles.preferenceRadioSelected
                            ]}>
                                {preference.preference === 'trolitoko' && (
                                    <View style={styles.preferenceRadioInner} />
                                )}
                            </View>
                        </TouchableOpacity>
                        
                        <TouchableOpacity 
                            style={[styles.preferenceOption, styles.preferenceOptionLast]}
                            onPress={() => !preferenceLoading && handlePreferenceChange('own')}
                            disabled={preferenceLoading}
                        >
                            <View style={styles.preferenceInfo}>
                                <Text style={styles.preferenceLabel}>Your Instagram</Text>
                                <Text style={styles.preferenceDesc}>Products will be posted on your connected account</Text>
                            </View>
                            <View style={[
                                styles.preferenceRadio,
                                preference.preference === 'own' && styles.preferenceRadioSelected
                            ]}>
                                {preference.preference === 'own' && (
                                    <View style={styles.preferenceRadioInner} />
                                )}
                            </View>
                        </TouchableOpacity>
                    </View>
                </View>

                {/* Info */}
                <View style={styles.infoCard}>
                    <Ionicons name="information-circle-outline" size={20} color={colors.primary} style={styles.infoIcon} />
                    <Text style={styles.infoText}>
                        When you create a product with Instagram posting enabled, it will automatically be posted to the selected Instagram account based on your preference.
                    </Text>
                </View>
            </ScrollView>
        </View>
    );
}
