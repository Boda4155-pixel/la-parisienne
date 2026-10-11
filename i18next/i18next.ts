import AsyncStorage from "@react-native-async-storage/async-storage";
import { getLocales } from "expo-localization";
import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import { I18nManager } from "react-native";
import { supabase } from "../lib/supabase";

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

const applyRtlOnBoot = (lang: string) => {
  const isRtl = getIsRtl(lang);
  I18nManager.allowRTL(isRtl);
  if (I18nManager.isRTL!== isRtl) {
    I18nManager.forceRTL(isRtl);
  }
  return isRtl;
};

// دي كانت في adminQueries - نقلناها هنا عشان ما نعملش import للادمن
const getAppLanguage = async (): Promise<string | null> => {
  try {
    const { data } = await supabase.from('app_settings').select('language').limit(1).single();
    return data?.language || null;
  } catch {
    return null;
  }
};

const initI18n = async () => {
  const deviceLanguage = getLocales()[0]?.languageCode?? "en";
  const defaultLanguage = supportedLanguages.includes(deviceLanguage)? deviceLanguage : "en";

  let savedLanguage: string | null = null;
  try {
    savedLanguage = await AsyncStorage.getItem("user-language");
  } catch (e) {}

  if (!savedLanguage) {
    try {
      savedLanguage = await getAppLanguage();
    } catch (e) {}
  }

  const resolvedLanguage = savedLanguage || defaultLanguage;

  await i18n.use(initReactI18next).init({
    resources,
    lng: resolvedLanguage,
    fallbackLng: "en",
    supportedLngs: supportedLanguages,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });

  applyRtlOnBoot(resolvedLanguage);
};

initI18n();

export const changeAppLanguage = async (lang: string) => {
  await AsyncStorage.setItem("user-language", lang);
  await AsyncStorage.setItem("app_lang", lang);
  await i18n.changeLanguage(lang);
  const isRtl = getIsRtl(lang);
  // forceRTL only takes effect after a reload on native; do it when the
  // writing direction actually flips so AR<->EN/FR switches re-layout.
  if (I18nManager.isRTL !== isRtl) {
    I18nManager.forceRTL(isRtl);
    const { reloadAsync } = await import("expo-updates");
    await reloadAsync();
  } else {
    I18nManager.allowRTL(isRtl);
  }
  return lang;
};

export default i18n;