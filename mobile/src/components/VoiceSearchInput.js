import React, { useState } from 'react';
import {
  View,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeStore } from '../theme/ThemeContext';

const VoiceSearchInput = ({ onSearch, placeholder = 'Search...' }) => {
  const { colors } = useThemeStore();
  const [isListening, setIsListening] = useState(false);
  const [query, setQuery] = useState('');

  const startListening = () => {
    if (Platform.OS !== 'web' && window && window.SpeechRecognition) {
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = 'id-ID';

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const transcript = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalTranscript += transcript;
          } else {
            interimTranscript += transcript;
          }
        }

        if (finalTranscript) {
          setQuery(finalTranscript);
          onSearch(finalTranscript);
        } else {
          setQuery(interimTranscript);
        }
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } else {
      console.log('Speech recognition not supported on this platform');
    }
  };

  const stopListening = () => {
    setIsListening(false);
  };

  const handleSubmit = () => {
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery('');
    onSearch('');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.input, borderRadius: 8 }]}>
      <Ionicons name="search" size={20} color={colors.textSecondary} />
      <TextInput
        style={[styles.input, { color: colors.text }]}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        value={query}
        onChangeText={setQuery}
        onSubmitEditing={handleSubmit}
        returnKeyType="search"
      />
      {query.length > 0 && (
        <TouchableOpacity onPress={handleClear}>
          <Ionicons name="close-circle" size={20} color={colors.textSecondary} />
        </TouchableOpacity>
      )}
      <TouchableOpacity
        onPress={isListening ? stopListening : startListening}
        style={styles.micButton}
      >
        <Ionicons
          name={isListening ? 'mic' : 'mic-outline'}
          size={20}
          color={isListening ? '#ef4444' : colors.textSecondary}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    fontSize: 16,
    padding: 0,
  },
  micButton: {
    padding: 4,
  },
});

export default VoiceSearchInput;
