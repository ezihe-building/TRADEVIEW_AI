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
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth, useUser } from "@clerk/expo";
import { useColors } from "@/hooks/useColors";
import { useAnalysis } from "@/context/AnalysisContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { GlassCard } from "@/components/GlassCard";

export default function SettingsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { analyses, clearHistory } = useAnalysis();
  const { plan, isPro, isBase, scansRemaining, cancelSubscription } = useSubscription();
  const { signOut } = useAuth();
  const { user } = useUser();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const planLabel = plan.tier === "pro" ? "Pro" : plan.tier === "base" ? "Base" : "Free";
  const planColor = plan.tier === "pro" ? colors.primary : plan.tier === "base" ? colors.accent : colors.mutedForeground;

  function confirmClear() {
    Alert.alert(
      "Clear History",
      "Remove all analyzed charts? This cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Clear All", style: "destructive",
          onPress: async () => {
            await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
            clearHistory();
          },
        },
      ]
    );
  }

  function confirmSignOut() {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out", style: "destructive",
        onPress: async () => {
          await signOut();
          router.replace("/(auth)/sign-in");
        },
      },
    ]);
  }

  function confirmCancel() {
    Alert.alert(
      "Cancel Subscription",
      "Your plan will revert to Free. You'll lose access to premium features.",
      [
        { text: "Keep Plan", style: "cancel" },
        {
          text: "Cancel Subscription", style: "destructive",
          onPress: () => {
            cancelSubscription();
            Alert.alert("Cancelled", "Your subscription has been cancelled.");
          },
        },
      ]
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 16, paddingBottom: 120 }]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Settings</Text>

        {user && (
          <GlassCard style={styles.profileCard}>
            <View style={[styles.avatar, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
              <Text style={[styles.avatarText, { color: colors.primary }]}>
                {(user.firstName?.[0] ?? user.emailAddresses[0]?.emailAddress?.[0] ?? "?").toUpperCase()}
              </Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: colors.foreground }]}>
                {user.firstName ? `${user.firstName} ${user.lastName ?? ""}`.trim() : "Trader"}
              </Text>
              <Text style={[styles.profileEmail, { color: colors.mutedForeground }]}>
                {user.emailAddresses[0]?.emailAddress ?? ""}
              </Text>
            </View>
            <View style={[styles.planPill, { backgroundColor: planColor + "22", borderColor: planColor + "44" }]}>
              <Text style={[styles.planPillText, { color: planColor }]}>{planLabel}</Text>
            </View>
          </GlassCard>
        )}

        <GlassCard
          glow={isPro ? "green" : isBase ? "blue" : "none"}
          style={styles.subscriptionCard}
        >
          <View style={styles.subCardTop}>
            <View>
              <Text style={[styles.subCardLabel, { color: colors.mutedForeground }]}>Current Plan</Text>
              <Text style={[styles.subCardPlan, { color: planColor }]}>
                {planLabel}{plan.interval ? ` · ${plan.interval}` : ""}
              </Text>
            </View>
            <View style={[styles.scansPill, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "33" }]}>
              <Feather name="zap" size={12} color={colors.primary} />
              <Text style={[styles.scansPillText, { color: colors.primary }]}>
                {isPro ? "Unlimited" : `${scansRemaining} scans left`}
              </Text>
            </View>
          </View>
          {!isPro && (
            <TouchableOpacity
              style={[styles.upgradeBtn, { backgroundColor: colors.primary }]}
              onPress={() => router.push("/subscription")}
              activeOpacity={0.85}
            >
              <Feather name="zap" size={15} color={colors.primaryForeground} />
              <Text style={[styles.upgradeBtnText, { color: colors.primaryForeground }]}>
                {isBase ? "Upgrade to Pro" : "Upgrade Plan"}
              </Text>
            </TouchableOpacity>
          )}
          {(isPro || isBase) && (
            <TouchableOpacity onPress={confirmCancel} style={styles.manageSubBtn}>
              <Text style={[styles.manageSubText, { color: colors.mutedForeground }]}>Manage subscription</Text>
            </TouchableOpacity>
          )}
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Statistics</Text>
        <GlassCard style={styles.statsCard}>
          <View style={styles.statRow}>
            <StatItem label="Charts Analyzed" value={analyses.length.toString()} color={colors.accent} />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <StatItem
              label="Bullish"
              value={analyses.filter((a) => a.sentiment === "bullish").length.toString()}
              color={colors.bullish}
            />
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <StatItem
              label="Bearish"
              value={analyses.filter((a) => a.sentiment === "bearish").length.toString()}
              color={colors.bearish}
            />
          </View>
        </GlassCard>

        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>AI Capabilities</Text>
        <GlassCard style={styles.featuresCard}>
          {AI_FEATURES.map((f, i) => (
            <View key={f.label}>
              <View style={styles.featureRow}>
                <View style={[styles.featureIcon, { backgroundColor: colors.primary + "22" }]}>
                  <Feather name={f.icon as any} size={14} color={colors.primary} />
                </View>
                <Text style={[styles.featureLabel, { color: colors.foreground }]}>{f.label}</Text>
                <Feather name="check" size={14} color={colors.bullish} />
              </View>
              {i < AI_FEATURES.length - 1 && (
                <View style={[styles.sep, { backgroundColor: colors.border }]} />
              )}
            </View>
          ))}
        </GlassCard>

        <View style={styles.actionsGroup}>
          {analyses.length > 0 && (
            <TouchableOpacity
              style={[styles.actionBtn, { borderColor: colors.bearish + "55", backgroundColor: colors.bearish + "11" }]}
              onPress={confirmClear}
              activeOpacity={0.8}
            >
              <Feather name="trash-2" size={16} color={colors.bearish} />
              <Text style={[styles.actionBtnText, { color: colors.bearish }]}>Clear Analysis History</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.actionBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={confirmSignOut}
            activeOpacity={0.8}
          >
            <Feather name="log-out" size={16} color={colors.mutedForeground} />
            <Text style={[styles.actionBtnText, { color: colors.mutedForeground }]}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <Text style={[styles.versionText, { color: colors.mutedForeground }]}>
          TradeMind AI v1.0.0
        </Text>
      </ScrollView>
    </View>
  );
}

