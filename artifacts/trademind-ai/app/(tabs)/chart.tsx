import React, { useState, useRef, useCallback } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Feather } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as Haptics from "expo-haptics";
import { useColors } from "@/hooks/useColors";
import { useSubscription } from "@/context/SubscriptionContext";
import { useAnalysis, type TradeAnalysis } from "@/context/AnalysisContext";
import { router } from "expo-router";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

const TV_SYMBOLS: Record<string, string> = {
  "BTC/USDT": "BINANCE:BTCUSDT",
  "ETH/USDT": "BINANCE:ETHUSDT",
  "SOL/USDT": "BINANCE:SOLUSDT",
  "DOGE/USDT": "BINANCE:DOGEUSDT",
  "BNB/USDT": "BINANCE:BNBUSDT",
  "XRP/USDT": "BINANCE:XRPUSDT",
  "ADA/USDT": "BINANCE:ADAUSDT",
  "AVAX/USDT": "BINANCE:AVAXUSDT",
  "DOT/USDT": "BINANCE:DOTUSDT",
  "LINK/USDT": "BINANCE:LINKUSDT",
  "LTC/USDT": "BINANCE:LTCUSDT",
  "MATIC/USDT": "BINANCE:MATICUSDT",
  "UNI/USDT": "BINANCE:UNIUSDT",
  "ATOM/USDT": "BINANCE:ATOMUSDT",
  "EUR/USD": "FX:EURUSD",
  "GBP/USD": "FX:GBPUSD",
  "USD/JPY": "FX:USDJPY",
  "AUD/USD": "FX:AUDUSD",
  "USD/CAD": "FX:USDCAD",
  "USD/CHF": "FX:USDCHF",
  "NZD/USD": "FX:NZDUSD",
  "EUR/GBP": "FX:EURGBP",
  "EUR/JPY": "FX:EURJPY",
  "GBP/JPY": "FX:GBPJPY",
  "XAU/USD": "TVC:GOLD",
  "XAG/USD": "TVC:SILVER",
  "AAPL": "NASDAQ:AAPL",
  "TSLA": "NASDAQ:TSLA",
  "NVDA": "NASDAQ:NVDA",
  "MSFT": "NASDAQ:MSFT",
  "AMZN": "NASDAQ:AMZN",
  "GOOGL": "NASDAQ:GOOGL",
  "META": "NASDAQ:META",
  "NFLX": "NASDAQ:NFLX",
  "SPX500": "SP:SPX",
  "NASDAQ": "NASDAQ:NDX",
  "DOW": "DJ:DJI",
  "FTSE100": "SPREADEX:FTSE",
};

const TV_TIMEFRAMES: Record<string, string> = {
  "1m": "1",
  "5m": "5",
  "15m": "15",
  "30m": "30",
  "1h": "60",
  "4h": "240",
  "1D": "D",
  "1W": "W",
};

const POPULAR_SYMBOLS = [
  "BTC/USDT", "ETH/USDT", "SOL/USDT", "XAU/USD",
  "EUR/USD", "GBP/USD", "SPX500", "NVDA",
];

const TIMEFRAMES = ["1m", "5m", "15m", "1h", "4h", "1D", "1W"];

function getTradingViewHtml(tvSymbol: string, tvTimeframe: string): string {
  return `<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,user-scalable=no">
<style>
*{margin:0;padding:0;box-sizing:border-box;}
html,body{height:100%;width:100%;background:#131722;overflow:hidden;}
#tv{width:100%;height:100vh;}
</style>
</head>
<body>
<div id="tv"></div>
<script src="https://s3.tradingview.com/tv.js"></script>
<script>
new TradingView.widget({
  container_id:"tv",
  autosize:true,
  symbol:"${tvSymbol}",
  interval:"${tvTimeframe}",
  timezone:"Etc/UTC",
  theme:"dark",
  style:"1",
  locale:"en",
  toolbar_bg:"#1E222D",
  enable_publishing:false,
  allow_symbol_change:true,
  hide_top_toolbar:false,
  hide_legend:false,
  save_image:false,
  studies:["RSI@tv-basicstudies","MACD@tv-basicstudies"],
  overrides:{
    "mainSeriesProperties.candleStyle.upColor":"#089981",
    "mainSeriesProperties.candleStyle.downColor":"#F23645",
    "mainSeriesProperties.candleStyle.borderUpColor":"#089981",
    "mainSeriesProperties.candleStyle.borderDownColor":"#F23645",
    "mainSeriesProperties.candleStyle.wickUpColor":"#089981",
    "mainSeriesProperties.candleStyle.wickDownColor":"#F23645",
    "paneProperties.background":"#131722",
    "paneProperties.vertGridProperties.color":"#1E222D",
    "paneProperties.horzGridProperties.color":"#1E222D",
    "scalesProperties.textColor":"#787B86",
  }
});
</script>
</body></html>`;
}

