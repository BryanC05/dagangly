import React, { useState, useEffect, useMemo } from 'react';
import {
    View, Text, ScrollView, TouchableOpacity, StyleSheet, Alert,
    TextInput, ActivityIndicator, Modal
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Linking from 'expo-linking';
import api from '../../api/api';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useTheme } from '../../theme/ThemeContext';

const SOCIAL_PLATFORMS = [
    { id: 'instagram', name: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
    { id: 'tiktok', name: 'TikTok', icon: 'logo-tiktok', color: '#000000' },
    { id: 'facebook', name: 'Facebook', icon: 'logo-facebook', color: '#1877F2' },
    { id: 'twitter', name: 'Twitter/X', icon: 'logo-twitter', color: '#1DA1F2' },
    { id: 'youtube', name: 'YouTube', icon: 'logo-youtube', color: '#FF0000' },
    { id: 'whatsapp', name: 'WhatsApp', icon: 'logo-whatsapp', color: '#25D366' },
    { id: 'website', name: 'Website', icon: 'globe-outline', color: '#666666' },
];

export default function SocialLinksScreen({ navigation, route }) {
    const { user } = useAuthStore();
    const { t } = useTranslation();
    const { colors } = useTheme();
    
    const { isStoreLinks = false } = route?.params || {};
    const linkType = isStoreLinks ? 'store' : 'profile';
    
    const [links, setLinks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [showAddModal, setShowAddModal] = useState(false);
    const [editingLink, setEditingLink] = useState(null);
    const [urlInput, setUrlInput] = useState('');
    const [selectedPlatform, setSelectedPlatform] = useState(null);

    useEffect(() => {
        fetchLinks();
    }, [linkType]);

    const fetchLinks = async () => {
        setLoading(true);
        try {
            const response = await api.get('/users/social-links');
            const fetchedLinks = isStoreLinks ? response.data.storeLinks : response.data.profileLinks;
            setLinks(fetchedLinks || []);
        } catch (error) {
            console.error('Failed to fetch social links:', error);
            setLinks([]);
        } finally {
            setLoading(false);
        }
    };

    const detectPlatform = (url) => {
        const lower = url.toLowerCase();
        if (lower.includes('instagram.com')) return 'instagram';
        if (lower.includes('tiktok.com')) return 'tiktok';
        if (lower.includes('facebook.com') || lower.includes('fb.com')) return 'facebook';
        if (lower.includes('twitter.com') || lower.includes('x.com')) return 'twitter';
        if (lower.includes('youtube.com')) return 'youtube';
        if (lower.includes('wa.me') || lower.includes('whatsapp.com')) return 'whatsapp';
        return 'website';
    };

    const isValidURL = (url) => {
        return url.startsWith('http://') || url.startsWith('https://');
    };

    const handleSaveLink = async () => {
        if (!urlInput.trim()) {
            Alert.alert(t.error, t.enterUrl || 'Please enter a URL');
            return;
        }

        let url = urlInput.trim();
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
            url = 'https://' + url;
        }

        if (!isValidURL(url)) {
            Alert.alert(t.error, t.invalidUrl || 'Please enter a valid URL');
            return;
        }

        const platform = selectedPlatform || detectPlatform(url);

        setSaving(true);
        try {
            const payload = linkType === 'store' 
                ? { storeLinks: [...links.filter(l => l.platform !== platform), { platform, url }] }
                : { profileLinks: [...links.filter(l => l.platform !== platform), { platform, url }] };

            await api.put('/users/social-links', payload);
            await fetchLinks();
            setShowAddModal(false);
            setEditingLink(null);
            setUrlInput('');
            setSelectedPlatform(null);
        } catch (error) {
            Alert.alert(t.error, error.response?.data?.error || 'Failed to save link');
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteLink = (platform) => {
        Alert.alert(
            t.deleteLink || 'Delete Link',
            `Remove this ${platform} link?`,
            [
                { text: t.cancel, style: 'cancel' },
                {
                    text: t.delete,
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete(`/users/social-links?platform=${platform}&type=${linkType}`);
                            await fetchLinks();
                        } catch (error) {
                            Alert.alert(t.error, 'Failed to delete link');
                        }
                    }
                }
            ]
        );
    };

    const handleOpenLink = async (url) => {
        try {
            const supported = await Linking.canOpenURL(url);
            if (supported) {
                await Linking.openURL(url);
            } else {
                Alert.alert(t.error, 'Cannot open this link');
            }
        } catch (error) {
            Alert.alert(t.error, 'Failed to open link');
        }
    };

    const getPlatformInfo = (platformId) => {
        return SOCIAL_PLATFORMS.find(p => p.id === platformId) || { 
            id: platformId, name: platformId, icon: 'globe-outline', color: '#666666' 
        };
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
        sectionTitle: { fontSize: 16, fontWeight: '600', color: colors.text, marginBottom: 16 },
        linkCard: {
            flexDirection: 'row', alignItems: 'center', backgroundColor: colors.card,
            padding: 14, borderRadius: 12, marginBottom: 10,
        },
        platformIcon: {
            width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center',
            marginRight: 12,
        },
        linkInfo: { flex: 1 },
        linkPlatform: { fontSize: 14, fontWeight: '600', color: colors.text },
        linkUrl: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
        deleteBtn: { padding: 8 },
        emptyState: { alignItems: 'center', paddingVertical: 40 },
        emptyIcon: { marginBottom: 12, color: colors.textSecondary },
        emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
        addBtn: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
            backgroundColor: colors.primary, paddingVertical: 14, borderRadius: 12, gap: 8,
        },
        addBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
        
        // Modal styles
        modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
        modalContent: { backgroundColor: colors.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20 },
        modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
        modalTitle: { fontSize: 20, fontWeight: '700', color: colors.text },
        platformGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 16 },
        platformOption: {
            width: '30%', padding: 12, borderRadius: 12, alignItems: 'center',
            borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
        },
        platformOptionSelected: { borderColor: colors.primary, backgroundColor: colors.primaryLight + '20' },
        platformOptionIcon: { marginBottom: 4 },
        platformOptionText: { fontSize: 11, color: colors.text },
        urlInput: {
            backgroundColor: colors.input, borderRadius: 12, padding: 14,
            fontSize: 14, color: colors.text, borderWidth: 1, borderColor: colors.border,
            marginBottom: 16,
        },
        modalActions: { flexDirection: 'row', gap: 12 },
        cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.input },
        cancelBtnText: { fontSize: 16, fontWeight: '600', color: colors.text },
        saveBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: colors.primary },
        saveBtnText: { fontSize: 16, fontWeight: '600', color: '#fff' },
    }), [colors]);

    const renderPlatformIcon = (platformId, size = 24) => {
        const platform = getPlatformInfo(platformId);
        return (
            <View style={[styles.platformIcon, { backgroundColor: platform.color + '20' }]}>
                <Ionicons name={platform.icon} size={size} color={platform.color} />
            </View>
        );
    };

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
                <Text style={styles.headerTitle}>
                    {isStoreLinks ? (t.storeLinks || 'Store Links') : (t.profileLinks || 'Profile Links')}
                </Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
                {links.length === 0 ? (
                    <View style={styles.emptyState}>
                        <Ionicons name="link-outline" size={48} color={colors.textSecondary} style={styles.emptyIcon} />
                        <Text style={styles.emptyText}>
                            {isStoreLinks 
                                ? 'No store links added yet. Add links to display on your store page.'
                                : 'No social links added yet. Add links to display on your profile.'
                            }
                        </Text>
                    </View>
                ) : (
                    links.map((link) => {
                        const platform = getPlatformInfo(link.platform);
                        return (
                            <TouchableOpacity 
                                key={link.platform} 
                                style={styles.linkCard}
                                onPress={() => handleOpenLink(link.url)}
                            >
                                {renderPlatformIcon(link.platform)}
                                <View style={styles.linkInfo}>
                                    <Text style={styles.linkPlatform}>{platform.name}</Text>
                                    <Text style={styles.linkUrl} numberOfLines={1}>{link.url}</Text>
                                </View>
                                <TouchableOpacity 
                                    style={styles.deleteBtn}
                                    onPress={() => handleDeleteLink(link.platform)}
                                >
                                    <Ionicons name="trash-outline" size={20} color={colors.danger} />
                                </TouchableOpacity>
                            </TouchableOpacity>
                        );
                    })
                )}

                {links.length < 5 && (
                    <TouchableOpacity 
                        style={styles.addBtn} 
                        onPress={() => setShowAddModal(true)}
                    >
                        <Ionicons name="add" size={20} color="#fff" />
                        <Text style={styles.addBtnText}>{t.addSocialLink || 'Add Social Link'}</Text>
                    </TouchableOpacity>
                )}

                {links.length >= 5 && (
                    <Text style={{ textAlign: 'center', color: colors.textSecondary, marginTop: 10 }}>
                        {t.maxLinksReached || 'Maximum 5 links allowed'}
                    </Text>
                )}
            </ScrollView>

            {/* Add Link Modal */}
            <Modal visible={showAddModal} animationType="slide" transparent>
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>{t.addSocialLink || 'Add Social Link'}</Text>
                            <TouchableOpacity onPress={() => { setShowAddModal(false); setEditingLink(null); setUrlInput(''); setSelectedPlatform(null); }}>
                                <Ionicons name="close" size={24} color={colors.textSecondary} />
                            </TouchableOpacity>
                        </View>

                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 10 }}>
                            {t.platform || 'Platform'}
                        </Text>
                        <View style={styles.platformGrid}>
                            {SOCIAL_PLATFORMS.map((platform) => (
                                <TouchableOpacity
                                    key={platform.id}
                                    style={[
                                        styles.platformOption,
                                        selectedPlatform === platform.id && styles.platformOptionSelected
                                    ]}
                                    onPress={() => setSelectedPlatform(platform.id)}
                                >
                                    <Ionicons 
                                        name={platform.icon} 
                                        size={24} 
                                        color={selectedPlatform === platform.id ? colors.primary : platform.color}
                                        style={styles.platformOptionIcon}
                                    />
                                    <Text style={[styles.platformOptionText, selectedPlatform === platform.id && { color: colors.primary }]}>
                                        {platform.name}
                                    </Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={{ fontSize: 14, fontWeight: '600', color: colors.text, marginBottom: 10 }}>
                            {t.url || 'URL'}
                        </Text>
                        <TextInput
                            style={styles.urlInput}
                            placeholder="https://instagram.com/yourname"
                            placeholderTextColor={colors.textSecondary}
                            value={urlInput}
                            onChangeText={setUrlInput}
                            autoCapitalize="none"
                            keyboardType="url"
                        />

                        {selectedPlatform && urlInput && (
                            <View style={[styles.linkCard, { marginBottom: 16 }]}>
                                {renderPlatformIcon(selectedPlatform, 20)}
                                <View style={styles.linkInfo}>
                                    <Text style={styles.linkPlatform}>{getPlatformInfo(selectedPlatform).name}</Text>
                                    <Text style={styles.linkUrl} numberOfLines={1}>{urlInput}</Text>
                                </View>
                            </View>
                        )}

                        <View style={styles.modalActions}>
                            <TouchableOpacity 
                                style={styles.cancelBtn} 
                                onPress={() => { setShowAddModal(false); setEditingLink(null); setUrlInput(''); setSelectedPlatform(null); }}
                            >
                                <Text style={styles.cancelBtnText}>{t.cancel}</Text>
                            </TouchableOpacity>
                            <TouchableOpacity 
                                style={styles.saveBtn} 
                                onPress={handleSaveLink}
                                disabled={saving || !urlInput}
                            >
                                {saving ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.saveBtnText}>{t.save}</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}
