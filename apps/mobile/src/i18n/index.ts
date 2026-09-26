import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import AsyncStorage from '@react-native-async-storage/async-storage';

import en from './locales/en.json';
import ta from './locales/ta.json';

const LANGUAGE_STORAGE_KEY = '@ZAHApp:language';

// Initialize i18n with Tamil and English support
i18n
  .use(initReactI18next)
  .init({
    compatibilityJSON: 'v3',
    resources: {
      en: { translation: en },
      ta: { translation: ta },
    },
    lng: 'ta', // Default to Tamil
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

// Load saved language preference
export const loadLanguagePreference = async () => {
  try {
    const savedLanguage = await AsyncStorage.getItem(LANGUAGE_STORAGE_KEY);
    if (savedLanguage && (savedLanguage === 'en' || savedLanguage === 'ta')) {
      await i18n.changeLanguage(savedLanguage);
      return savedLanguage;
    }
    // Use device language as fallback safely
    const locales = Localization.getLocales ? Localization.getLocales() : [];
    const firstLang = locales[0]?.languageCode || (Localization as any).locale || 'ta';
    const deviceLanguage = (typeof firstLang === 'string' && firstLang.startsWith('ta')) ? 'ta' : 'en';
    await i18n.changeLanguage(deviceLanguage);
    return deviceLanguage;
  } catch (error) {
    console.warn('Error loading language preference:', error);
    return 'ta';
  }
};

// Save language preference
export const saveLanguagePreference = async (language: 'en' | 'ta') => {
  try {
    await AsyncStorage.setItem(LANGUAGE_STORAGE_KEY, language);
    await i18n.changeLanguage(language);
  } catch (error) {
    console.error('Error saving language preference:', error);
  }
};

export default i18n;
