import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import en from '../i18n/en';
import id from '../i18n/id';

const translations = { en, id };

const getNestedValue = (obj, path) => {
    const keys = path.split('.');
    let result = obj;
    for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
            result = result[key];
        } else {
            return path;
        }
    }
    return result;
};

const createT = (translations) => (key) => getNestedValue(translations, key);

export const useLanguageStore = create((set, get) => ({
    language: 'id',
    t: createT(id),
    languageVersion: 0,

    initLanguage: async () => {
        try {
            const saved = await AsyncStorage.getItem('language');
            if (saved && translations[saved]) {
                set({ language: saved, t: createT(translations[saved]), languageVersion: get().languageVersion + 1 });
            } else {
                // Also load translations to have all keys
                set({ language: saved || 'id', t: createT(translations[saved || 'id']), languageVersion: 1 });
            }
        } catch (error) {
            console.error('Failed to load language:', error);
            // Fallback to default language
            set({ language: 'id', t: createT(id), languageVersion: 1 });
        }
    },

    toggleLanguage: async () => {
        const currentLang = get().language;
        const newLang = currentLang === 'en' ? 'id' : 'en';
        try {
            await AsyncStorage.setItem('language', newLang);
        } catch (error) {
            console.error('Failed to save language:', error);
        }
        set({ language: newLang, t: createT(translations[newLang]), languageVersion: get().languageVersion + 1 });
    },

    setLanguage: async (lang) => {
        if (!translations[lang]) return;
        try {
            await AsyncStorage.setItem('language', lang);
        } catch (error) {
            console.error('Failed to save language:', error);
        }
        set({ language: lang, t: createT(translations[lang]), languageVersion: get().languageVersion + 1 });
    },
}));