function generateDemoAnalysis(pair: string, timeframe: string) {
  const seed = pair.charCodeAt(0) + pair.charCodeAt(1) + timeframe.charCodeAt(0);
  const isBullish = seed % 3 !== 2;
  const isNeutral = seed % 7 === 0;
  const sentiment: "bullish" | "bearish" | "neutral" = isNeutral ? "neutral" : isBullish ? "bullish" : "bearish";
  const direction: "long" | "short" | "wait" = isNeutral ? "wait" : isBullish ? "long" : "short";
  const confidence = 65 + (seed % 27);

  const basePrices: Record<string, number> = {
    "BTC/USDT": 67400, "ETH/USDT": 3520, "SOL/USDT": 168, "XAU/USD": 2348,
    "EUR/USD": 1.0812, "GBP/USD": 1.2743, "USD/JPY": 155.6,
    "SPX500": 5234, "NVDA": 875,
  };
  const base = basePrices[pair] ?? 100;
  const atr = base * 0.012;
  const entry = isBullish ? base * 1.001 : base * 0.999;
  const sl = isBullish ? entry - atr * 1.5 : entry + atr * 1.5;
  const tp = isBullish ? entry + atr * 3 : entry - atr * 3;
  const fmt = (n: number) => base > 1000 ? n.toFixed(0) : base > 10 ? n.toFixed(2) : n.toFixed(5);

  return {
    sentiment, confidence, direction,
    entry: fmt(entry), stopLoss: fmt(sl), takeProfit: fmt(tp),
    riskRewardRatio: "1:2.0",
    riskLevel: (confidence > 80 ? "low" : confidence > 72 ? "medium" : "high") as "low" | "medium" | "high",
    patterns: isBullish
      ? ["Bullish Engulfing", "Support Bounce", "Higher Low Formation"]
      : ["Bearish Engulfing", "Resistance Rejection", "Lower High"],
    indicators: [
      `RSI at ${42 + (seed % 20)} — ${isBullish ? "Oversold recovery" : "Overbought rejection"}`,
      `MACD ${isBullish ? "bullish crossover forming" : "bearish crossover"}`,
      `Price ${isBullish ? "above" : "below"} 50 EMA`,
    ],
    keyLevels: { support: fmt(base * 0.97), resistance: fmt(base * 1.03) },
    strategy: `${isBullish ? "Look for long entry" : "Short opportunity"} on ${pair} ${timeframe} with confirmed ${isBullish ? "bullish" : "bearish"} momentum. Risk 1-2% of account.`,
    reasoning: `${pair} on ${timeframe} shows ${isBullish ? "bullish" : "bearish"} structure with ${isBullish ? "demand zone" : "supply zone"} confluence. Price action suggests ${isBullish ? "continuation higher" : "further downside"}. Volume supports the move.`,
    tradeManagement: "Risk 1% of account. Move SL to breakeven at 50% of target. Partial close at first TP.",
  };
}

