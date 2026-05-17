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
import { GlassCard } from "@/components/GlassCard";
import { MarketTypeSelector } from "@/components/MarketTypeSelector";
import { TimeframeSelector } from "@/components/TimeframeSelector";

type MarketType = "crypto" | "forex" | "stocks" | "indices";

export default function AnalyzerScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { addAnalysis } = useAnalysis();

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
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      base64: true,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
      setImageBase64(result.assets[0].base64 ?? null);
    }
  }

  async function openCamera() {
    if (Platform.OS === "web") {
      Alert.alert("Camera", "Camera access is only available on mobile devices.");
      return;
    }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission needed", "Allow camera access to scan charts.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      quality: 0.8,
      base64: true,
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
    setAnalyzing(true);
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const domain = process.env.EXPO_PUBLIC_DOMAIN;
      const url = `https://${domain}/api/analyze-chart`;

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64,
          imageUri,
          pair,
          timeframe,
          marketType,
        }),
      });

      if (!response.ok) {
        throw new Error(`Analysis failed: ${response.status}`);
      }

      const data = await response.json();
      const analysis: TradeAnalysis = {
        id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
        imageUri: imageUri ?? "",
        timestamp: Date.now(),
        pair,
        timeframe,
        marketType,
        sentiment: data.sentiment ?? "neutral",
        confidence: data.confidence ?? 60,
        direction: data.direction ?? "wait",
        entry: data.entry ?? "N/A",
        stopLoss: data.stopLoss ?? "N/A",
        takeProfit: data.takeProfit ?? "N/A",
        riskLevel: data.riskLevel ?? "medium",
        patterns: data.patterns ?? [],
        indicators: data.indicators ?? [],
        strategy: data.strategy ?? "",
        reasoning: data.reasoning ?? "",
      };

      addAnalysis(analysis);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      router.push({
        pathname: "/analysis/[id]",
        params: { id: analysis.id },
      });

      setImageUri(null);
      setImageBase64(null);
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Analysis Failed",
        "Could not analyze the chart. Please check your connection and try again."
      );
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: topInset + 16, paddingBottom: 120 },
        ]}
      >
        <Text style={[styles.title, { color: colors.foreground }]}>Chart Analyzer</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Upload or capture a trading chart for AI analysis
        </Text>

        {/* Chart Upload Area */}
        {imageUri ? (
          <View>
            <Image
              source={{ uri: imageUri }}
              style={[styles.chartImage, { borderColor: colors.primary }]}
              resizeMode="contain"
            />
            <TouchableOpacity
              style={[styles.clearBtn, { borderColor: colors.border }]}
              onPress={() => {
                setImageUri(null);
                setImageBase64(null);
              }}
            >
              <Feather name="x" size={16} color={colors.mutedForeground} />
              <Text style={[styles.clearText, { color: colors.mutedForeground }]}>
                Remove
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.uploadRow}>
            <TouchableOpacity
              style={[
                styles.uploadBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={pickImage}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.uploadIcon,
                  { backgroundColor: colors.accent + "22", borderColor: colors.accent + "44" },
                ]}
              >
                <Feather name="upload" size={22} color={colors.accent} />
              </View>
              <Text style={[styles.uploadTitle, { color: colors.foreground }]}>
                Upload Chart
              </Text>
              <Text style={[styles.uploadSub, { color: colors.mutedForeground }]}>
                From gallery
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.uploadBtn,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
              onPress={openCamera}
              activeOpacity={0.75}
            >
              <View
                style={[
                  styles.uploadIcon,
                  { backgroundColor: colors.primary + "22", borderColor: colors.primary + "44" },
                ]}
              >
                <Feather name="camera" size={22} color={colors.primary} />
              </View>
              <Text style={[styles.uploadTitle, { color: colors.foreground }]}>
                Scan Chart
              </Text>
              <Text style={[styles.uploadSub, { color: colors.mutedForeground }]}>
                Live camera
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Market Type */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
            Market
          </Text>
          <View style={styles.negativeMargin}>
            <MarketTypeSelector selected={marketType} onSelect={(m) => {
              setMarketType(m);
              const pairs = PAIRS[m];
              if (pairs.length > 0) setPairState(pairs[0]);
            }} />
          </View>
        </View>

        {/* Pair Selector */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
            Trading Pair
          </Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.pairScroll}
          >
            {PAIRS[marketType].map((p) => (
              <TouchableOpacity
                key={p}
                onPress={() => setPairState(p)}
                style={[
                  styles.pairPill,
                  {
                    backgroundColor:
                      pair === p ? colors.primary + "22" : colors.surface,
                    borderColor: pair === p ? colors.primary : colors.border,
                  },
                ]}
              >
                <Text
                  style={[
                    styles.pairLabel,
                    { color: pair === p ? colors.primary : colors.mutedForeground },
                  ]}
                >
                  {p}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* Timeframe */}
        <View style={styles.section}>
          <Text style={[styles.sectionLabel, { color: colors.foreground }]}>
            Timeframe
          </Text>
          <View style={styles.negativeMargin}>
            <TimeframeSelector selected={timeframe} onSelect={setTimeframe} />
          </View>
        </View>

        {/* Analyze Button */}
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
            <ActivityIndicator color={imageUri ? colors.primaryForeground : colors.mutedForeground} />
          ) : (
            <Feather
              name="cpu"
              size={20}
              color={imageUri ? colors.primaryForeground : colors.mutedForeground}
            />
          )}
          <Text
            style={[
              styles.analyzeBtnText,
              {
                color: imageUri
                  ? colors.primaryForeground
                  : colors.mutedForeground,
              },
            ]}
          >
            {analyzing ? "Analyzing..." : "Analyze with AI"}
          </Text>
        </TouchableOpacity>

        {/* Disclaimer */}
        <GlassCard style={styles.disclaimer}>
          <Feather name="alert-triangle" size={14} color={colors.neutral} />
          <Text style={[styles.disclaimerText, { color: colors.mutedForeground }]}>
            AI analysis is for educational purposes only. Not financial advice. Always manage your risk.
          </Text>
        </GlassCard>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 20 },
  title: { fontFamily: "Inter_700Bold", fontSize: 24 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 14, lineHeight: 20 },
  chartImage: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    borderWidth: 1,
  },
  clearBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    marginTop: 8,
  },
  clearText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  uploadRow: { flexDirection: "row", gap: 12 },
  uploadBtn: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    alignItems: "center",
    gap: 10,
    borderStyle: "dashed",
  },
  uploadIcon: {
    width: 48,
    height: 48,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadTitle: { fontFamily: "Inter_700Bold", fontSize: 14 },
  uploadSub: { fontFamily: "Inter_400Regular", fontSize: 12 },
  section: { gap: 10 },
  sectionLabel: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  negativeMargin: { marginHorizontal: -20 },
  pairScroll: { gap: 8 },
  pairPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  pairLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  analyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginTop: 4,
  },
  analyzeBtnText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  disclaimer: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    padding: 12,
  },
  disclaimerText: {
    fontFamily: "Inter_400Regular",
    fontSize: 12,
    lineHeight: 18,
    flex: 1,
  },
});
