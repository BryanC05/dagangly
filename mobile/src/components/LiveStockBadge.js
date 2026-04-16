import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';

export default function LiveStockBadge({ stock = 0, lowStockThreshold = 10, showOnlyIfLow = false, style }) {
    const { colors } = useThemeStore();
    const [animate, setAnimate] = useState(false);
    
    const isLowStock = stock <= lowStockThreshold;
    const isCriticalStock = stock <= 3;
    const isOutOfStock = stock <= 0;
    
    useEffect(() => {
        if (isLowStock && !isOutOfStock) {
            const pulse = setInterval(() => {
                setAnimate(prev => !prev);
            }, 1000);
            return () => clearInterval(pulse);
        }
    }, [isLowStock]);
    
    if (showOnlyIfLow && !isLowStock) return null;
    if (isOutOfStock) {
        return (
            <View style={[styles.container, { backgroundColor: '#fee2e2' }]}>
                <Ionicons name="close-circle" size={12} color="#dc2626" />
                <Text style={[styles.text, { color: '#dc2626' }]}>Habis</Text>
            </View>
        );
    }
    
    if (!isLowStock) return null;
    
    return (
        <View style={[
            styles.container,
            { backgroundColor: isCriticalStock ? '#fee2e2' : '#fef3c7' },
            animate && styles.pulse,
            style
        ]}>
            <Ionicons 
                name={isCriticalStock ? "warning" : "cube"} 
                size={10} 
                color={isCriticalStock ? "#dc2626" : "#d97706"} 
            />
            <Text style={[
                styles.text, 
                { color: isCriticalStock ? "#dc2626" : "#d97706" }
            ]}>
                {isCriticalStock ? `Hanya ${stock}!` : `${stock} tersisa`}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 10,
    },
    text: {
        fontSize: 10,
        fontWeight: '700',
    },
    pulse: {
        transform: [{ scale: 1.05 }],
    },
});