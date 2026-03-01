import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Appearance } from 'react-native';

const lightColors = {
    background: '#f3f5f7',
    card: '#ffffff',
    text: '#1e293b',
    textSecondary: '#64748b',
    textTertiary: '#94a3b8',
    border: '#e2e8f0',
    primary: '#06b6d4',
    primaryLight: '#ecfeff',
    primaryDark: '#0891b2',
    input: '#f1f5f9',
    tabBar: '#ffffff',
    tabBorder: '#e2e8f0',
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
    glow: 'rgba(6, 182, 212, 0.3)',
};

const darkColors = {
    background: '#0f172a',
    card: '#1e293b',
    text: '#e2e8f0',
    textSecondary: '#94a3b8',
    textTertiary: '#64748b',
    border: '#334155',
    primary: '#22d3ee',
    primaryLight: '#164e63',
    primaryDark: '#06b6d4',
    input: '#1e293b',
    tabBar: '#1e293b',
    tabBorder: '#334155',
    success: '#34d399',
    successLight: '#064e3b',
    danger: '#f87171',
    dangerLight: '#450a0a',
    warning: '#fbbf24',
    warningLight: '#451a03',
    white: '#1e293b',
    placeholder: '#64748b',
    shadow: 'rgba(0, 0, 0, 0.4)',
    surface: '#1e293b',
    glow: 'rgba(34, 211, 238, 0.3)',
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
                    set({ isReady: true });
                }
            } else {
                set({ isReady: true });
            }
        } catch (error) {
            console.error('Failed to load theme:', error);
            set({ isReady: true });
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
