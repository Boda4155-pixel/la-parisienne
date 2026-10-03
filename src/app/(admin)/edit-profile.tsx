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
    <View style={{flex:1, backgroundColor:'#0F0F0F', padding:16, paddingTop:50}}>
      <View style={{flexDirection:'row', justifyContent:'space-between', alignItems:'center', marginBottom:24}}>
        <TouchableOpacity onPress={()=>router.back()}><Ionicons name="chevron-forward" size={24} color="#fff" /></TouchableOpacity>
        <Text style={{color:'#fff', fontSize:18, fontWeight:'bold'}}>{t('profile.editTitle')}</Text>
        <View style={{width:24}} />
      </View>

      <Text style={{color:'#999', textAlign:'right', marginBottom:6}}>{t('common.fullName')}</Text>
      <TextInput value={name} onChangeText={setName} style={{backgroundColor:'#1A1A1A', color:'#fff', padding:14, borderRadius:12, textAlign:'right', marginBottom:16, borderWidth:1, borderColor:'#2A2A2A'}} />

      <Text style={{color:'#999', textAlign:'right', marginBottom:6}}>{t('common.email')}</Text>
      <TextInput value={email} onChangeText={setEmail} style={{backgroundColor:'#1A1A1A', color:'#fff', padding:14, borderRadius:12, textAlign:'right', marginBottom:16, borderWidth:1, borderColor:'#2A2A2A'}} />

      <Text style={{color:'#999', textAlign:'right', marginBottom:6}}>{t('common.phone')}</Text>
      <TextInput value={phone} onChangeText={setPhone} style={{backgroundColor:'#1A1A1A', color:'#fff', padding:14, borderRadius:12, textAlign:'right', marginBottom:24, borderWidth:1, borderColor:'#2A2A2A'}} />

      <TouchableOpacity onPress={()=>{Alert.alert('تم','تم حفظ التعديلات ✅'); router.back();}} style={{backgroundColor:'#E8C87A', padding:16, borderRadius:12, alignItems:'center'}}>
        <Text style={{color:'#000', fontWeight:'bold'}}>{t('profile.saveChanges')}</Text>
      </TouchableOpacity>
    </View>
  )
}