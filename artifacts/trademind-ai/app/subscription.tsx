import React, { useState } from "react";
import {
  ActivityIndicator,
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
import * as Linking from "expo-linking";
import { useColors } from "@/hooks/useColors";
import { GlassCard } from "@/components/GlassCard";
import { useSubscription, type PlanTier, type BillingInterval } from "@/context/SubscriptionContext";
import { useUser } from "@clerk/expo";

type BillingMode = "weekly" | "monthly";

const NGN_PRICES: Record<string, Record<string, string>> = {
  base: { weekly: "₦8,000", monthly: "₦24,000" },
  pro: { weekly: "₦16,000", monthly: "₦48,000" },
};
const USD_PRICES: Record<string, Record<string, string>> = {
  base: { weekly: "$5", monthly: "$15" },
  pro: { weekly: "$10", monthly: "$30" },
};

export default function SubscriptionScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { plan, setPlan, isPro, isBase, scansRemaining } = useSubscription();
  const { user } = useUser();
  const [billing, setBilling] = useState<BillingMode>("monthly");
  const [processing, setProcessing] = useState<string | null>(null);
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const PLANS = [
    {
      tier: "free" as PlanTier,
      name: "Free",
      badge: null,
      ngnPrice: "₦0",
      usdPrice: "$0",
      color: colors.mutedForeground,
      glow: "none" as const,
      features: [
        { text: "3 AI chart scans per day", ok: true },
        { text: "Basic market analysis", ok: true },
        { text: "Trend & sentiment detection", ok: true },
        { text: "Live price data (read-only)", ok: true },
        { text: "Advanced AI analysis", ok: false },
        { text: "Risk/reward calculator", ok: false },
        { text: "Live camera scanning", ok: false },
        { text: "Priority processing", ok: false },
      ],
    },
    {
      tier: "base" as PlanTier,
      name: "Base",
      badge: "POPULAR",
      ngnPrice: NGN_PRICES.base[billing],
      usdPrice: USD_PRICES.base[billing],
      color: colors.accent,
      glow: "blue" as const,
      features: [
        { text: "15 AI chart scans per day", ok: true },
        { text: "Full technical analysis", ok: true },
        { text: "Candlestick pattern detection", ok: true },
        { text: "Entry / Stop Loss / Take Profit", ok: true },
        { text: "Risk/reward ratios", ok: true },
        { text: "Live camera scanning", ok: true },
        { text: "Unlimited live market prices", ok: true },
        { text: "Unlimited AI scans", ok: false },
      ],
    },
    {
      tier: "pro" as PlanTier,
      name: "Pro",
      badge: "BEST VALUE",
      ngnPrice: NGN_PRICES.pro[billing],
      usdPrice: USD_PRICES.pro[billing],
      color: colors.primary,
      glow: "green" as const,
      features: [
        { text: "Unlimited AI chart scans", ok: true },
        { text: "Priority AI processing", ok: true },
        { text: "Advanced multi-timeframe analysis", ok: true },
        { text: "Live camera chart scanning", ok: true },
        { text: "All Base features", ok: true },
        { text: "Trade journal & history", ok: true },
        { text: "Custom price alerts", ok: true },
        { text: "Early access to new features", ok: true },
      ],
    },
  ];

  async function handleSelectPlan(tier: PlanTier) {
    if (tier === "free") {
      setPlan({ tier: "free", interval: null });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.back();
      return;
    }

    if (plan.tier === tier && plan.interval === billing) {
      Alert.alert("Already Active", `You are already on the ${tier} ${billing} plan.`);
      return;
    }

    setProcessing(tier);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const baseUrl = Platform.OS === "web"
        ? ""
        : `https://${domain}`;

      const res = await fetch(`${baseUrl}/api/payment/initiate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          planTier: tier,
          billingInterval: billing,
          userEmail: user?.emailAddresses[0]?.emailAddress ?? "user@example.com",
          userName: user?.firstName ?? "Trader",
        }),
      });

      const data = await res.json() as any;

      if (!res.ok || data.error) {
        if (data.message?.includes("BLUSALT_API_KEY")) {
          Alert.alert(
            "Payment Not Configured",
            "The payment gateway is not yet set up. Activating demo plan for now.",
            [
              { text: "Cancel", style: "cancel" },
              {
                text: "Activate Demo",
                onPress: async () => {
                  setPlan({ tier, interval: billing as BillingInterval });
                  await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
                  Alert.alert(
                    `${tier === "pro" ? "Pro" : "Base"} Plan Activated`,
                    `Demo mode: Your ${tier} ${billing} plan is now active.`
                  );
                  router.back();
                },
              },
            ]
          );
          return;
        }
        throw new Error(data.error ?? "Payment failed");
      }

      if (data.paymentUrl) {
        await Linking.openURL(data.paymentUrl);
        Alert.alert(
          "Complete Payment",
          "After completing payment in your browser, tap Verify to activate your plan.",
          [
            { text: "Cancel", style: "cancel" },
            {
              text: "Verify Payment",
              onPress: async () => {
                await verifyPayment(data.reference, tier);
              },
            },
          ]
        );
      }
    } catch (err: any) {
      Alert.alert("Error", err?.message ?? "Something went wrong. Please try again.");
    } finally {
      setProcessing(null);
    }
  }

  async function verifyPayment(reference: string, tier: PlanTier) {
    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const baseUrl = Platform.OS === "web" ? "" : `https://${domain}`;
      const res = await fetch(`${baseUrl}/api/payment/verify/${reference}`);
      const data = await res.json() as any;

      if (data.success) {
        setPlan({ tier, interval: billing as BillingInterval });
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        Alert.alert(
          "Payment Successful!",
          `Your ${tier === "pro" ? "Pro" : "Base"} plan is now active.`
        );
        router.back();
      } else {
        Alert.alert("Verification Failed", "Payment not confirmed. Please contact support if payment was deducted.");
      }
    } catch {
      Alert.alert("Error", "Could not verify payment. Please contact support.");
    }
  }

  const activeTier = plan.tier;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 8, paddingBottom: 100 }]}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={[styles.backBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Feather name="arrow-left" size={20} color={colors.foreground} />
          </TouchableOpacity>
        </View>

        <LinearGradient
          colors={["#00FF8822", "#00C6FF11", "transparent"]}
          style={styles.heroBg}
        >
          <View style={[styles.heroIcon, { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" }]}>
            <Feather name="zap" size={28} color={colors.primary} />
          </View>
          <Text style={[styles.heroTitle, { color: colors.foreground }]}>Upgrade TradeMind AI</Text>
          <Text style={[styles.heroSubtitle, { color: colors.mutedForeground }]}>
            Unlock the full power of AI trading analysis
          </Text>

          {!isPro && (
            <View style={[styles.scansLeft, { backgroundColor: colors.surface, borderColor: colors.border }]}>
              <Feather name="zap" size={13} color={colors.primary} />
              <Text style={[styles.scansLeftText, { color: colors.primary }]}>
                {isPro ? "Unlimited scans" : `${scansRemaining} scans remaining today`}
              </Text>
            </View>
          )}
        </LinearGradient>

        <View style={styles.billingToggle}>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              billing === "weekly" && { backgroundColor: colors.primary },
            ]}
            onPress={() => setBilling("weekly")}
          >
            <Text style={[
              styles.toggleText,
              { color: billing === "weekly" ? colors.primaryForeground : colors.mutedForeground },
            ]}>
              Weekly
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              styles.toggleBtn,
              billing === "monthly" && { backgroundColor: colors.primary },
            ]}
            onPress={() => setBilling("monthly")}
          >
            <View style={styles.toggleContent}>
              <Text style={[
                styles.toggleText,
                { color: billing === "monthly" ? colors.primaryForeground : colors.mutedForeground },
              ]}>
                Monthly
              </Text>
              <View style={[styles.saveBadge, { backgroundColor: billing === "monthly" ? colors.primaryForeground + "33" : colors.primary + "22" }]}>
                <Text style={[styles.saveBadgeText, { color: billing === "monthly" ? colors.primaryForeground : colors.primary }]}>
                  Save 33%
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        </View>

        {PLANS.map((p) => {
          const isCurrent = activeTier === p.tier;
          const isProcessingThis = processing === p.tier;
          return (
            <GlassCard
              key={p.tier}
              glow={isCurrent ? p.glow : "none"}
              style={[
                styles.planCard,
                isCurrent && { borderColor: p.color + "88", borderWidth: 1.5 },
              ]}
            >
              {p.badge && (
                <View style={[styles.planBadge, { backgroundColor: p.color + "22", borderColor: p.color + "44" }]}>
                  <Text style={[styles.planBadgeText, { color: p.color }]}>{p.badge}</Text>
                </View>
              )}

              <View style={styles.planHeader}>
                <Text style={[styles.planName, { color: p.color }]}>{p.name}</Text>
                {p.tier !== "free" && (
                  <View style={styles.priceBlock}>
                    <Text style={[styles.ngnPrice, { color: colors.foreground }]}>
                      {p.ngnPrice}
                    </Text>
                    <Text style={[styles.usdPrice, { color: colors.mutedForeground }]}>
                      ≈ {p.usdPrice} / {billing === "weekly" ? "wk" : "mo"}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.featureList}>
                {p.features.map((f) => (
                  <View key={f.text} style={styles.featureRow}>
                    <View style={[
                      styles.featureCheck,
                      { backgroundColor: f.ok ? (p.color + "22") : colors.border + "44" },
                    ]}>
                      <Feather
                        name={f.ok ? "check" : "x"}
                        size={11}
                        color={f.ok ? p.color : colors.mutedForeground}
                      />
                    </View>
                    <Text style={[styles.featureText, { color: f.ok ? colors.foreground : colors.mutedForeground }]}>
                      {f.text}
                    </Text>
                  </View>
                ))}
              </View>

              <TouchableOpacity
                style={[
                  styles.selectBtn,
                  {
                    backgroundColor: isCurrent
                      ? colors.surface
                      : p.tier === "free"
                        ? colors.surface
                        : p.color,
                    borderColor: isCurrent ? p.color + "55" : p.tier === "free" ? colors.border : p.color,
                    borderWidth: isCurrent ? 1.5 : 0,
                  },
                ]}
                onPress={() => handleSelectPlan(p.tier)}
                disabled={isProcessingThis || isCurrent}
                activeOpacity={0.85}
              >
                {isProcessingThis ? (
                  <ActivityIndicator size="small" color={colors.primaryForeground} />
                ) : (
                  <Text style={[
                    styles.selectBtnText,
                    {
                      color: isCurrent
                        ? p.color
                        : p.tier === "free"
                          ? colors.mutedForeground
                          : colors.primaryForeground,
                    },
                  ]}>
                    {isCurrent ? "Current Plan" : p.tier === "free" ? "Downgrade to Free" : `Get ${p.name}`}
                  </Text>
                )}
              </TouchableOpacity>

              {p.tier !== "free" && !isCurrent && (
                <Text style={[styles.paymentNote, { color: colors.mutedForeground }]}>
                  Secure payment via BluSalt PaymentPro · NGN
                </Text>
              )}
            </GlassCard>
          );
        })}

        <View style={[styles.securityNote, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Feather name="lock" size={14} color={colors.mutedForeground} />
          <Text style={[styles.securityText, { color: colors.mutedForeground }]}>
            Payments are secured by BluSalt PaymentPro. Cancel anytime from Settings.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  header: { flexDirection: "row", alignItems: "center" },
  backBtn: {
    width: 40, height: 40, borderRadius: 12, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  heroBg: { borderRadius: 20, padding: 24, alignItems: "center", gap: 10 },
  heroIcon: {
    width: 64, height: 64, borderRadius: 20, borderWidth: 1,
    alignItems: "center", justifyContent: "center", marginBottom: 4,
  },
  heroTitle: { fontFamily: "Inter_700Bold", fontSize: 22, textAlign: "center" },
  heroSubtitle: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center" },
  scansLeft: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, borderWidth: 1, marginTop: 4,
  },
  scansLeftText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  billingToggle: {
    flexDirection: "row", backgroundColor: "#111820",
    borderRadius: 12, padding: 4, gap: 4,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 9, alignItems: "center", justifyContent: "center" },
  toggleContent: { flexDirection: "row", alignItems: "center", gap: 6 },
  toggleText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  saveBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  saveBadgeText: { fontFamily: "Inter_700Bold", fontSize: 10 },
  planCard: { gap: 16 },
  planBadge: {
    alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 6, borderWidth: 1,
  },
  planBadgeText: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.5 },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  planName: { fontFamily: "Inter_700Bold", fontSize: 22 },
  priceBlock: { alignItems: "flex-end" },
  ngnPrice: { fontFamily: "Inter_700Bold", fontSize: 20 },
  usdPrice: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  featureList: { gap: 10 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  featureCheck: { width: 20, height: 20, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  featureText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1 },
  selectBtn: {
    paddingVertical: 14, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  selectBtnText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  paymentNote: { fontFamily: "Inter_400Regular", fontSize: 11, textAlign: "center", marginTop: -4 },
  securityNote: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  securityText: { fontFamily: "Inter_400Regular", fontSize: 12, flex: 1, lineHeight: 18 },
});
