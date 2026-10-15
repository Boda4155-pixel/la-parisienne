import Ionicons from "@expo/vector-icons/Ionicons";
import { router } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, FlatList, Modal, Pressable, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CUSTOMER_COLORS } from "../../../lib/customerTheme";
import { getOrders } from "../../../lib/queries";
import { supabase } from "../../../lib/supabase";

type Order = { id: string; status: string; payment_method: string; subtotal: number; total: number; created_at: string; };

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  pending: { label: "Pending", color: "#8B7355", bg: "#FFF3E0", icon: "time-outline" },
  confirmed: { label: "Confirmed", color: "#1E40AF", bg: "#DBEAFE", icon: "checkmark-circle-outline" },
  preparing: { label: "Preparing", color: "#7C3AED", bg: "#EDE9FE", icon: "restaurant-outline" },
  out_for_delivery: { label: "Out for delivery", color: "#D97706", bg: "#FEF3C7", icon: "bicycle-outline" },
  delivered: { label: "Delivered", color: "#065F46", bg: "#D1FAE5", icon: "checkmark-done-outline" },
  cancelled: { label: "Cancelled", color: "#991B1B", bg: "#FEE2E2", icon: "close-circle-outline" },
};

function CustomerChatBox({ orderId, status, onClose }: { orderId: string; status: string; onClose: () => void }) {
  const [msgs, setMsgs] = useState<any[]>([]);
  const [text, setText] = useState("");
  const [convId, setConvId] = useState<string | null>(null);
  const [chatType, setChatType] = useState<"cashier" | "delivery">(status === "out_for_delivery" ? "delivery" : "cashier");
  const channelRef = useRef<any>(null);
  const C = CUSTOMER_COLORS;

  useEffect(() => {
    let isMounted = true;
    const init = async () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      let { data: conv } = await supabase.from("chat_conversations").select("*").eq("order_id", orderId).eq("type", chatType).maybeSingle();
      if (!conv) {
        const { data: nc } = await supabase.from("chat_conversations").insert([{ order_id: orderId, type: chatType }]).select().single();
        conv = nc;
      }
      if (!conv || !isMounted) return;
      setConvId(conv.id);
      const { data } = await supabase.from("chat_messages").select("*").eq("conversation_id", conv.id).order("created_at", { ascending: true });
      if (isMounted) setMsgs(data || []);

      // Remove any stale channel for this conversation. Under React Strict
      // Mode, the component remounts (new useRef, fresh channelRef) while
      // the previous channel's removeChannel (async WebSocket leave) hasn't
      // yet removed it from the RealtimeClient's internal `channels` array.
      // Without this, channel() returns the leaving-state channel and
      // .subscribe() silently no-ops. Synchronously splice stale channels
      // from the array (mirrors RealtimeClient._remove).
      const chatTopic = `cust-chat-${conv.id}`;
      const realtimeChatTopic = `realtime:${chatTopic}`;
      const staleChat = supabase.getChannels().filter((c) => c.topic === realtimeChatTopic);
      staleChat.forEach((c) => supabase.removeChannel(c));
      supabase.realtime.channels = supabase.realtime.channels.filter(
        (c) => c.topic !== realtimeChatTopic
      );

      const ch = supabase.channel(chatTopic).on("postgres_changes", { event: "INSERT", schema: "public", table: "chat_messages", filter: `conversation_id=eq.${conv.id}` }, (p) => {
          setMsgs((m) => [...m, p.new])
        }).subscribe();
      channelRef.current = ch;
    };
    init();
    return () => { isMounted = false; if (channelRef.current) supabase.removeChannel(channelRef.current); };
  }, [orderId, chatType]);

  const send = async () => {
    if (!text.trim() || !convId) return;
    await supabase.from("chat_messages").insert([{ conversation_id: convId, sender_role: "customer", message: text.trim() }]);
    setText("");
  };

  return (
    <View style={{ flex: 1, backgroundColor: C.background, borderTopLeftRadius: 28, borderTopRightRadius: 28, padding: 20, maxHeight: "92%" }}>
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
        <View>
          <Text style={{ fontWeight: "900", fontSize: 17, color: C.textPrimary }}>Order #{orderId.slice(0, 8)}</Text>
          <Text style={{ fontSize: 12, color: C.textMuted, marginTop: 2 }}>{chatType === "cashier" ? "Chat with cashier" : "Chat with delivery"}</Text>
        </View>
        <Pressable onPress={onClose} style={{ width: 36, height: 36, backgroundColor: C.card, borderRadius: 18, borderWidth: 1, borderColor: C.border, justifyContent: "center", alignItems: "center" }}>
          <Ionicons name="close" size={20} color={C.textPrimary} />
        </Pressable>
      </View>

      <View style={{ flexDirection: "row", gap: 10, marginBottom: 16 }}>
        <Pressable onPress={() => setChatType("cashier")} style={{ flex: 1, height: 42, borderRadius: 21, backgroundColor: chatType === "cashier" ? C.textPrimary : C.card, borderWidth: 1, borderColor: chatType === "cashier" ? C.textPrimary : C.border, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 6 }}>
          <Ionicons name="storefront-outline" size={16} color={chatType === "cashier" ? C.card : C.textPrimary} />
          <Text style={{ fontWeight: "800", fontSize: 13, color: chatType === "cashier" ? C.card : C.textPrimary }}>Cashier</Text>
        </Pressable>
        <Pressable onPress={() => setChatType("delivery")} style={{ flex: 1, height: 42, borderRadius: 21, backgroundColor: chatType === "delivery" ? C.textPrimary : C.card, borderWidth: 1, borderColor: chatType === "delivery" ? C.textPrimary : C.border, justifyContent: "center", alignItems: "center", flexDirection: "row", gap: 6 }}>
          <Ionicons name="bicycle-outline" size={16} color={chatType === "delivery" ? C.card : C.textPrimary} />
          <Text style={{ fontWeight: "800", fontSize: 13, color: chatType === "delivery" ? C.card : C.textPrimary }}>Delivery</Text>
        </Pressable>
      </View>

      <FlatList
        data={msgs}
        keyExtractor={(i) => i.id}
        style={{ flex: 1 }}
        contentContainerStyle={{ gap: 10, paddingVertical: 10 }}
        renderItem={({ item }) => (
          <View style={{ alignSelf: item.sender_role === "customer" ? "flex-end" : "flex-start", backgroundColor: item.sender_role === "customer" ? C.textPrimary : C.card, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18, borderBottomRightRadius: item.sender_role === "customer" ? 4 : 18, borderBottomLeftRadius: item.sender_role === "customer" ? 18 : 4, maxWidth: "80%", borderWidth: 1, borderColor: item.sender_role === "customer" ? C.textPrimary : C.border }}>
            <Text style={{ color: item.sender_role === "customer" ? C.card : C.textPrimary, fontWeight: "600", fontSize: 13, lineHeight: 18 }}>{item.message}</Text>
          </View>
        )}
        ListEmptyComponent={<View style={{ alignItems: "center", marginTop: 40 }}><Ionicons name="chatbubbles-outline" size={40} color={C.textMuted} /><Text style={{ color: C.textMuted, marginTop: 10, fontSize: 13 }}>{chatType === "cashier" ? "Need to change something?" : "Contact delivery when on the way"}</Text></View>}
      />

      <View style={{ flexDirection: "row", gap: 10, marginTop: 14, alignItems: "center" }}>
        <TextInput value={text} onChangeText={setText} placeholder={chatType === "cashier" ? "Ex: Remove onions..." : "Where are you?"} placeholderTextColor={C.textMuted} style={{ flex: 1, backgroundColor: C.card, borderWidth: 1, borderColor: C.border, paddingHorizontal: 18, height: 48, borderRadius: 24, fontWeight: "600", color: C.textPrimary }} onSubmitEditing={send} returnKeyType="send" />
        <Pressable onPress={send} style={{ width: 48, height: 48, borderRadius: 24, backgroundColor: C.textPrimary, justifyContent: "center", alignItems: "center" }}><Ionicons name="send" size={18} color={C.card} /></Pressable>
      </View>
    </View>
  );
}

