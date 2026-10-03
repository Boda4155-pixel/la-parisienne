import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { BackHandler, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export default function Settings() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const isRTL = i18n.language === 'ar';

  // ده اللي بيصلح زرار الرجوع بتاع الموبايل
  useEffect(() => {
    const onBackPress = () => {
      if (router.canGoBack()) {
        router.back();
        return true;
      }
      return false;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, []);

  const Item = ({icon, label, subLabel, onPress}: any) => (
    <TouchableOpacity onPress={onPress} style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#1A1A1A', padding:16, borderRadius:16, marginBottom:12, borderWidth:1, borderColor:'#2A2A2A'}}>
      <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={18} color="#555" />
      <View style={{flex:1, alignItems: isRTL ? 'flex-end':'flex-start', marginHorizontal:12}}>
        <Text style={{color:'#fff', fontSize:15, fontWeight:'500', textAlign: isRTL ? 'right':'left'}}>{label}</Text>
        {subLabel && <Text style={{color:'#666', fontSize:11, marginTop:2, textAlign: isRTL ? 'right':'left'}}>{subLabel}</Text>}
      </View>
      <View style={{backgroundColor:'#2A2A2A', padding:8, borderRadius:10}}>
        <Ionicons name={icon} size={20} color="#E8C87A" />
      </View>
    </TouchableOpacity>
  );

  const handleBack = () => {
    if (router.canGoBack()) router.back();
    else router.replace('/(admin)/account' as any);
  };

  return (
    <View style={{flex:1, backgroundColor:'#0F0F0F'}}>
      <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, paddingTop: insets.top + 10}}>
        <TouchableOpacity onPress={handleBack} style={{backgroundColor:'#1A1A1A', width:44, height:44, borderRadius:22, justifyContent:'center', alignItems:'center'}}>
          <Ionicons name={isRTL ? "chevron-forward" : "chevron-back"} size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={{color:'#fff', fontSize:22, fontWeight:'bold'}}>{t('admin.advanced.title','Advanced Settings')}</Text>
        <View style={{width:44}} />
      </View>
      <ScrollView style={{flex:1, padding:16}} contentContainerStyle={{paddingBottom:120}}>
        <Text style={{color:'#666', fontSize:12, textAlign: isRTL ? 'right':'left', marginBottom:8}}>{t('admin.advanced.storeSettings','Store Settings')}</Text>
        <Item icon="location-outline" label={t('admin.advanced.location','Store location on map')} subLabel={t('admin.advanced.locationSub','Set branch address')} onPress={()=>router.push('/(admin)/store-location' as any)} />
        <Item icon="call-outline" label={t('admin.advanced.support','Support Numbers')} subLabel={t('admin.advanced.supportSub','WhatsApp & Phone')} onPress={()=>router.push('/(admin)/support-numbers' as any)} />
        <Text style={{color:'#666', fontSize:12, textAlign: isRTL ? 'right':'left', marginBottom:8, marginTop:20}}>{t('admin.account.moreSection','More')}</Text>
        <Item icon="shield-checkmark-outline" label={t('admin.advanced.privacy','Privacy Policy')} onPress={()=>router.push('/(admin)/privacy' as any)} />
        <Item icon="document-text-outline" label={t('admin.advanced.terms','Terms & Conditions')} onPress={()=>router.push('/(admin)/terms' as any)} />
        <Item icon="information-circle-outline" label={t('admin.advanced.about','About App')} subLabel="Version 1.0.0 - la-parisienne" onPress={()=>router.push('/(admin)/about' as any)} />
        <Item icon="chatbubbles-outline" label={t('admin.advanced.feedback','Suggestions & Complaints')} subLabel={t('admin.advanced.feedbackSub','Customer messages')} onPress={()=>router.push('/(admin)/feedback' as any)} />
      </ScrollView>
    </View>
  );
}