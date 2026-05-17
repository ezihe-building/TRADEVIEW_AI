import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface RiskBadgeProps {
  risk: "low" | "medium" | "high";
}

export function RiskBadge({ risk }: RiskBadgeProps) {
  const colors = useColors();

  const config = {
    low: { color: colors.bullish, bg: colors.glow, label: "LOW RISK" },
    medium: { color: colors.neutral, bg: "#FFB80022", label: "MED RISK" },
    high: { color: colors.bearish, bg: "#FF3B5C22", label: "HIGH RISK" },
  };

  const c = config[risk];

  return (
    <View
      style={[
        styles.badge,
        { backgroundColor: c.bg, borderColor: c.color + "55" },
      ]}
    >
      <Text style={[styles.label, { color: c.color }]}>{c.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  label: {
    fontFamily: "Inter_700Bold",
    fontSize: 10,
    letterSpacing: 0.5,
  },
});
