import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import CheckoutStepper from "../../components/CheckoutStepper";
import CustomButton from "../../components/CustomButton";
import PaymentInfoStripe from "../../components/PaymentInfoStripe";
import { useSupabaseQuery } from "../../hooks/useSupabaseQuery";
import { useStoreSettings } from "../../hooks/useStoreSettings";
import {
  createOrder,
  DELIVERY_OPTIONS,
  DeliveryOption,
  getAddresses,
  validateCoupon,
} from "../../lib/queries";
import { useAuthStore } from "../../store/auth.store";
import { useCartStore } from "../../store/cart.store";

type PaymentMethod = "cash" | "card" | "wallet";

export default function Checkout() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const profile = useAuthStore((state) => state.profile);

  const items = useCartStore((state) => state.items);
  const totalPrice = useCartStore((state) => state.getTotalPrice());
  const clearCart = useCartStore((state) => state.clearCart);

  const { data: addresses, loading: loadingAddresses } = useSupabaseQuery({
    fn: getAddresses,
    params: { userId: user?.id ?? "" },
    skip: !user,
  });

  const { data: deliveryOptions } = useStoreSettings();

  const [step, setStep] = useState(0);

  // Step 1: Address
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(
    null,
  );
  const [phone, setPhone] = useState(profile?.phone ?? "");

  // Step 2: Delivery
  const [deliveryType, setDeliveryType] =
    useState<DeliveryOption["id"]>("standard");
  const [notes, setNotes] = useState("");

  // Step 3: Payment
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("cash");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discountAmount: number;
  } | null>(null);
  const [checkingCoupon, setCheckingCoupon] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const deliveryFee =
    deliveryOptions.find((d) => d.id === deliveryType)?.fee ?? 30;
  const discountAmount = appliedCoupon?.discountAmount ?? 0;
  const finalTotal = totalPrice + deliveryFee - discountAmount;

  const steps = [
    t("checkout.stepAddress"),
    t("checkout.stepDelivery"),
    t("checkout.stepPayment"),
  ];

  const handleApplyCoupon = async () => {
    if (!couponInput.trim()) return;
    setCheckingCoupon(true);

    try {
      const result = await validateCoupon({
        code: couponInput,
        orderTotal: totalPrice,
      });

      if (!result.valid) {
        const messages: Record<string, string> = {
          not_found: t("checkout.couponNotFound"),
          expired: t("checkout.couponExpired"),
          inactive: t("checkout.couponInactive"),
          limit_reached: t("checkout.couponLimitReached"),
          min_order: t("checkout.couponMinOrder"),
        };
        Alert.alert(t("checkout.invalidCoupon"), messages[result.reason]);
        return;
      }

      setAppliedCoupon({
        id: result.coupon.id,
        code: result.coupon.code,
        discountAmount: result.discountAmount,
      });
    } catch {
      Alert.alert(t("common.somethingWentWrong"));
    } finally {
      setCheckingCoupon(false);
    }
  };

  const handleNext = () => {
    if (step === 0 && !selectedAddressId) {
      Alert.alert(t("checkout.error"), t("checkout.selectAddress"));
      return;
    }
    setStep((s) => Math.min(s + 1, 2));
  };

  const handleBack = () => {
    if (step === 0) {
      router.back();
      return;
    }
    setStep((s) => s - 1);
  };

  const handlePlaceOrder = async () => {
    if (!user || !selectedAddressId) return;

    setSubmitting(true);

    try {
      const result = await createOrder({
        userId: user.id,
        addressId: selectedAddressId,
        paymentMethod,
        subtotal: totalPrice,
        deliveryFee,
        discountAmount,
        couponCode: appliedCoupon?.code,
        couponId: appliedCoupon?.id,
        total: finalTotal,
        customerNote: notes || undefined,
        items: items.map((item) => ({
          productId: item.id,
          productName: item.name,
          unitPrice: item.price,
          quantity: item.quantity,
        })),
      });

      if (!result.success) {
        Alert.alert(
          t("checkout.orderFailed"),
          result.error?.message || t("common.somethingWentWrong"),
        );
        return;
      }

      if (!result.data || !result.data.order) {
        Alert.alert(t("checkout.orderFailed"), t("common.somethingWentWrong"));
        return;
      }

      const order = result.data.order;
      clearCart();
      router.replace({
        pathname: "/order/success",
        params: { id: order.id },
      });
    } catch (error: any) {
      Alert.alert(
        t("checkout.orderFailed"),
        error?.message || t("common.somethingWentWrong"),
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-white">
      <View className="flex-row items-center justify-between px-5 py-3">
        <Pressable onPress={handleBack}>
          <ChevronLeft size={24} color="#1a1a1a" />
        </Pressable>

        <Text className="h1-bold text-dark-100">{t("checkout.title")}</Text>

        <View className="size-6" />
      </View>

      <CheckoutStepper steps={steps} currentStep={step} />

      <ScrollView contentContainerClassName="px-5 pb-6 gap-y-6">
        {/* Step 1: Address */}
        {step === 0 && (
          <View className="gap-y-5">
            <View>
              <Text className="h3-bold text-dark-100 mb-3">
                {t("checkout.deliveryAddress")}
              </Text>

              {loadingAddresses ? (
                <ActivityIndicator color="#FE8C00" />
              ) : !addresses?.data || addresses.data.length === 0 ? (
                <Pressable
                  onPress={() => router.push("/address/add")}
                  className="border border-dashed border-gray-200 rounded-2xl p-5 items-center"
                >
                  <Text className="paragraph-bold text-primary">
                    {t("checkout.addAddress")}
                  </Text>
                </Pressable>
              ) : (
                <View className="gap-y-3">
                  {addresses?.data?.map((address: any) => {
                    const isSelected = selectedAddressId === address.id;

                    return (
                      <Pressable
                        key={address.id}
                        onPress={() => setSelectedAddressId(address.id)}
                        className={
                          isSelected
                            ? "border-2 border-primary rounded-2xl p-4"
                            : "border border-gray-200 rounded-2xl p-4"
                        }
                      >
                        <Text className="paragraph-bold text-dark-100">
                          {address.label || t("checkout.address")}
                        </Text>
                        <Text className="paragraph-regular text-gray-100 mt-1">
                          {address.address_line}
                        </Text>
                      </Pressable>
                    );
                  })}

                  <Pressable
                    onPress={() => router.push("/address/add")}
                    className="items-center py-2"
                  >
                    <Text className="paragraph-bold text-primary">
                      {t("checkout.addNewAddress")}
                    </Text>
                  </Pressable>
                </View>
              )}
            </View>

            <View>
              <Text className="h3-bold text-dark-100 mb-3">
                {t("checkout.contactInfo")}
              </Text>

              <View className="border border-gray-200 rounded-2xl p-4 gap-y-3">
                <View className="flex-row items-center justify-between">
                  <Text className="paragraph-regular text-gray-100">
                    {t("checkout.phone")}
                  </Text>
                  <TextInput
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    className="paragraph-bold text-dark-100 flex-1 text-right"
                  />
                </View>

                <View className="flex-row items-center justify-between border-t border-gray-100 pt-3">
                  <Text className="paragraph-regular text-gray-100">
                    {t("checkout.email")}
                  </Text>
                  <Text className="paragraph-bold text-dark-100">
                    {profile?.email}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* Step 2: Delivery */}
        {step === 1 && (
          <View className="gap-y-5">
            <View>
              <Text className="h3-bold text-dark-100 mb-3">
                {t("checkout.deliveryMethod")}
              </Text>

              <View className="gap-y-3">
                {(deliveryOptions ?? []).map((option) => {
                  const isSelected = deliveryType === option.id;

                  return (
                    <Pressable
                      key={option.id}
                      onPress={() => setDeliveryType(option.id)}
                      className={
                        isSelected
                          ? "border-2 border-primary rounded-2xl p-4 flex-row items-center justify-between"
                          : "border border-gray-200 rounded-2xl p-4 flex-row items-center justify-between"
                      }
                    >
                      <View>
                        <Text className="paragraph-bold text-dark-100">
                          {option.label}
                        </Text>
                        <Text className="paragraph-regular text-gray-100 mt-1">
                          {option.time}
                        </Text>
                      </View>

                      <Text className="paragraph-bold text-dark-100">
                        {option.fee === 0
                          ? t("checkout.free")
                          : `${option.fee} ${t("common.currency")}`}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View>
              <Text className="h3-bold text-dark-100 mb-3">
                {t("checkout.orderNotes")}
              </Text>

              <TextInput
                value={notes}
                onChangeText={setNotes}
                placeholder={t("checkout.orderNotesPlaceholder")}
                multiline
                numberOfLines={3}
                className="border border-gray-200 rounded-2xl p-4 paragraph-regular text-dark-100"
                style={{ textAlignVertical: "top" }}
              />
            </View>
          </View>
        )}

        {/* Step 3: Payment */}
        {step === 2 && (
          <View className="gap-y-5">
            <View>
              <Text className="h3-bold text-dark-100 mb-3">
                {t("checkout.paymentMethod")}
              </Text>

              <View className="gap-y-3">
                <Pressable
                  onPress={() => setPaymentMethod("cash")}
                  className={
                    paymentMethod === "cash"
                      ? "border-2 border-primary rounded-2xl p-4"
                      : "border border-gray-200 rounded-2xl p-4"
                  }
                >
                  <Text className="paragraph-bold text-dark-100">
                    {t("checkout.cashOnDelivery")}
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setPaymentMethod("card")}
                  className={
                    paymentMethod === "card"
                      ? "border-2 border-primary rounded-2xl p-4"
                      : "border border-gray-200 rounded-2xl p-4"
                  }
                >
                  <Text className="paragraph-bold text-dark-100">
                    {t("checkout.cardPayment")}
                  </Text>
                </Pressable>

                <View className="border border-gray-100 rounded-2xl p-4 opacity-50">
                  <Text className="paragraph-bold text-gray-300">
                    {t("checkout.walletComingSoon")}
                  </Text>
                </View>
              </View>
            </View>

            <View>
              <Text className="h3-bold text-dark-100 mb-3">
                {t("checkout.haveCoupon")}
              </Text>

              {appliedCoupon ? (
                <View className="flex-row items-center justify-between border border-primary bg-primary/5 rounded-2xl p-4">
                  <Text className="paragraph-bold text-primary">
                    {appliedCoupon.code}
                  </Text>
                  <Pressable onPress={() => setAppliedCoupon(null)}>
                    <Text className="paragraph-regular text-gray-100">
                      {t("common.remove")}
                    </Text>
                  </Pressable>
                </View>
              ) : (
                <View className="flex-row gap-x-2">
                  <TextInput
                    value={couponInput}
                    onChangeText={setCouponInput}
                    placeholder={t("checkout.couponPlaceholder")}
                    autoCapitalize="characters"
                    className="flex-1 border border-gray-200 rounded-2xl px-4 py-3 paragraph-regular text-dark-100"
                  />
                  <Pressable
                    onPress={handleApplyCoupon}
                    disabled={checkingCoupon}
                    className="bg-dark-100 rounded-2xl px-5 items-center justify-center"
                  >
                    {checkingCoupon ? (
                      <ActivityIndicator color="white" size="small" />
                    ) : (
                      <Text className="paragraph-bold text-white">
                        {t("checkout.apply")}
                      </Text>
                    )}
                  </Pressable>
                </View>
              )}
            </View>

            <View className="border border-gray-200 p-5 rounded-2xl">
              <Text className="h3-bold text-dark-100 mb-4">
                {t("checkout.paymentSummary")}
              </Text>

              <PaymentInfoStripe
                label={t("checkout.subtotal")}
                value={`${totalPrice} ${t("common.currency")}`}
              />
              <PaymentInfoStripe
                label={t("checkout.deliveryFee")}
                value={
                  deliveryFee === 0
                    ? t("checkout.free")
                    : `${deliveryFee} ${t("common.currency")}`
                }
              />

              {appliedCoupon && (
                <PaymentInfoStripe
                  label={t("checkout.discount")}
                  value={`- ${discountAmount} ${t("common.currency")}`}
                  valueStyle="!text-success"
                />
              )}

              <View className="border-t border-gray-200 my-2" />

              <PaymentInfoStripe
                label={t("checkout.total")}
                value={`${finalTotal} ${t("common.currency")}`}
                labelStyle="base-bold !text-dark-100"
                valueStyle="base-bold !text-dark-100"
              />
            </View>
          </View>
        )}
      </ScrollView>

      <View className="px-5 py-4 border-t border-gray-100">
        <CustomButton
          title={
            step === 2
              ? `${t("checkout.placeOrder")} - ${finalTotal} ${t("common.currency")}`
              : t("checkout.continue")
          }
          isLoading={submitting}
          onPress={step === 2 ? handlePlaceOrder : handleNext}
        />
      </View>
    </SafeAreaView>
  );
}
