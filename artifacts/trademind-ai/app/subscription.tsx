import React, { useState } from "react";
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
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { GlassCard } from "@/components/GlassCard";
import { useSubscription, type PlanTier, type BillingInterval } from "@/context/SubscriptionContext";

type BillingMode = "weekly" | "monthly";

export default function SubscriptionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { plan, setPlan, isPro, isBase, scansRemaining } = useSubscription();
  const [billing, setBilling] = useState<BillingMode>("monthly");
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const PLANS = [
    {
      tier: "free" as PlanTier,
      name: "Free",
      badge: null,
      weeklyPrice: "$0",
      monthlyPrice: "$0",
      color: colors.mutedForeground,
      features: [
        { text: "3 AI chart scans per day", included: true },
        { text: "Basic market analysis", included: true },
        { text: "Trend detection", included: true },
        { text: "Advanced AI analysis", included: false },
        { text: "Live camera scanning", included: false },
        { text: "Risk/reward calculator", included: false },
        { text: "Priority processing", included: false },
      ],
    },
    {
      tier: "base" as PlanTier,
      name: "Base",
      badge: "POPULAR",
      weeklyPrice: "$5",
      monthlyPrice: "$15",
      color: colors.accent,
      features: [
        { text: "15 AI chart scans per day", included: true },
        { text: "Full technical analysis", included: true },
        { text: "Candlestick pattern detection", included: true },
        { text: "Entry / Stop Loss / Take Profit", included: true },
        { text: "Risk/reward ratios", included: true },
        { text: "Live camera scanning", included: false },
        { text: "Priority AI processing", included: false },
      ],
    },
    {
      tier: "pro" as PlanTier,
      name: "Pro",
      badge: "BEST VALUE",
      weeklyPrice: "$10",
      monthlyPrice: "$30",
      color: colors.primary,
      features: [
        { text: "Unlimited AI chart scans", included: true },
        { text: "Advanced GPT vision analysis", included: true },
        { text: "Full pattern library", included: true },
        { text: "Entry / Stop Loss / Take Profit", included: true },
        { text: "Live camera scanning", included: true },
        { text: "Priority AI processing", included: true },
        { text: "Trade journal & tracking", included: true },
      ],
    },
  ];

  async function handleSubscribe(tier: PlanTier) {
    if (tier === "free") {
      setPlan("free");
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
      return;
    }
    if (tier === plan.tier) {
      router.back();
      return;
    }

    Alert.alert(
      `Upgrade to ${tier === "base" ? "Base" : "Pro"}`,
      `${tier === "base" ? "Base" : "Pro"} plan — ${billing === "weekly" ? (tier === "base" ? "$5/week" : "$10/week") : (tier === "base" ? "$15/month" : "$30/month")}.\n\nTo process payment, connect a Stripe account in your settings. For now, activating your plan in demo mode.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Activate Plan",
          onPress: async () => {
            setPlan(tier, billing);
            await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            Alert.alert(
              "Plan Activated!",
              `You now have ${tier === "pro" ? "unlimited" : "15"} scans ${billing === "weekly" ? "this week" : "per day"}.`,
              [{ text: "Let's Trade!", onPress: () => router.back() }]
            );
          },
        },
      ]
    );
  }

  const currentPlanIndex = PLANS.findIndex((p) => p.tier === plan.tier);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <LinearGradient
        colors={["#00FF8820", "#00C6FF10", "#080C14"]}
        style={styles.gradient}
      />

      <View style={[styles.header, { paddingTop: topInset + 8 }]}>
        <TouchableOpacity
          style={[styles.backBtn, { backgroundColor: colors.surface }]}
          onPress={() => router.back()}
        >
          <Feather name="x" size={18} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.foreground }]}>
          Upgrade Plan
        </Text>
        <View style={{ width: 36 }} />
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingBottom: insets.bottom + 40 }]}
      >
        <Text style={[styles.headline, { color: colors.foreground }]}>
          Unlock Your{"\n"}Trading Edge
        </Text>
        <Text style={[styles.subheadline, { color: colors.mutedForeground }]}>
          AI-powered analysis trusted by professional traders
        </Text>

        {plan.tier !== "free" && (
          <View style={[styles.currentBadge, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
            <Feather name="check-circle" size={14} color={colors.primary} />
            <Text style={[styles.currentBadgeText, { color: colors.primary }]}>
              Active: {plan.tier.toUpperCase()} — {scansRemaining === 999 ? "Unlimited" : scansRemaining} scans remaining today
            </Text>
          </View>
        )}

        <View style={[styles.billingToggle, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.billingOption, billing === "weekly" && { backgroundColor: colors.primary }]}
            onPress={() => setBilling("weekly")}
          >
            <Text style={[styles.billingOptionText, { color: billing === "weekly" ? colors.primaryForeground : colors.mutedForeground }]}>
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.billingOption, billing === "monthly" && { backgroundColor: colors.primary }]}
            onPress={() => setBilling("monthly")}
          >
            <Text style={[styles.billingOptionText, { color: billing === "monthly" ? colors.primaryForeground : colors.mutedForeground }]}>
              Monthly
              {billing === "monthly" && (
                <Text style={{ fontSize: 10 }}> SAVE 40%</Text>
              )}
            </Text>
          </TouchableOpacity>
        </View>

        {PLANS.map((p) => {
          const isCurrentPlan = plan.tier === p.tier;
          const price = billing === "weekly" ? p.weeklyPrice : p.monthlyPrice;
          const isUpgrade = PLANS.findIndex((x) => x.tier === p.tier) > currentPlanIndex;

          return (
            <GlassCard
              key={p.tier}
              glow={p.tier === "pro" ? "green" : p.tier === "base" ? "blue" : "none"}
              style={[
                styles.planCard,
                isCurrentPlan ? { borderColor: p.color + "66", borderWidth: 2 } : undefined,
              ]}
            >
              {p.badge && (
                <View style={[styles.planBadge, { backgroundColor: p.color + "22", borderColor: p.color + "44" }]}>
                  <Text style={[styles.planBadgeText, { color: p.color }]}>{p.badge}</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <View>
                  <Text style={[styles.planName, { color: colors.foreground }]}>{p.name}</Text>
                  <View style={styles.priceRow}>
                    <Text style={[styles.planPrice, { color: p.color }]}>{price}</Text>
                    {p.tier !== "free" && (
                      <Text style={[styles.planInterval, { color: colors.mutedForeground }]}>
                        /{billing === "weekly" ? "week" : "month"}
                      </Text>
                    )}
                  </View>
                </View>
                {isCurrentPlan && (
                  <View style={[styles.activePill, { backgroundColor: p.color + "22", borderColor: p.color + "44" }]}>
                    <Feather name="check" size={12} color={p.color} />
                    <Text style={[styles.activePillText, { color: p.color }]}>Active</Text>
                  </View>
                )}
              </View>

              <View style={[styles.planDivider, { backgroundColor: colors.border }]} />

              <View style={styles.featureList}>
                {p.features.map((f, i) => (
                  <View key={i} style={styles.featureRow}>
                    <View style={[
                      styles.featureIcon,
                      { backgroundColor: f.included ? p.color + "22" : colors.surface },
                    ]}>
                      <Feather
                        name={f.included ? "check" : "x"}
                        size={11}
                        color={f.included ? p.color : colors.mutedForeground}
                      />
                    </View>
                    <Text style={[
                      styles.featureText,
                      { color: f.included ? colors.foreground : colors.mutedForeground },
                    ]}>
                      {f.text}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.selectBtn,
                  {
                    backgroundColor: isCurrentPlan
                      ? colors.surface
                      : isUpgrade
                        ? p.color
                        : colors.surface,
                    borderColor: isCurrentPlan ? colors.border : p.color,
                    borderWidth: 1,
                  },
                ]}
                onPress={() => handleSubscribe(p.tier)}
                activeOpacity={0.85}
              >
                <Text style={[
                  styles.selectBtnText,
                  { color: isCurrentPlan ? colors.mutedForeground : isUpgrade ? (p.tier === "pro" ? colors.primaryForeground : "#000") : p.color },
                ]}>
                  {isCurrentPlan ? "Current Plan" : isUpgrade ? `Upgrade to ${p.name}` : `Switch to ${p.name}`}
                </Text>
                {isUpgrade && (
                  <Feather
                    name="arrow-right"
                    size={16}
                    color={p.tier === "pro" ? colors.primaryForeground : "#000"}
                  />
                )}
              </TouchableOpacity>
            </GlassCard>
          );
        })}

        <View style={[styles.trustRow, { borderColor: colors.border }]}>
          {["Cancel anytime", "Secure payment", "Instant access"].map((t) => (
            <View key={t} style={styles.trustItem}>
              <Feather name="shield" size={12} color={colors.mutedForeground} />
              <Text style={[styles.trustText, { color: colors.mutedForeground }]}>{t}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  gradient: { position: "absolute", top: 0, left: 0, right: 0, height: 400 },
  header: {
    flexDirection: "row", alignItems: "center", justifyContent: "space-between",
    paddingHorizontal: 20, paddingBottom: 16,
  },
  backBtn: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  headerTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  headline: { fontFamily: "Inter_700Bold", fontSize: 30, lineHeight: 38 },
  subheadline: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 },
  currentBadge: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1,
  },
  currentBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  billingToggle: {
    flexDirection: "row", borderRadius: 14, borderWidth: 1, padding: 4,
  },
  billingOption: {
    flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: "center",
  },
  billingOptionText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  planCard: { gap: 0, padding: 20, position: "relative" },
  planBadge: {
    position: "absolute", top: 16, right: 16,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1,
  },
  planBadgeText: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.5 },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  planName: { fontFamily: "Inter_700Bold", fontSize: 20, marginBottom: 4 },
  priceRow: { flexDirection: "row", alignItems: "baseline", gap: 4 },
  planPrice: { fontFamily: "Inter_700Bold", fontSize: 28 },
  planInterval: { fontFamily: "Inter_400Regular", fontSize: 14 },
  activePill: {
    flexDirection: "row", alignItems: "center", gap: 4,
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1,
  },
  activePillText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  planDivider: { height: 1, marginBottom: 16 },
  featureList: { gap: 10, marginBottom: 16 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureIcon: {
    width: 20, height: 20, borderRadius: 6, alignItems: "center", justifyContent: "center",
  },
  featureText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  selectBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 14, borderRadius: 12,
  },
  selectBtnText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  trustRow: {
    flexDirection: "row", justifyContent: "space-around",
    paddingVertical: 16, borderTopWidth: 1,
  },
  trustItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  trustText: { fontFamily: "Inter_400Regular", fontSize: 11 },
});
