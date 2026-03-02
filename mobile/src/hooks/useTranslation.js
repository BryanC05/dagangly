import { useLanguageStore } from '../store/languageStore';
import en from '../i18n/en';
import id from '../i18n/id';

const translations = { en, id };

export const useTranslation = () => {
    const language = useLanguageStore((s) => s.language) || 'id';

    const t = (key) => {
        try {
            const keys = key.split('.');
            let value = translations[language];

            for (const k of keys) {
                if (value && typeof value === 'object') {
                    value = value[k];
                } else {
                    return key;
                }
            }

            return value || key;
        } catch (error) {
            return key;
        }
    };

    return { t, language };
};