export default function CustomerOrders() {
  const insets = useSafeAreaInsets();
  const C = CUSTOMER_COLORS;
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const load = async () => {
    const { data } = await getOrders();
    setOrders((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    load();

    // React Strict Mode (and remounts from navigation) can cause the effect to
    // re-run while a previous Realtime channel with the same topic name still
    // lingers in the RealtimeClient's internal registry.
    //
    // removeChannel() is async: it awaits a WebSocket leave round-trip
    // (up to 10 s) before _remove() splices the channel out of the internal
    // `channels` array. Calling it fire-and-forget leaves the stale channel
    // in the array, so channel() returns the leaving-state channel on which
    // .on() does not throw (only 'joined'/'joining' are checked) but
    // .subscribe() silently no-ops (isClosed() is false for 'leaving').
    //
    // Fix: synchronously splice stale channels out of the array (mirroring
    // RealtimeClient._remove) so channel() creates a genuinely fresh
    // instance, and fire-and-forget removeChannel for WS-level cleanup.
    const topic = "orders-realtime-cust";
    const realtimeTopic = `realtime:${topic}`;
    const stale = supabase.getChannels().filter((c) => c.topic === realtimeTopic);
    stale.forEach((c) => supabase.removeChannel(c));
    supabase.realtime.channels = supabase.realtime.channels.filter(
      (c) => c.topic !== realtimeTopic
    );

    const channel = supabase
      .channel(topic)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        load();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  return (
    <View style={{ flex: 1, backgroundColor: C.background }}>
      <View style={{ flexDirection: "row", alignItems: "center", paddingHorizontal: 20, paddingTop: insets.top + 12, paddingBottom: 16 }}>
        <Pressable onPress={() => router.back()} style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: C.card, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.border }}>
          <Ionicons name="arrow-back" size={20} color={C.textPrimary} />
        </Pressable>
        <Text style={{ fontSize: 18, fontWeight: "900", color: C.textPrimary, marginLeft: 14 }}>My Orders</Text>
      </View>

      {loading ? (
        <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}><ActivityIndicator size="large" color={C.textPrimary} /></View>
      ) : (
        <FlatList
          data={orders}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 130 }}
          renderItem={({ item }) => {
            const cfg = STATUS_CONFIG[item.status] || STATUS_CONFIG.pending;
            return (
              <Pressable onPress={() => setSelectedOrder(item)} style={{ backgroundColor: C.card, borderRadius: 20, borderWidth: 1, borderColor: C.border, padding: 16, marginBottom: 12 }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: C.searchBg, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.border }}>
                      <Ionicons name={cfg.icon} size={20} color={C.textPrimary} />
                    </View>
                    <View>
                      <Text style={{ fontSize: 14, fontWeight: "900", color: C.textPrimary }}>#{item.id.slice(0, 8).toUpperCase()}</Text>
                      <Text style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{new Date(item.created_at).toLocaleDateString()} • {item.payment_method}</Text>
                    </View>
                  </View>
                  <View style={{ backgroundColor: cfg.bg, paddingHorizontal: 10, paddingVertical: 5, borderRadius: 12, flexDirection: "row", alignItems: "center", gap: 5 }}>
                    <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: cfg.color }} />
                    <Text style={{ fontSize: 11, fontWeight: "800", color: cfg.color }}>{cfg.label}</Text>
                  </View>
                </View>
                <View style={{ height: 1, backgroundColor: C.border, marginVertical: 12 }} />
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                    <View style={{ backgroundColor: C.searchBg, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1, borderColor: C.border }}>
                      <Text style={{ fontSize: 13, fontWeight: "900", color: C.textPrimary }}>{item.total} EGP</Text>
                    </View>
                    <Pressable style={{ backgroundColor: C.textPrimary, width: 34, height: 34, borderRadius: 17, justifyContent: "center", alignItems: "center" }}>
                      <Ionicons name="chatbubble-ellipses-outline" size={16} color={C.card} />
                    </Pressable>
                  </View>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                    <Text style={{ fontSize: 12, fontWeight: "700", color: C.textSecondary }}>Chat & Edit</Text>
                    <Ionicons name="chevron-forward" size={14} color={C.textSecondary} />
                  </View>
                </View>
              </Pressable>
            );
          }}
          ListEmptyComponent={
            <View style={{ alignItems: "center", marginTop: 80 }}>
              <View style={{ width: 80, height: 80, borderRadius: 40, backgroundColor: C.card, justifyContent: "center", alignItems: "center", borderWidth: 1, borderColor: C.border }}>
                <Ionicons name="receipt-outline" size={36} color={C.textMuted} />
              </View>
              <Text style={{ fontSize: 16, fontWeight: "800", color: C.textPrimary, marginTop: 14 }}>No orders yet</Text>
              <Text style={{ fontSize: 13, color: C.textMuted, marginTop: 4 }}>Your French journey starts here</Text>
            </View>
          }
        />
      )}

      <Modal visible={!!selectedOrder} transparent animationType="slide" onRequestClose={() => setSelectedOrder(null)}>
        <View style={{ flex: 1, backgroundColor: "rgba(43,33,23,0.4)", justifyContent: "flex-end" }}>
          {selectedOrder && <CustomerChatBox orderId={selectedOrder.id} status={selectedOrder.status} onClose={() => setSelectedOrder(null)} />}
        </View>
      </Modal>
    </View>
  );
}