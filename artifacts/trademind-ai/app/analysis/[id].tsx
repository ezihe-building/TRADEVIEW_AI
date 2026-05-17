import React from "react";
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { router, useLocalSearchParams } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAnalysis } from "@/context/AnalysisContext";
import { GlassCard } from "@/components/GlassCard";
import { SentimentBadge } from "@/components/SentimentBadge";
import { ConfidenceBar } from "@/components/ConfidenceBar";
import { RiskBadge } from "@/components/RiskBadge";

export default function AnalysisDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analyses } = useAnalysis();

  const analysis = analyses.find((a) => a.id === id);
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  if (!analysis) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.notFound, { paddingTop: topInset + 60 }]}>
          <Feather name="alert-circle" size={48} color={colors.mutedForeground} />
          <Text style={[styles.notFoundText, { color: colors.mutedForeground }]}>
            Analysis not found
          </Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={[styles.backLink, { color: colors.accent }]}>Go back</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  const directionColor =
    analysis.direction === "long"
      ? colors.bullish
      : analysis.direction === "short"
        ? colors.bearish
        : colors.neutral;

  const directionLabel =
    analysis.direction === "long"
      ? "LONG"
      : analysis.direction === "short"
        ? "SHORT"
        : "WAIT";

  const directionIcon =
    analysis.direction === "long"
      ? "arrow-up-right"
      : analysis.direction === "short"
        ? "arrow-down-right"
        : "pause";

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View
        style={[
          styles.header,
          { paddingTop: topInset + 8, borderBottomColor: colors.border },
        ]}
      >
        <TouchableOpacity
          onPress={() => router.back()}
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          activeOpacity={0.7}
        >
          <Feather name="arrow-left" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerPair, { color: colors.foreground }]}>
            {analysis.pair}
          </Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {analysis.timeframe} · {analysis.marketType.toUpperCase()}
          </Text>
        </View>
        <SentimentBadge sentiment={analysis.sentiment} size="sm" />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
      >
        {/* Chart Image */}
        {analysis.imageUri ? (
          <Image
            source={{ uri: analysis.imageUri }}
            style={[styles.chartImage, { borderColor: colors.border }]}
            resizeMode="contain"
          />
        ) : (
          <View
            style={[
              styles.noImage,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <Feather name="image" size={32} color={colors.mutedForeground} />
            <Text style={[styles.noImageText, { color: colors.mutedForeground }]}>
              No chart image
            </Text>
          </View>
        )}

        {/* Signal Summary */}
        <GlassCard
          glow={
            analysis.sentiment === "bullish"
              ? "green"
              : analysis.sentiment === "bearish"
                ? "red"
                : "none"
          }
          style={styles.summaryCard}
        >
          <View style={styles.summaryHeader}>
            <View
              style={[
                styles.directionBig,
                {
                  backgroundColor: directionColor + "22",
                  borderColor: directionColor + "55",
                },
              ]}
            >
              <Feather name={directionIcon as any} size={24} color={directionColor} />
              <Text style={[styles.directionLabel, { color: directionColor }]}>
                {directionLabel}
              </Text>
            </View>
            <View style={styles.summaryRight}>
              <RiskBadge risk={analysis.riskLevel} />
              <Text style={[styles.timestamp, { color: colors.mutedForeground }]}>
                {new Date(analysis.timestamp).toLocaleString()}
              </Text>
            </View>
          </View>
          <ConfidenceBar confidence={analysis.confidence} />
        </GlassCard>

        {/* Key Levels */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Key Levels
        </Text>
        <View style={styles.levelsRow}>
          <LevelCard label="Entry Zone" value={analysis.entry} color={colors.accent} icon="target" />
          <LevelCard label="Stop Loss" value={analysis.stopLoss} color={colors.bearish} icon="shield-off" />
          <LevelCard label="Take Profit" value={analysis.takeProfit} color={colors.bullish} icon="trending-up" />
        </View>

        {/* Patterns & Indicators */}
        {analysis.patterns.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Detected Patterns
            </Text>
            <GlassCard style={styles.tagsCard}>
              <View style={styles.tagWrap}>
                {analysis.patterns.map((p) => (
                  <View
                    key={p}
                    style={[
                      styles.tag,
                      { backgroundColor: colors.accent + "22", borderColor: colors.accent + "44" },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: colors.accent }]}>{p}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          </>
        )}

        {analysis.indicators.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Indicator Signals
            </Text>
            <GlassCard style={styles.tagsCard}>
              <View style={styles.tagWrap}>
                {analysis.indicators.map((ind) => (
                  <View
                    key={ind}
                    style={[
                      styles.tag,
                      { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" },
                    ]}
                  >
                    <Text style={[styles.tagText, { color: colors.primary }]}>{ind}</Text>
                  </View>
                ))}
              </View>
            </GlassCard>
          </>
        )}

        {/* Strategy */}
        {analysis.strategy ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              Recommended Strategy
            </Text>
            <GlassCard glow="blue" style={styles.strategyCard}>
              <Feather name="cpu" size={16} color={colors.accent} />
              <Text style={[styles.strategyText, { color: colors.foreground }]}>
                {analysis.strategy}
              </Text>
            </GlassCard>
          </>
        ) : null}

        {/* Reasoning */}
        {analysis.reasoning ? (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
              AI Reasoning
            </Text>
            <GlassCard style={styles.reasoningCard}>
              <Text style={[styles.reasoningText, { color: colors.foreground }]}>
                {analysis.reasoning}
              </Text>
            </GlassCard>
          </>
        ) : null}

        {/* Disclaimer */}
        <GlassCard style={styles.disclaimer}>
          <Feather name="alert-triangle" size={14} color={colors.neutral} />
          <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
            This analysis is for educational purposes only. Not financial advice. Past patterns do not guarantee future results.
          </Text>
        </GlassCard>

        {/* New Analysis CTA */}
        <TouchableOpacity
          style={[styles.newBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
          onPress={async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            router.push("/(tabs)/analyzer");
          }}
          activeOpacity={0.8}
        >
          <Feather name="plus" size={16} color={colors.accent} />
          <Text style={[styles.newBtnText, { color: colors.accent }]}>
            New Analysis
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function LevelCard({
  label,
  value,
  color,
  icon,
}: {
  label: string;
  value: string;
  color: string;
  icon: any;
}) {
  const colors = useColors();
  return (
    <GlassCard style={styles.levelCard}>
      <View
        style={[
          styles.levelIcon,
          { backgroundColor: color + "22", borderColor: color + "44" },
        ]}
      >
        <Feather name={icon} size={14} color={color} />
      </View>
      <Text style={[styles.levelLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.levelValue, { color }]}>{value}</Text>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    gap: 12,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerCenter: { flex: 1 },
  headerPair: { fontFamily: "Inter_700Bold", fontSize: 18 },
  headerSub: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 1 },
  scroll: { padding: 16, gap: 16, paddingBottom: 40 },
  chartImage: {
    width: "100%",
    height: 220,
    borderRadius: 12,
    borderWidth: 1,
  },
  noImage: {
    width: "100%",
    height: 160,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderStyle: "dashed",
  },
  noImageText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  summaryCard: { gap: 14 },
  summaryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  directionBig: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
  },
  directionLabel: { fontFamily: "Inter_700Bold", fontSize: 16, letterSpacing: 1 },
  summaryRight: { alignItems: "flex-end", gap: 6 },
  timestamp: { fontFamily: "Inter_400Regular", fontSize: 11 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  levelsRow: { flexDirection: "row", gap: 10 },
  levelCard: { flex: 1, alignItems: "center", gap: 6, padding: 12 },
  levelIcon: {
    width: 32,
    height: 32,
    borderRadius: 9,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  levelLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  levelValue: { fontFamily: "Inter_700Bold", fontSize: 14 },
  tagsCard: { padding: 14 },
  tagWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
  },
  tagText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  strategyCard: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
  },
  strategyText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22, flex: 1 },
  reasoningCard: { padding: 16 },
  reasoningText: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 22 },
  disclaimer: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    padding: 12,
  },
  disclaimerText: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 18, flex: 1 },
  newBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  newBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  notFound: { flex: 1, alignItems: "center", gap: 12, paddingHorizontal: 40 },
  notFoundText: { fontFamily: "Inter_400Regular", fontSize: 16 },
  backLink: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
