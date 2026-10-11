import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { MoreHorizontal } from "lucide-react-native";

const AdminMoreTrigger: React.FC = () => {
  return (
    <Pressable style={styles.container}>
      <MoreHorizontal size={24} color="#181C2E" />
    </Pressable>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 44,
    height: 44,
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
  },
});

export default AdminMoreTrigger;