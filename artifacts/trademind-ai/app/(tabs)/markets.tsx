import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  ActivityIndicator,
  Animated,
  Linking,
  Modal,
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

interface CoinPrice { id: string; symbol: string; price: number; change24h: number; marketCap: number; }
interface ForexPair { pair: string; rate: number; }
interface NewsArticle { id: string; title: string; source: string; category: string; publishedAt: number; url: string; }

const COIN_TO_PAIR: Record<string, string> = {
  BTC: "BTC/USDT", ETH: "ETH/USDT", SOL: "SOL/USDT", DOGE: "DOGE/USDT",
  BNB: "BNB/USDT", XRP: "XRP/USDT", ADA: "ADA/USDT", DOT: "DOT/USDT",
  LINK: "LINK/USDT", AVAX: "AVAX/USDT", UNI: "UNI/USDT", LTC: "LTC/USDT",
};

const FOREX_TO_PAIR: Record<string, string> = {
  "XAU/USD": "XAU/USD", "USD/EUR": "EUR/USD", "USD/GBP": "GBP/USD",
  "USD/JPY": "USD/JPY", "USD/AUD": "AUD/USD", "USD/CAD": "USD/CAD",
  "USD/CHF": "USD/CHF", "USD/NZD": "NZD/USD",
};

const BROKERS = [
  { name: "Exness", desc: "Zero spread, instant withdrawals", rating: 4.8, url: "https://www.exness.com", regulated: "FCA, CySEC", minDeposit: "$1", badge: "POPULAR" },
  { name: "XM Group", desc: "1000+ instruments, 30x leverage", rating: 4.6, url: "https://www.xm.com", regulated: "FCA, ASIC, IFSC", minDeposit: "$5", badge: "TRUSTED" },
  { name: "FTMO", desc: "Prop trading, up to $200K funded", rating: 4.9, url: "https://ftmo.com", regulated: "CySEC", minDeposit: "Challenge fee", badge: "PROP" },
  { name: "IC Markets", desc: "Raw spreads from 0.0 pips, ECN", rating: 4.7, url: "https://www.icmarkets.com", regulated: "ASIC, CySEC, FSA", minDeposit: "$200", badge: "" },
  { name: "Pepperstone", desc: "Ultra-fast execution, MT4/MT5", rating: 4.7, url: "https://pepperstone.com", regulated: "FCA, ASIC, CySEC", minDeposit: "None", badge: "" },
  { name: "Binance", desc: "World's largest crypto exchange", rating: 4.5, url: "https://www.binance.com", regulated: "Multiple", minDeposit: "$10", badge: "CRYPTO" },
];

