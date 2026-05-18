import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import * as Haptics from "expo-haptics";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useColors } from "@/hooks/useColors";
import { useAnalysis, type TradeAnalysis } from "@/context/AnalysisContext";
import { useSubscription } from "@/context/SubscriptionContext";
import { GlassCard } from "@/components/GlassCard";

type MarketType = "crypto" | "forex" | "stocks" | "indices";

const PAIRS: Record<MarketType, string[]> = {
  crypto: [
    "BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT",
    "DOGE/USDT", "ADA/USDT", "AVAX/USDT", "DOT/USDT", "LINK/USDT",
    "LTC/USDT", "UNI/USDT", "MATIC/USDT", "ATOM/USDT",
  ],
  forex: [
    "EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD",
    "USD/CHF", "NZD/USD", "EUR/GBP", "EUR/JPY", "GBP/JPY",
    "XAU/USD", "XAG/USD",
  ],
  stocks: ["AAPL", "TSLA", "NVDA", "MSFT", "AMZN", "GOOGL", "META", "NFLX"],
  indices: ["SPX500", "NASDAQ", "DOW", "FTSE100", "DAX", "NIKKEI225"],
};

const TIMEFRAMES = ["1m", "5m", "15m", "30m", "1h", "4h", "1D", "1W"];

const MARKET_TABS: { key: MarketType; label: string; icon: string }[] = [
  { key: "crypto", label: "Crypto", icon: "trending-up" },
  { key: "forex", label: "Forex", icon: "dollar-sign" },
  { key: "stocks", label: "Stocks", icon: "bar-chart" },
  { key: "indices", label: "Indices", icon: "activity" },
];

