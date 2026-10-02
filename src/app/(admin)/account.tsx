import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import { supabase } from '../../../lib/supabase';

export default function AccountPage(){
  const [isOpen, setIsOpen] = useState(true);
  const logout = async () => {
    await supabase.auth.signOut();
    router.replace('/login' as any);
  };

  const Item = ({icon, label, onPress, color='#fff'}: any) => (
    <TouchableOpacity style={s.item} onPress={onPress}>
      <Ionicons name="chevron-back" size={18} color="#555" />
      <Text style={[s.itemTxt,{color}]}>{label}</Text>
      <View style={s.itemIcon}><Ionicons name={icon} size={18} color="#E8C87A" /></View>
    </TouchableOpacity>
  );

  return (
    <View style={s.bg}>
      <View style={s.topBar}>
        <TouchableOpacity onPress={()=>router.push('/(admin)/settings' as any)} style={s.gear}>
          <Ionicons name="settings-outline" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={s.h1}>Account</Text>
      </View>

      <ScrollView contentContainerStyle={{padding:16, paddingBottom:120, gap:16}}>
        <View style={s.card}>
          <View style={s.avatar}><Ionicons name="person" size={44} color="#000"/></View>
          <Text style={s.name}>La Parisienne Admin</Text>
          <Text style={s.email}>admin@laparisienne.com</Text>
        </View>

        <View style={s.cardRow}>
          <Switch value={isOpen} onValueChange={setIsOpen} trackColor={{true:'#E8C87A', false:'#333'}} thumbColor={isOpen?'#000':'#888'} />
          <View style={{alignItems:'flex-end'}}>
            <Text style={s.rowTitle}>{isOpen ? 'المتجر مفتوح • Open' : 'المتجر مغلق • Closed'}</Text>
            <Text style={s.rowSub}>ايقاف استقبال الطلبات مؤقتا</Text>
          </View>
          <View style={s.iconBox}><Ionicons name={isOpen?'storefront':'storefront-outline'} size={20} color="#E8C87A"/></View>
        </View>

        <Text style={s.section}>الإدارة</Text>
        <View style={{gap:10}}>
          <Item icon="pricetag-outline" label="Coupons & Offers" onPress={()=>router.push('/(admin)/coupons' as any)} />
          <Item icon="people-outline" label="Staff Management" onPress={()=>router.push('/(admin)/users' as any)} />
          <Item icon="time-outline" label="Opening Hours" onPress={()=>router.push('/(admin)/opening-hours' as any)} />
          <Item icon="bicycle-outline" label="Delivery Zones & Fees" onPress={()=>router.push('/(admin)/delivery-zones' as any)} />
          <Item icon="receipt-outline" label="Tax & Service Charge" onPress={()=>router.push('/(admin)/tax-settings' as any)} />
          <Item icon="print-outline" label="Printer & Receipt" onPress={()=>router.push('/(admin)/printer-settings' as any)} />
        </View>

        <Text style={s.section}>App</Text>
        <View style={{gap:10}}>
          <Item icon="language-outline" label="Language • اللغة" onPress={()=>{}} />
          <Item icon="notifications-outline" label="Notifications" onPress={()=>{}} />
          <Item icon="information-circle-outline" label="About La Parisienne" onPress={()=>{}} />
        </View>

        <TouchableOpacity style={s.logout} onPress={logout}>
          <Ionicons name="log-out-outline" size={18} color="#000"/><Text style={s.logoutTxt}>Logout</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
const s = StyleSheet.create({
  bg:{flex:1, backgroundColor:'#0F0F0F'},
  topBar:{flexDirection:'row', justifyContent:'space-between', alignItems:'center', padding:16, paddingTop:60},
  h1:{color:'#fff', fontSize:28, fontWeight:'bold'}, gear:{width:40, height:40, borderRadius:20, backgroundColor:'#1A1A1A', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#222'},
  card:{backgroundColor:'#161616', borderRadius:20, padding:20, alignItems:'center', borderWidth:1, borderColor:'#222'},
  avatar:{width:72, height:72, borderRadius:36, backgroundColor:'#E8C87A', justifyContent:'center', alignItems:'center', marginBottom:10},
  name:{color:'#fff', fontWeight:'bold', fontSize:16}, email:{color:'#888', fontSize:12},
  cardRow:{backgroundColor:'#161616', borderRadius:16, padding:16, flexDirection:'row', alignItems:'center', justifyContent:'space-between', borderWidth:1, borderColor:'#222'},
  rowTitle:{color:'#fff', fontWeight:'bold', textAlign:'right'}, rowSub:{color:'#888', fontSize:10, textAlign:'right'}, iconBox:{width:36, height:36, borderRadius:10, backgroundColor:'#1E1E1E', justifyContent:'center', alignItems:'center'},
  section:{color:'#666', fontSize:11, textAlign:'right', marginTop:8, letterSpacing:1},
  item:{backgroundColor:'#161616', borderRadius:14, padding:14, flexDirection:'row', alignItems:'center', justifyContent:'space-between', borderWidth:1, borderColor:'#222'},
  itemIcon:{width:32, height:32, borderRadius:8, backgroundColor:'#1E1E1E', justifyContent:'center', alignItems:'center'}, itemTxt:{color:'#fff', fontSize:13, fontWeight:'500'},
  logout:{backgroundColor:'#E8C87A', height:50, borderRadius:14, justifyContent:'center', alignItems:'center', flexDirection:'row', gap:8, marginTop:10}, logoutTxt:{color:'#000', fontWeight:'bold'}
});