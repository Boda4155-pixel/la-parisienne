import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { I18nManager } from "react-native";

import { getAppLanguage } from "../lib/adminQueries";

import ar from "./locales/ar.json";
import en from "./locales/en.json";
import fr from "./locales/fr.json";

const resources = {
  en: { translation: en },
  ar: { translation: ar },
  fr: { translation: fr },
};

const RTL_LANGUAGES = ["ar"];
const supportedLanguages = ["en", "ar", "fr"];

const getIsRtl = (lang: string) => RTL_LANGUAGES.includes(lang);

const applyRtl = (lang: string) => {
  const isRtl = getIsRtl(lang);
  I18nManager.allowRTL(isRtl);
  I18nManager.forceRTL(isRtl);
  return isRtl;
};

const initI18n = async () => {
  const deviceLanguage = getLocales()[0]?.languageCode ?? "en";
  const defaultLanguage = supportedLanguages.includes(deviceLanguage)
    ? deviceLanguage
    : "en";

  let savedLanguage: string | null = null;
  try {
    savedLanguage = await AsyncStorage.getItem("user-language");
  } catch (e) {}

  // Fallback to Supabase app_language if AsyncStorage has no saved language
  if (!savedLanguage) {
    try {
      savedLanguage = await getAppLanguage();
    } catch (e) {
      // No network or table not available — fall through to device default
    }
  }

  const resolvedLanguage = savedLanguage || defaultLanguage;

  await i18n.use(initReactI18next).init({
    resources,
    lng: resolvedLanguage,
    fallbackLng: "en",
    supportedLngs: supportedLanguages,
    interpolation: {
      escapeValue: false,
    },
    react: {
      useSuspense: false,
    },
  });

  // Apply RTL based on the ACTUAL resolved language, not the raw device locale
  applyRtl(resolvedLanguage);
};

initI18n();

export const changeAppLanguage = async (lang: string) => {
  await AsyncStorage.setItem("user-language", lang);
  await i18n.changeLanguage(lang);

  const isRtl = applyRtl(lang);
};

export default i18n;