import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";

interface SentimentBadgeProps {
  sentiment: "bullish" | "bearish" | "neutral";
  size?: "sm" | "md" | "lg";
}

export function SentimentBadge({ sentiment, size = "md" }: SentimentBadgeProps) {
  const colors = useColors();

  const config = {
    bullish: {
      color: colors.bullish,
      bg: colors.glow,
      icon: "trending-up" as const,
      label: "BULLISH",
    },
    bearish: {
      color: colors.bearish,
      bg: "#FF3B5C22",
      icon: "trending-down" as const,
      label: "BEARISH",
    },
    neutral: {
      color: colors.neutral,
      bg: "#FFB80022",
      icon: "minus" as const,
      label: "NEUTRAL",
    },
  };

  const c = config[sentiment];
  const fontSize = size === "sm" ? 10 : size === "lg" ? 14 : 11;
  const iconSize = size === "sm" ? 10 : size === "lg" ? 16 : 12;
  const px = size === "sm" ? 6 : size === "lg" ? 12 : 8;
  const py = size === "sm" ? 3 : size === "lg" ? 6 : 4;

  return (
    <View
      style={[
        styles.badge,
        {
          backgroundColor: c.bg,
          borderColor: c.color + "55",
          paddingHorizontal: px,
          paddingVertical: py,
        },
      ]}
    >
      <Feather name={c.icon} size={iconSize} color={c.color} />
      <Text
        style={[
          styles.label,
          { color: c.color, fontSize, marginLeft: 3 },
        ]}
      >
        {c.label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: "row",
    alignItems: "center",
    borderRadius: 6,
    borderWidth: 1,
  },
  label: {
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
});
