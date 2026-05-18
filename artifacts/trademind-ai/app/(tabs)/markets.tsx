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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useColors } from "@/hooks/useColors";

type ExploreTab = "overview" | "crypto" | "forex" | "news";

interface CoinPrice {
  id: string;
  symbol: string;
  price: number;
  change24h: number;
  marketCap: number;
}

interface ForexPair {
  pair: string;
  rate: number;
}

interface NewsArticle {
  id: string;
  title: string;
  source: string;
  category: string;
  publishedAt: number;
  url: string;
}

function timeAgo(ts: number): string {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function formatPrice(price: number): string {
  if (price >= 10000) return `$${price.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;
  if (price >= 1) return `$${price.toFixed(2)}`;
  return `$${price.toFixed(5)}`;
}

export default function ExploreScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 0 : insets.top;

  const [activeTab, setActiveTab] = useState<ExploreTab>("overview");
  const [coins, setCoins] = useState<CoinPrice[]>([]);
  const [forex, setForex] = useState<ForexPair[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const baseUrl = Platform.OS === "web" ? "" : `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

  const fetchAll = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [priceRes, forexRes, newsRes] = await Promise.allSettled([
        fetch(`${baseUrl}/api/market/prices`).then((r) => r.json()),
        fetch(`${baseUrl}/api/market/forex`).then((r) => r.json()),
        fetch(`${baseUrl}/api/market/news`).then((r) => r.json()),
      ]);
      if (priceRes.status === "fulfilled") setCoins(priceRes.value?.coins ?? []);
      if (forexRes.status === "fulfilled") setForex(forexRes.value?.pairs ?? []);
      if (newsRes.status === "fulfilled") setNews(newsRes.value?.articles ?? []);
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [baseUrl]);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(() => fetchAll(), 60000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  const topGainers = [...coins].sort((a, b) => b.change24h - a.change24h).slice(0, 6);
  const topLosers = [...coins].sort((a, b) => a.change24h - b.change24h).slice(0, 6);

  const INDEX_DATA = [
    { name: "S&P 500", symbol: "SPX500", price: "5,234.18", change: -1.24 },
    { name: "Dow 30", symbol: "DOW", price: "39,512.84", change: -1.07 },
    { name: "Nasdaq", symbol: "NASDAQ", price: "18,321.63", change: -1.54 },
    { name: "FTSE 100", symbol: "FTSE100", price: "8,112.55", change: +0.28 },
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.topBar, { paddingTop: topInset + 12, backgroundColor: colors.background }]}>
        <Text style={[styles.pageTitle, { color: colors.foreground }]}>Explore</Text>
        <TouchableOpacity
          style={[styles.searchBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
          onPress={() => {}}
        >
          <Feather name="search" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <View style={[styles.quickRow, { paddingHorizontal: 16 }]}>
        {[
          { label: "News", icon: "file-text" },
          { label: "Calendar", icon: "calendar" },
          { label: "Brokers", icon: "briefcase" },
        ].map((item) => (
          <TouchableOpacity
            key={item.label}
            style={[styles.quickBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => {}}
          >
            <Feather name={item.icon as any} size={20} color={colors.foreground} />
            <Text style={[styles.quickLabel, { color: colors.foreground }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[styles.filterRow, { paddingHorizontal: 16 }]}>
        {([
          { key: "overview", label: "Overview" },
          { key: "crypto", label: "Crypto" },
          { key: "forex", label: "Forex" },
          { key: "news", label: "News" },
        ] as const).map((tab) => {
          const active = activeTab === tab.key;
          return (
            <TouchableOpacity
              key={tab.key}
              style={[
                styles.filterBtn,
                {
                  backgroundColor: active ? colors.foreground : "transparent",
                  borderColor: active ? colors.foreground : colors.border,
                },
              ]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[styles.filterText, { color: active ? colors.background : colors.mutedForeground }]}>
                {tab.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={styles.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} tintColor={colors.primary} />
          }
          contentContainerStyle={[styles.scroll, { paddingBottom: 120 }]}
        >
          {activeTab === "overview" && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Indices</Text>
              <View style={styles.indexGrid}>
                {INDEX_DATA.map((idx) => {
                  const isUp = idx.change >= 0;
                  const changeColor = isUp ? colors.bullish : colors.bearish;
                  return (
                    <TouchableOpacity
                      key={idx.name}
                      style={[styles.indexCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => router.push("/(tabs)/chart" as any)}
                      activeOpacity={0.75}
                    >
                      <Text style={[styles.indexName, { color: colors.foreground }]}>{idx.name}</Text>
                      <Text style={[styles.indexPrice, { color: colors.foreground }]}>{idx.price} USD</Text>
                      <Text style={[styles.indexChange, { color: changeColor }]}>
                        {isUp ? "+" : ""}{idx.change}% today
                      </Text>
                      <View style={styles.miniChart}>
                        {Array.from({ length: 20 }).map((_, i) => {
                          const h = 8 + Math.abs(Math.sin(i * 0.8 + idx.name.charCodeAt(0)) * 18);
                          return (
                            <View
                              key={i}
                              style={[
                                styles.miniBar,
                                {
                                  height: h,
                                  backgroundColor: isUp ? colors.bullish : colors.bearish,
                                  opacity: 0.5 + (i / 20) * 0.5,
                                },
                              ]}
                            />
                          );
                        })}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {news.length > 0 && (
                <>
                  <View style={styles.sectionRow}>
                    <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Top Stories</Text>
                    <TouchableOpacity onPress={() => setActiveTab("news")}>
                      <Text style={[styles.seeAll, { color: colors.primary }]}>See all ›</Text>
                    </TouchableOpacity>
                  </View>
                  {news.slice(0, 5).map((article) => (
                    <TouchableOpacity
                      key={article.id}
                      style={styles.newsRow}
                      activeOpacity={0.7}
                    >
                      <View style={[styles.newsIcon, { backgroundColor: colors.surface }]}>
                        <Text style={[styles.newsIconText, { color: colors.primary }]}>
                          {article.source[0]?.toUpperCase() ?? "N"}
                        </Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.newsMeta, { color: colors.mutedForeground }]}>
                          {timeAgo(article.publishedAt)} · {article.source}
                        </Text>
                        <Text style={[styles.newsTitle, { color: colors.foreground }]} numberOfLines={2}>
                          {article.title}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </>
          )}

          {activeTab === "crypto" && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Gainers</Text>
              <View style={styles.moverGrid}>
                {topGainers.map((coin) => (
                  <TouchableOpacity
                    key={coin.id}
                    style={[styles.moverCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => router.push("/(tabs)/chart" as any)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.moverCardTop}>
                      <View style={[styles.moverAvatar, { backgroundColor: colors.bullish + "22" }]}>
                        <Text style={[styles.moverAvatarText, { color: colors.bullish }]}>
                          {coin.symbol[0]}
                        </Text>
                      </View>
                      <Text style={[styles.moverSymbol, { color: colors.foreground }]}>{coin.symbol}</Text>
                    </View>
                    <Text style={[styles.moverPrice, { color: colors.foreground }]}>{formatPrice(coin.price)}</Text>
                    <Text style={[styles.moverChange, { color: colors.bullish }]}>
                      +{coin.change24h.toFixed(2)}% today
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Losers</Text>
              <View style={styles.moverGrid}>
                {topLosers.map((coin) => (
                  <TouchableOpacity
                    key={coin.id}
                    style={[styles.moverCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => router.push("/(tabs)/chart" as any)}
                    activeOpacity={0.75}
                  >
                    <View style={styles.moverCardTop}>
                      <View style={[styles.moverAvatar, { backgroundColor: colors.bearish + "22" }]}>
                        <Text style={[styles.moverAvatarText, { color: colors.bearish }]}>
                          {coin.symbol[0]}
                        </Text>
                      </View>
                      <Text style={[styles.moverSymbol, { color: colors.foreground }]}>{coin.symbol}</Text>
                    </View>
                    <Text style={[styles.moverPrice, { color: colors.foreground }]}>{formatPrice(coin.price)}</Text>
                    <Text style={[styles.moverChange, { color: colors.bearish }]}>
                      {coin.change24h.toFixed(2)}% today
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {activeTab === "forex" && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Forex & Commodities</Text>
              {forex.map((item, i) => (
                <TouchableOpacity
                  key={item.pair}
                  style={[styles.forexRow, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push("/(tabs)/chart" as any)}
                  activeOpacity={0.7}
                >
                  <View style={[styles.forexIcon, { backgroundColor: colors.accent + "22" }]}>
                    <Feather name="dollar-sign" size={14} color={colors.accent} />
                  </View>
                  <Text style={[styles.forexPair, { color: colors.foreground }]}>{item.pair}</Text>
                  <Text style={[styles.forexRate, { color: colors.foreground }]}>
                    {item.pair === "XAU/USD"
                      ? `$${item.rate.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                      : item.rate.toFixed(4)}
                  </Text>
                  <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </>
          )}

          {activeTab === "news" && (
            <>
              <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Market News</Text>
              {news.map((article) => (
                <TouchableOpacity
                  key={article.id}
                  style={styles.newsRow}
                  activeOpacity={0.7}
                >
                  <View style={[styles.newsIcon, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.newsIconText, { color: colors.primary }]}>
                      {article.source[0]?.toUpperCase() ?? "N"}
                    </Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.newsMeta, { color: colors.mutedForeground }]}>
                      {timeAgo(article.publishedAt)} · {article.source}
                    </Text>
                    <Text style={[styles.newsTitle, { color: colors.foreground }]} numberOfLines={3}>
                      {article.title}
                    </Text>
                    <View style={[styles.categoryPill, {
                      backgroundColor: article.category === "crypto" ? colors.primary + "22" : colors.accent + "22",
                    }]}>
                      <Text style={[styles.categoryText, {
                        color: article.category === "crypto" ? colors.primary : colors.accent,
                      }]}>
                        {article.category.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                </TouchableOpacity>
              ))}
              {news.length === 0 && (
                <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                  Pull to refresh for latest news
                </Text>
              )}
            </>
          )}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  topBar: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 12,
  },
  pageTitle: { fontFamily: "Inter_700Bold", fontSize: 26 },
  searchBtn: {
    width: 38, height: 38, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  quickRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  quickBtn: {
    flex: 1, alignItems: "center", gap: 8, paddingVertical: 14,
    borderRadius: 12, borderWidth: 1,
  },
  quickLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center" },
  scroll: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  seeAll: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  indexGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  indexCard: {
    width: "48%", borderRadius: 12, borderWidth: 1,
    padding: 14, gap: 4, overflow: "hidden",
  },
  indexName: { fontFamily: "Inter_700Bold", fontSize: 13 },
  indexPrice: { fontFamily: "Inter_700Bold", fontSize: 15, marginTop: 4 },
  indexChange: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  miniChart: { flexDirection: "row", alignItems: "flex-end", gap: 2, height: 32, marginTop: 8 },
  miniBar: { width: 3, borderRadius: 1 },
  moverGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  moverCard: { width: "31%", borderRadius: 12, borderWidth: 1, padding: 12, gap: 6 },
  moverCardTop: { flexDirection: "row", alignItems: "center", gap: 6 },
  moverAvatar: { width: 24, height: 24, borderRadius: 6, alignItems: "center", justifyContent: "center" },
  moverAvatarText: { fontFamily: "Inter_700Bold", fontSize: 11 },
  moverSymbol: { fontFamily: "Inter_700Bold", fontSize: 12, flex: 1 },
  moverPrice: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  moverChange: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  newsRow: { flexDirection: "row", gap: 12, alignItems: "flex-start", paddingVertical: 12 },
  newsIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  newsIconText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  newsMeta: { fontFamily: "Inter_400Regular", fontSize: 11, marginBottom: 4 },
  newsTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, lineHeight: 20 },
  categoryPill: { alignSelf: "flex-start", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, marginTop: 6 },
  categoryText: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.5 },
  forexRow: {
    flexDirection: "row", alignItems: "center", gap: 12,
    padding: 14, borderRadius: 12, borderWidth: 1,
  },
  forexIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  forexPair: { fontFamily: "Inter_700Bold", fontSize: 14, flex: 1 },
  forexRate: { fontFamily: "Inter_700Bold", fontSize: 14 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingVertical: 40 },
});
