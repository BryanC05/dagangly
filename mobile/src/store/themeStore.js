import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

export const lightColors = {
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
    tabBorder: '#dbe0e6',
    success: '#10b981',
    successLight: '#ecfdf5',
    danger: '#ef4444',
    dangerLight: '#fef2f2',
    warning: '#f59e0b',
    warningLight: '#fffbeb',
    white: '#ffffff',
    placeholder: '#94a3b8',
    shadow: 'rgba(0, 0, 0, 0.08)',
    surface: '#f1f5f9',
    glow: 'rgba(20, 184, 166, 0.3)',
};

export const darkColors = {
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
    tabBorder: '#242c38',
    success: '#34d399',
    successLight: '#064e3b',
    danger: '#f87171',
    dangerLight: '#450a0a',
    warning: '#fbbf24',
    warningLight: '#451a03',
    white: '#ffffff',
    placeholder: '#64748b',
    shadow: 'rgba(0, 0, 0, 0.4)',
    surface: '#1c2128',
    glow: 'rgba(20, 184, 166, 0.3)',
};

export const useThemeStore = create((set, get) => ({
    isDarkMode: false,
    colors: lightColors,
    isReady: false,

    initTheme: async () => {
        try {
            const savedTheme = await AsyncStorage.getItem('theme');
            if (savedTheme === 'dark') {
                set({ isDarkMode: true, colors: darkColors, isReady: true });
            } else if (savedTheme === 'light') {
                set({ isDarkMode: false, colors: lightColors, isReady: true });
            } else if (savedTheme === null) {
                const systemScheme = Appearance.getColorScheme();
                if (systemScheme === 'dark') {
                    set({ isDarkMode: true, colors: darkColors, isReady: true });
                    await AsyncStorage.setItem('theme', 'dark');
                } else {
                    set({ isDarkMode: false, colors: lightColors, isReady: true });
                }
            } else {
                set({ isDarkMode: false, colors: lightColors, isReady: true });
            }
        } catch (error) {
            console.error('Failed to load theme:', error);
            set({ isDarkMode: false, colors: lightColors, isReady: true });
        }
    },

    toggleTheme: async () => {
        const newDarkMode = !get().isDarkMode;
        try {
            await AsyncStorage.setItem('theme', newDarkMode ? 'dark' : 'light');
        } catch (error) {
            console.error('Failed to save theme:', error);
        }

        set({ isDarkMode: newDarkMode, colors: newDarkMode ? darkColors : lightColors });
    },
}));