export default function AnalyzerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addAnalysis } = useAnalysis();
  const { canScan, useOneScan, scansRemaining, plan, isPro } = useSubscription();

  const [imageUri, setImageUri] = useState<string | null>(null);
  const [imageBase64, setImageBase64] = useState<string | null>(null);
  const [marketType, setMarketType] = useState<MarketType>("crypto");
  const [timeframe, setTimeframe] = useState("1h");
  const [pair, setPairState] = useState("BTC/USDT");
  const [analyzing, setAnalyzing] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow photo library access to upload charts.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: "images",
      quality: 0.9,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
    }
  }

  async function openCamera() {
    if (Platform.OS === "web") {
      Alert.alert("Camera not available", "Live camera scanning works on iOS and Android devices.");
      return;
    }
    if (!isPro && plan.tier !== "base") {
      Alert.alert(
        "Base+ Feature",
        "Live camera scanning is available on Base and Pro plans.",
        [
          { text: "Later", style: "cancel" },
          { text: "Upgrade", onPress: () => router.push("/subscription") },
        ]
      );
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Camera Access Required", "Please allow camera access to scan charts live.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: "images",
      quality: 0.9,
      base64: true,
      allowsEditing: false,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
    }
  }

  async function analyzeChart() {
    if (!canScan) {
      const limit = plan.tier === "free" ? 3 : 15;
      Alert.alert(
        "Daily Limit Reached",
        `You've used all ${limit} scans for today. Upgrade to get more.`,
        [
          { text: "Later", style: "cancel" },
          { text: "Upgrade Now", onPress: () => router.push("/subscription") },
        ]
      );
      return;
    }

    setAnalyzing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const url = Platform.OS === "web"
        ? "/api/analyze-chart"
        : `https://${domain}/api/analyze-chart`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: imageBase64 ?? undefined,
          imageUri: imageUri ?? undefined,
          pair,
          timeframe,
          marketType,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({})) as any;
        throw new Error(errData?.error ?? `Analysis failed: ${response.status}`);
      }

      const data = await response.json() as any;
      const analysis: TradeAnalysis & Record<string, any> = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        imageUri: imageUri ?? "",
        timestamp: Date.now(),
        pair,
        timeframe,
        marketType,
        sentiment: data.sentiment ?? "neutral",
        confidence: data.confidence ?? 72,
        direction: data.direction ?? "wait",
        entry: data.entry ?? "N/A",
        stopLoss: data.stopLoss ?? "N/A",
        takeProfit: data.takeProfit ?? "N/A",
        riskLevel: data.riskLevel ?? "medium",
        patterns: data.patterns ?? [],
        indicators: data.indicators ?? [],
        strategy: data.strategy ?? "",
        reasoning: data.reasoning ?? "",
        riskRewardRatio: data.riskRewardRatio,
        keyLevels: data.keyLevels,
        tradeManagement: data.tradeManagement,
      };

      useOneScan();
      addAnalysis(analysis);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      router.push({ pathname: "/analysis/[id]", params: { id: analysis.id } });
      setImageUri(null);
      setImageBase64(null);
    } catch (err: any) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Analysis Failed",
        err?.message ?? "Could not analyze. Check your connection and try again."
      );
    } finally {
      setAnalyzing(false);
    }
  }

  const scansLabel = isPro ? "Unlimited" : `${scansRemaining} left today`;
  const scansBgColor = scansRemaining <= 1 && !isPro ? colors.bearish + "22" : colors.primary + "15";
  const scansColor = scansRemaining <= 1 && !isPro ? colors.bearish : colors.primary;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 16, paddingBottom: 120 }]}
      >
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Chart Analyzer</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              AI-powered technical analysis
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.scansBadge, { backgroundColor: scansBgColor, borderColor: scansColor + "44" }]}
            onPress={() => router.push("/subscription")}
          >
            <Feather name="zap" size={12} color={scansColor} />
            <Text style={[styles.scansText, { color: scansColor }]}>{scansLabel}</Text>
          </TouchableOpacity>
        </View>

        {imageUri ? (
          <GlassCard style={styles.imageCard}>
            <Image
              source={{ uri: imageUri }}
              style={styles.chartImage}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={[styles.clearBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
              onPress={() => { setImageUri(null); setImageBase64(null); }}
            >
              <Feather name="x" size={14} color={colors.mutedForeground} />
              <Text style={[styles.clearText, { color: colors.mutedForeground }]}>Remove Chart</Text>
            </TouchableOpacity>
          </GlassCard>
        ) : (
          <View style={styles.uploadRow}>
            <TouchableOpacity
              style={[styles.uploadBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
              onPress={pickImage}
              activeOpacity={0.75}
            >
              <View style={[styles.uploadIcon, { backgroundColor: colors.accent + "22", borderColor: colors.accent + "44" }]}>
                <Feather name="upload" size={22} color={colors.accent} />
              </View>
              <Text style={[styles.uploadTitle, { color: colors.foreground }]}>Upload Chart</Text>
              <Text style={[styles.uploadSub, { color: colors.mutedForeground }]}>From gallery</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.uploadBtn,
                {
                  backgroundColor: colors.surface,
                  borderColor: isPro || plan.tier === "base" ? colors.primary : colors.border,
                },
              ]}
              onPress={openCamera}
              activeOpacity={0.75}
            >
              <View style={[
                styles.uploadIcon,
                {
                  backgroundColor: (isPro || plan.tier === "base") ? colors.primary + "22" : colors.surface,
                  borderColor: (isPro || plan.tier === "base") ? colors.primary + "44" : colors.border,
                },
              ]}>
                <Feather name="camera" size={22} color={isPro || plan.tier === "base" ? colors.primary : colors.mutedForeground} />
              </View>
              <Text style={[styles.uploadTitle, { color: isPro || plan.tier === "base" ? colors.foreground : colors.mutedForeground }]}>
                Live Scan
              </Text>
              <Text style={[styles.uploadSub, { color: colors.mutedForeground }]}>
                {isPro || plan.tier === "base" ? "Camera" : "Base+"}
              </Text>
            </TouchableOpacity>
          </View>
        )}

        <GlassCard style={styles.configCard}>
          <Text style={[styles.configLabel, { color: colors.mutedForeground }]}>Market Type</Text>
          <View style={styles.marketTabs}>
            {MARKET_TABS.map((m) => {
              const isActive = marketType === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[
                    styles.marketTab,
                    {
                      backgroundColor: isActive ? colors.primary : colors.surface,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => {
                    setMarketType(m.key);
                    setPairState(PAIRS[m.key][0]);
                  }}
                  activeOpacity={0.8}
                >
                  <Feather
                    name={m.icon as any}
                    size={13}
                    color={isActive ? colors.primaryForeground : colors.mutedForeground}
                  />
                  <Text style={[
                    styles.marketTabText,
                    { color: isActive ? colors.primaryForeground : colors.mutedForeground },
                  ]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        <GlassCard style={styles.configCard}>
          <Text style={[styles.configLabel, { color: colors.mutedForeground }]}>Trading Pair</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pairsScroll}>
            {PAIRS[marketType].map((p) => {
              const isActive = pair === p;
              return (
                <TouchableOpacity
                  key={p}
                  style={[
                    styles.pairChip,
                    {
                      backgroundColor: isActive ? colors.primary + "22" : colors.surface,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setPairState(p)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.pairChipText,
                    { color: isActive ? colors.primary : colors.mutedForeground },
                  ]}>
                    {p}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </GlassCard>

        <GlassCard style={styles.configCard}>
          <Text style={[styles.configLabel, { color: colors.mutedForeground }]}>Timeframe</Text>
          <View style={styles.timeframeRow}>
            {TIMEFRAMES.map((tf) => {
              const isActive = timeframe === tf;
              return (
                <TouchableOpacity
                  key={tf}
                  style={[
                    styles.tfChip,
                    {
                      backgroundColor: isActive ? colors.primary : colors.surface,
                      borderColor: isActive ? colors.primary : colors.border,
                    },
                  ]}
                  onPress={() => setTimeframe(tf)}
                  activeOpacity={0.8}
                >
                  <Text style={[
                    styles.tfChipText,
                    { color: isActive ? colors.primaryForeground : colors.mutedForeground },
                  ]}>
                    {tf}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </GlassCard>

        {!imageUri && (
          <GlassCard style={[styles.noChartHint, { borderColor: colors.primary + "33" }]}>
            <Feather name="info" size={15} color={colors.primary} />
            <Text style={[styles.noChartText, { color: colors.mutedForeground }]}>
              <Text style={{ color: colors.foreground }}>No chart? No problem.</Text>
              {" "}AI will analyze {pair} on the {timeframe} timeframe using market structure logic.
            </Text>
          </GlassCard>
        )}

        <TouchableOpacity
          style={[
            styles.analyzeBtn,
            {
              backgroundColor: analyzing ? colors.primary + "88" : colors.primary,
              opacity: analyzing ? 0.9 : 1,
            },
          ]}
          onPress={analyzeChart}
          disabled={analyzing}
          activeOpacity={0.85}
        >
          {analyzing ? (
            <View style={styles.analyzingRow}>
              <ActivityIndicator size="small" color={colors.primaryForeground} />
              <Text style={[styles.analyzeBtnText, { color: colors.primaryForeground }]}>
                Analyzing {pair}...
              </Text>
            </View>
          ) : (
            <View style={styles.analyzingRow}>
              <Feather name="cpu" size={18} color={colors.primaryForeground} />
              <Text style={[styles.analyzeBtnText, { color: colors.primaryForeground }]}>
                Analyze {pair} — {timeframe}
              </Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontFamily: "Inter_700Bold", fontSize: 24 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, marginTop: 3 },
  scansBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1,
  },
  scansText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  imageCard: { padding: 8, gap: 8 },
  chartImage: { width: "100%", height: 220, borderRadius: 10 },
  clearBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  clearText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  uploadRow: { flexDirection: "row", gap: 12 },
  uploadBtn: {
    flex: 1, alignItems: "center", gap: 10, paddingVertical: 24,
    borderRadius: 16, borderWidth: 1.5, borderStyle: "dashed",
  },
  uploadIcon: {
    width: 52, height: 52, borderRadius: 16, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  uploadTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  uploadSub: { fontFamily: "Inter_400Regular", fontSize: 11 },
  configCard: { gap: 12 },
  configLabel: { fontFamily: "Inter_600SemiBold", fontSize: 12, textTransform: "uppercase", letterSpacing: 0.8 },
  marketTabs: { flexDirection: "row", gap: 8 },
  marketTab: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 9, borderRadius: 10, borderWidth: 1,
  },
  marketTabText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  pairsScroll: { marginHorizontal: -4 },
  pairChip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10,
    marginHorizontal: 4, borderWidth: 1,
  },
  pairChipText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  timeframeRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tfChip: {
    paddingHorizontal: 14, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1, minWidth: 48, alignItems: "center",
  },
  tfChipText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  noChartHint: {
    flexDirection: "row", alignItems: "flex-start", gap: 10,
    paddingVertical: 14, paddingHorizontal: 16,
    borderWidth: 1,
  },
  noChartText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, lineHeight: 19 },
  analyzeBtn: {
    paddingVertical: 18, borderRadius: 16,
    alignItems: "center", justifyContent: "center",
    shadowColor: "#00FF88",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  analyzingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  analyzeBtnText: { fontFamily: "Inter_700Bold", fontSize: 16 },
});
