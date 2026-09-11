import cn from "clsx";
import { Text, View } from "react-native";

type CheckoutStepperProps = {
  steps: string[];
  currentStep: number; // 0-indexed
};

const CheckoutStepper = ({ steps, currentStep }: CheckoutStepperProps) => {
  return (
    <View className="flex-row items-center justify-center px-5 py-4">
      {steps.map((label, index) => {
        const isActive = index === currentStep;
        const isCompleted = index < currentStep;

        return (
          <View key={label} className="flex-row items-center">
            <View className="items-center gap-y-1">
              <View
                className={cn(
                  "size-7 rounded-full items-center justify-center",
                  isActive || isCompleted ? "bg-dark-100" : "bg-gray-100",
                )}
              >
                <Text
                  className={cn(
                    "small-bold",
                    isActive || isCompleted ? "text-white" : "text-gray-400",
                  )}
                >
                  {index + 1}
                </Text>
              </View>

              <Text
                className={cn(
                  "small-bold",
                  isActive ? "text-dark-100" : "text-gray-300",
                )}
              >
                {label}
              </Text>
            </View>

            {index < steps.length - 1 && (
              <View className="w-10 h-[1px] bg-gray-200 mx-2 mb-4" />
            )}
          </View>
        );
      })}
    </View>
  );
};

export default CheckoutStepper;
