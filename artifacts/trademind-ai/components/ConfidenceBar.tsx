import React, { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";
import { useColors } from "@/hooks/useColors";

interface ConfidenceBarProps {
  confidence: number;
  showLabel?: boolean;
}

export function ConfidenceBar({ confidence, showLabel = true }: ConfidenceBarProps) {
  const colors = useColors();
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: confidence,
      duration: 900,
      useNativeDriver: false,
    }).start();
  }, [confidence]);

  const barColor =
    confidence >= 70
      ? colors.bullish
      : confidence >= 40
        ? colors.neutral
        : colors.bearish;

  const widthInterpolated = anim.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={styles.container}>
      {showLabel && (
        <View style={styles.labelRow}>
          <Text style={[styles.label, { color: colors.mutedForeground }]}>
            AI Confidence
          </Text>
          <Text style={[styles.value, { color: barColor }]}>
            {confidence}%
          </Text>
        </View>
      )}
      <View style={[styles.track, { backgroundColor: colors.surface }]}>
        <Animated.View
          style={[
            styles.fill,
            {
              width: widthInterpolated,
              backgroundColor: barColor,
              shadowColor: barColor,
            },
          ]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6 },
  labelRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  label: { fontFamily: "Inter_400Regular", fontSize: 12 },
  value: { fontFamily: "Inter_700Bold", fontSize: 14 },
  track: {
    height: 6,
    borderRadius: 3,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 3,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
});
