import React, { useState, useEffect, useCallback } from "react";
import {
  ActivityIndicator,
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
  tvPair: string;
  price: string;
  change: number;
  coinId?: string;
}

const DEFAULT_WATCHLIST: WatchItem[] = [
  { symbol: "BTC/USDT", tvPair: "BTC/USDT", price: "--", change: 0, coinId: "bitcoin" },
  { symbol: "ETH/USDT", tvPair: "ETH/USDT", price: "--", change: 0, coinId: "ethereum" },
  { symbol: "SOL/USDT", tvPair: "SOL/USDT", price: "--", change: 0, coinId: "solana" },
  { symbol: "BNB/USDT", tvPair: "BNB/USDT", price: "--", change: 0, coinId: "binancecoin" },
  { symbol: "XAU/USD", tvPair: "XAU/USD", price: "--", change: 0 },
  { symbol: "EUR/USD", tvPair: "EUR/USD", price: "--", change: 0 },
  { symbol: "GBP/USD", tvPair: "GBP/USD", price: "--", change: 0 },
  { symbol: "NVDA", tvPair: "NVDA", price: "--", change: 0 },
];

export default function WatchlistScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { user } = useUser();
  const { analyses } = useAnalysis();
  const { plan, isPro, scansRemaining } = useSubscription();

  const [watchlist, setWatchlist] = useState<WatchItem[]>(DEFAULT_WATCHLIST);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState("");

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
          const match = coins.find((c: any) => c.symbol === item.symbol.split("/")[0]);
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
    finally {
      setRefreshing(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchPrices();
    const interval = setInterval(() => fetchPrices(), 30000);
    return () => clearInterval(interval);
  }, [fetchPrices]);

  const firstName = user?.firstName ?? "Trader";
  const recentAnalyses = analyses.slice(0, 3);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topInset + 12, backgroundColor: colors.background }]}>
        <View>
          <Text style={[styles.greeting, { color: colors.mutedForeground }]}>
            Welcome back, {firstName}
          </Text>
          <Text style={[styles.pageTitle, { color: colors.foreground }]}>Watchlist</Text>
        </View>
        <View style={styles.topBarRight}>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push("/subscription")}
          >
            <Feather name="zap" size={18} color={colors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => fetchPrices(true)}
          >
            <Feather name="refresh-cw" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={() => fetchPrices(true)} tintColor={colors.primary} />
        }
        contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}
      >
        {!isPro && (
          <TouchableOpacity
            style={[styles.upgradeBanner, { backgroundColor: colors.primary + "11", borderColor: colors.primary + "33" }]}
            onPress={() => router.push("/subscription")}
          >
            <Feather name="zap" size={15} color={colors.primary} />
            <Text style={[styles.upgradeBannerText, { color: colors.primary }]}>
              {scansRemaining} AI scans left today · Upgrade for more
            </Text>
            <Feather name="chevron-right" size={14} color={colors.primary} />
          </TouchableOpacity>
        )}

        <View style={[styles.watchCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.watchCardHeader}>
            <Text style={[styles.watchCardTitle, { color: colors.foreground }]}>My Watchlist</Text>
            {lastUpdated ? (
              <Text style={[styles.updatedText, { color: colors.mutedForeground }]}>
                Updated {lastUpdated}
              </Text>
            ) : null}
          </View>

          {watchlist.map((item, i) => {
            const isUp = item.change >= 0;
            const changeColor = item.change === 0 ? colors.mutedForeground : isUp ? colors.bullish : colors.bearish;
            return (
              <TouchableOpacity
                key={item.symbol}
                style={[styles.watchRow, i < watchlist.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }]}
                onPress={() => router.push("/(tabs)/chart" as any)}
                activeOpacity={0.7}
              >
                <View style={[styles.symbolAvatar, { backgroundColor: colors.surface }]}>
                  <Text style={[styles.symbolAvatarText, { color: colors.foreground }]}>
                    {item.symbol.split("/")[0][0]}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.watchSymbol, { color: colors.foreground }]}>{item.symbol}</Text>
                  <Text style={[styles.watchSubtitle, { color: colors.mutedForeground }]}>
                    {item.price === "--" ? "Loading…" : ""}
                  </Text>
                </View>
                <View style={styles.watchRight}>
                  <Text style={[styles.watchPrice, { color: colors.foreground }]}>{item.price}</Text>
                  {item.change !== 0 && (
                    <Text style={[styles.watchChange, { color: changeColor }]}>
                      {isUp ? "+" : ""}{item.change.toFixed(2)}%
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <TouchableOpacity
          style={[styles.analyzeAllBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(tabs)/chart" as any)}
          activeOpacity={0.85}
        >
          <Feather name="cpu" size={18} color="#000" />
          <Text style={[styles.analyzeAllText, { color: "#000" }]}>Open Chart & AI Analyze</Text>
        </TouchableOpacity>

        {recentAnalyses.length > 0 && (
          <>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recent AI Signals</Text>
            {recentAnalyses.map((a) => {
              const sentColor = a.sentiment === "bullish" ? colors.bullish : a.sentiment === "bearish" ? colors.bearish : colors.neutral;
              return (
                <TouchableOpacity
                  key={a.id}
                  style={[styles.signalCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push({ pathname: "/analysis/[id]", params: { id: a.id } })}
                  activeOpacity={0.75}
                >
                  <View style={styles.signalTop}>
                    <Text style={[styles.signalPair, { color: colors.foreground }]}>{a.pair}</Text>
                    <View style={[styles.signalBadge, { backgroundColor: sentColor + "22", borderColor: sentColor + "44" }]}>
                      <Text style={[styles.signalBadgeText, { color: sentColor }]}>
                        {a.direction?.toUpperCase()} {a.confidence}%
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.signalTf, { color: colors.mutedForeground }]}>
                    {a.timeframe} · {new Date(a.timestamp).toLocaleDateString()}
                  </Text>
                  <Text style={[styles.signalReasoning, { color: colors.mutedForeground }]} numberOfLines={2}>
                    {a.reasoning}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end",
    paddingHorizontal: 16, paddingBottom: 12,
  },
  greeting: { fontFamily: "Inter_400Regular", fontSize: 13 },
  pageTitle: { fontFamily: "Inter_700Bold", fontSize: 22, marginTop: 2 },
  topBarRight: { flexDirection: "row", gap: 8 },
  iconBtn: {
    width: 38, height: 38, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  scroll: { paddingHorizontal: 16, gap: 16, paddingTop: 8 },
  upgradeBanner: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  upgradeBannerText: { fontFamily: "Inter_600SemiBold", fontSize: 13, flex: 1 },
  watchCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  watchCardHeader: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
  },
  watchCardTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  updatedText: { fontFamily: "Inter_400Regular", fontSize: 11 },
  watchRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 16, paddingVertical: 12 },
  symbolAvatar: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  symbolAvatarText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  watchSymbol: { fontFamily: "Inter_700Bold", fontSize: 14 },
  watchSubtitle: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  watchRight: { alignItems: "flex-end" },
  watchPrice: { fontFamily: "Inter_700Bold", fontSize: 14 },
  watchChange: { fontFamily: "Inter_600SemiBold", fontSize: 12, marginTop: 2 },
  analyzeAllBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 10, paddingVertical: 15, borderRadius: 12,
    shadowColor: "#00FF88", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 10, elevation: 6,
  },
  analyzeAllText: { fontFamily: "Inter_700Bold", fontSize: 16 },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 16 },
  signalCard: {
    borderRadius: 12, borderWidth: 1, padding: 14, gap: 6,
  },
  signalTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  signalPair: { fontFamily: "Inter_700Bold", fontSize: 15 },
  signalBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, borderWidth: 1 },
  signalBadgeText: { fontFamily: "Inter_700Bold", fontSize: 12 },
  signalTf: { fontFamily: "Inter_400Regular", fontSize: 12 },
  signalReasoning: { fontFamily: "Inter_400Regular", fontSize: 12, lineHeight: 17 },
});
