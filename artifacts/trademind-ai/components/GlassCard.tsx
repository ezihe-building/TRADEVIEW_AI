import React from "react";
import {
  StyleSheet,
  View,
  ViewStyle,
} from "react-native";
import { useColors } from "@/hooks/useColors";

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle | ViewStyle[] | (ViewStyle | undefined)[];
  glow?: "green" | "blue" | "red" | "none";
}

export function GlassCard({ children, style, glow = "none" }: GlassCardProps) {
  const colors = useColors();

  const glowColor =
    glow === "green"
      ? colors.glow
      : glow === "blue"
        ? colors.glowBlue
        : glow === "red"
          ? "#FF3B5C33"
          : "transparent";

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: glow !== "none" ? glowColor : colors.border,
          borderWidth: 1,
          shadowColor: glow !== "none" ? glowColor : "transparent",
        },
        style,
      ]}
    >
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 1,
    shadowRadius: 12,
    elevation: 4,
  },
});
