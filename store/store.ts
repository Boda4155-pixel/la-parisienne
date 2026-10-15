// src/store/language.store.ts
import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

type Lang = 'en' | 'ar' | 'fr';

interface LanguageState {
  lang: Lang;
  setLang: (lang: Lang) => void;
  t: (en: string, ar: string, fr?: string) => string;
}

export const useLanguageStore = create<LanguageState>()(
  persist(
    (set, get) => ({
      lang: 'en',
      setLang: (lang) => set({ lang }),
      t: (en, ar, fr) => {
        const { lang } = get();
        if (lang === 'ar') return ar;
        if (lang === 'fr') return fr || en;
        return en;
      },
    }),
    {
      name: 'app-language',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);