const INDEX_DATA = [
  { name: "S&P 500", symbol: "SPX500", price: "5,234.18", change: -1.24 },
  { name: "Dow 30", symbol: "DOW", price: "39,512.84", change: -1.07 },
  { name: "Nasdaq", symbol: "NASDAQ", price: "18,321.63", change: -1.54 },
  { name: "FTSE 100", symbol: "FTSE100", price: "8,112.55", change: +0.28 },
];

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

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(28)).current;
  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 80, friction: 12, useNativeDriver: true }),
    ]).start();
  }, []);

  const [activeTab, setActiveTab] = useState<ExploreTab>("overview");
  const [coins, setCoins] = useState<CoinPrice[]>([]);
  const [forex, setForex] = useState<ForexPair[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showBrokers, setShowBrokers] = useState(false);
  const [newsRefreshedAt, setNewsRefreshedAt] = useState(0);

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
      if (newsRes.status === "fulfilled") {
        setNews(newsRes.value?.articles ?? []);
        setNewsRefreshedAt(newsRes.value?.updatedAt ?? Date.now());
      }
    } catch {}
    finally { setLoading(false); setRefreshing(false); }
  }, [baseUrl]);

  useEffect(() => {
    fetchAll();
    const iv = setInterval(() => fetchAll(), 90_000);
    return () => clearInterval(iv);
  }, [fetchAll]);

  const topGainers = [...coins].sort((a, b) => b.change24h - a.change24h).slice(0, 6);
  const topLosers = [...coins].sort((a, b) => a.change24h - b.change24h).slice(0, 6);

  function navigateToChart(pair: string) {
    router.push({ pathname: "/(tabs)/chart", params: { pair } } as any);
  }

  function openArticle(url: string) {
    if (url) Linking.openURL(url).catch(() => {});
  }

  return (
    <Animated.View style={[s.container, { backgroundColor: colors.background, opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
      <View style={[s.topBar, { paddingTop: topInset + 12, backgroundColor: colors.background }]}>
        <Text style={[s.pageTitle, { color: colors.foreground }]}>Explore</Text>
        <TouchableOpacity style={[s.iconBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => {}}>
          <Feather name="search" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <View style={[s.quickRow, { paddingHorizontal: 16 }]}>
        {([
          { label: "News", icon: "file-text", action: () => setActiveTab("news") },
          { label: "Calendar", icon: "calendar", action: () => {} },
          { label: "Brokers", icon: "briefcase", action: () => setShowBrokers(true) },
        ] as const).map((item) => (
          <TouchableOpacity key={item.label} style={[s.quickBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={item.action}>
            <Feather name={item.icon as any} size={20} color={colors.foreground} />
            <Text style={[s.quickLabel, { color: colors.foreground }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={[s.filterRow, { paddingHorizontal: 16 }]}>
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
              style={[s.filterBtn, { backgroundColor: active ? colors.foreground : "transparent", borderColor: active ? colors.foreground : colors.border }]}
              onPress={() => setActiveTab(tab.key)}
            >
              <Text style={[s.filterText, { color: active ? colors.background : colors.mutedForeground }]}>{tab.label}</Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? (
        <View style={s.loadingCenter}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[s.loadingText, { color: colors.mutedForeground }]}>Loading market data…</Text>
        </View>
      ) : (
        <ScrollView
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => fetchAll(true)} tintColor={colors.primary} />}
          contentContainerStyle={[s.scroll, { paddingBottom: 120 }]}
        >
          {activeTab === "overview" && (
            <>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Indices</Text>
              <View style={s.indexGrid}>
                {INDEX_DATA.map((idx) => {
                  const isUp = idx.change >= 0;
                  const cc = isUp ? colors.bullish : colors.bearish;
                  return (
                    <TouchableOpacity
                      key={idx.name}
                      style={[s.indexCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                      onPress={() => navigateToChart(idx.symbol)}
                      activeOpacity={0.75}
                    >
                      <Text style={[s.indexName, { color: colors.foreground }]}>{idx.name}</Text>
                      <Text style={[s.indexPrice, { color: colors.foreground }]}>{idx.price} USD</Text>
                      <Text style={[s.indexChange, { color: cc }]}>{isUp ? "+" : ""}{idx.change}% today</Text>
                      <View style={s.miniChart}>
                        {Array.from({ length: 20 }).map((_, i) => (
                          <View key={i} style={[s.miniBar, { height: 8 + Math.abs(Math.sin(i * 0.8 + idx.name.charCodeAt(0)) * 18), backgroundColor: cc, opacity: 0.5 + (i / 20) * 0.5 }]} />
                        ))}
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {news.length > 0 && (
                <>
                  <View style={s.sectionRow}>
                    <Text style={[s.sectionTitle, { color: colors.foreground }]}>Top Stories</Text>
                    <TouchableOpacity onPress={() => setActiveTab("news")}>
                      <Text style={[s.seeAll, { color: colors.primary }]}>See all ›</Text>
                    </TouchableOpacity>
                  </View>
                  {news.slice(0, 5).map((article) => (
                    <TouchableOpacity key={article.id} style={s.newsRow} activeOpacity={0.7} onPress={() => openArticle(article.url)}>
                      <View style={[s.newsIcon, { backgroundColor: colors.surface }]}>
                        <Text style={[s.newsIconText, { color: colors.primary }]}>{article.source[0]?.toUpperCase() ?? "N"}</Text>
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[s.newsMeta, { color: colors.mutedForeground }]}>{timeAgo(article.publishedAt)} · {article.source}</Text>
                        <Text style={[s.newsTitle, { color: colors.foreground }]} numberOfLines={2}>{article.title}</Text>
                      </View>
                      <Feather name="external-link" size={13} color={colors.mutedForeground} />
                    </TouchableOpacity>
                  ))}
                </>
              )}
            </>
          )}

          {activeTab === "crypto" && (
            <>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Top Gainers 🚀</Text>
              <View style={s.moverGrid}>
                {topGainers.map((coin) => (
                  <TouchableOpacity key={coin.id} style={[s.moverCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigateToChart(COIN_TO_PAIR[coin.symbol] ?? `${coin.symbol}/USDT`)} activeOpacity={0.75}>
                    <View style={s.moverCardTop}>
                      <View style={[s.moverAvatar, { backgroundColor: colors.bullish + "22" }]}>
                        <Text style={[s.moverAvatarText, { color: colors.bullish }]}>{coin.symbol[0]}</Text>
                      </View>
                      <Text style={[s.moverSymbol, { color: colors.foreground }]}>{coin.symbol}</Text>
                    </View>
                    <Text style={[s.moverPrice, { color: colors.foreground }]}>{formatPrice(coin.price)}</Text>
                    <Text style={[s.moverChange, { color: colors.bullish }]}>+{coin.change24h.toFixed(2)}%</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Top Losers 📉</Text>
              <View style={s.moverGrid}>
                {topLosers.map((coin) => (
                  <TouchableOpacity key={coin.id} style={[s.moverCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigateToChart(COIN_TO_PAIR[coin.symbol] ?? `${coin.symbol}/USDT`)} activeOpacity={0.75}>
                    <View style={s.moverCardTop}>
                      <View style={[s.moverAvatar, { backgroundColor: colors.bearish + "22" }]}>
                        <Text style={[s.moverAvatarText, { color: colors.bearish }]}>{coin.symbol[0]}</Text>
                      </View>
                      <Text style={[s.moverSymbol, { color: colors.foreground }]}>{coin.symbol}</Text>
                    </View>
                    <Text style={[s.moverPrice, { color: colors.foreground }]}>{formatPrice(coin.price)}</Text>
                    <Text style={[s.moverChange, { color: colors.bearish }]}>{coin.change24h.toFixed(2)}%</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </>
          )}

          {activeTab === "forex" && (
            <>
              <Text style={[s.sectionTitle, { color: colors.foreground }]}>Forex & Commodities</Text>
              {forex.map((item) => (
                <TouchableOpacity key={item.pair} style={[s.forexRow, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => navigateToChart(FOREX_TO_PAIR[item.pair] ?? item.pair)} activeOpacity={0.7}>
                  <View style={[s.forexIcon, { backgroundColor: colors.accent + "22" }]}>
                    <Feather name="dollar-sign" size={14} color={colors.accent} />
                  </View>
                  <Text style={[s.forexPair, { color: colors.foreground }]}>{item.pair}</Text>
                  <Text style={[s.forexRate, { color: colors.foreground }]}>
                    {item.pair === "XAU/USD" ? `$${item.rate.toLocaleString("en-US", { minimumFractionDigits: 2 })}` : item.rate.toFixed(4)}
                  </Text>
                  <Feather name="chevron-right" size={14} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </>
          )}

          {activeTab === "news" && (
            <>
              <View style={s.sectionRow}>
                <Text style={[s.sectionTitle, { color: colors.foreground }]}>Market News</Text>
                {newsRefreshedAt > 0 && (
                  <Text style={[s.refreshedText, { color: colors.mutedForeground }]}>Updated {timeAgo(newsRefreshedAt)}</Text>
                )}
              </View>
              {news.length === 0 && (
                <View style={s.emptyNews}>
                  <ActivityIndicator color={colors.primary} />
                  <Text style={[s.emptyText, { color: colors.mutedForeground }]}>Loading latest trading news…</Text>
                </View>
              )}
              {news.map((article) => (
                <TouchableOpacity key={article.id} style={s.newsRow} activeOpacity={0.7} onPress={() => openArticle(article.url)}>
                  <View style={[s.newsIcon, { backgroundColor: colors.surface }]}>
                    <Text style={[s.newsIconText, { color: colors.primary }]}>{article.source[0]?.toUpperCase() ?? "N"}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[s.newsMeta, { color: colors.mutedForeground }]}>{timeAgo(article.publishedAt)} · {article.source}</Text>
                    <Text style={[s.newsTitle, { color: colors.foreground }]} numberOfLines={3}>{article.title}</Text>
                    <View style={[s.catPill, {
                      backgroundColor: article.category === "crypto" ? colors.primary + "22" : article.category === "forex" ? colors.accent + "22" : colors.surface,
                    }]}>
                      <Text style={[s.catText, {
                        color: article.category === "crypto" ? colors.primary : article.category === "forex" ? colors.accent : colors.mutedForeground,
                      }]}>{article.category.toUpperCase()}</Text>
                    </View>
                  </View>
                  <Feather name="external-link" size={13} color={colors.mutedForeground} />
                </TouchableOpacity>
              ))}
            </>
          )}
        </ScrollView>
      )}

      <Modal visible={showBrokers} animationType="slide" transparent onRequestClose={() => setShowBrokers(false)}>
        <View style={m.overlay}>
          <TouchableOpacity style={m.dismiss} onPress={() => setShowBrokers(false)} />
          <View style={[m.sheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={m.handle} />
            <Text style={[m.title, { color: colors.foreground }]}>Trusted Brokers</Text>
            <Text style={[m.subtitle, { color: colors.mutedForeground }]}>Regulated brokers recommended for TradeMind AI users</Text>
            <ScrollView showsVerticalScrollIndicator={false}>
              {BROKERS.map((b) => (
                <TouchableOpacity key={b.name} style={[m.brokerRow, { backgroundColor: colors.surface, borderColor: colors.border }]} onPress={() => Linking.openURL(b.url).catch(() => {})} activeOpacity={0.8}>
                  <View style={[m.brokerIcon, { backgroundColor: colors.primary + "22" }]}>
                    <Text style={[m.brokerInitial, { color: colors.primary }]}>{b.name[0]}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <Text style={[m.brokerName, { color: colors.foreground }]}>{b.name}</Text>
                      {b.badge ? (
                        <View style={[m.badge, { backgroundColor: colors.primary + "22" }]}>
                          <Text style={[m.badgeTxt, { color: colors.primary }]}>{b.badge}</Text>
                        </View>
                      ) : null}
                    </View>
                    <Text style={[m.brokerDesc, { color: colors.mutedForeground }]}>{b.desc}</Text>
                    <Text style={[m.brokerMeta, { color: colors.mutedForeground }]}>Min: {b.minDeposit} · {b.regulated}</Text>
                  </View>
                  <View style={{ alignItems: "flex-end", gap: 4 }}>
                    <Text style={[m.rating, { color: colors.bullish }]}>★ {b.rating}</Text>
                    <Feather name="external-link" size={14} color={colors.mutedForeground} />
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </Animated.View>
  );
}

const m = StyleSheet.create({
  overlay: { flex: 1, justifyContent: "flex-end" },
  dismiss: { flex: 1 },
  sheet: { maxHeight: "82%", borderTopLeftRadius: 24, borderTopRightRadius: 24, borderWidth: 1, borderBottomWidth: 0, padding: 20, gap: 12 },
  handle: { width: 36, height: 4, borderRadius: 2, backgroundColor: "#2A2E39", alignSelf: "center", marginBottom: 8 },
  title: { fontFamily: "Inter_700Bold", fontSize: 20 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 19 },
  brokerRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1, marginBottom: 10 },
  brokerIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  brokerInitial: { fontFamily: "Inter_700Bold", fontSize: 20 },
  brokerName: { fontFamily: "Inter_700Bold", fontSize: 14 },
  brokerDesc: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  brokerMeta: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  badge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeTxt: { fontFamily: "Inter_700Bold", fontSize: 9 },
  rating: { fontFamily: "Inter_700Bold", fontSize: 13 },
});

const s = StyleSheet.create({
  container: { flex: 1 },
  topBar: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 16, paddingBottom: 12 },
  pageTitle: { fontFamily: "Inter_700Bold", fontSize: 26 },
  iconBtn: { width: 38, height: 38, borderRadius: 10, borderWidth: 1, alignItems: "center", justifyContent: "center" },
  quickRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  quickBtn: { flex: 1, alignItems: "center", gap: 8, paddingVertical: 14, borderRadius: 12, borderWidth: 1 },
  quickLabel: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  filterRow: { flexDirection: "row", gap: 8, marginBottom: 4 },
  filterBtn: { paddingHorizontal: 14, paddingVertical: 7, borderRadius: 20, borderWidth: 1 },
  filterText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  loadingCenter: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 13 },
  scroll: { paddingHorizontal: 16, paddingTop: 12, gap: 12 },
  sectionRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  sectionTitle: { fontFamily: "Inter_700Bold", fontSize: 18 },
  seeAll: { fontFamily: "Inter_600SemiBold", fontSize: 14 },
  refreshedText: { fontFamily: "Inter_400Regular", fontSize: 11 },
  indexGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  indexCard: { width: "48%", borderRadius: 12, borderWidth: 1, padding: 14, gap: 4, overflow: "hidden" },
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
  catPill: { alignSelf: "flex-start", paddingHorizontal: 7, paddingVertical: 3, borderRadius: 4, marginTop: 6 },
  catText: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.5 },
  forexRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  forexIcon: { width: 32, height: 32, borderRadius: 8, alignItems: "center", justifyContent: "center" },
  forexPair: { fontFamily: "Inter_700Bold", fontSize: 14, flex: 1 },
  forexRate: { fontFamily: "Inter_700Bold", fontSize: 14 },
  emptyNews: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14 },
});
