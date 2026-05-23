import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Platform,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { router } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useUser } from "@clerk/expo";
import { useColors } from "@/hooks/useColors";
import { useAnalysis } from "@/context/AnalysisContext";
import { useSubscription } from "@/context/SubscriptionContext";

interface WatchItem {
  symbol: string;
  price: string;
  change: number;
}

const DEFAULT_WATCHLIST: WatchItem[] = [
  { symbol: "BTC/USDT", price: "--", change: 0 },
  { symbol: "ETH/USDT", price: "--", change: 0 },
  { symbol: "SOL/USDT", price: "--", change: 0 },
  { symbol: "BNB/USDT", price: "--", change: 0 },
  { symbol: "XAU/USD",  price: "--", change: 0 },
  { symbol: "EUR/USD",  price: "--", change: 0 },
  { symbol: "GBP/USD",  price: "--", change: 0 },
  { symbol: "NVDA",     price: "--", change: 0 },
];

export default function WatchlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { analyses } = useAnalysis();
  const { isPro, scansRemaining } = useSubscription();

  const [watchlist, setWatchlist] = useState<WatchItem[]>(DEFAULT_WATCHLIST);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const topInset = Platform.OS === "web" ? 0 : insets.top;
  const baseUrl = Platform.OS === "web" ? "" : `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

  const fetchPrices = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    try {
      const res = await fetch(`${baseUrl}/api/market/prices`);
      if (!res.ok) return;
      const data = await res.json() as any;
      const coins: any[] = data.coins ?? [];
      setWatchlist((prev) =>
        prev.map((item) => {
          const sym = item.symbol.split("/")[0];
          const match = coins.find((c: any) => c.symbol === sym);
          if (match) {
            return {
              ...item,
              price: match.price >= 1000
                ? `$${match.price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                : `$${match.price.toFixed(4)}`,
              change: match.change24h ?? 0,
            };
          }
          return item;
        })
      );
      setLastUpdated(new Date().toLocaleTimeString());
    } catch {}
    finally { setRefreshing(false); }
  }, [baseUrl]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(() => fetchPrices(), 30000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const firstName = user?.firstName ?? "Trader";
  const recentAnalyses = analyses.slice(0, 3);

  return (
    <View style={[st.container, { backgroundColor: colors.background }]}>
      <Animated.View style={{ flex: 1, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
        <View style={[st.topBar, { paddingTop: topInset + 14, backgroundColor: colors.background }]}>
          <View>
            <Text style={[st.greeting, { color: colors.mutedForeground }]}>Welcome back, {firstName}</Text>
            <Text style={[st.pageTitle, { color: colors.foreground }]}>Watchlist</Text>
          </View>
          <View style={st.topBarRight}>
            <TouchableOpacity
              style={[st.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push("/subscription")}
            >
              <Feather name="zap" size={18} color={colors.primary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={[st.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => fetchPrices(true)}
            >
              <Feather name="refresh-cw" size={18} color={colors.mutedForeground} />
            </TouchableOpacity>
          </View>
        </View>

        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchPrices(true)} tintColor={colors.primary} />}
          contentContainerStyle={[st.scroll, { paddingBottom: 120 }]}
        >
          {!isPro && (
            <TouchableOpacity
              style={[st.upgradeBanner, { backgroundColor: colors.primary + "11", borderColor: colors.primary + "33" }]}
              onPress={() => router.push("/subscription")}
            >
              <Feather name="zap" size={15} color={colors.primary} />
              <Text style={[st.upgradeBannerText, { color: colors.primary }]}>
                {scansRemaining} AI scans left today · Upgrade for more
              </Text>
              <Feather name="chevron-right" size={14} color={colors.primary} />
            </TouchableOpacity>
          )}

          <View style={[st.watchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={st.watchCardHeader}>
              <Text style={[st.watchCardTitle, { color: colors.foreground }]}>My Watchlist</Text>
              {lastUpdated ? (
                <Text style={[st.updatedText, { color: colors.mutedForeground }]}>Updated {lastUpdated}</Text>
              ) : null}
            </View>

            {watchlist.map((item, i) => {
              const isUp = item.change >= 0;
              const changeColor = item.change === 0 ? colors.mutedForeground : isUp ? colors.bullish : colors.bearish;
              return (
                <TouchableOpacity
                  key={item.symbol}
                  style={[st.watchRow, i < watchlist.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                  onPress={() => router.push("/(tabs)/chart" as any)}
                  activeOpacity={0.7}
                >
                  <View style={[st.symbolAvatar, { backgroundColor: colors.surface }]}>
                    <Text style={[st.symbolAvatarText, { color: colors.foreground }]}>
                      {item.symbol.split("/")[0][0]}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[st.watchSymbol, { color: colors.foreground }]}>{item.symbol}</Text>
                    {item.price === "--" && (
                      <Text style={[st.watchSubtitle, { color: colors.mutedForeground }]}>Loading…</Text>
                    )}
                  </View>
                  <View style={st.watchRight}>
                    <Text style={[st.watchPrice, { color: colors.foreground }]}>{item.price}</Text>
                    {item.change !== 0 && (
                      <Text style={[st.watchChange, { color: changeColor }]}>
                        {isUp ? "+" : ""}{item.change.toFixed(2)}%
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>

          <TouchableOpacity
            style={[st.analyzeBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/chart" as any)}
            activeOpacity={0.85}
          >
            <Feather name="cpu" size={18} color="#000" />
            <Text style={st.analyzeBtnText}>Open Chart & AI Analyze</Text>
          </TouchableOpacity>

          {recentAnalyses.length > 0 && (
            <>
              <Text style={[st.sectionTitle, { color: colors.foreground }]}>Recent AI Signals</Text>
              {recentAnalyses.map((a) => {
                const sentColor = a.sentiment === "bullish" ? colors.bullish : a.sentiment === "bearish" ? colors.bearish : colors.neutral;
                return (
                  <TouchableOpacity
                    key={a.id}
                    style={[st.signalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => router.push({ pathname: "/analysis/[id]", params: { id: a.id } })}
                    activeOpacity={0.75}
                  >
                    <View style={st.signalTop}>
                      <Text style={[st.signalPair, { color: colors.foreground }]}>{a.pair}</Text>
                      <View style={[st.signalBadge, { backgroundColor: sentColor + "22", borderColor: sentColor + "44" }]}>
                        <Text style={[st.signalBadgeText, { color: sentColor }]}>
                          {a.direction?.toUpperCase()} {a.confidence}%
                        </Text>
                      </View>
                    </View>
                    <Text style={[st.signalTf, { color: colors.mutedForeground }]}>
                      {a.timeframe} · {new Date(a.timestamp).toLocaleDateString()}
                    </Text>
                    <Text style={[st.signalReasoning, { color: colors.mutedForeground }]} numberOfLines={2}>
                      {a.reasoning}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </>
          )}
        </ScrollView>
      </Animated.View>
    </View>
  );
}

const st = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end", paddingHorizontal: 16, paddingBottom: 12 },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 13 },
  pageTitle: { fontFamily: "Inter_700Bold", fontSize: 24, marginTop: 2 },
  topBarRight: { flexDirection: "row", gap: 8 },
  iconBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 16, gap: 16, paddingTop: 8 },
  upgradeBanner: { flexDirection: "row", alignItems: "center", gap: 8, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1 },
  upgradeBannerText: { fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1 },
  watchCard: { borderRadius: 14, borderWidth: 1, overflow: "hidden" },
  watchCardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingVertical: 12 },
  watchCardTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  updatedText: { fontFamily: "Inter_400Regular", fontSize: 11 },
  watchRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 13 },
  symbolAvatar: { width: 38, height: 38, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  symbolAvatarText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  watchSymbol: { fontFamily: "Inter_700Bold", fontSize: 14 },
  watchSubtitle: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  watchRight: { alignItems: "flex-end" },
  watchPrice: { fontFamily: "Inter_700Bold", fontSize: 14 },
  watchChange: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginTop: 2 },
  analyzeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 14, shadowColor: "#00FF88", shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 },
  analyzeBtnText: { fontFamily: "Inter_700Bold", fontSize: 16, color: "#000" },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  signalCard: { borderRadius: 14, borderWidth: 1, padding: 14, gap: 6 },
  signalTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  signalPair: { fontFamily: "Inter_700Bold", fontSize: 15 },
  signalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  signalBadgeText: { fontFamily: "Inter_700Bold", fontSize: 12 },
  signalTf: { fontFamily: "Inter_400Regular", fontSize: 12 },
  signalReasoning: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
});
