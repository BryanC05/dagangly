import React, { useState, useEffect } from 'react';
import {
    View, Text, TouchableOpacity, StyleSheet, TextInput,
    Image, ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../theme/ThemeContext';
import api from '../../api/api';

export default function BusinessSection({ user, onBusinessUpdate }) {
    const { colors } = useTheme();
    const [business, setBusiness] = useState(null);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [uploadingLogo, setUploadingLogo] = useState(false);

    // Form state
    const [form, setForm] = useState({
        name: '',
        description: '',
        email: '',
        phone: '',
        businessType: 'micro',
        address: '',
        city: '',
        state: '',
    });

    useEffect(() => {
        fetchBusiness();
    }, []);

    const fetchBusiness = async () => {
        try {
            const response = await api.get('/business/my');
            setBusiness(response.data.business);
            if (response.data.business) {
                setForm({
                    name: response.data.business.name || '',
                    description: response.data.business.description || '',
                    email: response.data.business.email || '',
                    phone: response.data.business.phone || '',
                    businessType: response.data.business.businessType || 'micro',
                    address: response.data.business.address || '',
                    city: response.data.business.city || '',
                    state: response.data.business.state || '',
                });
            }
        } catch (error) {
            console.error('Failed to fetch business:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateBusiness = async () => {
        if (!form.name || !form.email || !form.phone) {
            Alert.alert('Error', 'Please fill in all required fields');
            return;
        }

        setSaving(true);
        try {
            const response = await api.post('/business/', form);
            setBusiness(response.data.business);
            setEditing(false);
            onBusinessUpdate?.(response.data.business);
            Alert.alert('Success', 'Business registered successfully!');
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to create business');
        } finally {
            setSaving(false);
        }
    };

    const handleUpdateBusiness = async () => {
        setSaving(true);
        try {
            const response = await api.put('/business/', form);
            await fetchBusiness();
            setEditing(false);
            onBusinessUpdate?.(business);
            Alert.alert('Success', 'Business updated successfully!');
        } catch (error) {
            Alert.alert('Error', error.response?.data?.message || 'Failed to update business');
        } finally {
            setSaving(false);
        }
    };

    const pickLogoImage = async () => {
        const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
        if (status !== 'granted') {
            Alert.alert('Permission needed', 'Camera roll access is required');
            return;
        }

        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ['images'],
            allowsEditing: true,
            aspect: [1, 1],
            quality: 0.7,
            base64: true,
        });

        if (!result.canceled && result.assets?.[0]) {
            uploadLogoImage(result.assets[0]);
        }
    };

    const uploadLogoImage = async (asset) => {
        setUploadingLogo(true);
        try {
            const base64 = asset.base64;
            const ext = (asset.uri || '').split('.').pop()?.toLowerCase() || 'jpeg';
            const mimeType = ext === 'png' ? 'image/png' : 'image/jpeg';
            const dataUrl = `data:${mimeType};base64,${base64}`;

            // First upload the image to get a URL
            const uploadResponse = await api.post('/product-images/process', {
                image: dataUrl,
            });

            const logoUrl = uploadResponse.data.url;

            // Update business logo
            await api.put('/business/logo', { logoUrl });
            await fetchBusiness();
            Alert.alert('Success', 'Logo updated successfully!');
        } catch (error) {
            Alert.alert('Error', 'Failed to upload logo');
            console.error(error);
        } finally {
            setUploadingLogo(false);
        }
    };

    const styles = StyleSheet.create({
        container: {
            backgroundColor: colors.card,
            marginHorizontal: 16,
            marginTop: 16,
            borderRadius: 16,
            padding: 16,
        },
        header: {
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 16,
        },
        headerIcon: {
            width: 40,
            height: 40,
            borderRadius: 10,
            backgroundColor: colors.primary + '15',
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
        },
        headerTitle: {
            fontSize: 16,
            fontWeight: '700',
            color: colors.text,
        },
        headerSubtitle: {
            fontSize: 13,
            color: colors.textSecondary,
            marginTop: 2,
        },
        logoSection: {
            alignItems: 'center',
            marginBottom: 20,
        },
        logoContainer: {
            width: 100,
            height: 100,
            borderRadius: 50,
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: colors.border,
            overflow: 'hidden',
        },
        logoImage: {
            width: 100,
            height: 100,
            borderRadius: 50,
        },
        logoPlaceholder: {
            fontSize: 36,
            fontWeight: '700',
            color: colors.primary,
        },
        logoBadge: {
            position: 'absolute',
            bottom: 0,
            right: 0,
            backgroundColor: colors.success,
            borderRadius: 12,
            width: 24,
            height: 24,
            justifyContent: 'center',
            alignItems: 'center',
            borderWidth: 2,
            borderColor: colors.card,
        },
        changeLogoBtn: {
            marginTop: 8,
            paddingHorizontal: 16,
            paddingVertical: 8,
            backgroundColor: colors.primary + '15',
            borderRadius: 8,
        },
        changeLogoText: {
            color: colors.primary,
            fontSize: 13,
            fontWeight: '600',
        },
        infoRow: {
            flexDirection: 'row',
            alignItems: 'center',
            paddingVertical: 10,
            borderBottomWidth: 1,
            borderBottomColor: colors.border,
        },
        infoIcon: {
            width: 32,
            height: 32,
            borderRadius: 8,
            backgroundColor: colors.background,
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: 12,
        },
        infoLabel: {
            fontSize: 12,
            color: colors.textSecondary,
        },
        infoValue: {
            fontSize: 14,
            fontWeight: '600',
            color: colors.text,
            marginTop: 2,
        },
        inputGroup: {
            marginBottom: 12,
        },
        inputLabel: {
            fontSize: 12,
            fontWeight: '600',
            color: colors.textSecondary,
            marginBottom: 6,
        },
        input: {
            backgroundColor: colors.background,
            borderRadius: 10,
            borderWidth: 1,
            borderColor: colors.border,
            paddingHorizontal: 14,
            paddingVertical: 10,
            fontSize: 14,
            color: colors.text,
        },
        textArea: {
            height: 80,
            textAlignVertical: 'top',
        },
        buttonRow: {
            flexDirection: 'row',
            gap: 10,
            marginTop: 16,
        },
        button: {
            flex: 1,
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: 'center',
        },
        primaryButton: {
            backgroundColor: colors.primary,
        },
        secondaryButton: {
            backgroundColor: colors.background,
            borderWidth: 1,
            borderColor: colors.border,
        },
        buttonText: {
            fontSize: 14,
            fontWeight: '600',
        },
        registerPrompt: {
            alignItems: 'center',
            paddingVertical: 20,
        },
        registerText: {
            fontSize: 14,
            color: colors.textSecondary,
            textAlign: 'center',
            marginBottom: 16,
        },
        registerButton: {
            backgroundColor: colors.primary,
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 10,
        },
        registerButtonText: {
            color: colors.white,
            fontSize: 14,
            fontWeight: '600',
        },
    });

    if (loading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator color={colors.primary} />
            </View>
        );
    }

    // No business registered yet
    if (!business && !editing) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerIcon}>
                        <Ionicons name="storefront-outline" size={20} color={colors.primary} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>Business Profile</Text>
                        <Text style={styles.headerSubtitle}>Register your business</Text>
                    </View>
                </View>
                <View style={styles.registerPrompt}>
                    <Text style={styles.registerText}>
                        Register your business to access logo generation and showcase your brand
                    </Text>
                    <TouchableOpacity style={styles.registerButton} onPress={() => setEditing(true)}>
                        <Text style={styles.registerButtonText}>Register Business</Text>
                    </TouchableOpacity>
                </View>
            </View>
        );
    }

    // Editing/Creating business
    if (editing || !business) {
        return (
            <View style={styles.container}>
                <View style={styles.header}>
                    <View style={styles.headerIcon}>
                        <Ionicons name="storefront-outline" size={20} color={colors.primary} />
                    </View>
                    <View>
                        <Text style={styles.headerTitle}>
                            {business ? 'Edit Business' : 'Register Business'}
                        </Text>
                    </View>
                </View>

                <ScrollView showsVerticalScrollIndicator={false}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Business Name *</Text>
                        <TextInput
                            style={styles.input}
                            value={form.name}
                            onChangeText={(v) => setForm({ ...form, name: v })}
                            placeholder="Enter business name"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Description</Text>
                        <TextInput
                            style={[styles.input, styles.textArea]}
                            value={form.description}
                            onChangeText={(v) => setForm({ ...form, description: v })}
                            placeholder="Describe your business"
                            placeholderTextColor={colors.textSecondary}
                            multiline
                            numberOfLines={3}
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Email *</Text>
                        <TextInput
                            style={styles.input}
                            value={form.email}
                            onChangeText={(v) => setForm({ ...form, email: v })}
                            placeholder="business@email.com"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="email-address"
                            autoCapitalize="none"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Phone *</Text>
                        <TextInput
                            style={styles.input}
                            value={form.phone}
                            onChangeText={(v) => setForm({ ...form, phone: v })}
                            placeholder="08123456789"
                            placeholderTextColor={colors.textSecondary}
                            keyboardType="phone-pad"
                        />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>Address</Text>
                        <TextInput
                            style={styles.input}
                            value={form.address}
                            onChangeText={(v) => setForm({ ...form, address: v })}
                            placeholder="Business address"
                            placeholderTextColor={colors.textSecondary}
                        />
                    </View>

                    <View style={styles.buttonRow}>
                        <TouchableOpacity
                            style={[styles.button, styles.secondaryButton]}
                            onPress={() => setEditing(false)}
                        >
                            <Text style={[styles.buttonText, { color: colors.text }]}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.button, styles.primaryButton]}
                            onPress={business ? handleUpdateBusiness : handleCreateBusiness}
                            disabled={saving}
                        >
                            {saving ? (
                                <ActivityIndicator color={colors.white} size="small" />
                            ) : (
                                <Text style={[styles.buttonText, { color: colors.white }]}>
                                    {business ? 'Save Changes' : 'Register'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </View>
        );
    }

    // View business info
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <View style={styles.headerIcon}>
                    <Ionicons name="storefront" size={20} color={colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.headerTitle}>{business.name}</Text>
                    <Text style={styles.headerSubtitle}>
                        {business.isVerified ? 'Verified Business' : 'Pending Verification'}
                    </Text>
                </View>
                <TouchableOpacity onPress={() => setEditing(true)}>
                    <Ionicons name="pencil" size={18} color={colors.primary} />
                </TouchableOpacity>
            </View>

            {/* Logo Section */}
            <View style={styles.logoSection}>
                <View style={styles.logoContainer}>
                    {business.logoInfo?.url ? (
                        <Image source={{ uri: business.logoInfo.url }} style={styles.logoImage} />
                    ) : (
                        <Text style={styles.logoPlaceholder}>
                            {(business.name || 'B').charAt(0).toUpperCase()}
                        </Text>
                    )}
                    {uploadingLogo && (
                        <View style={[StyleSheet.absoluteFill, {
                            backgroundColor: 'rgba(0,0,0,0.4)',
                            justifyContent: 'center',
                            alignItems: 'center',
                        }]}>
                            <ActivityIndicator color={colors.white} />
                        </View>
                    )}
                    {business.isVerified && (
                        <View style={styles.logoBadge}>
                            <Ionicons name="checkmark" size={14} color={colors.white} />
                        </View>
                    )}
                </View>
                <TouchableOpacity style={styles.changeLogoBtn} onPress={pickLogoImage}>
                    <Text style={styles.changeLogoText}>Change Logo</Text>
                </TouchableOpacity>
            </View>

            {/* Business Info */}
            <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                    <Ionicons name="mail-outline" size={16} color={colors.textSecondary} />
                </View>
                <View>
                    <Text style={styles.infoLabel}>Email</Text>
                    <Text style={styles.infoValue}>{business.email}</Text>
                </View>
            </View>

            <View style={styles.infoRow}>
                <View style={styles.infoIcon}>
                    <Ionicons name="call-outline" size={16} color={colors.textSecondary} />
                </View>
                <View>
                    <Text style={styles.infoLabel}>Phone</Text>
                    <Text style={styles.infoValue}>{business.phone}</Text>
                </View>
            </View>

            {business.description && (
                <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                        <Ionicons name="document-text-outline" size={16} color={colors.textSecondary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.infoLabel}>Description</Text>
                        <Text style={styles.infoValue} numberOfLines={2}>{business.description}</Text>
                    </View>
                </View>
            )}

            {business.address && (
                <View style={styles.infoRow}>
                    <View style={styles.infoIcon}>
                        <Ionicons name="location-outline" size={16} color={colors.textSecondary} />
                    </View>
                    <View>
                        <Text style={styles.infoLabel}>Address</Text>
                        <Text style={styles.infoValue}>{business.address}</Text>
                    </View>
                </View>
            )}
        </View>
    );
}