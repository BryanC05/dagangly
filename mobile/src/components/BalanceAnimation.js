import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useThemeStore } from '../store/themeStore';
import { useTranslation } from '../hooks/useTranslation';

export default function BalanceAnimation({ 
    amount = 0, 
    previousAmount = null,
    animated = true,
    showSign = false,
    prefix = 'Rp'
}) {
    const { colors } = useThemeStore();
    const { language } = useTranslation();
    const [displayAmount, setDisplayAmount] = useState(amount);
    const [isAnimating, setIsAnimating] = useState(false);
    const scaleAnim = useRef(new Animated.Value(1)).current;
    const isId = language === 'id';
    
    const formatNumber = (num) => {
        return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };
    
    useEffect(() => {
        if (!animated || previousAmount === null || previousAmount === amount) {
            setDisplayAmount(amount);
            return;
        }
        
        setIsAnimating(true);
        
        const startValue = previousAmount;
        const endValue = amount;
        const duration = 800;
        const steps = 20;
        const stepDuration = duration / steps;
        const stepValue = (endValue - startValue) / steps;
        
        Animated.sequence([
            Animated.timing(scaleAnim, {
                toValue: 1.1,
                duration: 200,
                useNativeDriver: true,
            }),
            Animated.loop(
                Animated.sequence([
                    Animated.timing(scaleAnim, {
                        toValue: 1,
                        duration: stepDuration,
                        useNativeDriver: true,
                    }),
                ])
            ),
        ]).start();
        
        let currentStep = 0;
        const interval = setInterval(() => {
            currentStep++;
            const newValue = startValue + (stepValue * currentStep);
            setDisplayAmount(Math.round(newValue));
            
            if (currentStep >= steps) {
                clearInterval(interval);
                setDisplayAmount(endValue);
                setIsAnimating(false);
                Animated.timing(scaleAnim, {
                    toValue: 1,
                    duration: 200,
                    useNativeDriver: true,
                }).start();
            }
        }, stepDuration);
        
        return () => {
            clearInterval(interval);
            scaleAnim.setValue(1);
        };
    }, [amount, previousAmount]);
    
    const formatWithSign = (value) => {
        if (!showSign) return `${prefix} ${formatNumber(value)}`;
        const sign = value >= 0 ? '+' : '';
        return `${sign}${prefix} ${formatNumber(Math.abs(value))}`;
    };
    
    return (
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
            <Text 
                style={[
                    styles.balance, 
                    { 
                        color: showSign 
                            ? (amount >= 0 ? '#22c55e' : '#ef4444') 
                            : colors?.text 
                    },
                    isAnimating && styles.animating
                ]}
            >
                {formatWithSign(displayAmount)}
            </Text>
        </Animated.View>
    );
}

export function WalletBalanceCard({ balance, pendingBalance = 0, showPending = true }) {
    const { colors } = useThemeStore();
    const { language } = useTranslation();
    const isId = language === 'id';
    
    return (
        <View style={[styles.card, { backgroundColor: colors?.primary }]}>
            <Text style={styles.cardLabel}>
                {isId ? 'Saldo Dompet' : 'Wallet Balance'}
            </Text>
            <BalanceAnimation amount={balance} />
            
            {showPending && pendingBalance > 0 && (
                <View style={styles.pendingRow}>
                    <Text style={styles.pendingLabel}>
                        {isId ? 'Tertunda:' : 'Pending:'}
                    </Text>
                    <Text style={styles.pendingAmount}>
                        Rp {pendingBalance.toLocaleString('id-ID')}
                    </Text>
                </View>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    balance: {
        fontSize: 28,
        fontWeight: '800',
    },
    animating: {
        opacity: 0.8,
    },
    card: {
        padding: 16,
        borderRadius: 16,
    },
    cardLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.8)',
        marginBottom: 4,
    },
    pendingRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 12,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.2)',
    },
    pendingLabel: {
        fontSize: 12,
        color: 'rgba(255,255,255,0.7)',
    },
    pendingAmount: {
        fontSize: 14,
        fontWeight: '600',
        color: '#fff',
    },
});