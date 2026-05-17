import React from "react";
import {
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAnalysis } from "@/context/AnalysisContext";
import { GlassCard } from "@/components/GlassCard";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analyses, clearHistory } = useAnalysis();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  function confirmClear() {
    Alert.alert(
      "Clear History",
      "Remove all analyzed charts? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All",
          style: "destructive",
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            clearHistory();
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topInset + 16, paddingBottom: 120 },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>

        {/* App Info */}
        <GlassCard glow="blue" style={styles.appCard}>
          <View style={styles.appIcon}>
            <Feather name="cpu" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.appName, { color: colors.foreground }]}>
            TradeMind AI
          </Text>
          <Text style={[styles.appVersion, { color: colors.mutedForeground }]}>
            Version 1.0.0
          </Text>
          <Text style={[styles.appDesc, { color: colors.mutedForeground }]}>
            AI-powered trading chart analysis for crypto, forex, stocks & indices
          </Text>
        </GlassCard>

        {/* Stats */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Your Statistics
        </Text>
        <GlassCard style={styles.statsCard}>
          <View style={styles.statRow}>
            <StatItem label="Charts Analyzed" value={analyses.length.toString()} color={colors.accent} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <StatItem
              label="Bullish Signals"
              value={analyses.filter((a) => a.sentiment === "bullish").length.toString()}
              color={colors.bullish}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <StatItem
              label="Bearish Signals"
              value={analyses.filter((a) => a.sentiment === "bearish").length.toString()}
              color={colors.bearish}
            />
          </View>
        </GlassCard>

        {/* Supported Markets */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          Supported Markets
        </Text>
        <GlassCard style={styles.marketsCard}>
          {MARKETS.map((m, i) => (
            <View key={m.name}>
              <View style={styles.marketRow}>
                <View
                  style={[
                    styles.marketIcon,
                    { backgroundColor: m.color + "22", borderColor: m.color + "44" },
                  ]}
                >
                  <Feather name={m.icon as any} size={16} color={m.color} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.marketName, { color: colors.foreground }]}>
                    {m.name}
                  </Text>
                  <Text style={[styles.marketDesc, { color: colors.mutedForeground }]}>
                    {m.desc}
                  </Text>
                </View>
                <View
                  style={[
                    styles.activeDot,
                    { backgroundColor: colors.bullish },
                  ]}
                />
              </View>
              {i < MARKETS.length - 1 && (
                <View style={[styles.sep, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </GlassCard>

        {/* AI Features */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>
          AI Capabilities
        </Text>
        <GlassCard style={styles.featuresCard}>
          {AI_FEATURES.map((f, i) => (
            <View key={f.label}>
              <View style={styles.featureRow}>
                <Feather name={f.icon as any} size={16} color={colors.primary} />
                <Text style={[styles.featureLabel, { color: colors.foreground }]}>
                  {f.label}
                </Text>
              </View>
              {i < AI_FEATURES.length - 1 && (
                <View style={[styles.sep, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </GlassCard>

        {/* Disclaimer */}
        <GlassCard style={styles.disclaimer}>
          <Feather name="shield" size={18} color={colors.neutral} />
          <View style={{ flex: 1 }}>
            <Text style={[styles.disclaimerTitle, { color: colors.foreground }]}>
              Risk Disclaimer
            </Text>
            <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
              TradeMind AI provides technical analysis for educational purposes only. This is not financial advice. Trading involves significant risk. Always conduct your own research and manage your risk accordingly.
            </Text>
          </View>
        </GlassCard>

        {/* Danger Zone */}
        {analyses.length > 0 && (
          <TouchableOpacity
            style={[
              styles.dangerBtn,
              { borderColor: colors.bearish + "55", backgroundColor: colors.bearish + "11" },
            ]}
            onPress={confirmClear}
            activeOpacity={0.8}
          >
            <Feather name="trash-2" size={16} color={colors.bearish} />
            <Text style={[styles.dangerText, { color: colors.bearish }]}>
              Clear Analysis History
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

function StatItem({
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
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const MARKETS = [
  { name: "Cryptocurrency", desc: "BTC, ETH, SOL and more", icon: "zap", color: "#F7931A" },
  { name: "Forex", desc: "EUR/USD, GBP/USD and more", icon: "globe", color: "#00C6FF" },
  { name: "Stocks", desc: "AAPL, TSLA, NVDA and more", icon: "bar-chart", color: "#00FF88" },
  { name: "Indices", desc: "SPX500, NASDAQ and more", icon: "trending-up", color: "#A78BFA" },
];

const AI_FEATURES = [
  { label: "Candlestick Pattern Recognition", icon: "eye" },
  { label: "Support & Resistance Detection", icon: "layers" },
  { label: "Trend Direction Analysis", icon: "trending-up" },
  { label: "Entry / Stop Loss / Take Profit", icon: "target" },
  { label: "Market Sentiment Classification", icon: "activity" },
  { label: "Risk Level Assessment", icon: "shield" },
  { label: "Strategy Recommendations", icon: "cpu" },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 24 },
  appCard: { alignItems: "center", gap: 8, padding: 24 },
  appIcon: {
    width: 64,
    height: 64,
    borderRadius: 18,
    backgroundColor: "#00FF8822",
    borderWidth: 1,
    borderColor: "#00FF8844",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  appName: { fontFamily: "Inter_700Bold", fontSize: 20 },
  appVersion: { fontFamily: "Inter_400Regular", fontSize: 12 },
  appDesc: {
    fontFamily: "Inter_400Regular",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
    marginTop: 4,
  },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  statsCard: { padding: 20 },
  statRow: { flexDirection: "row", alignItems: "center" },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 22 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center" },
  divider: { width: 1, height: 40, marginHorizontal: 8 },
  marketsCard: { gap: 0, padding: 0 },
  marketRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
  },
  marketIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  marketName: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  marketDesc: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  activeDot: { width: 8, height: 8, borderRadius: 4 },
  sep: { height: 1, marginHorizontal: 16 },
  featuresCard: { gap: 0, padding: 0 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
  },
  featureLabel: { fontFamily: "Inter_400Regular", fontSize: 14 },
  disclaimer: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-start",
    padding: 16,
  },
  disclaimerTitle: {
    fontFamily: "Inter_600SemiBold",
    fontSize: 13,
    marginBottom: 4,
  },
  disclaimerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
  },
  dangerBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  dangerText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
});
