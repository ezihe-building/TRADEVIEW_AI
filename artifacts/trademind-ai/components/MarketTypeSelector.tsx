import React from "react";
import { ScrollView, StyleSheet, Text, TouchableOpacity } from "react-native";
import { useColors } from "@/hooks/useColors";

const MARKETS = ["crypto", "forex", "stocks", "indices"] as const;
type MarketType = (typeof MARKETS)[number];

interface MarketTypeSelectorProps {
  selected: MarketType;
  onSelect: (m: MarketType) => void;
}

export function MarketTypeSelector({ selected, onSelect }: MarketTypeSelectorProps) {
  const colors = useColors();

  const labels: Record<MarketType, string> = {
    crypto: "Crypto",
    forex: "Forex",
    stocks: "Stocks",
    indices: "Indices",
  };

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {MARKETS.map((m) => {
        const active = selected === m;
        return (
          <TouchableOpacity
            key={m}
            onPress={() => onSelect(m)}
            style={[
              styles.pill,
              {
                backgroundColor: active ? colors.primary + "22" : colors.surface,
                borderColor: active ? colors.primary : colors.border,
              },
            ]}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.label,
                { color: active ? colors.primary : colors.mutedForeground },
              ]}
            >
              {labels[m]}
            </Text>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { gap: 8, paddingHorizontal: 20 },
  pill: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  label: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
});
