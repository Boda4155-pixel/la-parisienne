import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import { LanguageProvider, useLang } from '../../lib/language';
function TabsInside(){
  const {lang,t} = useLang();
  return(
    <Tabs key={lang} screenOptions={{headerShown:false, tabBarActiveTintColor:'#000', tabBarInactiveTintColor:'#999', tabBarStyle:{height:90, paddingBottom:25}, tabBarLabelStyle:{fontSize:11, fontWeight:'700'}}}>
      <Tabs.Screen name="index" options={{title:t.home, tabBarIcon:({c,s}:any)=><Ionicons name="home" size={22} color={c}/>}}/>
      <Tabs.Screen name="orders" options={{title:t.orders, tabBarIcon:({c,s}:any)=><Ionicons name="receipt" size={22} color={c}/>}}/>
      <Tabs.Screen name="tracking" options={{title:t.tracking, tabBarIcon:({c,s}:any)=><Ionicons name="map" size={22} color={c}/>}}/>
      <Tabs.Screen name="wallet" options={{title:t.wallet, tabBarIcon:({c,s}:any)=><Ionicons name="wallet" size={22} color={c}/>}}/>
      <Tabs.Screen name="profile" options={{title:t.profile, tabBarIcon:({c,s}:any)=><Ionicons name="person" size={22} color={c}/>}}/>
    </Tabs>
  );
}
export default function Layout(){ return <LanguageProvider><TabsInside/></LanguageProvider> }