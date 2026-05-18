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
import { useColors } from "@/hooks/useColors";
import { GlassCard } from "@/components/GlassCard";

type TabKey = "crypto" | "forex" | "news";

interface CoinPrice {
  id: string;
  symbol: string;
  name: string;
  price: number;
  change24h: number;
  marketCap: number;
  volume24h: number;
}

interface ForexPair {
  pair: string;
  rate: number;
  base: string;
  quote: string;
}

interface NewsArticle {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: string;
  category: string;
  score: number;
  publishedAt: number;
}

function formatPrice(price: number): string {
  if (price >= 1000) return price.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  if (price >= 1) return price.toFixed(4);
  return price.toFixed(6);
}

function formatMarketCap(n: number): string {
  if (n >= 1e12) return `$${(n / 1e12).toFixed(2)}T`;
  if (n >= 1e9) return `$${(n / 1e9).toFixed(2)}B`;
  if (n >= 1e6) return `$${(n / 1e6).toFixed(2)}M`;
  return `$${n.toFixed(0)}`;
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

export default function MarketsScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const topInset = Platform.OS === "web" ? 67 : insets.top;

  const [activeTab, setActiveTab] = useState<TabKey>("crypto");
  const [coins, setCoins] = useState<CoinPrice[]>([]);
  const [forex, setForex] = useState<ForexPair[]>([]);
  const [news, setNews] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<number | null>(null);

  const baseUrl = Platform.OS === "web"
    ? ""
    : `https://${process.env.EXPO_PUBLIC_DOMAIN}`;

  const fetchData = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const [priceRes, forexRes, newsRes] = await Promise.allSettled([
        fetch(`${baseUrl}/api/market/prices`).then((r) => r.json()),
        fetch(`${baseUrl}/api/market/forex`).then((r) => r.json()),
        fetch(`${baseUrl}/api/market/news`).then((r) => r.json()),
      ]);

      if (priceRes.status === "fulfilled" && priceRes.value?.coins) {
        setCoins(priceRes.value.coins);
      }
      if (forexRes.status === "fulfilled" && forexRes.value?.pairs) {
        setForex(forexRes.value.pairs);
      }
      if (newsRes.status === "fulfilled" && newsRes.value?.articles) {
        setNews(newsRes.value.articles);
      }
      setLastUpdated(Date.now());
    } catch (err) {
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [baseUrl]);

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(), 60_000);
    return () => clearInterval(interval);
  }, [fetchData]);

  const topGainer = coins.length > 0
    ? coins.reduce((a, b) => (a.change24h > b.change24h ? a : b))
    : null;
  const topLoser = coins.length > 0
    ? coins.reduce((a, b) => (a.change24h < b.change24h ? a : b))
    : null;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => fetchData(true)}
            tintColor={colors.primary}
            colors={[colors.primary]}
          />
        }
        contentContainerStyle={[styles.scroll, { paddingTop: topInset + 16, paddingBottom: 120 }]}
      >
        <View style={styles.titleRow}>
          <View>
            <Text style={[styles.title, { color: colors.foreground }]}>Markets</Text>
            <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
              {lastUpdated ? `Updated ${timeAgo(lastUpdated)}` : "Live market data"}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.refreshBtn, { borderColor: colors.border, backgroundColor: colors.surface }]}
            onPress={() => fetchData(true)}
          >
            <Feather name="refresh-cw" size={15} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {coins.length > 0 && (
          <View style={styles.moversRow}>
            {topGainer && (
              <GlassCard style={[styles.moverCard, { borderColor: colors.bullish + "44" }]}>
                <View style={[styles.moverBadge, { backgroundColor: colors.bullish + "22" }]}>
                  <Feather name="trending-up" size={11} color={colors.bullish} />
                  <Text style={[styles.moverBadgeText, { color: colors.bullish }]}>Top Gainer</Text>
                </View>
                <Text style={[styles.moverSymbol, { color: colors.foreground }]}>{topGainer.symbol}</Text>
                <Text style={[styles.moverChange, { color: colors.bullish }]}>
                  +{topGainer.change24h.toFixed(2)}%
                </Text>
              </GlassCard>
            )}
            {topLoser && (
              <GlassCard style={[styles.moverCard, { borderColor: colors.bearish + "44" }]}>
                <View style={[styles.moverBadge, { backgroundColor: colors.bearish + "22" }]}>
                  <Feather name="trending-down" size={11} color={colors.bearish} />
                  <Text style={[styles.moverBadgeText, { color: colors.bearish }]}>Top Loser</Text>
                </View>
                <Text style={[styles.moverSymbol, { color: colors.foreground }]}>{topLoser.symbol}</Text>
                <Text style={[styles.moverChange, { color: colors.bearish }]}>
                  {topLoser.change24h.toFixed(2)}%
                </Text>
              </GlassCard>
            )}
          </View>
        )}

        <View style={styles.tabRow}>
          {([
            { key: "crypto" as TabKey, label: "Crypto", icon: "trending-up" },
            { key: "forex" as TabKey, label: "Forex & Gold", icon: "dollar-sign" },
            { key: "news" as TabKey, label: "News", icon: "rss" },
          ] as const).map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                style={[
                  styles.tabBtn,
                  {
                    backgroundColor: isActive ? colors.primary : colors.surface,
                    borderColor: isActive ? colors.primary : colors.border,
                  },
                ]}
                onPress={() => setActiveTab(tab.key)}
              >
                <Feather
                  name={tab.icon as any}
                  size={13}
                  color={isActive ? colors.primaryForeground : colors.mutedForeground}
                />
                <Text style={[
                  styles.tabBtnText,
                  { color: isActive ? colors.primaryForeground : colors.mutedForeground },
                ]}>
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading ? (
          <View style={styles.loadingCenter}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.mutedForeground }]}>
              Fetching live market data...
            </Text>
          </View>
        ) : (
          <>
            {activeTab === "crypto" && (
              <GlassCard style={styles.listCard}>
                {coins.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    Price data unavailable. Pull down to refresh.
                  </Text>
                ) : (
                  coins.map((coin, i) => {
                    const isUp = coin.change24h >= 0;
                    return (
                      <View key={coin.id}>
                        <View style={styles.coinRow}>
                          <View style={[styles.coinIcon, { backgroundColor: colors.primary + "22" }]}>
                            <Text style={[styles.coinIconText, { color: colors.primary }]}>
                              {coin.symbol[0]}
                            </Text>
                          </View>
                          <View style={styles.coinInfo}>
                            <Text style={[styles.coinSymbol, { color: colors.foreground }]}>{coin.symbol}</Text>
                            <Text style={[styles.coinMcap, { color: colors.mutedForeground }]}>
                              {formatMarketCap(coin.marketCap)}
                            </Text>
                          </View>
                          <View style={styles.coinPriceCol}>
                            <Text style={[styles.coinPrice, { color: colors.foreground }]}>
                              ${formatPrice(coin.price)}
                            </Text>
                            <View style={[
                              styles.changePill,
                              { backgroundColor: isUp ? colors.bullish + "22" : colors.bearish + "22" },
                            ]}>
                              <Feather
                                name={isUp ? "arrow-up-right" : "arrow-down-right"}
                                size={10}
                                color={isUp ? colors.bullish : colors.bearish}
                              />
                              <Text style={[
                                styles.changeText,
                                { color: isUp ? colors.bullish : colors.bearish },
                              ]}>
                                {isUp ? "+" : ""}{coin.change24h.toFixed(2)}%
                              </Text>
                            </View>
                          </View>
                        </View>
                        {i < coins.length - 1 && (
                          <View style={[styles.sep, { backgroundColor: colors.border }]} />
                        )}
                      </View>
                    );
                  })
                )}
              </GlassCard>
            )}

            {activeTab === "forex" && (
              <GlassCard style={styles.listCard}>
                {forex.length === 0 ? (
                  <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                    Forex data unavailable. Pull down to refresh.
                  </Text>
                ) : (
                  forex.map((item, i) => (
                    <View key={item.pair}>
                      <View style={styles.forexRow}>
                        <View style={[styles.forexIcon, { backgroundColor: colors.accent + "22" }]}>
                          <Feather name="dollar-sign" size={14} color={colors.accent} />
                        </View>
                        <View style={styles.coinInfo}>
                          <Text style={[styles.coinSymbol, { color: colors.foreground }]}>{item.pair}</Text>
                          <Text style={[styles.coinMcap, { color: colors.mutedForeground }]}>
                            {item.base} / {item.quote}
                          </Text>
                        </View>
                        <Text style={[styles.forexRate, { color: colors.foreground }]}>
                          {item.pair === "XAU/USD"
                            ? `$${item.rate.toLocaleString("en-US", { minimumFractionDigits: 2 })}`
                            : item.rate.toFixed(4)}
                        </Text>
                      </View>
                      {i < forex.length - 1 && (
                        <View style={[styles.sep, { backgroundColor: colors.border }]} />
                      )}
                    </View>
                  ))
                )}
              </GlassCard>
            )}

            {activeTab === "news" && (
              <View style={{ gap: 12 }}>
                {news.length === 0 ? (
                  <GlassCard>
                    <Text style={[styles.emptyText, { color: colors.mutedForeground }]}>
                      News unavailable. Pull down to refresh.
                    </Text>
                  </GlassCard>
                ) : (
                  news.map((article) => (
                    <GlassCard key={article.id} style={styles.newsCard}>
                      <View style={styles.newsHeader}>
                        <View style={[
                          styles.newsCategoryPill,
                          {
                            backgroundColor: article.category === "crypto"
                              ? colors.primary + "22"
                              : colors.accent + "22",
                          },
                        ]}>
                          <Text style={[
                            styles.newsCategoryText,
                            {
                              color: article.category === "crypto"
                                ? colors.primary
                                : colors.accent,
                            },
                          ]}>
                            {article.category.toUpperCase()}
                          </Text>
                        </View>
                        <Text style={[styles.newsTime, { color: colors.mutedForeground }]}>
                          {timeAgo(article.publishedAt)}
                        </Text>
                      </View>
                      <Text style={[styles.newsTitle, { color: colors.foreground }]}>
                        {article.title}
                      </Text>
                      <Text style={[styles.newsSource, { color: colors.mutedForeground }]}>
                        {article.source}
                      </Text>
                    </GlassCard>
                  ))
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: 20, gap: 16 },
  titleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  title: { fontFamily: "Inter_700Bold", fontSize: 24 },
  subtitle: { fontFamily: "Inter_400Regular", fontSize: 13, marginTop: 3 },
  refreshBtn: {
    width: 38, height: 38, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  moversRow: { flexDirection: "row", gap: 12 },
  moverCard: { flex: 1, gap: 6, borderWidth: 1 },
  moverBadge: {
    flexDirection: "row", alignItems: "center", gap: 5,
    paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: "flex-start",
  },
  moverBadgeText: { fontFamily: "Inter_600SemiBold", fontSize: 10 },
  moverSymbol: { fontFamily: "Inter_700Bold", fontSize: 18 },
  moverChange: { fontFamily: "Inter_700Bold", fontSize: 15 },
  tabRow: { flexDirection: "row", gap: 8 },
  tabBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 5, paddingVertical: 10, borderRadius: 10, borderWidth: 1,
  },
  tabBtnText: { fontFamily: "Inter_600SemiBold", fontSize: 12 },
  loadingCenter: { alignItems: "center", paddingVertical: 60, gap: 12 },
  loadingText: { fontFamily: "Inter_400Regular", fontSize: 14 },
  listCard: { gap: 0, padding: 0 },
  coinRow: {
    flexDirection: "row", alignItems: "center", gap: 12, padding: 14,
  },
  coinIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  coinIconText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  coinInfo: { flex: 1 },
  coinSymbol: { fontFamily: "Inter_700Bold", fontSize: 15 },
  coinMcap: { fontFamily: "Inter_400Regular", fontSize: 11, marginTop: 2 },
  coinPriceCol: { alignItems: "flex-end", gap: 5 },
  coinPrice: { fontFamily: "Inter_700Bold", fontSize: 14 },
  changePill: {
    flexDirection: "row", alignItems: "center", gap: 3,
    paddingHorizontal: 7, paddingVertical: 3, borderRadius: 6,
  },
  changeText: { fontFamily: "Inter_600SemiBold", fontSize: 11 },
  sep: { height: 1, marginHorizontal: 14 },
  forexRow: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14 },
  forexIcon: {
    width: 40, height: 40, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  forexRate: { fontFamily: "Inter_700Bold", fontSize: 15 },
  newsCard: { gap: 8 },
  newsHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  newsCategoryPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  newsCategoryText: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.5 },
  newsTime: { fontFamily: "Inter_400Regular", fontSize: 11 },
  newsTitle: { fontFamily: "Inter_600SemiBold", fontSize: 14, lineHeight: 20 },
  newsSource: { fontFamily: "Inter_400Regular", fontSize: 11 },
  emptyText: { fontFamily: "Inter_400Regular", fontSize: 14, textAlign: "center", paddingVertical: 24 },
});
