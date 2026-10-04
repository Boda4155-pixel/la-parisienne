import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, Text, TextInput, TouchableOpacity, View } from 'react-native';

export default function EditAdminProfile() {
  const { t } = useTranslation();
  const router = useRouter();
  const [name, setName] = useState('Abdelrahman El Sawy');
  const [email, setEmail] = useState('bboda4155@gmail.com');
  const [phone, setPhone] = useState('01000000000');

  return (
    <View style={{flex:1, backgroundColor:'#FFFFFF', padding:16, paddingTop:50}}>
      <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
        <TouchableOpacity onPress={()=>router.back()} style={{width:36, height:36, borderRadius:18, backgroundColor:'#FFFFFF', justifyContent:'center', alignItems:'center', borderWidth:1, borderColor:'#E5E5E5'}}><Ionicons name="chevron-forward" size={20} color="#111" /></TouchableOpacity>
        <Text style={{color:'#111', fontSize:19, fontWeight:'800'}}>{t('profile.editTitle')}</Text>
        <View style={{width:36}} />
      </View>

      <Text style={{color:'#111', textAlign:'right', marginBottom:6, fontWeight:'700', fontSize:12}}>{t('common.fullName')}</Text>
      <TextInput value={name} onChangeText={setName} style={{backgroundColor:'#F9F9F9', color:'#111', padding:14, borderRadius:12, textAlign:'right', marginBottom:16, borderWidth:1, borderColor:'#E5E5E5', fontWeight:'600'}} placeholderTextColor="#999" />

      <Text style={{color:'#111', textAlign:'right', marginBottom:6, fontWeight:'700', fontSize:12}}>{t('common.email')}</Text>
      <TextInput value={email} onChangeText={setEmail} style={{backgroundColor:'#F9F9F9', color:'#111', padding:14, borderRadius:12, textAlign:'right', marginBottom:16, borderWidth:1, borderColor:'#E5E5E5', fontWeight:'600'}} placeholderTextColor="#999" />

      <Text style={{color:'#111', textAlign:'right', marginBottom:6, fontWeight:'700', fontSize:12}}>{t('common.phone')}</Text>
      <TextInput value={phone} onChangeText={setPhone} style={{backgroundColor:'#F9F9F9', color:'#111', padding:14, borderRadius:12, textAlign:'right', marginBottom:24, borderWidth:1, borderColor:'#E5E5E5', fontWeight:'600'}} placeholderTextColor="#999" />

      <TouchableOpacity onPress={()=>{Alert.alert('تم','تم حفظ التعديلات ✅'); router.back();}} style={{backgroundColor:'#16A34A', padding:16, borderRadius:12, alignItems:'center'}}>
        <Text style={{color:'#FFFFFF', fontWeight:'800', fontSize:15}}>{t('profile.saveChanges')}</Text>
      </TouchableOpacity>
    </View>
  )
}