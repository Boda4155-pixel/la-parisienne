import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import * as Updates from "expo-updates";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { I18nManager } from "react-native";

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
  const wasRtl = I18nManager.isRTL;
  await AsyncStorage.setItem("user-language", lang);
  await i18n.changeLanguage(lang);

  const isRtl = applyRtl(lang);

  // I18nManager direction change only takes effect after a reload
  if (wasRtl !== isRtl) {
    try {
      await Updates.reloadAsync();
    } catch (e) {
      // Updates.reloadAsync isn't available in dev/Expo Go — fall back silently
      console.warn("RTL direction changed; please restart the app manually.");
    }
  } else {
    try {
      await Updates.reloadAsync();
    } catch (e) {
      // Updates.reloadAsync isn't available in dev/Expo Go — fall back silently
      console.warn("LTR direction changed; please restart the app manually.");
    }
  }
};

export default i18n;
