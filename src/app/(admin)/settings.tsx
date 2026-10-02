import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Text, TouchableOpacity, View } from 'react-native';
export default function Settings(){
  return (
    <View style={{flex:1, backgroundColor:'#0F0F0F', paddingTop:60, padding:16}}>
      <TouchableOpacity onPress={()=>router.back()} style={{flexDirection:'row', alignItems:'center', gap:6, marginBottom:20}}>
        <Ionicons name="chevron-forward" size={20} color="#fff"/><Text style={{color:'#fff'}}>Back</Text>
      </TouchableOpacity>
      <Text style={{color:'#fff', fontSize:24, fontWeight:'bold', textAlign:'right'}}>Settings</Text>
      <Text style={{color:'#666', marginTop:20, textAlign:'center'}}>هنا هنحط الاعدادات المتقدمة بعدين - زي Backup / Delete All Data / API Keys</Text>
    </View>
  );
}