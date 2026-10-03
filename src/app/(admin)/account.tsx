import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';

export default function AdminAccount() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const isRTL = i18n.language === 'ar';

  const Item = ({icon, label, onPress}: any) => (
    <TouchableOpacity onPress={onPress} style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:'#1A1A1A', padding:16, borderRadius:16, marginBottom:12, borderWidth:1, borderColor:'#2A2A2A'}}>
      <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={18} color="#555" />
      <Text style={{color:'#fff', fontSize:15, flex:1, textAlign: isRTL ? 'right':'left', marginHorizontal:12}}>{label}</Text>
      <View style={{backgroundColor:'#2A2A2A', padding:8, borderRadius:10}}>
        <Ionicons name={icon} size={20} color="#E8C87A" />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{flex:1, backgroundColor:'#0F0F0F'}}>
      <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, paddingTop:50}}>
        <TouchableOpacity onPress={()=>router.push('/(admin)/settings' as any)} style={{backgroundColor:'#1A1A1A', width:44, height:44, borderRadius:22, justifyContent:'center', alignItems:'center'}}>
          <Ionicons name="settings-outline" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={{color:'#fff', fontSize:24, fontWeight:'bold'}}>{t('admin.nav.account','Account')}</Text>
      </View>

      <ScrollView style={{flex:1, padding:16}} contentContainerStyle={{paddingBottom: 140}} showsVerticalScrollIndicator={false}>
        
        <TouchableOpacity activeOpacity={0.8} onPress={()=>router.push('/(admin)/edit-profile' as any)} style={{backgroundColor:'#1A1A1A', borderRadius:24, padding:20, alignItems:'center', borderWidth:1, borderColor:'#2A2A2A', marginBottom:16}}>
          <View style={{width:80, height:80, borderRadius:40, backgroundColor:'#E8C87A', justifyContent:'center', alignItems:'center'}}>
            <Ionicons name="person" size={40} color="#000" />
          </View>
          <Text style={{color:'#fff', fontSize:18, fontWeight:'bold', marginTop:12}}>Abdelrahman El Sawy</Text>
          <Text style={{color:'#999', fontSize:13, marginTop:4}}>bboda4155@gmail.com</Text>
          <View style={{flexDirection:'row', alignItems:'center', marginTop:10, backgroundColor:'#2A2A2A', paddingHorizontal:10, paddingVertical:4, borderRadius:12}}>
            <Ionicons name="create-outline" size={14} color="#E8C87A" />
            <Text style={{color:'#E8C87A', fontSize:11, marginLeft:4}}>{t('profile.editProfile','Edit Profile')}</Text>
          </View>
        </TouchableOpacity>

        <View style={{backgroundColor:'#1A1A1A', borderRadius:16, padding:16, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:1, borderColor:'#2A2A2A', marginBottom:20}}>
          <Switch value={isOpen} onValueChange={setIsOpen} trackColor={{false:'#333', true:'#E8C87A'}} thumbColor="#fff" />
          <View style={{flex:1, alignItems: isRTL ? 'flex-end':'flex-start', marginHorizontal:12}}>
            <Text style={{color:'#fff', fontSize:15, fontWeight:'bold'}}>{isOpen ? t('admin.account.open','مفتوح') : t('admin.account.closed','مغلق')}</Text>
            <Text style={{color:'#666', fontSize:11, marginTop:2}}>{t('admin.account.manageStore','إدارة إعدادات المتجر')}</Text>
          </View>
          <View style={{backgroundColor:'#2A2A2A', padding:8, borderRadius:10}}><Ionicons name="storefront-outline" size={20} color="#E8C87A" /></View>
        </View>

        <Text style={{color:'#666', fontSize:12, textAlign: isRTL ? 'right':'left', marginBottom:8}}>{t('admin.account.storeSection','المتجر')}</Text>
        <Item icon="bicycle-outline" label={t('admin.nav.zones','Delivery Zones')} onPress={()=>router.push('/(admin)/delivery-zones' as any)} />
        <Item icon="receipt-outline" label={t('admin.nav.tax','Tax Settings')} onPress={()=>router.push('/(admin)/tax-settings' as any)} />
        <Item icon="print-outline" label={t('admin.nav.printer','Printer')} onPress={()=>router.push('/(admin)/printer-settings' as any)} />
        <Item icon="time-outline" label={t('admin.nav.openingHours','Opening Hours')} onPress={()=>router.push('/(admin)/opening-hours' as any)} />

        {/* دول اللي كانو ثابتين - اتصلحو */}
        <Text style={{color:'#666', fontSize:12, textAlign: isRTL ? 'right':'left', marginBottom:8, marginTop:20}}>{t('admin.account.moreSection','المزيد')}</Text>
        <Item icon="pricetag-outline" label={t('admin.coupons.title','الكوبونات والخصومات')} onPress={()=>router.push('/(admin)/coupons' as any)} />
        <Item icon="people-outline" label={t('admin.nav.users')} onPress={()=>router.push('/(admin)/users' as any)} />
        <Item icon="grid-outline" label={t('admin.categories.title','الأقسام')} onPress={()=>router.push('/(admin)/categories' as any)} />

        <Text style={{color:'#666', fontSize:12, textAlign: isRTL ? 'right':'left', marginBottom:8, marginTop:20}}>App</Text>
        <Item icon="language-outline" label={`${t('admin.settings.language.title','App Language')} • ${i18n.language.toUpperCase()}`} onPress={()=>router.push('/(admin)/language' as any)} />
        <Item icon="notifications-outline" label={t('admin.nav.notifications','Notifications')} onPress={()=>router.push('/(admin)/notifications' as any)} />

        <TouchableOpacity onPress={()=>Alert.alert(t('admin.account.logoutTitle','Logout'), t('admin.account.logoutConfirm','Are you sure?'), [{text:t('common:cancel','Cancel'), style:'cancel'}, {text:t('admin.account.logoutButton','Logout')}])} style={{backgroundColor:'#E8C87A', padding:18, borderRadius:16, alignItems:'center', flexDirection:'row', justifyContent:'center', marginTop:24}}>
          <Text style={{color:'#000', fontSize:16, fontWeight:'bold', marginLeft:8}}>{t('admin.account.logoutButton','Logout')}</Text>
          <Ionicons name="log-out-outline" size={20} color="#000" />
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}