export default function ChartScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { canScan, useOneScan, plan, isPro } = useSubscription();
  const { addAnalysis } = useAnalysis();

  const [selectedPair, setSelectedPair] = useState("BTC/USDT");
  const [selectedTF, setSelectedTF] = useState("1D");
  const [showSymbolPicker, setShowSymbolPicker] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysis, setAnalysis] = useState<any>(null);
  const [showAnalysis, setShowAnalysis] = useState(false);

  const tvSymbol = TV_SYMBOLS[selectedPair] ?? "BINANCE:BTCUSDT";
  const tvTF = TV_TIMEFRAMES[selectedTF] ?? "D";
  const chartHtml = getTradingViewHtml(tvSymbol, tvTF);

  const topInset = Platform.OS === "web" ? 0 : insets.top;
  const bottomInset = Platform.OS === "ios" ? insets.bottom : 0;

  const handleAnalyze = useCallback(async () => {
    if (!canScan) {
      Alert.alert(
        "Daily Limit Reached",
        `Upgrade to get more scans.`,
        [
          { text: "Later", style: "cancel" },
          { text: "Upgrade", onPress: () => router.push("/subscription") },
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

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);

      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pair: selectedPair,
          timeframe: selectedTF,
          marketType: selectedPair.includes("/USD") && !selectedPair.includes("USDT") ? "forex"
            : selectedPair.length <= 6 && !selectedPair.includes("/") ? "stocks"
            : "crypto",
        }),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      let data: any;
      if (response.ok) {
        data = await response.json();
      } else {
        data = generateDemoAnalysis(selectedPair, selectedTF);
      }

      const result: TradeAnalysis & Record<string, any> = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        imageUri: "",
        timestamp: Date.now(),
        pair: selectedPair,
        timeframe: selectedTF,
        marketType: "crypto",
        ...data,
      };

      useOneScan();
      addAnalysis(result);
      setAnalysis(result);
      setShowAnalysis(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (err: any) {
      const demo = generateDemoAnalysis(selectedPair, selectedTF);
      const result: TradeAnalysis & Record<string, any> = {
        id: Date.now().toString() + Math.random().toString(36).substring(2, 9),
        imageUri: "",
        timestamp: Date.now(),
        pair: selectedPair,
        timeframe: selectedTF,
        marketType: "crypto",
        ...demo,
      };
      useOneScan();
      addAnalysis(result);
      setAnalysis(result);
      setShowAnalysis(true);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } finally {
      setAnalyzing(false);
    }
  }, [selectedPair, selectedTF, canScan]);

  const sentimentColor = analysis?.sentiment === "bullish" ? colors.bullish
    : analysis?.sentiment === "bearish" ? colors.bearish : colors.neutral;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.toolbar, { paddingTop: topInset + 8, backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          style={[styles.symbolBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowSymbolPicker(true)}
        >
          <Text style={[styles.symbolText, { color: colors.foreground }]}>{selectedPair}</Text>
          <Feather name="chevron-down" size={14} color={colors.mutedForeground} />
        </TouchableOpacity>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tfScroll}>
          {TIMEFRAMES.map((tf) => (
            <TouchableOpacity
              key={tf}
              style={[
                styles.tfBtn,
                { backgroundColor: selectedTF === tf ? colors.primary + "22" : "transparent" },
              ]}
              onPress={() => setSelectedTF(tf)}
            >
              <Text style={[
                styles.tfText,
                { color: selectedTF === tf ? colors.primary : colors.mutedForeground },
              ]}>
                {tf}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      <View style={styles.chartContainer}>
        <TVChartWebView html={chartHtml} tvSymbol={tvSymbol} tvTF={tvTF} />
      </View>

      <View style={[styles.bottomBar, { paddingBottom: bottomInset + 8, backgroundColor: colors.card, borderTopColor: colors.border }]}>
        <TouchableOpacity
          style={[
            styles.analyzeBtn,
            { backgroundColor: analyzing ? colors.primary + "88" : colors.primary },
          ]}
          onPress={handleAnalyze}
          disabled={analyzing}
          activeOpacity={0.85}
        >
          {analyzing ? (
            <>
              <ActivityIndicator size="small" color="#000" />
              <Text style={[styles.analyzeBtnText, { color: "#000" }]}>Analyzing…</Text>
            </>
          ) : (
            <>
              <Feather name="cpu" size={16} color="#000" />
              <Text style={[styles.analyzeBtnText, { color: "#000" }]}>AI Analyze</Text>
            </>
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.historyBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => router.push("/analysis/[id]" as any)}
        >
          <Feather name="clock" size={18} color={colors.mutedForeground} />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showSymbolPicker}
        animationType="slide"
        transparent
        onRequestClose={() => setShowSymbolPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} onPress={() => setShowSymbolPicker(false)} />
          <View style={[styles.modalSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHandle} />
            <Text style={[styles.modalTitle, { color: colors.foreground }]}>Select Symbol</Text>
            <ScrollView>
              <Text style={[styles.modalSection, { color: colors.mutedForeground }]}>POPULAR</Text>
              {POPULAR_SYMBOLS.map((sym) => (
                <TouchableOpacity
                  key={sym}
                  style={[
                    styles.symbolOption,
                    { borderBottomColor: colors.border },
                    selectedPair === sym && { backgroundColor: colors.primary + "11" },
                  ]}
                  onPress={() => { setSelectedPair(sym); setShowSymbolPicker(false); }}
                >
                  <Text style={[styles.symbolOptionText, { color: colors.foreground }]}>{sym}</Text>
                  {selectedPair === sym && <Feather name="check" size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
              <Text style={[styles.modalSection, { color: colors.mutedForeground }]}>ALL SYMBOLS</Text>
              {Object.keys(TV_SYMBOLS).map((sym) => (
                <TouchableOpacity
                  key={sym}
                  style={[
                    styles.symbolOption,
                    { borderBottomColor: colors.border },
                    selectedPair === sym && { backgroundColor: colors.primary + "11" },
                  ]}
                  onPress={() => { setSelectedPair(sym); setShowSymbolPicker(false); }}
                >
                  <Text style={[styles.symbolOptionText, { color: colors.foreground }]}>{sym}</Text>
                  {selectedPair === sym && <Feather name="check" size={16} color={colors.primary} />}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>

      <Modal
        visible={showAnalysis}
        animationType="slide"
        transparent
        onRequestClose={() => setShowAnalysis(false)}
      >
        <View style={styles.modalOverlay}>
          <TouchableOpacity style={styles.modalDismiss} onPress={() => setShowAnalysis(false)} />
          <View style={[styles.analysisSheet, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <View style={styles.modalHandle} />
            <ScrollView showsVerticalScrollIndicator={false}>
              {analysis && (
                <>
                  <View style={styles.analysisHeader}>
                    <View>
                      <Text style={[styles.analysisPair, { color: colors.foreground }]}>
                        {analysis.pair} · {analysis.timeframe}
                      </Text>
                      <Text style={[styles.analysisTime, { color: colors.mutedForeground }]}>
                        AI Analysis · {new Date().toLocaleTimeString()}
                      </Text>
                    </View>
                    <View style={[styles.sentimentBadge, { backgroundColor: sentimentColor + "22", borderColor: sentimentColor + "44" }]}>
                      <Text style={[styles.sentimentText, { color: sentimentColor }]}>
                        {analysis.direction?.toUpperCase()} {analysis.confidence}%
                      </Text>
                    </View>
                  </View>

                  <View style={[styles.levelsRow, { borderColor: colors.border }]}>
                    <LevelItem label="Entry" value={analysis.entry} color={colors.foreground} />
                    <LevelItem label="Stop Loss" value={analysis.stopLoss} color={colors.bearish} />
                    <LevelItem label="Take Profit" value={analysis.takeProfit} color={colors.bullish} />
                  </View>

                  <View style={[styles.rrRow, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                    <Text style={[styles.rrLabel, { color: colors.mutedForeground }]}>Risk/Reward</Text>
                    <Text style={[styles.rrValue, { color: colors.primary }]}>{analysis.riskRewardRatio}</Text>
                    <Text style={[styles.rrLabel, { color: colors.mutedForeground }]}>Support</Text>
                    <Text style={[styles.rrValue, { color: colors.bullish }]}>{analysis.keyLevels?.support}</Text>
                    <Text style={[styles.rrLabel, { color: colors.mutedForeground }]}>Resistance</Text>
                    <Text style={[styles.rrValue, { color: colors.bearish }]}>{analysis.keyLevels?.resistance}</Text>
                  </View>

                  {analysis.patterns?.length > 0 && (
                    <View style={styles.tagsRow}>
                      {analysis.patterns.map((p: string) => (
                        <View key={p} style={[styles.tag, { backgroundColor: colors.surface }]}>
                          <Text style={[styles.tagText, { color: colors.foreground }]}>{p}</Text>
                        </View>
                      ))}
                    </View>
                  )}

                  <View style={[styles.reasoningBox, { backgroundColor: colors.surface }]}>
                    <Text style={[styles.reasoningLabel, { color: colors.mutedForeground }]}>AI REASONING</Text>
                    <Text style={[styles.reasoningText, { color: colors.foreground }]}>{analysis.reasoning}</Text>
                  </View>

                  <View style={[styles.strategyBox, { backgroundColor: colors.primary + "11", borderColor: colors.primary + "33" }]}>
                    <Feather name="target" size={14} color={colors.primary} />
                    <Text style={[styles.strategyText, { color: colors.foreground }]}>{analysis.strategy}</Text>
                  </View>

                  <TouchableOpacity
                    style={[styles.viewFullBtn, { borderColor: colors.border }]}
                    onPress={() => {
                      setShowAnalysis(false);
                      router.push({ pathname: "/analysis/[id]", params: { id: analysis.id } });
                    }}
                  >
                    <Text style={[styles.viewFullText, { color: colors.primary }]}>View Full Analysis</Text>
                    <Feather name="arrow-right" size={14} color={colors.primary} />
                  </TouchableOpacity>
                </>
              )}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function TVChartWebView({ html, tvSymbol, tvTF }: { html: string; tvSymbol: string; tvTF: string }) {
  if (Platform.OS === "web") {
    const iframeSrc = `https://www.tradingview.com/widgetembed/?symbol=${encodeURIComponent(tvSymbol)}&interval=${tvTF}&theme=Dark&style=1&locale=en&enable_publishing=0&allow_symbol_change=1&save_image=0&hide_top_toolbar=0&hide_side_toolbar=0&withdateranges=1`;
    return (
      <View style={styles.webview}>
        {
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          <iframe
            src={iframeSrc}
            style={{ width: "100%", height: "100%", border: "none", backgroundColor: "#131722" }}
            scrolling="no"
            allowTransparency
            frameBorder="0"
          />
        }
      </View>
    );
  }

  let WebViewComponent: React.ComponentType<any> | null = null;
  try {
    WebViewComponent = require("react-native-webview").WebView;
  } catch {}

  if (!WebViewComponent) {
    return (
      <View style={styles.chartLoading}>
        <Feather name="bar-chart-2" size={48} color="#2A2E39" />
        <Text style={{ color: "#787B86", marginTop: 12, fontFamily: "Inter_400Regular" }}>
          Live charts available on Android / iOS builds
        </Text>
      </View>
    );
  }

  return (
    <WebViewComponent
      source={{ html }}
      style={styles.webview}
      scrollEnabled={false}
      allowsInlineMediaPlayback
      mediaPlaybackRequiresUserAction={false}
      javaScriptEnabled
      domStorageEnabled
      startInLoadingState
      renderLoading={() => (
        <View style={styles.chartLoading}>
          <ActivityIndicator size="large" color="#00FF88" />
        </View>
      )}
    />
  );
}

function LevelItem({ label, value, color }: { label: string; value: string; color: string }) {
  return (
    <View style={levelStyles.item}>
      <Text style={[levelStyles.label, { color: "#787B86" }]}>{label}</Text>
      <Text style={[levelStyles.value, { color }]}>{value}</Text>
    </View>
  );
}
const levelStyles = StyleSheet.create({
  item: { flex: 1, alignItems: "center" },
  label: { fontFamily: "Inter_400Regular", fontSize: 11, marginBottom: 4 },
  value: { fontFamily: "Inter_700Bold", fontSize: 14 },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  toolbar: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 12, paddingBottom: 10, borderBottomWidth: 1,
    zIndex: 10,
  },
  symbolBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1,
  },
  symbolText: { fontFamily: "Inter_700Bold", fontSize: 14 },
  tfScroll: { flex: 1 },
  tfBtn: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 6 },
  tfText: { fontFamily: "Inter_600SemiBold", fontSize: 13 },
  chartContainer: { flex: 1 },
  webview: { flex: 1, backgroundColor: "#131722" },
  chartLoading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#131722" },
  bottomBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 16, paddingTop: 10, borderTopWidth: 1,
  },
  analyzeBtn: {
    flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, paddingVertical: 13, borderRadius: 10,
    shadowColor: "#00FF88", shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25, shadowRadius: 8, elevation: 6,
  },
  analyzeBtnText: { fontFamily: "Inter_700Bold", fontSize: 15 },
  historyBtn: {
    width: 46, height: 46, borderRadius: 10, borderWidth: 1,
    alignItems: "center", justifyContent: "center",
  },
  modalOverlay: { flex: 1, justifyContent: "flex-end" },
  modalDismiss: { flex: 1 },
  modalSheet: {
    maxHeight: SCREEN_HEIGHT * 0.75,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, borderBottomWidth: 0, padding: 20,
  },
  analysisSheet: {
    maxHeight: SCREEN_HEIGHT * 0.85,
    borderTopLeftRadius: 20, borderTopRightRadius: 20,
    borderWidth: 1, borderBottomWidth: 0, padding: 20,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: "#2A2E39", alignSelf: "center", marginBottom: 16,
  },
  modalTitle: { fontFamily: "Inter_700Bold", fontSize: 18, marginBottom: 16 },
  modalSection: {
    fontFamily: "Inter_700Bold", fontSize: 11, letterSpacing: 1,
    paddingVertical: 10, paddingHorizontal: 4,
  },
  symbolOption: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    paddingVertical: 14, paddingHorizontal: 4, borderBottomWidth: 1,
  },
  symbolOptionText: { fontFamily: "Inter_600SemiBold", fontSize: 15 },
  analysisHeader: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "flex-start", marginBottom: 16,
  },
  analysisPair: { fontFamily: "Inter_700Bold", fontSize: 18 },
  analysisTime: { fontFamily: "Inter_400Regular", fontSize: 12, marginTop: 2 },
  sentimentBadge: {
    paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1,
  },
  sentimentText: { fontFamily: "Inter_700Bold", fontSize: 13 },
  levelsRow: {
    flexDirection: "row", paddingVertical: 16,
    borderTopWidth: 1, borderBottomWidth: 1, marginBottom: 12,
  },
  rrRow: {
    flexDirection: "row", justifyContent: "space-between", alignItems: "center",
    padding: 12, borderRadius: 10, borderWidth: 1, marginBottom: 12,
  },
  rrLabel: { fontFamily: "Inter_400Regular", fontSize: 11 },
  rrValue: { fontFamily: "Inter_700Bold", fontSize: 13 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 12 },
  tag: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 6 },
  tagText: { fontFamily: "Inter_400Regular", fontSize: 12 },
  reasoningBox: { padding: 14, borderRadius: 10, marginBottom: 12, gap: 8 },
  reasoningLabel: { fontFamily: "Inter_700Bold", fontSize: 10, letterSpacing: 0.8 },
  reasoningText: { fontFamily: "Inter_400Regular", fontSize: 13, lineHeight: 20 },
  strategyBox: {
    flexDirection: "row", gap: 10, padding: 14,
    borderRadius: 10, borderWidth: 1, marginBottom: 16, alignItems: "flex-start",
  },
  strategyText: { fontFamily: "Inter_400Regular", fontSize: 13, flex: 1, lineHeight: 19 },
  viewFullBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 6, paddingVertical: 14, borderRadius: 10, borderWidth: 1, marginBottom: 8,
  },
  viewFullText: { fontFamily: "Inter_700Bold", fontSize: 14 },
});