function StatItem({ label, value, color }: { label: string; value: string; color: string }) {
  const colors = useColors();
  return (
    <View style={styles.statItem}>
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </View>
  );
}

const AI_FEATURES = [
  { label: "Candlestick Pattern Recognition", icon: "eye" },
  { label: "Support & Resistance Detection", icon: "layers" },
  { label: "Entry / Stop Loss / Take Profit", icon: "target" },
  { label: "Risk/Reward Ratio Calculation", icon: "percent" },
  { label: "Market Sentiment Classification", icon: "activity" },
  { label: "Multi-Timeframe Analysis", icon: "clock" },
  { label: "Trade Management Guidance", icon: "sliders" },
];

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 24 },
  profileCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16 },
  avatar: {
    width: 52, height: 52, borderRadius: 16, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  avatarText: { fontFamily: "Inter_700Bold", fontSize: 22 },
  profileName: { fontFamily: "Inter_700Bold", fontSize: 16 },
  profileEmail: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  planPill: {
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  planPillText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  subscriptionCard: { gap: 14 },
  subCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  subCardLabel: { fontFamily: "Inter_400Regular", fontSize: 12, marginBottom: 2 },
  subCardPlan: { fontFamily: "Inter_700Bold", fontSize: 18 },
  scansPill: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
  },
  scansPillText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  upgradeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 13, borderRadius: 12,
  },
  upgradeBtnText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  manageSubBtn: { alignItems: "center" },
  manageSubText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  statsCard: { padding: 20 },
  statRow: { flexDirection: "row", alignItems: "center" },
  statItem: { flex: 1, alignItems: "center", gap: 4 },
  statValue: { fontFamily: "Inter_700Bold", fontSize: 22 },
  statLabel: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center" },
  divider: { width: 1, height: 40, marginHorizontal: 8 },
  featuresCard: { gap: 0, padding: 0 },
  featureRow: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 14,
  },
  featureIcon: {
    width: 30, height: 30, borderRadius: 8, alignItems: "center", justifyContent: "center",
  },
  featureLabel: { fontFamily: "Inter_400Regular", fontSize: 14, flex: 1 },
  sep: { height: 1, marginHorizontal: 16 },
  actionsGroup: { gap: 10 },
  actionBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
  },
  actionBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  versionText: { fontFamily: "Inter_400Regular", fontSize: 12, textAlign: "center", marginTop: 4 },
});
