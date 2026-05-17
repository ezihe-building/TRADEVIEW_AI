import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/useColors";

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1D", "1W"];

interface TimeframeSelectorProps {
  selected: string;
  onSelect: (tf: string) => void;
}

export function TimeframeSelector({ selected, onSelect }: TimeframeSelectorProps) {
  const colors = useColors();

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {TIMEFRAMES.map((tf) => {
        const active = selected === tf;
        return (
          <TouchableOpacity
            key={tf}
            onPress={() => onSelect(tf)}
            style={[
              styles.pill,
              {
                backgroundColor: active ? colors.accent + "22" : colors.surface,
                borderColor: active ? colors.accent : colors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.label,
                { color: active ? colors.accent : colors.mutedForeground },
              ]}
            >
              {tf}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 6, paddingHorizontal: 20 },
  pill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
});
