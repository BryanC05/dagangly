import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, SafeAreaView } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';

const { width } = Dimensions.get('window');

export default function BarcodeScannerScreen({ navigation }) {
    const [permission, requestPermission] = useCameraPermissions();
    const [scanned, setScanned] = useState(false);
    const { colors } = useThemeStore();
    const { t } = useTranslation();

    useEffect(() => {
        if (!permission?.granted) {
            requestPermission();
        }
    }, [permission]);

    const handleBarCodeScanned = ({ type, data }) => {
        setScanned(true);
        
        // In a fully integrated flow, you could hit your API here:
        // api.get(`/products/barcode/${data}`)
        
        // Redirect to the products list and trigger a search for the barcode
        navigation.navigate('Browse', { 
            screen: 'Products', 
            params: { search: data } 
        });
    };

    if (!permission) {
        return <View style={[styles.container, { backgroundColor: colors.background }]} />;
    }

    if (!permission.granted) {
        return (
            <SafeAreaView style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center', padding: 20 }]}>
                <Ionicons name="camera-outline" size={64} color={colors.textSecondary} style={{ marginBottom: 16 }} />
                <Text style={{ color: colors.text, textAlign: 'center', marginBottom: 24, fontSize: 16 }}>
                    We need your permission to access the camera to scan barcodes.
                </Text>
                <TouchableOpacity style={[styles.button, { backgroundColor: colors.primary }]} onPress={requestPermission}>
                    <Text style={styles.buttonText}>Grant Camera Permission</Text>
                </TouchableOpacity>
            </SafeAreaView>
        );
    }

    return (
        <View style={styles.container}>
            <CameraView
                style={StyleSheet.absoluteFillObject}
                facing="back"
                onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
                barcodeScannerSettings={{
                    barcodeTypes: ["qr", "ean13", "ean8", "upc_e", "code39", "code128"],
                }}
            >
                <View style={styles.overlay}>
                    <SafeAreaView style={styles.header}>
                        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                            <Ionicons name="close" size={28} color="#fff" />
                        </TouchableOpacity>
                        <Text style={styles.title}>{t('scanner.scanBarcode') || 'Scan Barcode'}</Text>
                        <View style={{ width: 40 }} />
                    </SafeAreaView>

                    <View style={styles.scannerFrameContainer}>
                        <View style={styles.scannerFrame}>
                            <View style={[styles.corner, styles.topLeft]} />
                            <View style={[styles.corner, styles.topRight]} />
                            <View style={[styles.corner, styles.bottomLeft]} />
                            <View style={[styles.corner, styles.bottomRight]} />
                        </View>
                        <Text style={styles.instructionText}>
                            {t('scanner.pointCamera') || 'Point camera at barcode'}
                        </Text>
                    </View>

                    {scanned ? (
                        <SafeAreaView style={styles.footer}>
                            <TouchableOpacity 
                                style={[styles.button, { backgroundColor: colors.primary }]} 
                                onPress={() => setScanned(false)}
                            >
                                <Text style={styles.buttonText}>Tap to Scan Again</Text>
                            </TouchableOpacity>
                        </SafeAreaView>
                    ) : (
                        <SafeAreaView style={styles.footer} />
                    )}
                </View>
            </CameraView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1 },
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
        justifyContent: 'space-between',
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    backButton: { width: 40, height: 40, justifyContent: 'center', alignItems: 'flex-start' },
    title: { color: '#fff', fontSize: 18, fontWeight: '700' },
    scannerFrameContainer: { alignItems: 'center', justifyContent: 'center', flex: 1 },
    scannerFrame: { width: width * 0.65, height: width * 0.65, position: 'relative' },
    corner: { position: 'absolute', width: 40, height: 40, borderColor: '#14b8a6' },
    topLeft: { top: 0, left: 0, borderTopWidth: 4, borderLeftWidth: 4, borderTopLeftRadius: 16 },
    topRight: { top: 0, right: 0, borderTopWidth: 4, borderRightWidth: 4, borderTopRightRadius: 16 },
    bottomLeft: { bottom: 0, left: 0, borderBottomWidth: 4, borderLeftWidth: 4, borderBottomLeftRadius: 16 },
    bottomRight: { bottom: 0, right: 0, borderBottomWidth: 4, borderRightWidth: 4, borderBottomRightRadius: 16 },
    instructionText: { color: '#fff', fontSize: 16, marginTop: 40, fontWeight: '500' },
    footer: { padding: 30, alignItems: 'center', minHeight: 100 },
    button: { paddingHorizontal: 24, paddingVertical: 14, borderRadius: 12 },
    buttonText: { color: '#fff', fontSize: 16, fontWeight: '700' }
});