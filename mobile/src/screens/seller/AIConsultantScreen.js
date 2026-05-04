import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../../theme/ThemeContext';
import api from '../../api/api';

export default function AIConsultantScreen({ route, navigation }) {
  const { period = '30' } = route.params || {};
  const { colors, isDarkMode } = useThemeStore();
  const [query, setQuery] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const scrollViewRef = useRef();

  const [analyticsContext, setAnalyticsContext] = useState(null);
  const [fetchingContext, setFetchingContext] = useState(true);

  useEffect(() => {
    fetchContext();
  }, [period]);

  const fetchContext = async () => {
    try {
      const res = await api.get(`/analytics/seller?period=${period}`);
      setAnalyticsContext(res.data);
    } catch (err) {
      console.error('Failed to fetch analytics for AI context:', err);
    } finally {
      setFetchingContext(false);
    }
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    const lines = text.split('\n');
    return lines.map((line, idx) => {
      if (line.trim().startsWith('- ') || line.trim().startsWith('• ')) {
        return (
          <Text key={idx} style={{ flexDirection: 'row', marginVertical: 2 }}>
            <Text style={{ color: colors.primary }}>• </Text>
            <Text style={{ color: colors.text }}>{line.trim().substring(2)}</Text>
          </Text>
        );
      }
      const match = line.match(/^(\d+)\.\s/);
      if (match) {
        return (
          <Text key={idx} style={{ flexDirection: 'row', marginVertical: 2 }}>
            <Text style={{ color: colors.primary }}>{match[1]}. </Text>
            <Text style={{ color: colors.text }}>{line.substring(match[0].length)}</Text>
          </Text>
        );
      }
      const parts = line.split(/(\*\*[^*]+\*\*)/g);
      return (
        <Text key={idx} style={{ color: colors.text }}>
          {parts.map((part, i) => {
            if (part.startsWith('**') && part.endsWith('**')) {
              return <Text key={i} style={{ fontWeight: '700' }}>{part.slice(2, -2)}</Text>;
            }
            return part;
          })}
        </Text>
      );
    });
  };

  const handleSend = async () => {
    if (!query.trim()) return;

    const userMessage = { role: 'user', content: query };
    setChatHistory((prev) => [...prev, userMessage]);
    setQuery('');
    setLoading(true);

    try {
      const res = await api.post('/ai/financial-consultant', {
        query: userMessage.content,
        analytics: {
            period,
            ...analyticsContext
        },
      });

      setChatHistory((prev) => [...prev, { role: 'ai', content: res.data.response }]);
    } catch (error) {
      console.error('AI Error:', error);
      setChatHistory((prev) => [
        ...prev,
        { role: 'ai', content: 'Sorry, I encountered an error analyzing your data. Please try again.' },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      {/* Header */}
      <View style={[styles.header, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={colors.text} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Ionicons name="sparkles" size={20} color={colors.primary} style={styles.headerIcon} />
          <Text style={[styles.headerTitle, { color: colors.text }]}>AI Business Analyst</Text>
        </View>
        <View style={styles.backButton} />
      </View>

      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollViewRef.current?.scrollToEnd({ animated: true })}
      >
        {chatHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="stats-chart" size={48} color={colors.primary} style={{ opacity: 0.5, marginBottom: 16 }} />
            <Text style={[styles.emptyText, { color: colors.text }]}>
              I am your AI Financial Consultant.
            </Text>
            <Text style={[styles.emptySubtext, { color: colors.textSecondary }]}>
              Ask me about your sales, margins, or how to improve your store's performance.
            </Text>
            
            <View style={styles.suggestionsContainer}>
               <TouchableOpacity 
                  style={[styles.suggestionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setQuery("What was my most profitable product this month?")}
                >
                   <Text style={[styles.suggestionText, { color: colors.primary }]}>What was my most profitable product this month?</Text>
               </TouchableOpacity>
               <TouchableOpacity 
                  style={[styles.suggestionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => setQuery("How can I increase my sales based on current trends?")}
                >
                   <Text style={[styles.suggestionText, { color: colors.primary }]}>How can I increase my sales based on current trends?</Text>
               </TouchableOpacity>
            </View>
          </View>
        ) : (
          chatHistory.map((msg, index) => (
            <View
              key={index}
              style={[
                styles.messageBubble,
                msg.role === 'user'
                  ? [styles.userMessage, { backgroundColor: colors.primary }]
                  : [styles.aiMessage, { backgroundColor: colors.card, borderColor: colors.border }],
              ]}
            >
              {msg.role === 'ai' && (
                  <Ionicons name="sparkles" size={14} color={colors.primary} style={{ marginRight: 6, marginTop: 2 }} />
              )}
              {msg.role === 'user' ? (
                <Text
                  style={[
                    styles.messageText,
                    { color: '#fff' },
                  ]}
                >
                  {msg.content}
                </Text>
              ) : (
                <View style={{ flex: 1 }}>
                  {renderMarkdown(msg.content)}
                </View>
              )}
            </View>
          ))
        )}

        {loading && (
          <View style={[styles.messageBubble, styles.aiMessage, { backgroundColor: colors.card, borderColor: colors.border, alignSelf: 'flex-start' }]}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        )}
      </ScrollView>

      {/* Input Area */}
      <View style={[styles.inputContainer, { backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TextInput
          style={[
            styles.input,
            { backgroundColor: colors.background, color: colors.text, borderColor: colors.border },
          ]}
          placeholder="Ask me anything..."
          placeholderTextColor={colors.textSecondary}
          value={query}
          onChangeText={setQuery}
          multiline
          maxLength={500}
        />
        <TouchableOpacity
          style={[styles.sendButton, { backgroundColor: query.trim() ? colors.primary : colors.border }]}
          onPress={handleSend}
          disabled={!query.trim() || loading || fetchingContext}
        >
          <Ionicons name="send" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Platform.OS === 'ios' ? 50 : 20,
    paddingBottom: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
  },
  backButton: {
    width: 40,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerIcon: {
    marginRight: 6,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  chatContainer: {
    flex: 1,
  },
  chatContent: {
    padding: 16,
    paddingBottom: 32,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    padding: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 32,
  },
  suggestionsContainer: {
    width: '100%',
    gap: 12,
  },
  suggestionBtn: {
      padding: 12,
      borderRadius: 12,
      borderWidth: 1,
      alignItems: 'center',
  },
  suggestionText: {
      fontSize: 14,
      fontWeight: '500',
      textAlign: 'center',
  },
  messageBubble: {
    maxWidth: '85%',
    padding: 12,
    borderRadius: 16,
    marginBottom: 12,
    flexDirection: 'row',
  },
  userMessage: {
    alignSelf: 'flex-end',
    borderBottomRightRadius: 4,
  },
  aiMessage: {
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
  },
  messageText: {
    fontSize: 15,
    lineHeight: 22,
    flexShrink: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    borderTopWidth: 1,
    alignItems: 'flex-end',
  },
  input: {
    flex: 1,
    minHeight: 40,
    maxHeight: 120,
    borderRadius: 20,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 10,
    marginRight: 10,
    fontSize: 15,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
