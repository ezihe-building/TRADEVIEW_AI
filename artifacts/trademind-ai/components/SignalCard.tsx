import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Feather } from "@expo/vector-icons";
import { useColors } from "@/hooks/useColors";
import { GlassCard } from "./GlassCard";
import { SentimentBadge } from "./SentimentBadge";
import { ConfidenceBar } from "./ConfidenceBar";
import type { TradeAnalysis } from "@/context/AnalysisContext";

interface SignalCardProps {
  analysis: TradeAnalysis;
  onPress: () => void;
}

export function SignalCard({ analysis, onPress }: SignalCardProps) {
  const colors = useColors();

  const directionColor =
    analysis.direction === "long"
      ? colors.bullish
      : analysis.direction === "short"
        ? colors.bearish
        : colors.neutral;

  const directionIcon =
    analysis.direction === "long"
      ? "arrow-up-right"
      : analysis.direction === "short"
        ? "arrow-down-right"
        : "minus";

  const timeAgo = (() => {
    const diff = Date.now() - analysis.timestamp;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  })();

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8}>
      <GlassCard
        glow={
          analysis.sentiment === "bullish"
            ? "green"
            : analysis.sentiment === "bearish"
              ? "red"
              : "none"
        }
        style={styles.card}
      >
        <View style={styles.header}>
          <View style={styles.pairRow}>
            <View
              style={[
                styles.directionDot,
                { backgroundColor: directionColor + "33", borderColor: directionColor },
              ]}
            >
              <Feather name={directionIcon as any} size={14} color={directionColor} />
            </View>
            <View>
              <Text style={[styles.pair, { color: colors.foreground }]}>
                {analysis.pair}
              </Text>
              <Text style={[styles.timeframe, { color: colors.mutedForeground }]}>
                {analysis.timeframe} · {analysis.marketType.toUpperCase()}
              </Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <SentimentBadge sentiment={analysis.sentiment} size="sm" />
            <Text style={[styles.timeAgo, { color: colors.mutedForeground }]}>
              {timeAgo}
            </Text>
          </View>
        </View>

        {analysis.imageUri ? (
          <Image
            source={{ uri: analysis.imageUri }}
            style={[styles.chartThumb, { borderColor: colors.border }]}
            resizeMode="cover"
          />
        ) : null}

        <ConfidenceBar confidence={analysis.confidence} />

        <View style={styles.levels}>
          <LevelItem label="Entry" value={analysis.entry} color={colors.accent} />
          <LevelItem label="SL" value={analysis.stopLoss} color={colors.bearish} />
          <LevelItem label="TP" value={analysis.takeProfit} color={colors.bullish} />
        </View>
      </GlassCard>
    </TouchableOpacity>
  );
}

function LevelItem({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const colors = useColors();
  return (
    <View style={styles.levelItem}>
      <Text style={[styles.levelLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
      <Text style={[styles.levelValue, { color }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { gap: 12 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  pairRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  directionDot: {
    width: 32,
    height: 32,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  pair: { fontFamily: "Inter_700Bold", fontSize: 16 },
  timeframe: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  headerRight: { alignItems: "flex-end", gap: 4 },
  timeAgo: { fontFamily: "Inter_400Regular", fontSize: 11 },
  chartThumb: {
    width: "100%",
    height: 100,
    borderRadius: 8,
    borderWidth: 1,
  },
  levels: { flexDirection: "row", justifyContent: "space-between" },
  levelItem: { alignItems: "center", gap: 2 },
  levelLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  levelValue: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
});
