import { router, useFocusEffect } from "expo-router";
import { Briefcase, Check, ChevronLeft, Home, MapPin, Plus, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Alert, FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "../../../lib/supabase";
import { useAuthStore } from "../../../store/auth.store";

const ORANGE = "#FF6B00";

export default function AddressesScreen() {
  const { user } = useAuthStore() as any;
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [form, setForm] = useState({ label:"Home", full_name:"", phone:"", area:"", street:"", building:"" });

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("addresses").select("*").eq("user_id", user.id).order("is_default", {ascending:false}).order("created_at", {ascending:false});
    if(data) setList(data);
    setLoading(false);
  };

  useFocusEffect(useCallback(()=>{ load(); },[]));

  const save = async () => {
    if(!form.full_name ||!form.phone ||!form.area ||!form.street) return Alert.alert("كمل البيانات");
    const { error } = await supabase.from("addresses").insert({
      user_id: user.id,
      label: form.label,
      full_name: form.full_name,
      phone: form.phone,
      area: form.area,
      street: form.street,
      building: form.building,
      address_line: `${form.area}, ${form.street}, ${form.building}`,
      is_default: list.length===0 // اول واحد يبقى افتراضي
    });
    if(error) return Alert.alert(error.message);
    setShowAdd(false);
    setForm({ label:"Home", full_name:"", phone:"", area:"", street:"", building:"" });
    load();
  };

  const setDefault = async (id:string) => {
    await supabase.from("addresses").update({is_default:false}).eq("user_id", user.id);
    await supabase.from("addresses").update({is_default:true}).eq("id", id);
    load();
  };

  const del = async (id:string) => {
    Alert.alert("حذف", "متأكد؟", [{text:"لا"},{text:"نعم", style:"destructive", onPress: async ()=>{
      await supabase.from("addresses").delete().eq("id", id);
      load();
    }}]);
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 py-4">
        <Pressable onPress={()=> router.back()} className="size-9 bg-gray-100 rounded-full items-center justify-center"><ChevronLeft size={20}/></Pressable>
        <Text className="text-[18px] font-black">عناوين التوصيل</Text>
        <Pressable onPress={()=> setShowAdd(true)} className="size-9 bg-black rounded-full items-center justify-center"><Plus size={20} color="#fff"/></Pressable>
      </View>

      <FlatList
        data={list}
        keyExtractor={i=>i.id}
        contentContainerClassName="px-5 gap-y-3 pb-10"
        ListEmptyComponent={!loading? <View className="items-center mt-24"><View className="size-20 bg-orange-50 rounded-full items-center justify-center"><MapPin size={32} color={ORANGE}/></View><Text className="font-bold mt-4">مفيش عناوين لسه</Text><Text className="text-gray-400 text-sm mt-1">ضيف عنوان عشان التوصيل يبقى اسرع</Text></View> : null}
        renderItem={({item})=>(
          <View className={`p-4 rounded-[20px] border ${item.is_default? 'border-black bg-gray-50' : 'border-gray-200 bg-white'}`}>
            <View className="flex-row justify-between">
              <View className="flex-row items-center gap-x-2">
                <View className="size-8 rounded-full bg-white border border-gray-200 items-center justify-center">{item.label==="Home"? <Home size={14}/> : <Briefcase size={14}/>}</View>
                <Text className="font-black">{item.label}</Text>
                {item.is_default && <View className="bg-black px-2 py-1 rounded-full"><Text className="text-white text-[10px] font-bold">افتراضي</Text></View>}
              </View>
              <Pressable onPress={()=> del(item.id)}><Trash2 size={18} color="#FF3B30"/></Pressable>
            </View>
            <Text className="mt-3 font-bold text-[14px]">{item.full_name} • {item.phone}</Text>
            <Text className="text-gray-500 text-[13px] mt-1">{item.address_line}</Text>
            {!item.is_default && (
              <Pressable onPress={()=> setDefault(item.id)} className="mt-3 flex-row items-center gap-x-1"><Check size={14} color={ORANGE}/><Text className="text-[12px] font-bold" style={{color:ORANGE}}>اجعله افتراضي</Text></Pressable>
            )}
          </View>
        )}
      />

      {/* ADD MODAL */}
      <Modal visible={showAdd} animationType="slide" presentationStyle="pageSheet">
        <SafeAreaView className="flex-1 bg-white px-5">
          <View className="flex-row justify-between items-center py-4">
            <Text className="text-lg font-black">عنوان جديد</Text>
            <Pressable onPress={()=> setShowAdd(false)}><Text className="text-gray-500">الغاء</Text></Pressable>
          </View>

          <View className="flex-row gap-x-2 mb-4">
            {["Home","Work"].map(l=>(
              <Pressable key={l} onPress={()=> setForm({...form, label:l})} className={`flex-1 h-12 rounded-full items-center justify-center border ${form.label===l? 'bg-black border-black':'border-gray-200'}`}>
                <Text className={`font-bold ${form.label===l? 'text-white':'text-black'}`}>{l}</Text>
              </Pressable>
            ))}
          </View>

          {[
            {k:"full_name", p:"الاسم كامل"},
            {k:"phone", p:"الموبايل", key:"phone-pad"},
            {k:"area", p:"المنطقة - المعادي"},
            {k:"street", p:"الشارع"},
            {k:"building", p:"رقم العمارة / الشقة (اختياري)"},
          ].map(f=>(
            <View key={f.k} className="mb-3">
              <Text className="text-xs font-bold text-gray-500 mb-2 ml-1">{f.p}</Text>
              <TextInput value={(form as any)[f.k]} onChangeText={v=> setForm({...form, [f.k]:v})} keyboardType={f.key as any || "default"} placeholder={f.p} className="h-12 bg-gray-50 border border-gray-200 rounded-xl px-4" />
            </View>
          ))}

          <Pressable onPress={save} className="h-14 bg-black rounded-full items-center justify-center mt-4"><Text className="text-white font-black">حفظ العنوان</Text></Pressable>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}