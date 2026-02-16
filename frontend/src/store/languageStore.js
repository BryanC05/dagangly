import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useLanguageStore = create(
    persist(
        (set, get) => ({
            language: 'id', // 'en' or 'id'

            setLanguage: (language) => {
                document.documentElement.setAttribute('lang', language);
                set({ language });
            },

            toggleLanguage: () => {
                const newLang = get().language === 'en' ? 'id' : 'en';
                document.documentElement.setAttribute('lang', newLang);
                set({ language: newLang });
            },

            initializeLanguage: () => {
                const storedLang = localStorage.getItem('language-storage');
                let language = 'id';
                if (storedLang) {
                    try {
                        language = JSON.parse(storedLang).state.language;
                    } catch (e) {
                        console.error("Failed to parse stored language", e);
                    }
                }
                document.documentElement.setAttribute('lang', language);
                set({ language });
            }
        }),
        {
            name: 'language-storage',
        }
    )
);
