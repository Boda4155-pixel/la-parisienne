import AsyncStorage from '@react-native-async-storage/async-storage';
import { createContext, useContext, useEffect, useState } from 'react';
export type Lang = 'AR'|'EN'|'FR';
export const T = {
  AR: {home:'الرئيسية',orders:'الطلبات',tracking:'التتبع',wallet:'المحفظة',profile:'حسابي'},
  EN: {home:'Home',orders:'Orders',tracking:'Tracking',wallet:'Wallet',profile:'Profile'},
  FR: {home:'Accueil',orders:'Commandes',tracking:'Suivi',wallet:'Portefeuille',profile:'Profil'},
};
const Ctx = createContext<any>(null);
export function LanguageProvider({children}:any){
  const [lang,setLangState]=useState<Lang>('AR');
  useEffect(()=>{ AsyncStorage.getItem('driver_lang').then(v=>{ if(v) setLangState(v as Lang) }) },[]);
  const setLang = (l:Lang)=>{ setLangState(l); AsyncStorage.setItem('driver_lang',l); };
  return <Ctx.Provider value={{lang, t:T[lang], setLang}}>{children}</Ctx.Provider>
}
export const useLang = ()=>useContext(Ctx);