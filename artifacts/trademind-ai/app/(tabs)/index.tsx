import React, { useMemo } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAnalysis } from "@/context/AnalysisContext";
import { GlassCard } from "@/components/GlassCard";
import { SignalCard } from "@/components/SignalCard";
import { SentimentBadge } from "@/components/SentimentBadge";

export default function DashboardScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analyses } = useAnalysis();

  const stats = useMemo(() => {
    const total = analyses.length;
    const bullish = analyses.filter((a) => a.sentiment === "bullish").length;
    const bearish = analyses.filter((a) => a.sentiment === "bearish").length;
    const avgConf =
      total > 0
        ? Math.round(analyses.reduce((s, a) => s + a.confidence, 0) / total)
        : 0;
    return { total, bullish, bearish, avgConf };
  }, [analyses]);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topInset + 16, paddingBottom: bottomInset + 100 },
        ]}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
              TradeMind AI
            </Text>
            <Text style={[styles.title, { color: colors.foreground }]}>
              Market Dashboard
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.scanBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/analyzer")}
            activeOpacity={0.85}
          >
            <Feather name="camera" size={18} color={colors.primaryForeground} />
          </TouchableOpacity>
        </View>

        {/* Stats Row */}
        <View style={styles.statsRow}>
          <StatCard
            label="Signals"
            value={stats.total.toString()}
            icon="activity"
            color={colors.accent}
          />
          <StatCard
            label="Bullish"
            value={stats.bullish.toString()}
            icon="trending-up"
            color={colors.bullish}
          />
          <StatCard
            label="Bearish"
            value={stats.bearish.toString()}
            icon="trending-down"
            color={colors.bearish}
          />
          <StatCard
            label="Avg Conf"
            value={`${stats.avgConf}%`}
            icon="cpu"
            color={colors.neutral}
          />
        </View>

        {/* Market Overview */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Market Overview
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.marketRow}
        >
          {MARKET_OVERVIEW.map((m) => (
            <MarketChip key={m.pair} {...m} />
          ))}
        </ScrollView>

        {/* Recent Signals */}
        <View style={styles.sectionHeader}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
            Recent Signals
          </Text>
          {analyses.length > 0 && (
            <TouchableOpacity onPress={() => router.push("/(tabs)/analyzer")}>
              <Text style={[styles.seeAll, { color: colors.accent }]}>
                + New
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {analyses.length === 0 ? (
          <EmptyState />
        ) : (
          <View style={styles.signalList}>
            {analyses.slice(0, 5).map((a) => (
              <SignalCard
                key={a.id}
                analysis={a}
                onPress={() =>
                  router.push({
                    pathname: "/analysis/[id]",
                    params: { id: a.id },
                  })
                }
              />
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatCard({
  label,
  value,
  icon,
  color,
}: {
  label: string;
  value: string;
  icon: any;
  color: string;
}) {
  const colors = useColors();
  return (
    <GlassCard style={styles.statCard}>
      <View
        style={[
          styles.statIcon,
          { backgroundColor: color + "22", borderColor: color + "44" },
        ]}
      >
        <Feather name={icon} size={14} color={color} />
      </View>
      <Text style={[styles.statValue, { color: colors.foreground }]}>
        {value}
      </Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>
        {label}
      </Text>
    </GlassCard>
  );
}

function MarketChip({
  pair,
  change,
  sentiment,
}: {
  pair: string;
  change: string;
  sentiment: "bullish" | "bearish" | "neutral";
}) {
  const colors = useColors();
  const isPositive = !change.startsWith("-");
  const color = isPositive ? colors.bullish : colors.bearish;

  return (
    <GlassCard
      style={styles.marketChip}
      glow={sentiment === "bullish" ? "green" : sentiment === "bearish" ? "red" : "none"}
    >
      <Text style={[styles.chipPair, { color: colors.foreground }]}>{pair}</Text>
      <Text style={[styles.chipChange, { color }]}>{change}</Text>
      <SentimentBadge sentiment={sentiment} size="sm" />
    </GlassCard>
  );
}

function EmptyState() {
  const colors = useColors();
  return (
    <GlassCard style={styles.emptyCard}>
      <View style={styles.emptyInner}>
        <View
          style={[
            styles.emptyIcon,
            { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" },
          ]}
        >
          <Feather name="bar-chart-2" size={28} color={colors.primary} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.foreground }]}>
          No signals yet
        </Text>
        <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
          Upload a chart screenshot to get your first AI analysis
        </Text>
        <TouchableOpacity
          style={[styles.emptyBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(tabs)/analyzer")}
          activeOpacity={0.85}
        >
          <Feather name="upload" size={16} color={colors.primaryForeground} />
          <Text style={[styles.emptyBtnText, { color: colors.primaryForeground }]}>
            Analyze Chart
          </Text>
        </TouchableOpacity>
      </View>
    </GlassCard>
  );
}

const MARKET_OVERVIEW = [
  { pair: "BTC/USD", change: "+2.4%", sentiment: "bullish" as const },
  { pair: "ETH/USD", change: "+1.8%", sentiment: "bullish" as const },
  { pair: "EUR/USD", change: "-0.3%", sentiment: "bearish" as const },
  { pair: "GBP/USD", change: "+0.1%", sentiment: "neutral" as const },
  { pair: "SPX500", change: "+0.6%", sentiment: "bullish" as const },
  { pair: "GOLD", change: "-0.2%", sentiment: "neutral" as const },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 20 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 12, letterSpacing: 1 },
  title: { fontFamily: "Inter_700Bold", fontSize: 24, marginTop: 2 },
  scanBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  statsRow: { flexDirection: "row", gap: 10 },
  statCard: { flex: 1, padding: 12, gap: 4, alignItems: "center" },
  statIcon: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 16 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 10 },
  sectionTitle: {
    fontFamily: "Inter_700Bold",
    fontSize: 18,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  seeAll: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  marketRow: { gap: 10, paddingVertical: 4 },
  marketChip: { padding: 12, gap: 6, minWidth: 100, alignItems: "center" },
  chipPair: { fontFamily: "Inter_700Bold", fontSize: 13 },
  chipChange: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  signalList: { gap: 12 },
  emptyCard: { padding: 32 },
  emptyInner: { alignItems: "center", gap: 12 },
  emptyIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  emptyText: {
    fontFamily: "Inter_400Regular",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
  emptyBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 4,
  },
  emptyBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
