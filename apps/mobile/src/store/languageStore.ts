import { create } from 'zustand';
import { saveLanguagePreference, loadLanguagePreference } from '../i18n';

interface LanguageState {
  language: 'en' | 'ta';
  isLoading: boolean;
  setLanguage: (lang: 'en' | 'ta') => Promise<void>;
  loadLanguage: () => Promise<void>;
}

export const useLanguageStore = create<LanguageState>((set) => ({
  language: 'ta',
  isLoading: true,
  
  setLanguage: async (lang: 'en' | 'ta') => {
    await saveLanguagePreference(lang);
    set({ language: lang });
  },
  
  loadLanguage: async () => {
    set({ isLoading: true });
    const savedLang = await loadLanguagePreference();
    set({ language: savedLang as 'en' | 'ta', isLoading: false });
  },
}));
