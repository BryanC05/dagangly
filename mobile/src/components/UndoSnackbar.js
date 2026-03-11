import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../store/themeStore';

export default function UndoSnackbar({ 
    visible, 
    message, 
    actionLabel = 'Undo', 
    onUndo, 
    onDismiss,
    duration = 4000,
    style 
}) {
    const { colors } = useThemeStore();
    const translateY = useRef(new Animated.Value(100)).current;
    const opacity = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        if (visible) {
            Animated.parallel([
                Animated.timing(translateY, {
                    toValue: 0,
                    duration: 300,
                    useNativeDriver: true,
                }),
                Animated.timing(opacity, {
                    toValue: 1,
                    duration: 300,
                    useNativeDriver: true,
                }),
            ]).start();

            const timer = setTimeout(() => {
                handleDismiss();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [visible]);

    const handleDismiss = () => {
        Animated.parallel([
            Animated.timing(translateY, {
                toValue: 100,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.timing(opacity, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }),
        ]).start(() => {
            onDismiss?.();
        });
    };

    if (!visible) return null;

    return (
        <Animated.View 
            style={[
                styles.container, 
                { backgroundColor: colors.card, borderColor: colors.border },
                { transform: [{ translateY }], opacity },
                style
            ]}
        >
            <View style={styles.content}>
                <Ionicons name="checkmark-circle" size={20} color={colors.success} />
                <Text style={[styles.message, { color: colors.text }]} numberOfLines={2}>
                    {message}
                </Text>
            </View>
            <View style={styles.actions}>
                {onUndo && (
                    <TouchableOpacity 
                        style={[styles.undoBtn, { backgroundColor: colors.primary + '15' }]}
                        onPress={() => {
                            onUndo();
                            handleDismiss();
                        }}
                    >
                        <Text style={[styles.undoText, { color: colors.primary }]}>{actionLabel}</Text>
                    </TouchableOpacity>
                )}
                <TouchableOpacity onPress={handleDismiss} style={styles.closeBtn}>
                    <Ionicons name="close" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
            </View>
        </Animated.View>
    );
}

const styles = StyleSheet.create({
    container: {
        position: 'absolute',
        bottom: 100,
        left: 16,
        right: 16,
        borderRadius: 12,
        padding: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.15,
        shadowRadius: 8,
        elevation: 6,
    },
    content: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    message: {
        flex: 1,
        fontSize: 14,
        fontWeight: '500',
    },
    actions: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    undoBtn: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
    },
    undoText: {
        fontSize: 13,
        fontWeight: '600',
    },
    closeBtn: {
        padding: 4,
    },
});
