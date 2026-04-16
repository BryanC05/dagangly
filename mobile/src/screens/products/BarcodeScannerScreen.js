import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import api from '../../api/api';
import { useNavigation } from '@react-navigation/native';

export default function BarcodeScannerScreen() {
    const { colors } = useThemeStore();
    const { t } = useTranslation();
    const navigation = useNavigation();
    
    const [scanned, setScanned] = useState(false);
    const [loading, setLoading] = useState(false);
    const [lastScanned, setLastScanned] = useState(null);
    
    useEffect(() => {
        setScanned(false);
    }, []);
    
    const handleBarCodeScanned = async ({ type, data }) => {
        if (scanned || loading) return;
        
        setScanned(true);
        setLoading(true);
        Vibration.vibrate(100);
        
        setLastScanned({ type, data });
        
        try {
            const res = await api.get(`/products/barcode/${data}`);
            
            if (res.data && res.data._id) {
                navigation.replace('ProductDetail', { productId: res.data._id });
            } else {
                Alert.alert(
                    t.noProduct || 'No product found',
                    `Barcode: ${data}`,
                    [
                        { text: 'Try Again', onPress: () => setScanned(false) },
                        { text: 'Search', onPress: () => {
                            setScanned(false);
                            navigation.navigate('Products', { searchQuery: data });
                        }},
                    ]
                );
            }
        } catch (err) {
            const message = err.response?.data?.message || err.message;
            Alert.alert(
                t.noProduct || 'No product found',
                `Barcode: ${data}\n${message}`,
                [
                    { text: 'Try Again', onPress: () => setScanned(false) },
                    { text: 'Search', onPress: () => {
                        setScanned(false);
                        navigation.navigate('Products', { searchQuery: data });
                    }},
                ]
            );
        } finally {
            setLoading(false);
        }
    };
    
    const styles = {
        container: { flex: 1, backgroundColor: colors.background },
        header: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
            padding: 16, paddingTop: 60, paddingBottom: 16,
            backgroundColor: colors.card, borderBottomWidth: 1, borderBottomColor: colors.border,
        },
        headerTitle: { fontSize: 18, fontWeight: '700', color: colors.text },
        scannerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 16 },
        scannerPlaceholder: {
            width: 280, height: 280, borderRadius: 16,
            borderWidth: 2, borderColor: colors.primary,
            justifyContent: 'center', alignItems: 'center',
            backgroundColor: colors.input,
        },
        scannerText: { fontSize: 13, color: colors.textSecondary, marginTop: 12, textAlign: 'center' },
        scannerNote: { fontSize: 12, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },
        scanButton: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            backgroundColor: colors.primary, borderRadius: 14, paddingVertical: 16,
            paddingHorizontal: 32, margin: 16,
        },
        scanButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
        manualButton: {
            flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
            paddingVertical: 16, marginHorizontal: 16,
        },
        manualButtonText: { color: colors.primary, fontSize: 14, fontWeight: '600' },
        resultCard: {
            backgroundColor: colors.card, borderRadius: 16, padding: 16, margin: 16,
            shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1, shadowRadius: 8, elevation: 4,
        },
        resultRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
        resultIcon: {
            width: 48, height: 48, borderRadius: 24, backgroundColor: colors.primary + '15',
            justifyContent: 'center', alignItems: 'center',
        },
        resultInfo: { flex: 1 },
        resultLabel: { fontSize: 12, color: colors.textSecondary },
        resultValue: { fontSize: 16, fontWeight: '700', color: colors.text },
    };
    
    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>{t.scanBarcode || 'Scan Barcode'}</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Products')}>
                    <Ionicons name="search" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>
            
            <View style={styles.scannerContainer}>
                <View style={styles.scannerPlaceholder}>
                    <Ionicons name="barcode" size={64} color={colors.textSecondary} />
                    <Text style={styles.scannerText}>
                        {t.pointCamera || 'Point camera at barcode'}
                    </Text>
                    <Text style={styles.scannerNote}>
                        Using expo-barcode-scanner{'\n'}Requires development build for full functionality
                    </Text>
                </View>
                
                {lastScanned && (
                    <View style={styles.resultCard}>
                        <View style={styles.resultRow}>
                            <View style={styles.resultIcon}>
                                <Ionicons name="checkmark-circle" size={24} color={colors.primary} />
                            </View>
                            <View style={styles.resultInfo}>
                                <Text style={styles.resultLabel}>Last Scanned</Text>
                                <Text style={styles.resultValue}>{lastScanned.data}</Text>
                            </View>
                        </View>
                    </View>
                )}
                
                <TouchableOpacity 
                    style={styles.scanButton}
                    onPress={() => {
                        Alert.alert(
                            'Barcode Scanner',
                            'Camera access required for barcode scanning.\n\nUse development build (not Expo Go) for full functionality.',
                            [
                                { text: 'Search Instead', onPress: () => navigation.navigate('Products') },
                                { text: 'OK' },
                            ]
                        );
                    }}
                >
                    <Ionicons name="camera" size={20} color="#fff" />
                    <Text style={styles.scanButtonText}>
                        {t.scanBarcode || 'Tap to Scan'}
                    </Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                    style={styles.manualButton}
                    onPress={() => navigation.navigate('Products')}
                >
                    <Ionicons name="keypad" size={20} color={colors.primary} />
                    <Text style={styles.manualButtonText}>
                        Enter Manually
                    </Text>
                </TouchableOpacity>
            </View>
        </View>
    );
}