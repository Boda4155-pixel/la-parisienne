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

// بنطبق الـ RTL بس عند بداية التطبيق - مش اثناء التشغيل
const applyRtlOnBoot = (lang: string) => {
  const isRtl = getIsRtl(lang);
  I18nManager.allowRTL(isRtl);
  // مهم: ما نعملش forceRTL هنا الا اول مرة عشان ما يحتاجش ريستارت كل مرة
  if (I18nManager.isRTL!== isRtl) {
    I18nManager.forceRTL(isRtl);
  }
  return isRtl;
};

const initI18n = async () => {
  const deviceLanguage = getLocales()[0]?.languageCode?? "en";
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
      // No network or table not available
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

  // نطبق الـ RTL مرة واحدة عند التشغيل بس
  applyRtlOnBoot(resolvedLanguage);
};

initI18n();

// ده اللي هيتنده لما تدوس على لغة - فوري من غير ريستارت
export const changeAppLanguage = async (lang: string) => {
  // 1- احفظ
  await AsyncStorage.setItem("user-language", lang);
  // التوافق مع الكود القديم اللي كان بيستخدم app_lang
  await AsyncStorage.setItem("app_lang", lang);

  // 2- غير اللغة فورا في كل الاب
  await i18n.changeLanguage(lang);

  // 3- لو بتغير بين LTR و RTL (en <-> ar) هنحتاج ريستارت يدوي مرة واحدة بس
  // عشان كده مش هنعمل forceRTL هنا عشان ما نضربش الاب
  // لو عايز الـ RTL يتطبق كامل اعمل ريستارت يدوي للاب من الموبايل
  const isRtl = getIsRtl(lang);
  I18nManager.allowRTL(isRtl);
  // ملاحظة: ما بنعملش forceRTL هنا عمدا عشان التغيير يكون فوري

  return lang;
};

export default i18n;