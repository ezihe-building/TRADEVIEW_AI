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
import { MarketTypeSelector } from "@/components/MarketTypeSelector";
import { TimeframeSelector } from "@/components/TimeframeSelector";

type MarketType = "crypto" | "forex" | "stocks" | "indices";

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
        "Pro Feature",
        "Live camera scanning is available on Base and Pro plans.",
        [
          { text: "Cancel", style: "cancel" },
          { text: "Upgrade", onPress: () => router.push("/subscription") },
        ]
      );
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Camera Permission Required",
        "Please allow camera access in your device settings to use live chart scanning.",
        [{ text: "OK" }]
      );
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
    if (!imageBase64 && !imageUri) {
      Alert.alert("No chart", "Please upload or capture a chart first.");
      return;
    }

    if (!canScan) {
      Alert.alert(
        "Daily Limit Reached",
        `You've used all ${plan.tier === "free" ? 3 : 15} free scans for today. Upgrade for more.`,
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
      const url = `https://${domain}/api/analyze-chart`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64, imageUri, pair, timeframe, marketType }),
      });

      if (!response.ok) throw new Error(`Analysis failed: ${response.status}`);

      const data = await response.json();
      const analysis: TradeAnalysis & Record<string, any> = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        imageUri: imageUri ?? "",
        timestamp: Date.now(),
        pair,
        timeframe,
        marketType,
        sentiment: data.sentiment ?? "neutral",
        confidence: data.confidence ?? 70,
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
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Analysis Failed", "Could not analyze the chart. Please check your connection and try again.");
    } finally {
      setAnalyzing(false);
    }
  }

  const PAIRS: Record<MarketType, string[]> = {
    crypto: ["BTC/USDT", "ETH/USDT", "SOL/USDT", "BNB/USDT", "XRP/USDT"],
    forex: ["EUR/USD", "GBP/USD", "USD/JPY", "AUD/USD", "USD/CAD"],
    stocks: ["AAPL", "TSLA", "NVDA", "MSFT", "AMZN"],
    indices: ["SPX500", "NASDAQ", "DOW", "FTSE100", "DAX"],
  };

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
          <View>
            <Image
              source={{ uri: imageUri }}
              style={[styles.chartImage, { borderColor: colors.primary + "66" }]}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={[styles.clearBtn, { borderColor: colors.border }]}
              onPress={() => { setImageUri(null); setImageBase64(null); }}
            >
              <Feather name="x" size={16} color={colors.mutedForeground} />
              <Text style={[styles.clearText, { color: colors.mutedForeground }]}>Remove</Text>
            </TouchableOpacity>
          </View>
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
              {!isPro && plan.tier !== "base" && (
                <View style={[styles.lockBadge, { backgroundColor: colors.neutral + "22" }]}>
                  <Feather name="lock" size={10} color={colors.mutedForeground} />
                  <Text style={[styles.lockText, { color: colors.mutedForeground }]}>Base+</Text>
                </View>
              )}
              {(isPro || plan.tier === "base") && (
                <Text style={[styles.uploadSub, { color: colors.mutedForeground }]}>Live camera</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Market</Text>
          <View style={styles.negativeMargin}>
            <MarketTypeSelector selected={marketType} onSelect={(m) => {
              setMarketType(m);
              const pairs = PAIRS[m];
              if (pairs.length > 0) setPairState(pairs[0]);
            }} />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Trading Pair</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.pairScroll}>
            {PAIRS[marketType].map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPairState(p)}
                style={[
                  styles.pairPill,
                  {
                    backgroundColor: pair === p ? colors.primary + "22" : colors.surface,
                    borderColor: pair === p ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text style={[styles.pairLabel, { color: pair === p ? colors.primary : colors.mutedForeground }]}>
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>Timeframe</Text>
          <View style={styles.negativeMargin}>
            <TimeframeSelector selected={timeframe} onSelect={setTimeframe} />
          </View>
        </View>

        <TouchableOpacity
          style={[
            styles.analyzeBtn,
            {
              backgroundColor: imageUri ? colors.primary : colors.surface,
              borderColor: imageUri ? colors.primary : colors.border,
              opacity: analyzing ? 0.7 : 1,
            },
          ]}
          onPress={analyzeChart}
          disabled={analyzing}
          activeOpacity={0.85}
        >
          {analyzing ? (
            <>
              <ActivityIndicator color={imageUri ? colors.primaryForeground : colors.mutedForeground} />
              <Text style={[styles.analyzeBtnText, { color: imageUri ? colors.primaryForeground : colors.mutedForeground }]}>
                Analyzing...
              </Text>
            </>
          ) : (
            <>
              <Feather name="cpu" size={20} color={imageUri ? colors.primaryForeground : colors.mutedForeground} />
              <Text style={[styles.analyzeBtnText, { color: imageUri ? colors.primaryForeground : colors.mutedForeground }]}>
                Analyze with AI
              </Text>
            </>
          )}
        </TouchableOpacity>

        {!canScan && (
          <TouchableOpacity
            style={[styles.upgradePrompt, { backgroundColor: colors.primary + "15", borderColor: colors.primary + "44" }]}
            onPress={() => router.push("/subscription")}
          >
            <Feather name="zap" size={16} color={colors.primary} />
            <Text style={[styles.upgradePromptText, { color: colors.primary }]}>
              Daily limit reached — Upgrade for more scans
            </Text>
            <Feather name="arrow-right" size={14} color={colors.primary} />
          </TouchableOpacity>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 20 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontFamily: "Inter_700Bold", fontSize: 24 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 2 },
  scansBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 10, paddingVertical: 6, borderRadius: 10, borderWidth: 1,
  },
  scansText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  chartImage: { width: "100%", height: 200, borderRadius: 12, borderWidth: 1.5 },
  clearBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 10, borderRadius: 10, borderWidth: 1, marginTop: 8,
  },
  clearText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  uploadRow: { flexDirection: "row", gap: 12 },
  uploadBtn: {
    flex: 1, borderRadius: 16, borderWidth: 1, padding: 20,
    alignItems: "center", gap: 10, borderStyle: "dashed",
  },
  uploadIcon: {
    width: 48, height: 48, borderRadius: 14, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  uploadTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  uploadSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  lockBadge: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  lockText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  section: { gap: 10 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  negativeMargin: { marginHorizontal: -20 },
  pairScroll: { gap: 8 },
  pairPill: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, borderWidth: 1 },
  pairLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  analyzeBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 16, borderRadius: 14, borderWidth: 1, marginTop: 4,
  },
  analyzeBtnText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  upgradePrompt: {
    flexDirection: "row", alignItems: "center", gap: 10,
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  upgradePromptText: { fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1 },
});
