import React, { useEffect } from 'react';
import { StatusBar, ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from './src/store/authStore';
import { useCartStore } from './src/store/cartStore';
import { useThemeStore } from './src/store/themeStore';
import { useLanguageStore } from './src/store/languageStore';
import { useDriverStore } from './src/store/driverStore';
import { ThemeProvider } from './src/theme/ThemeContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import AppNavigator from './src/navigation/AppNavigator';
import notificationService from './src/services/NotificationService';

const lightColorsHex = {
  background: '#f0f3f8',
  card: '#ffffff',
  text: '#1a1f2e',
  textSecondary: '#64748b',
  textTertiary: '#94a3b8',
  border: '#dbe0e6',
  primary: '#14b8a6',
  primaryLight: '#ccfbf1',
  primaryDark: '#0f766e',
  input: '#f1f5f9',
  tabBar: '#ffffff',
  success: '#10b981',
  successLight: '#ecfdf5',
  danger: '#ef4444',
  dangerLight: '#fef2f2',
  warning: '#f59e0b',
  warningLight: '#fffbeb',
  placeholder: '#94a3b8',
  surface: '#f1f5f9',
  glow: 'rgba(20, 184, 166, 0.3)',
};

const darkColorsHex = {
  background: '#0d1117',
  card: '#161b22',
  text: '#e6eaef',
  textSecondary: '#94a3b8',
  textTertiary: '#64748b',
  border: '#242c38',
  primary: '#14b8a6',
  primaryLight: '#134e4a',
  primaryDark: '#14b8a6',
  input: '#1c2128',
  tabBar: '#161b22',
  success: '#34d399',
  successLight: '#064e3b',
  danger: '#f87171',
  dangerLight: '#450a0a',
  warning: '#fbbf24',
  warningLight: '#451a03',
  placeholder: '#64748b',
  surface: '#1c2128',
  glow: 'rgba(20, 184, 166, 0.3)',
};

export default function App() {
  const { isAuthenticated, isLoading, initializeAuth } = useAuthStore();
  const loadCart = useCartStore((s) => s.loadCart);
  const themeStore = useThemeStore();
  const isDarkMode = themeStore.isDarkMode;
  const colors = themeStore.colors;
  const isThemeReady = themeStore.isReady;
  const initTheme = themeStore.initTheme;
  const initLanguage = useLanguageStore((s) => s.initLanguage);
  const initDriverMode = useDriverStore((s) => s.initDriverMode);

  const safeColors = colors || (isDarkMode ? darkColorsHex : lightColorsHex);

  useEffect(() => {
    initializeAuth();
    loadCart();
    initTheme();
    initLanguage();
    initDriverMode();
    notificationService.initialize().catch(() => {});
  }, []);

  const navigationTheme = {
    dark: isDarkMode,
    colors: {
      primary: '#14b8a6',
      background: safeColors.background,
      card: safeColors.card,
      text: safeColors.text,
      border: safeColors.border,
      notification: '#14b8a6',
    },
    fonts: {
      regular: { fontFamily: 'System', fontWeight: '400' },
      medium: { fontFamily: 'System', fontWeight: '500' },
      bold: { fontFamily: 'System', fontWeight: '700' },
      heavy: { fontFamily: 'System', fontWeight: '800' },
    },
  };

  if (isLoading || !isThemeReady) {
    return (
      <View style={[styles.loading, { backgroundColor: lightColorsHex.background }]}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: safeColors.background }}>
      <SafeAreaProvider style={{ backgroundColor: safeColors.background }}>
        <ThemeProvider>
          <NavigationContainer theme={navigationTheme}>
            <StatusBar
              barStyle={isDarkMode ? 'light-content' : 'dark-content'}
              backgroundColor={safeColors.card}
            />
            {isAuthenticated ? <AppNavigator /> : <AuthNavigator />}
          </NavigationContainer>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
