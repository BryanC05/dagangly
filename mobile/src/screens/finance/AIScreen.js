import React, { useState, useEffect, useRef } from 'react';
import {
    View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, ActivityIndicator, KeyboardAvoidingView, Platform, Alert
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../store/themeStore';
import { useTranslation } from '../../hooks/useTranslation';
import { useAuthStore } from '../../store/authStore';
import api from '../../api/api';

const QUICK_QUESTIONS = [
    'Berapa keuntungan bersih produk saya?',
    'Produk mana yang paling menguntungkan?',
    'Bagaimana cara meningkatkan profit?',
    'Apakah ada produk merugi?',
];

export default function FinanceAIScreen({ navigation }) {
    const { colors } = useThemeStore();
    const { t, language } = useTranslation();
    const { user } = useAuthStore();
    const [messages, setMessages] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [analytics, setAnalytics] = useState(null);
    const [productCalcs, setProductCalcs] = useState([]);
    const scrollRef = useRef(null);

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            const chatRes = await api.get('/ai/finance-chats');
            if (chatRes.data.chats?.length > 0) {
                setMessages(chatRes.data.chats.map(c => ({ role: c.role, content: c.content })));
            }
        } catch (e) {
            console.log('No saved chats');
        }

        // Only get analytics, not all products (to avoid token limit)
        try {
            const sellerAnalyticsRes = await api.get('/analytics/seller').catch(() => ({ data: {} }));

            if (sellerAnalyticsRes.data.totalRevenue) {
                setAnalytics({
                    totalRevenue: sellerAnalyticsRes.data.totalRevenue,
                    orderCount: sellerAnalyticsRes.data.orderCount,
                    recentDays: sellerAnalyticsRes.data.revenueByDay ?
                        Object.entries(sellerAnalyticsRes.data.revenueByDay).map(([date, revenue]) => ({ date, revenue })) : []
                });
            }
        } catch (error) {
            console.log('Error loading data:', error);
        }
    };

    const handleSendMessage = async () => {
        if (!input.trim() || loading) return;

        const userMsg = input.trim();
        setInput('');
        setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
        setLoading(true);

        setTimeout(() => {
            scrollRef.current?.scrollToEnd({ animated: true });
        }, 200);

        try {
            console.log('[AI] Sending request to /ai/financial-consultant');
            const response = await api.post('/ai/financial-consultant', {
                query: userMsg,
                analytics: analytics,
                productCalculations: []
            });

            console.log('[AI] Response:', response.data);
            const aiResponse = response.data.response || 'Tidak ada respons dari AI';
            setMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
        } catch (error) {
            console.error('[AI] Request failed:', error.response || error);
            let errorMessage = 'Maaf, saya sedang mengalami kesulitan. Coba lagi nanti.';

            if (!error.response) {
                errorMessage = 'Tidak dapat terhubung ke server. Pastikan backend berjalan.';
            } else if (error.response?.status === 401) {
                errorMessage = 'Silakan login terlebih dahulu.';
            } else if (error.response?.status === 404) {
                errorMessage = 'Endpoint tidak ditemukan. Pastikan backend berjalan dan endpoint tersedia.';
            } else if (error.response?.status >= 500) {
                errorMessage = 'Server error. Coba beberapa saat lagi.';
            }

            setMessages(prev => [...prev, { role: 'assistant', content: errorMessage }]);
        } finally {
            setLoading(false);
            setTimeout(() => {
                scrollRef.current?.scrollToEnd({ animated: true });
            }, 200);
        }
    };

    const handleClearChats = () => {
        Alert.alert(
            language === 'id' ? 'Hapus Chat?' : 'Clear Chats?',
            language === 'id' ? 'Apakah Anda yakin ingin menghapus semua chat?' : 'Are you sure you want to clear all chats?',
            [
                { text: language === 'id' ? 'Batal' : 'Cancel', style: 'cancel' },
                {
                    text: language === 'id' ? 'Hapus' : 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        try {
                            await api.delete('/ai/finance-chats');
                            setMessages([]);
                        } catch (error) {
                            console.error('Failed to clear chats:', error);
                        }
                    }
                }
            ]
        );
    };

    const formatCurrency = (amount) => {
        return 'Rp ' + (amount || 0).toLocaleString('id-ID');
    };

    // Simple markdown-like renderer
    const renderMarkdown = (text) => {
        if (!text) return null;
        
        const lines = text.split('\n');
        return lines.map((line, idx) => {
            // Bullet points
            if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
                return (
                    <Text key={idx} style={styles.bulletLine}>
                        <Text style={styles.bullet}>• </Text>
                        <Text style={[styles.messageText, { color: colors.text }]}>{line.trim().substring(2)}</Text>
                    </Text>
                );
            }
            // Numbered lists
            const match = line.match(/^(\d+)\.\s/);
            if (match) {
                return (
                    <Text key={idx} style={styles.numberedLine}>
                        <Text style={styles.numberedPrefix}>{match[1]}. </Text>
                        <Text style={[styles.messageText, { color: colors.text }]}>{line.substring(match[0].length)}</Text>
                    </Text>
                );
            }
            // Bold text (simple **text** handling)
            let content = line;
            const parts = content.split(/(\*\*[^*]+\*\*)/g);
            return (
                <Text key={idx} style={[styles.messageText, { color: colors.text }]}>
                    {parts.map((part, i) => {
                        if (part.startsWith('**') && part.endsWith('**')) {
                            return <Text key={i} style={[styles.boldText, { color: colors.text }]}>{part.slice(2, -2)}</Text>;
                        }
                        return part;
                    })}
                </Text>
            );
        });
    };

    const renderQuickQuestions = () => (
        <View style={styles.welcomeContainer}>
            <View style={[styles.iconContainer, { backgroundColor: colors.primaryLight }]}>
                <Ionicons name="chatbubbles" size={36} color={colors.primary} />
            </View>
            <Text style={[styles.welcomeTitle, { color: colors.text }]}>
                {language === 'id' ? 'Asisten Keuangan AI' : 'AI Finance Assistant'}
            </Text>
            <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
                {language === 'id' ? 'Tanya tentang profit dan bisnis Anda' : 'Ask about your profit and business'}
            </Text>

            {analytics && (
                <View style={[styles.dataCard, { backgroundColor: colors.card }]}>
                    <Text style={[styles.dataLabel, { color: colors.textSecondary }]}>
                        {language === 'id' ? 'Data Bisnis Anda:' : 'Your Business Data:'}
                    </Text>
                    <View style={styles.dataRow}>
                        <Text style={{ color: colors.textSecondary }}>{language === 'id' ? 'Total Penjualan' : 'Total Sales'}:</Text>
                        <Text style={{ color: colors.success, fontWeight: '600' }}>{formatCurrency(analytics.totalRevenue)}</Text>
                    </View>
                    <View style={styles.dataRow}>
                        <Text style={{ color: colors.textSecondary }}>{language === 'id' ? 'Pesanan' : 'Orders'}:</Text>
                        <Text style={{ color: colors.primary, fontWeight: '600' }}>{analytics.orderCount || 0}</Text>
                    </View>
                </View>
            )}

            <Text style={[styles.quickLabel, { color: colors.text }]}>
                {language === 'id' ? 'Pertanyaan Cepat:' : 'Quick Questions:'}
            </Text>
            {QUICK_QUESTIONS.map((q, idx) => (
                <TouchableOpacity
                    key={idx}
                    style={[styles.quickButton, { backgroundColor: colors.primaryLight }]}
                    onPress={() => {
                        setInput(q);
                    }}
                >
                    <Text style={[styles.quickText, { color: colors.primary }]}>{q}</Text>
                </TouchableOpacity>
            ))}
        </View>
    );

    return (
        <View style={[styles.container, { backgroundColor: colors.background }]}>
            <View style={[styles.header, { backgroundColor: colors.card }]}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Ionicons name="chatbubbles" size={22} color={colors.primary} />
                    <Text style={[styles.headerTitle, { color: colors.text }]}>
                        {language === 'id' ? 'Konsultan AI' : 'AI Consultant'}
                    </Text>
                </View>
                {messages.length > 0 && (
                    <TouchableOpacity onPress={handleClearChats} style={styles.clearButton}>
                        <Ionicons name="trash-outline" size={20} color={colors.danger} />
                    </TouchableOpacity>
                )}
            </View>

            <ScrollView
                ref={scrollRef}
                style={styles.messageArea}
                contentContainerStyle={styles.messageContent}
                showsVerticalScrollIndicator={false}
            >
                {messages.length === 0 ? renderQuickQuestions() : (
                    <>
                        {messages.map((msg, idx) => (
                            <View
                                key={idx}
                                style={[
                                    styles.messageRow,
                                    msg.role === 'user' ? styles.userRow : styles.assistantRow
                                ]}
                            >
                                <View
                                    style={[
                                        styles.messageBubble,
                                        { backgroundColor: msg.role === 'user' ? colors.primary : colors.card }
                                    ]}
                                >
                                    {msg.role === 'user' ? (
                                        <Text style={[
                                            styles.messageText,
                                            { color: msg.role === 'user' ? colors.white : colors.text }
                                        ]}>
                                            {msg.content}
                                        </Text>
                                    ) : (
                                        <View style={styles.markdownContent}>
                                            {renderMarkdown(msg.content)}
                                        </View>
                                    )}
                                </View>
                            </View>
                        ))}
                        {loading && (
                            <View style={styles.loadingRow}>
                                <View style={[styles.messageBubble, { backgroundColor: colors.card }]}>
                                    <ActivityIndicator size="small" color={colors.primary} />
                                    <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                                        {language === 'id' ? 'Menjawab...' : 'Thinking...'}
                                    </Text>
                                </View>
                            </View>
                        )}
                    </>
                )}
            </ScrollView>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
                keyboardVerticalOffset={90}
            >
                <View style={[styles.inputArea, { backgroundColor: colors.card }]}>
                    <TextInput
                        style={[styles.textInput, { backgroundColor: colors.input, color: colors.text, borderColor: colors.border }]}
                        placeholder={language === 'id' ? 'Ketik pertanyaan Anda...' : 'Type your question...'}
                        placeholderTextColor={colors.placeholder}
                        value={input}
                        onChangeText={setInput}
                        multiline
                        maxLength={1000}
                    />
                    <TouchableOpacity
                        style={[
                            styles.sendButton,
                            { backgroundColor: input.trim() && !loading ? colors.primary : colors.input }
                        ]}
                        onPress={handleSendMessage}
                        disabled={!input.trim() || loading}
                    >
                        <Ionicons
                            name="send"
                            size={18}
                            color={input.trim() && !loading ? colors.white : colors.placeholder}
                        />
                    </TouchableOpacity>
                </View>
            </KeyboardAvoidingView>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingVertical: 14,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(0,0,0,0.05)',
    },
    backButton: {
        padding: 4,
    },
    headerContent: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginLeft: 8,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '700',
    },
    clearButton: {
        padding: 8,
    },
    messageArea: {
        flex: 1,
    },
    messageContent: {
        paddingVertical: 16,
        paddingHorizontal: 12,
    },
    welcomeContainer: {
        alignItems: 'center',
        paddingHorizontal: 20,
        paddingTop: 20,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 16,
    },
    welcomeTitle: {
        fontSize: 22,
        fontWeight: '700',
        marginBottom: 8,
    },
    welcomeSubtitle: {
        fontSize: 14,
        marginBottom: 20,
        textAlign: 'center',
    },
    dataCard: {
        width: '100%',
        padding: 16,
        borderRadius: 12,
        marginBottom: 20,
    },
    dataLabel: {
        fontSize: 13,
        marginBottom: 8,
    },
    dataRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 4,
    },
    quickLabel: {
        fontSize: 15,
        fontWeight: '600',
        marginBottom: 12,
    },
    quickButton: {
        width: '100%',
        paddingVertical: 12,
        paddingHorizontal: 16,
        borderRadius: 10,
        marginBottom: 8,
    },
    quickText: {
        fontSize: 14,
    },
    messageRow: {
        marginBottom: 12,
        paddingHorizontal: 4,
    },
    userRow: {
        alignItems: 'flex-end',
    },
    assistantRow: {
        alignItems: 'flex-start',
    },
    messageBubble: {
        maxWidth: '85%',
        padding: 12,
        borderRadius: 16,
    },
    markdownContent: {
        flex: 1,
    },
    messageText: {
        fontSize: 14,
        lineHeight: 20,
    },
    boldText: {
        fontWeight: '700',
    },
    bulletLine: {
        flexDirection: 'row',
        marginVertical: 2,
    },
    bullet: {
        fontSize: 14,
        color: '#10b981',
        fontWeight: '600',
    },
    numberedLine: {
        flexDirection: 'row',
        marginVertical: 2,
    },
    numberedPrefix: {
        fontSize: 14,
        color: '#10b981',
        fontWeight: '600',
        marginRight: 4,
    },
    loadingRow: {
        alignItems: 'flex-start',
        marginBottom: 12,
    },
    loadingText: {
        marginLeft: 8,
        fontSize: 13,
    },
    inputArea: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 12,
        paddingBottom: 90,
        gap: 10,
    },
    textInput: {
        flex: 1,
        maxHeight: 100,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        fontSize: 14,
        borderWidth: 1,
    },
    sendButton: {
        width: 44,
        height: 44,
        borderRadius: 22,
        justifyContent: 'center',
        alignItems: 'center',
    },
});