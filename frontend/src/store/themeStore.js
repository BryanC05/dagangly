import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useThemeStore = create(
    persist(
        (set) => ({
            theme: 'light',
            toggleTheme: () => set((state) => {
                const newTheme = state.theme === 'light' ? 'dark' : 'light';
                // Apply dark class to html element for Tailwind CSS
                if (newTheme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
                return { theme: newTheme };
            }),
            setTheme: (theme) => {
                if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
                set({ theme });
            },
            initializeTheme: () => {
                const storedTheme = localStorage.getItem('theme-storage');
                let theme = 'light';
                if (storedTheme) {
                    try {
                        theme = JSON.parse(storedTheme).state.theme;
                    } catch (e) {
                        console.error("Failed to parse stored theme", e);
                    }
                } else if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
                    // Default to system preference if no storage
                    theme = 'dark';
                }
                // Apply dark class
                if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                } else {
                    document.documentElement.classList.remove('dark');
                }
                set({ theme });
            }
        }),
        {
            name: 'theme-storage',
        }
    )
);
