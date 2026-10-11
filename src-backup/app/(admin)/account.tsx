import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, ScrollView, Switch, Text, TouchableOpacity, View } from 'react-native';
import { ADMIN_COLORS } from "../../../lib/adminTheme";

export default function AdminAccount() {
  const { t, i18n } = useTranslation();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(true);
  const isRTL = i18n.language === 'ar';

  const Item = ({icon, label, onPress}: any) => (
    <TouchableOpacity onPress={onPress} style={{flexDirection:'row', alignItems:'center', justifyContent:'space-between', backgroundColor:ADMIN_COLORS.card, padding:16, borderRadius:16, marginBottom:12, borderWidth:1, borderColor:ADMIN_COLORS.border}}>
      <Ionicons name={isRTL ? "chevron-back" : "chevron-forward"} size={18} color={ADMIN_COLORS.textSecondary} />
      <Text style={{color:ADMIN_COLORS.textPrimary, fontSize:14, flex:1, textAlign: isRTL ? 'right':'left', marginHorizontal:12, fontWeight:'600'}}>{label}</Text>
      <View style={{backgroundColor:ADMIN_COLORS.primary, padding:8, borderRadius:10}}>
        <Ionicons name={icon} size={20} color={ADMIN_COLORS.primaryText} />
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={{flex:1, backgroundColor:ADMIN_COLORS.background}}>
      <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, paddingTop:50, backgroundColor:ADMIN_COLORS.card, borderBottomWidth:1, borderBottomColor:ADMIN_COLORS.border}}>
        <TouchableOpacity onPress={()=>router.push('/(admin)/settings' as any)} style={{backgroundColor:ADMIN_COLORS.card, width:44, height:44, borderRadius:22, justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border}}>
          <Ionicons name="settings-outline" size={22} color={ADMIN_COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={{color:ADMIN_COLORS.textPrimary, fontSize:24, fontWeight:'800'}}>{t('admin.nav.account','Account')}</Text>
        <View style={{width:44}} />
      </View>

      <ScrollView style={{flex:1, padding:16, backgroundColor:ADMIN_COLORS.backgroundSecondary}} contentContainerStyle={{paddingBottom: 140}} showsVerticalScrollIndicator={false}>
        
        <TouchableOpacity activeOpacity={0.8} onPress={()=>router.push('/(admin)/edit-profile' as any)} style={{backgroundColor:ADMIN_COLORS.card, borderRadius:24, padding:20, alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border, marginBottom:16}}>
          <View style={{width:80, height:80, borderRadius:40, backgroundColor:ADMIN_COLORS.primary, justifyContent:'center', alignItems:'center'}}>
            <Ionicons name="person" size={40} color={ADMIN_COLORS.primaryText} />
          </View>
          <Text style={{color:ADMIN_COLORS.textPrimary, fontSize:18, fontWeight:'800', marginTop:12}}>Abdelrahman El Sawy</Text>
          <Text style={{color:ADMIN_COLORS.textSecondary, fontSize:13, marginTop:4, fontWeight:'500'}}>bboda4155@gmail.com</Text>
          <View style={{flexDirection:'row', alignItems:'center', marginTop:10, backgroundColor:ADMIN_COLORS.backgroundSecondary, paddingHorizontal:10, paddingVertical:5, borderRadius:12, borderWidth:1, borderColor:ADMIN_COLORS.border}}>
            <Ionicons name="create-outline" size={14} color={ADMIN_COLORS.textPrimary} />
            <Text style={{color:ADMIN_COLORS.textPrimary, fontSize:11, marginLeft:4, fontWeight:'700'}}>{t('profile.editProfile','Edit Profile')}</Text>
          </View>
        </TouchableOpacity>

        <View style={{backgroundColor:ADMIN_COLORS.card, borderRadius:16, padding:16, flexDirection:'row', justifyContent:'space-between', alignItems:'center', borderWidth:1, borderColor:ADMIN_COLORS.border, marginBottom:20}}>
          <Switch value={isOpen} onValueChange={setIsOpen} trackColor={{false:ADMIN_COLORS.border, true:ADMIN_COLORS.primary}} thumbColor={ADMIN_COLORS.textPrimary} />
          <View style={{flex:1, alignItems: isRTL ? 'flex-end':'flex-start', marginHorizontal:12}}>
            <Text style={{color:ADMIN_COLORS.textPrimary, fontSize:15, fontWeight:'800'}}>{isOpen ? t('admin.account.open','مفتوح') : t('admin.account.closed','مغلق')}</Text>
            <Text style={{color:ADMIN_COLORS.textSecondary, fontSize:11, marginTop:2}}>{t('admin.account.manageStore','إدارة إعدادات المتجر')}</Text>
          </View>
          <View style={{backgroundColor:ADMIN_COLORS.primary, padding:8, borderRadius:10}}><Ionicons name="storefront-outline" size={20} color={ADMIN_COLORS.primaryText} /></View>
        </View>

        <Text style={{color:ADMIN_COLORS.textPrimary, fontSize:11, textAlign: isRTL ? 'right':'left', marginBottom:8, fontWeight:'800', textTransform:'uppercase'}}>{t('admin.account.storeSection','المتجر')}</Text>
        <Item icon="bicycle-outline" label={t('admin.nav.zones','Delivery Zones')} onPress={()=>router.push('/(admin)/delivery-zones' as any)} />
        <Item icon="receipt-outline" label={t('admin.nav.tax','Tax Settings')} onPress={()=>router.push('/(admin)/tax-settings' as any)} />
        <Item icon="print-outline" label={t('admin.nav.printer','Printer')} onPress={()=>router.push('/(admin)/printer-settings' as any)} />
        <Item icon="time-outline" label={t('admin.nav.openingHours','Opening Hours')} onPress={()=>router.push('/(admin)/opening-hours' as any)} />

        <Text style={{color:ADMIN_COLORS.textPrimary, fontSize:11, textAlign: isRTL ? 'right':'left', marginBottom:8, marginTop:20, fontWeight:'800', textTransform:'uppercase'}}>{t('admin.account.moreSection','المزيد')}</Text>
        <Item icon="pricetag-outline" label={t('admin.coupons.title','الكوبونات والخصومات')} onPress={()=>router.push('/(admin)/coupons' as any)} />
        <Item icon="people-outline" label={t('admin.nav.users')} onPress={()=>router.push('/(admin)/users' as any)} />
        <Item icon="grid-outline" label={t('admin.categories.title','الأقسام')} onPress={()=>router.push('/(admin)/categories' as any)} />

        <Text style={{color:ADMIN_COLORS.textPrimary, fontSize:11, textAlign: isRTL ? 'right':'left', marginBottom:8, marginTop:20, fontWeight:'800', textTransform:'uppercase'}}>App</Text>
        <Item icon="language-outline" label={`${t('admin.settings.language.title','App Language')} • ${i18n.language.toUpperCase()}`} onPress={()=>router.push('/(admin)/language' as any)} />
        <Item icon="notifications-outline" label={t('admin.nav.notifications','Notifications')} onPress={()=>router.push('/(admin)/notifications' as any)} />

        <TouchableOpacity onPress={()=>Alert.alert(t('admin.account.logoutTitle','Logout'), t('admin.account.logoutConfirm','Are you sure?'), [{text:t('common:cancel','Cancel'), style:'cancel'}, {text:t('admin.account.logoutButton','Logout')}])} style={{backgroundColor:ADMIN_COLORS.primary, padding:18, borderRadius:16, alignItems:'center', flexDirection:'row', justifyContent:'center', marginTop:24}}>
          <Text style={{color:ADMIN_COLORS.primaryText, fontSize:16, fontWeight:'800', marginLeft:8}}>{t('admin.account.logoutButton','Logout')}</Text>
          <Ionicons name="log-out-outline" size={20} color={ADMIN_COLORS.primaryText} />
        </TouchableOpacity>

      </ScrollView>
    </View>
  );
}