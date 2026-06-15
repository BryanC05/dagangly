import React, { useEffect } from 'react';
import { StatusBar, ActivityIndicator, View, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { useAuthStore } from './src/store/authStore';
import { useCartStore } from './src/store/cartStore';
import { useThemeStore, lightColors, darkColors } from './src/store/themeStore';
import { useLanguageStore } from './src/store/languageStore';
import { useDriverStore } from './src/store/driverStore';
import { ThemeProvider } from './src/theme/ThemeContext';
import { NetworkProvider } from './src/context/NetworkContext';
import AuthNavigator from './src/navigation/AuthNavigator';
import AppNavigator from './src/navigation/AppNavigator';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginScreen from './src/screens/auth/LoginScreen';
import RegisterScreen from './src/screens/auth/RegisterScreen';

const RootStack = createNativeStackNavigator();
import notificationService from './src/services/NotificationService';
import { apiService } from './src/services/apiService';
import { localDatabase } from './src/store/localDatabase';
import { initializeMockData } from './src/data/mockApi';

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

  // Always fallback to lightColors if colors is somehow undefined
  const safeColors = colors || lightColors;

  useEffect(() => {
    const init = async () => {
      initializeAuth();
      loadCart();
      initTheme();
      initLanguage();
      initDriverMode();

      try {
        await localDatabase.initialize();
        await apiService.initialize();
        console.log('[App] Offline services initialized');
      } catch (e) {
        console.log('[App] Offline services error:', e);
      }
      
      try {
        await notificationService.initialize();
      } catch (e) {
        console.log('Notifications not available');
      }
      
      setTimeout(() => {
        useThemeStore.getState().isReady || useThemeStore.setState({ isReady: true });
      }, 3000);
    };
    init();
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
      <View style={[styles.loading, { backgroundColor: lightColors.background }]}>
        <ActivityIndicator size="large" color="#14b8a6" />
      </View>
    );
  }

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: safeColors.background }}>
      <SafeAreaProvider style={{ backgroundColor: safeColors.background }}>
        <ThemeProvider>
          <NetworkProvider>
            <NavigationContainer theme={navigationTheme}>
              <StatusBar
                barStyle={isDarkMode ? 'light-content' : 'dark-content'}
                backgroundColor={safeColors.card}
              />
              <RootStack.Navigator screenOptions={{ headerShown: false }}>
                <RootStack.Screen name="MainTabs" component={AppNavigator} />
                <RootStack.Screen name="Login" component={LoginScreen} />
                <RootStack.Screen name="Register" component={RegisterScreen} />
              </RootStack.Navigator>
            </NavigationContainer>
          </NetworkProvider>
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
