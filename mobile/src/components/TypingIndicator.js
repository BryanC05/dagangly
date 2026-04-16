import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { useTranslation } from '../hooks/useTranslation';

export default function TypingIndicator({ isTyping = false, userName = '', autoHide = true, hideDelay = 3000 }) {
    const { colors } = useThemeStore();
    const { language } = useTranslation();
    const [visible, setVisible] = useState(isTyping);
    const [dots, setDots] = useState(0);
    const isId = language === 'id';
    
    useEffect(() => {
        setVisible(isTyping);
    }, [isTyping]);
    
    useEffect(() => {
        if (!visible || !autoHide) return;
        
        const interval = setInterval(() => {
            setDots(prev => (prev + 1) % 4);
        }, 300);
        
        const timeout = setTimeout(() => {
            setVisible(false);
            setDots(0);
        }, hideDelay);
        
        return () => {
            clearInterval(interval);
            clearTimeout(timeout);
        };
    }, [visible]);
    
    if (!visible) return null;
    
    const getDotAnimation = () => {
        return Array(3).fill(0).map((_, i) => {
            const isActive = i < dots;
            return (
                <View 
                    key={i} 
                    style={[
                        styles.dot, 
                        { backgroundColor: isActive ? colors?.primary : colors?.textSecondary }
                    ]} 
                />
            );
        });
    };
    
    return (
        <View style={[styles.container, { backgroundColor: colors?.card }]}>
            <View style={styles.bubble}>
                <View style={styles.dots}>
                    {getDotAnimation()}
                </View>
            </View>
            <Text style={[styles.text, { color: colors?.textSecondary }]}>
                {userName ? `${userName} ` : ''}{isId ? 'mengetik...' : 'typing...'}
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingVertical: 4,
    },
    bubble: {
        width: 30,
        height: 24,
        justifyContent: 'center',
        alignItems: 'center',
    },
    dots: {
        flexDirection: 'row',
        gap: 3,
    },
    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
    },
    text: {
        fontSize: 12,
        fontStyle: 'italic',
    },
});